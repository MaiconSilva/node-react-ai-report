import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sql from 'mssql';

interface SchemaInfo {
  tableName: string;
  columnName: string;
  dataType: string;
  isNullable: string;
  maxLength: number | null;
}

interface TableInfo {
  tableName: string;
  columns: {
    name: string;
    type: string;
    nullable: boolean;
    description?: string;
  }[];
  description?: string;
}

@Injectable()
export class DbService implements OnModuleInit, OnModuleDestroy {
  private pool: sql.ConnectionPool;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private async connect() {
    const config: sql.config = {
      server: this.configService.get('DB_HOST', 'localhost'),
      port: parseInt(this.configService.get('DB_PORT', '1433'), 10),
      user: this.configService.get('DB_USER', 'sa'),
      password: this.configService.get('DB_PASSWORD', 'YourStrong@Passw0rd'),
      database: this.configService.get('DB_NAME', 'SalesDB'),
      options: {
        encrypt: false,
        trustServerCertificate: true,
      },
      pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000,
      },
      requestTimeout: 5000,
    };

    this.pool = await new sql.ConnectionPool(config).connect();
    console.log('✅ Connected to SQL Server');
  }

  private async disconnect() {
    if (this.pool) {
      await this.pool.close();
      console.log('🔌 Disconnected from SQL Server');
    }
  }

  async executeQuery(query: string): Promise<{ columns: string[]; rows: any[] }> {
    try {
      const result = await this.pool.request().query(query);
      
      const columns = result.recordset.columns 
        ? Object.keys(result.recordset.columns)
        : [];
      
      const rows = result.recordset.map(row => {
        const cleanRow: any = {};
        for (const [key, value] of Object.entries(row)) {
          // Convert Date objects to ISO strings for JSON serialization
          if (value instanceof Date) {
            cleanRow[key] = value.toISOString();
          } else {
            cleanRow[key] = value;
          }
        }
        return cleanRow;
      });

      return { columns, rows };
    } catch (error) {
      throw new Error(`Query execution failed: ${error.message}`);
    }
  }

  async getSchemaInfo(): Promise<TableInfo[]> {
    const query = `
      SELECT 
        t.TABLE_NAME as tableName,
        c.COLUMN_NAME as columnName,
        c.DATA_TYPE as dataType,
        c.IS_NULLABLE as isNullable,
        c.CHARACTER_MAXIMUM_LENGTH as maxLength
      FROM INFORMATION_SCHEMA.TABLES t
      JOIN INFORMATION_SCHEMA.COLUMNS c ON t.TABLE_NAME = c.TABLE_NAME
      WHERE t.TABLE_TYPE = 'BASE TABLE'
        AND t.TABLE_NAME NOT LIKE 'sys%'
        AND t.TABLE_NAME NOT LIKE 'MS%'
      ORDER BY t.TABLE_NAME, c.ORDINAL_POSITION
    `;

    const result = await this.executeQuery(query);
    
    // Group by table
    const tablesMap = new Map<string, TableInfo>();
    
    for (const row of result.rows) {
      const tableName = row.tableName;
      
      if (!tablesMap.has(tableName)) {
        tablesMap.set(tableName, {
          tableName,
          columns: [],
        });
      }
      
      const table = tablesMap.get(tableName)!;
      table.columns.push({
        name: row.columnName,
        type: row.dataType,
        nullable: row.isNullable === 'YES',
      });
    }

    // Add descriptions for tables
    const tableDescriptions: Record<string, string> = {
      'customers': 'Contains customer information including name, email, and location (city/state)',
      'products': 'Product catalog with name, category, price, and stock quantity',
      'orders': 'Customer orders with order date, status, and total amount',
      'order_items': 'Individual items within each order linking products to orders with quantity and price',
    };

    // Add column descriptions
    const columnDescriptions: Record<string, Record<string, string>> = {
      'customers': {
        'id': 'Primary key - auto-incrementing unique identifier (referenced by orders.customer_id)',
        'name': 'Full name of the customer',
        'email': 'Customer email address',
        'city': 'City of the customer',
        'state': 'Two-letter state code',
        'created_at': 'When the customer was first added',
      },
      'products': {
        'id': 'Primary key - auto-incrementing unique identifier (referenced by order_items.product_id)',
        'name': 'Product name',
        'category': 'Product category (Electronics, Furniture, Office Supplies, Software, Apparel)',
        'price': 'Current product price',
        'stock_quantity': 'Number of items in stock',
      },
      'orders': {
        'id': 'Primary key - auto-incrementing unique identifier (referenced by order_items.order_id)',
        'customer_id': 'Foreign key to customers.id - which customer placed this order',
        'order_date': 'Date when order was placed',
        'status': 'Order status: pending, processing, completed, or cancelled',
        'total_amount': 'Total monetary value of the order',
      },
      'order_items': {
        'id': 'Primary key - auto-incrementing unique identifier',
        'order_id': 'Foreign key to orders.id - which order this item belongs to',
        'product_id': 'Foreign key to products.id - which product was ordered',
        'quantity': 'Number of units ordered',
        'unit_price': 'Price per unit at time of order',
      },
    };

    for (const table of tablesMap.values()) {
      table.description = tableDescriptions[table.tableName];
      for (const col of table.columns) {
        col.description = columnDescriptions[table.tableName]?.[col.name];
      }
    }

    return Array.from(tablesMap.values());
  }

  formatSchemaForContext(tables: TableInfo[]): string {
    return tables.map(table => {
      const cols = table.columns.map(col => {
        let desc = `${col.name} (${col.type}${col.nullable ? '' : ', required'})`;
        if (col.description) {
          desc += ` - ${col.description}`;
        }
        return desc;
      }).join('\n  - ');
      
      return `Table: ${table.tableName}${table.description ? ` - ${table.description}` : ''}\n  - ${cols}`;
    }).join('\n\n');
  }

  // =========================================================
  // Query Memory Methods
  // =========================================================

  async findQueryInMemory(normalizedQuestion: string): Promise<{ id: number; generated_sql: string } | null> {
    try {
      const query = `
        SELECT TOP 1 id, generated_sql
        FROM query_memory
        WHERE question_normalized = @normalizedQuestion
        ORDER BY usage_count DESC, last_used_at DESC
      `;
      
      const result = await this.pool.request()
        .input('normalizedQuestion', sql.NVarChar(1000), normalizedQuestion)
        .query(query);
      
      if (result.recordset.length === 0) {
        return null;
      }
      
      return {
        id: result.recordset[0].id,
        generated_sql: result.recordset[0].generated_sql,
      };
    } catch (error) {
      console.log('⚠️ Query memory lookup failed (table may not exist):', error.message);
      return null;
    }
  }

  async saveQueryToMemory(data: {
    questionOriginal: string;
    questionNormalized: string;
    generatedSql: string;
    embedding: number[];
  }): Promise<number> {
    try {
      const query = `
        INSERT INTO query_memory (question_original, question_normalized, generated_sql, embedding_vector, created_at, last_used_at, usage_count)
        OUTPUT INSERTED.id
        VALUES (@questionOriginal, @questionNormalized, @generatedSql, @embeddingVector, SYSUTCDATETIME(), SYSUTCDATETIME(), 1)
      `;
      
      const result = await this.pool.request()
        .input('questionOriginal', sql.NVarChar(1000), data.questionOriginal)
        .input('questionNormalized', sql.NVarChar(1000), data.questionNormalized)
        .input('generatedSql', sql.NVarChar(sql.MAX), data.generatedSql)
        .input('embeddingVector', sql.NVarChar(sql.MAX), JSON.stringify(data.embedding))
        .query(query);
      
      return result.recordset[0].id;
    } catch (error) {
      console.log('⚠️ Failed to save query to memory:', error.message);
      // Return -1 to indicate failure but don't break the flow
      return -1;
    }
  }

  async updateQueryUsage(id: number): Promise<void> {
    try {
      const query = `
        UPDATE query_memory
        SET usage_count = usage_count + 1,
            last_used_at = SYSUTCDATETIME()
        WHERE id = @id
      `;
      
      await this.pool.request()
        .input('id', sql.BigInt, id)
        .query(query);
    } catch (error) {
      // Silently fail - this is just analytics
      console.log('⚠️ Failed to update query usage:', error.message);
    }
  }
}
