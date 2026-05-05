import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

interface GenerateSqlInput {
  question: string;
  context: string;
  history?: { question: string; sql: string }[];
}

@Injectable()
export class SqlGeneratorService {
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get('OPENAI_API_KEY'),
    });
  }

  async generateSql(input: GenerateSqlInput): Promise<string> {
    const systemPrompt = `You are a SQL Server query generator. Your task is to convert natural language questions into valid SQL Server queries.

CRITICAL RULES - YOU MUST FOLLOW ALL (VALIDATION WILL FAIL IF YOU DON'T):
1. ONLY generate SELECT statements - never INSERT, UPDATE, DELETE, DROP, CREATE, ALTER, or any data modification
2. ALWAYS use TOP clause immediately after SELECT - THIS IS MANDATORY
3. If the user asks for a specific number (e.g., "5 customers", "top 10 products"), use that exact number in TOP
4. If no specific number is requested, use TOP 100 as the default
5. NEVER exceed TOP 100 - if user asks for more than 100, cap it at TOP 100
6. Use ONLY table and column names that appear EXACTLY in the DATABASE SCHEMA below - NEVER guess, translate, or invent names
7. Available tables are: customers, products, orders, order_items - use these exact names only
8. Primary keys are named "id" (customers.id, products.id, orders.id, order_items.id)
9. Foreign keys: orders.customer_id = customers.id, order_items.order_id = orders.id, order_items.product_id = products.id
10. BEFORE writing any column name, CHECK the DATABASE SCHEMA section to confirm the exact column name exists
11. NEVER invent tables or columns - if you can't find a matching table/column in the schema, use the closest available one
12. NEVER translate table names (e.g., don't use "clientes" instead of "customers")
13. NEVER assume column names - always verify against the schema (e.g., use "created_at" not "created_date")
14. Use proper SQL Server syntax (T-SQL)
15. Use JOINs when querying across multiple tables
16. Use appropriate aggregations (SUM, COUNT, AVG, etc.) when the question asks for summaries
17. IMPORTANT - GROUP BY RULE: When using GROUP BY, every column in the SELECT list must either be in the GROUP BY clause OR inside an aggregate function. NEVER use "table.*" when grouping - instead, explicitly list only the columns you need
18. Format dates properly using SQL Server functions
19. NEVER use semicolons at the end
20. NEVER include comments in the SQL

BUSINESS CONTEXT:
- This is a sales database with customers, products, orders, and order items
- Primary keys: customers.id, products.id, orders.id, order_items.id
- Foreign keys: orders.customer_id references customers.id, order_items.order_id references orders.id, order_items.product_id references products.id
- orders.status can be: pending, processing, completed, cancelled
- order_date can be filtered using date ranges
- When calculating totals, use order_items.quantity * order_items.unit_price
- Customer location is tracked via city and state columns

EXAMPLES OF TOP USAGE:
- "get 5 clients" -> SELECT TOP 5 * FROM customers
- "show top 10 products" -> SELECT TOP 10 * FROM products
- "list all orders" -> SELECT TOP 100 * FROM orders
- "first 3 customers" -> SELECT TOP 3 * FROM customers

EXAMPLE OF GROUP BY (note: all selected columns must be in GROUP BY or aggregated):
- "top 5 selling products" -> SELECT TOP 5 p.id, p.name, SUM(oi.quantity * oi.unit_price) AS total_sales FROM products p JOIN order_items oi ON oi.product_id = p.id JOIN orders o ON oi.order_id = o.id WHERE o.status = 'completed' GROUP BY p.id, p.name ORDER BY total_sales DESC

Generate ONLY the SQL query, nothing else.`;

    const userPrompt = `DATABASE SCHEMA (verify all column names against this schema):
${input.context}

USER QUESTION: ${input.question}

INSTRUCTIONS:
1. First, identify which tables and columns from the schema above are needed to answer this question
2. Use ONLY the exact table and column names as shown in the schema
3. Determine the TOP value:
   - If the question specifies a number (e.g., "5 clients", "top 10"), use that number
   - If the number exceeds 100, use TOP 100 (this is the maximum allowed)
   - If no number is specified, use TOP 100 as default
4. ALWAYS include the TOP clause immediately after SELECT (mandatory - queries without TOP will be rejected)
5. If using GROUP BY: NEVER use "table.*" - instead, explicitly list only the columns you need, and ensure every selected column is either in GROUP BY or inside an aggregate function (SUM, COUNT, AVG, etc.)
6. Write the SQL query using verified column names only

EXAMPLES:
- "get 5 clients" -> SELECT TOP 5 * FROM customers
- "show me orders" -> SELECT TOP 100 * FROM orders
- "top 5 selling products" -> SELECT TOP 5 p.id, p.name, SUM(oi.quantity * oi.unit_price) AS total_sales FROM products p JOIN order_items oi ON oi.product_id = p.id JOIN orders o ON oi.order_id = o.id WHERE o.status = 'completed' GROUP BY p.id, p.name ORDER BY total_sales DESC

Generate the SQL query:`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.1,
      max_tokens: 500,
    });

    let sql = response.choices[0]?.message?.content?.trim() || '';
    
    // Clean up the SQL (remove markdown code blocks if present)
    sql = sql.replace(/^```sql\s*/i, '');
    sql = sql.replace(/\s*```$/, '');
    sql = sql.trim();

    return sql;
  }

  async formatResults(input: {
    question: string;
    sql: string;
    data: any[];
    columns: string[];
  }): Promise<{
    columns: { key: string; label: string }[];
    rows: any[];
    title: string;
    summary: string;
  }> {
    const systemPrompt = `You format SQL query results into a user-friendly table response.

You must return ONLY valid JSON in this exact format:
{
  "columns": [{ "key": "exact_column_name", "label": "Display Label" }],
  "title": "Descriptive title for the result",
  "summary": "Brief 1-2 sentence summary of what this data shows"
}

Rules:
- Use the exact column names from the data as "key"
- Create human-readable labels for the "label" field
- Title should be descriptive and concise
- Summary should explain what the user is seeing`;

    const userPrompt = `USER QUESTION: ${input.question}

SQL QUERY: ${input.sql}

RESULT DATA (first 5 rows shown, ${input.data.length} total):
${JSON.stringify(input.data.slice(0, 5), null, 2)}

COLUMN NAMES: ${input.columns.join(', ')}

Generate the JSON response with column formatting, title, and summary:`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.2,
        max_tokens: 500,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content || '{}';
      const formatting = JSON.parse(content);

      // Map the data rows to use the formatted column keys
      const rows = input.data.map(row => {
        const mappedRow: any = {};
        for (const col of input.columns) {
          mappedRow[col] = row[col];
        }
        return mappedRow;
      });

      // Build columns array with proper keys and labels
      const columns = input.columns.map(col => {
        const found = formatting.columns?.find((c: any) => c.key === col);
        return {
          key: col,
          label: found?.label || this.formatColumnLabel(col),
        };
      });

      return {
        columns,
        rows,
        title: formatting.title || 'Query Results',
        summary: formatting.summary || `Showing ${input.data.length} results`,
      };
    } catch (error) {
      // Fallback if AI formatting fails
      return {
        columns: input.columns.map(col => ({
          key: col,
          label: this.formatColumnLabel(col),
        })),
        rows: input.data,
        title: 'Query Results',
        summary: `Found ${input.data.length} results for your query`,
      };
    }
  }

  private formatColumnLabel(columnName: string): string {
    // Convert snake_case or camelCase to Title Case
    return columnName
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .replace(/^\s+/, '')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
}
