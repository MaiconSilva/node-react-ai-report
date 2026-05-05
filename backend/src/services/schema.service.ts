import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DbService } from '../modules/ai-report/db.service';
import { JsonStorageService } from './json-storage.service';
import { DatabaseSchema, SchemaTable, SchemaColumn, SchemaForeignKey, SchemaIndex, SchemaRelationship } from './types';
import * as sql from 'mssql';

@Injectable()
export class SchemaService {
  private readonly SCHEMA_FILENAME = 'schema.json';

  constructor(
    private dbService: DbService,
    private jsonStorage: JsonStorageService,
    private configService: ConfigService,
  ) {}

  async extractFromDatabase(): Promise<DatabaseSchema> {
    console.log('Starting schema extraction from database...');

    const tables = await this.extractTables();
    const relationships = this.inferRelationships(tables);

    const schema: DatabaseSchema = {
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      connection: {
        type: 'sqlserver',
        host: this.configService.get('DB_HOST', 'localhost'),
        port: parseInt(this.configService.get('DB_PORT', '1433'), 10),
        database: this.configService.get('DB_NAME', 'SalesDB'),
      },
      tables,
      relationships,
    };

    await this.jsonStorage.writeJson(this.SCHEMA_FILENAME, schema);
    console.log(`Schema saved to ${this.SCHEMA_FILENAME}`);
    console.log(`Extracted ${tables.length} tables with ${tables.reduce((acc, t) => acc + t.columns.length, 0)} total columns`);

    return schema;
  }

  async getSchema(): Promise<DatabaseSchema | null> {
    return this.jsonStorage.readJson<DatabaseSchema>(this.SCHEMA_FILENAME);
  }

  async schemaExists(): Promise<boolean> {
    return this.jsonStorage.fileExists(this.SCHEMA_FILENAME);
  }

  async getTableNames(): Promise<string[]> {
    const schema = await this.getSchema();
    if (!schema || !schema.tables) {
      return [];
    }
    return schema.tables.map(t => t.name);
  }

  async validateSchema(): Promise<{ valid: boolean; errors: string[] }> {
    const schema = await this.getSchema();
    const errors: string[] = [];

    if (!schema) {
      return { valid: false, errors: ['Schema file not found'] };
    }

    if (!schema.tables || schema.tables.length === 0) {
      errors.push('No tables found in schema');
    }

    for (const table of schema.tables) {
      if (!table.name) {
        errors.push('Table missing name');
      }
      if (!table.columns || table.columns.length === 0) {
        errors.push(`Table ${table.name} has no columns`);
      }
      for (const col of table.columns) {
        if (!col.name) {
          errors.push(`Column missing name in table ${table.name}`);
        }
        if (!col.type) {
          errors.push(`Column ${col.name} in table ${table.name} missing type`);
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  formatSchemaForContext(schema: DatabaseSchema): string {
    return schema.tables.map(table => {
      const cols = table.columns.map(col => {
        let desc = `${col.name} (${col.type}${col.nullable ? '' : ', required'})`;
        if (col.isPrimaryKey) {
          desc += ' PK';
        }
        if (col.isForeignKey && col.referencedTable) {
          desc += ` FK->${col.referencedTable}.${col.referencedColumn}`;
        }
        if (col.description) {
          desc += ` - ${col.description}`;
        }
        return desc;
      }).join('\n  - ');

      let result = `Table: ${table.name}`;
      if (table.description) {
        result += ` - ${table.description}`;
      }
      result += `\n  - ${cols}`;
      
      return result;
    }).join('\n\n');
  }

  private async extractTables(): Promise<SchemaTable[]> {
    // Get table and column information
    const columnsQuery = `
      SELECT 
        t.TABLE_NAME as tableName,
        c.COLUMN_NAME as columnName,
        c.DATA_TYPE as dataType,
        c.IS_NULLABLE as isNullable,
        c.CHARACTER_MAXIMUM_LENGTH as maxLength,
        CASE WHEN pk.COLUMN_NAME IS NOT NULL THEN 1 ELSE 0 END as isPrimaryKey,
        CASE WHEN c.COLUMN_NAME = 'id' THEN 1 ELSE 0 END as isIdentity
      FROM INFORMATION_SCHEMA.TABLES t
      JOIN INFORMATION_SCHEMA.COLUMNS c ON t.TABLE_NAME = c.TABLE_NAME
      LEFT JOIN (
        SELECT ku.TABLE_NAME, ku.COLUMN_NAME
        FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
        JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE ku ON tc.CONSTRAINT_NAME = ku.CONSTRAINT_NAME
        WHERE tc.CONSTRAINT_TYPE = 'PRIMARY KEY'
      ) pk ON t.TABLE_NAME = pk.TABLE_NAME AND c.COLUMN_NAME = pk.COLUMN_NAME
      WHERE t.TABLE_TYPE = 'BASE TABLE'
        AND t.TABLE_NAME NOT LIKE 'sys%'
        AND t.TABLE_NAME NOT LIKE 'MS%'
      ORDER BY t.TABLE_NAME, c.ORDINAL_POSITION
    `;

    const result = await this.dbService.executeQuery(columnsQuery);
    
    // Get foreign keys
    const fkQuery = `
      SELECT 
        fk.name as fkName,
        OBJECT_NAME(fk.parent_object_id) as tableName,
        c.name as columnName,
        OBJECT_NAME(fk.referenced_object_id) as referencedTable,
        rc.name as referencedColumn
      FROM sys.foreign_keys fk
      INNER JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
      INNER JOIN sys.columns c ON fkc.parent_object_id = c.object_id AND fkc.parent_column_id = c.column_id
      INNER JOIN sys.columns rc ON fkc.referenced_object_id = rc.object_id AND fkc.referenced_column_id = rc.column_id
    `;

    const fkResult = await this.dbService.executeQuery(fkQuery);
    const foreignKeysMap = new Map<string, SchemaForeignKey[]>();
    
    for (const row of fkResult.rows) {
      const tableName = row.tableName;
      if (!foreignKeysMap.has(tableName)) {
        foreignKeysMap.set(tableName, []);
      }
      foreignKeysMap.get(tableName)!.push({
        name: row.fkName,
        column: row.columnName,
        referencedTable: row.referencedTable,
        referencedColumn: row.referencedColumn,
      });
    }

    // Get indexes
    const indexQuery = `
      SELECT 
        t.name as tableName,
        i.name as indexName,
        i.type_desc as indexType,
        c.name as columnName
      FROM sys.indexes i
      INNER JOIN sys.tables t ON i.object_id = t.object_id
      INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
      INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
      WHERE i.name IS NOT NULL
        AND t.name NOT LIKE 'sys%'
    `;

    const indexResult = await this.dbService.executeQuery(indexQuery);
    const indexesMap = new Map<string, SchemaIndex[]>();
    
    for (const row of indexResult.rows) {
      const tableName = row.tableName;
      if (!indexesMap.has(tableName)) {
        indexesMap.set(tableName, []);
      }
      
      const existing = indexesMap.get(tableName)!.find(i => i.name === row.indexName);
      if (existing) {
        existing.columns.push(row.columnName);
      } else {
        indexesMap.get(tableName)!.push({
          name: row.indexName,
          columns: [row.columnName],
          type: row.indexType.toLowerCase().replace('_', ''),
        });
      }
    }

    // Group columns by table
    const tablesMap = new Map<string, SchemaTable>();
    
    for (const row of result.rows) {
      const tableName = row.tableName;
      
      if (!tablesMap.has(tableName)) {
        const fks = foreignKeysMap.get(tableName) || [];
        const indexes = indexesMap.get(tableName) || [];
        
        tablesMap.set(tableName, {
          name: tableName,
          columns: [],
          primaryKey: [],
          foreignKeys: fks,
          indexes,
        });
      }
      
      const table = tablesMap.get(tableName)!;
      
      const column: SchemaColumn = {
        name: row.columnName,
        type: row.maxLength ? `${row.dataType}(${row.maxLength})` : row.dataType,
        nullable: row.isNullable === 'YES',
        isPrimaryKey: row.isPrimaryKey === 1,
        isIdentity: row.isIdentity === 1,
      };

      // Check if this column is a foreign key
      const fk = table.foreignKeys?.find(f => f.column === row.columnName);
      if (fk) {
        column.isForeignKey = true;
        column.referencedTable = fk.referencedTable;
        column.referencedColumn = fk.referencedColumn;
      }
      
      table.columns.push(column);
      
      if (column.isPrimaryKey) {
        table.primaryKey.push(column.name);
      }
    }

    // Add descriptions (same as before)
    const tableDescriptions: Record<string, string> = {
      'customers': 'Contains customer information including name, email, and location (city/state)',
      'products': 'Product catalog with name, category, price, and stock quantity',
      'orders': 'Customer orders with order date, status, and total amount',
      'order_items': 'Individual items within each order linking products to orders with quantity and price',
    };

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
      table.description = tableDescriptions[table.name];
      for (const col of table.columns) {
        col.description = columnDescriptions[table.name]?.[col.name];
      }
    }

    return Array.from(tablesMap.values());
  }

  private inferRelationships(tables: SchemaTable[]): SchemaRelationship[] {
    const relationships: SchemaRelationship[] = [];

    for (const table of tables) {
      for (const fk of table.foreignKeys || []) {
        const relatedTable = tables.find(t => t.name === fk.referencedTable);
        if (relatedTable) {
          relationships.push({
            description: `${table.name}.${fk.column} references ${fk.referencedTable}.${fk.referencedColumn}`,
            from: `${table.name}.${fk.column}`,
            to: `${fk.referencedTable}.${fk.referencedColumn}`,
            type: 'many-to-one',
          });
        }
      }
    }

    return relationships;
  }
}
