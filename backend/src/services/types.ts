// =========================================================
// Schema Types (data/schema.json)
// =========================================================

export interface SchemaColumn {
  name: string;
  type: string;
  nullable: boolean;
  isPrimaryKey?: boolean;
  isIdentity?: boolean;
  isForeignKey?: boolean;
  referencedTable?: string;
  referencedColumn?: string;
  description?: string;
}

export interface SchemaForeignKey {
  name: string;
  column: string;
  referencedTable: string;
  referencedColumn: string;
}

export interface SchemaIndex {
  name: string;
  columns: string[];
  type: string;
}

export interface SchemaTable {
  name: string;
  description?: string;
  columns: SchemaColumn[];
  primaryKey: string[];
  foreignKeys?: SchemaForeignKey[];
  indexes?: SchemaIndex[];
}

export interface SchemaRelationship {
  description: string;
  from: string;
  to: string;
  type: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many';
}

export interface SchemaConnection {
  type: string;
  host: string;
  port: number;
  database: string;
}

export interface DatabaseSchema {
  version: string;
  generatedAt: string;
  connection: SchemaConnection;
  tables: SchemaTable[];
  relationships: SchemaRelationship[];
}

// =========================================================
// Query Memory Types (data/query-memory.json)
// =========================================================

export interface QueryMemoryMetadata {
  createdAt: string;
  lastUsedAt: string;
  usageCount: number;
  success: boolean;
  executionTimeMs?: number;
}

export interface QueryMemoryEntry {
  id: number;
  questionOriginal: string;
  questionNormalized: string;
  generatedSql: string;
  embedding: number[];
  metadata: QueryMemoryMetadata;
}

export interface QueryMemoryStats {
  totalQueries: number;
  mostUsedQueryId?: number;
  averageExecutionTimeMs?: number;
}

export interface QueryMemory {
  version: string;
  updatedAt: string;
  queries: QueryMemoryEntry[];
  stats: QueryMemoryStats;
}

// =========================================================
// Business Rules (data/business-rules.txt)
// =========================================================

// business-rules.txt is a plain text file, no structure needed
// But we define a type for the content
export type BusinessRulesContent = string;

// =========================================================
// DTOs for API
// =========================================================

export interface ExtractSchemaDto {
  force?: boolean;
}

export interface UpdateRulesDto {
  content: string;
}

export interface QueryMemoryListResponse {
  queries: QueryMemoryEntry[];
  stats: QueryMemoryStats;
}

export interface QueryMemoryDeleteResponse {
  success: boolean;
  message: string;
}
