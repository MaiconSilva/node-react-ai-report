import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { DbService } from './db.service';
import { VectorService } from './vector.service';
import { SqlGeneratorService } from './sql-generator.service';
import { SqlValidatorService } from './sql-validator.service';
import { SqlAstValidatorService } from './sql-ast-validator.service';
import { SchemaService } from '../../services/schema.service';
import { RulesService } from '../../services/rules.service';
import { MemoryService } from '../../services/memory.service';

interface AskInput {
  question: string;
}

interface AskResult {
  success: boolean;
  question: string;
  generatedSql: string;
  columns: { key: string; label: string }[];
  rows: any[];
  title: string;
  summary: string;
  rowCount: number;
  executionTimeMs: number;
  source: 'memory' | 'ai';
  memoryId: number | null;
}

@Injectable()
export class AskService {
  private readonly logger = new Logger(AskService.name);

  constructor(
    private dbService: DbService,
    private vectorService: VectorService,
    private sqlGenerator: SqlGeneratorService,
    private sqlValidator: SqlValidatorService,
    private sqlAstValidator: SqlAstValidatorService,
    private schemaService: SchemaService,
    private rulesService: RulesService,
    private memoryService: MemoryService,
  ) {}

  async initialize(): Promise<void> {
    // Initialize default rules if not exists
    await this.rulesService.initializeDefaultRules();
    
    // Load schema and rules into vector store if schema exists
    const schemaExists = await this.schemaService.schemaExists();
    if (schemaExists) {
      await this.loadContextToVectorStore();
    }
  }

  async loadContextToVectorStore(): Promise<void> {
    console.log('Loading context to vector store...');
    
    // Clear existing documents
    this.vectorService.clear();

    const documents: { content: string; metadata: { tableName?: string; type: 'table' | 'column' | 'relationship' | 'rule' } }[] = [];

    // Load schema
    const schema = await this.schemaService.getSchema();
    if (schema) {
      const schemaContext = this.schemaService.formatSchemaForContext(schema);
      
      documents.push({
        content: `Database Schema Overview:\n\n${schemaContext}\n\nKey Relationships:\n${schema.relationships.map(r => `- ${r.from} references ${r.to}`).join('\n')}`,
        metadata: { type: 'table' },
      });

      // Add individual tables
      for (const table of schema.tables) {
        documents.push({
          content: `Table ${table.name}: ${table.description || 'No description'}`,
          metadata: { tableName: table.name, type: 'table' },
        });

        // Add columns
        for (const col of table.columns) {
          let colDesc = `Column ${table.name}.${col.name}: ${col.type}${col.nullable ? '' : ' (required)'}`;
          if (col.isPrimaryKey) colDesc += ' [PK]';
          if (col.isForeignKey && col.referencedTable) {
            colDesc += ` [FK->${col.referencedTable}.${col.referencedColumn}]`;
          }
          if (col.description) colDesc += ` - ${col.description}`;
          
          documents.push({
            content: colDesc,
            metadata: { tableName: table.name, type: 'column' },
          });
        }
      }
    }

    // Load business rules
    const rules = await this.rulesService.getRules();
    if (rules) {
      documents.push({
        content: `Business Rules and Context:\n\n${rules}`,
        metadata: { type: 'rule' },
      });
    }

    // Index all documents
    await this.vectorService.addDocuments(documents);
    console.log(`Indexed ${documents.length} documents to vector store`);
  }

  async ask(input: AskInput): Promise<AskResult> {
    const startTime = Date.now();
    
    console.log('\n📝 New Question:', input.question);
    
    try {
      // Check if schema is loaded
      const schema = await this.schemaService.getSchema();
      if (!schema) {
        throw new HttpException(
          'Schema not loaded. Please run schema extraction first (POST /schema/extract)',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Step 0: Check query memory
      const normalizedQuestion = this.normalizeQuestion(input.question);
      console.log('🔍 Checking query memory for normalized:', normalizedQuestion);
      
      // Generate embedding for similarity search
      const questionEmbedding = await this.vectorService.generateEmbedding(input.question);
      
      const cachedQuery = await this.memoryService.findSimilarQuery(normalizedQuestion, questionEmbedding);
      
      let generatedSql: string;
      let source: 'memory' | 'ai';
      let memoryId: number | null = null;

      if (cachedQuery) {
        // Cache hit - use stored SQL
        generatedSql = cachedQuery.generatedSql;
        memoryId = cachedQuery.id;
        source = 'memory';
        console.log('✅ Cache HIT! Using SQL from query_memory (id:', memoryId, ')');
        
        // Update usage stats
        await this.memoryService.updateQueryUsage(memoryId);
      } else {
        // Cache miss - generate with AI
        source = 'ai';
        console.log('❌ Cache MISS. Generating SQL with AI...');
        
        // Step 1: Get business rules and all table names
        const rules = await this.rulesService.getRules();
        const allTables = await this.schemaService.getTableNames();

        // Step 2: Search for relevant context using vector search
        const contextResults = await this.vectorService.search(input.question, 5);
        const context = contextResults.map(r => r.content).join('\n\n');

        // Combine schema context with available tables and rules
        // Always include full table list to prevent AI from inventing table names
        const fullContext = `AVAILABLE TABLES: ${allTables.join(', ')}

${context}

Business Rules:
${rules}`;

        // Step 3: Generate SQL using LLM
        generatedSql = await this.sqlGenerator.generateSql({
          question: input.question,
          context: fullContext,
        });
        
        console.log('🤖 AI Generated SQL:', generatedSql);
      }

      // Step 4: Validate the generated SQL using AST-based validator
      const sanitizedSql = this.sqlAstValidator.sanitize(generatedSql);
      this.logger.log(`Sanitized SQL: ${sanitizedSql}`);

      const validation = this.sqlAstValidator.validate(sanitizedSql);

      if (!validation.valid) {
        this.logger.warn(`SQL validation failed: ${validation.error}`);
        throw new HttpException(
          `SQL validation failed: ${validation.error}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      // Step 5: Execute the query
      console.log(`🔍 Executing query (source: ${source})...`);
      const queryResult = await this.dbService.executeQuery(sanitizedSql);
      console.log('📊 Query returned', queryResult.rows.length, 'rows');

      // Step 6: Save to memory if this was an AI-generated query
      if (source === 'ai') {
        memoryId = await this.memoryService.saveQuery(
          input.question,
          normalizedQuestion,
          sanitizedSql,
          questionEmbedding,
        );
        console.log('💾 Saved new query to memory (id:', memoryId, ')');
      }

      // Step 7: Format results using LLM
      const formattedResults = await this.sqlGenerator.formatResults({
        question: input.question,
        sql: sanitizedSql,
        data: queryResult.rows,
        columns: queryResult.columns,
      });

      const executionTimeMs = Date.now() - startTime;

      console.log(`✨ Complete! Source: ${source}, Memory ID: ${memoryId}, Time: ${executionTimeMs}ms`);

      return {
        success: true,
        question: input.question,
        generatedSql: sanitizedSql,
        columns: formattedResults.columns,
        rows: formattedResults.rows,
        title: formattedResults.title,
        summary: formattedResults.summary,
        rowCount: queryResult.rows.length,
        executionTimeMs,
        source,
        memoryId,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        `Failed to process question: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private normalizeQuestion(question: string): string {
    return question.toLowerCase().trim().replace(/\s+/g, ' ');
  }
}
