import { Injectable, Logger } from '@nestjs/common';
import { Parser } from 'node-sql-parser';

interface ValidationResult {
  valid: boolean;
  error?: string;
}

@Injectable()
export class SqlAstValidatorService {
  private readonly logger = new Logger(SqlAstValidatorService.name);
  private parser: Parser;

  // Forbidden functions that could be used for attacks
  private readonly forbiddenFunctions = [
    'xp_cmdshell',
    'xp_regread',
    'xp_regwrite',
    'sp_oamethod',
    'sp_oacreate',
    'openrowset',
    'opendatasource',
    'bulkinsert',
    'waitfor',
  ];

  constructor() {
    this.parser = new Parser();
  }

  validate(sql: string): ValidationResult {
    try {
      // Transform SQL Server TOP syntax to standard LIMIT for parsing
      // This is a workaround since node-sql-parser doesn't natively support T-SQL TOP
      const transformedSql = this.transformTopToLimit(sql);

      const ast = this.parser.astify(transformedSql);
      const statements = Array.isArray(ast) ? ast : [ast];

      // Rule 1: Only single statements allowed
      if (statements.length > 1) {
        return { valid: false, error: 'Multiple statements are not allowed' };
      }

      const stmt = statements[0];

      // Rule 2: Must be SELECT only
      if (stmt.type !== 'select') {
        return { valid: false, error: `Only SELECT statements are allowed, got: ${stmt.type}` };
      }

      // Rule 3: Must have LIMIT/TOP clause
      if (!stmt.limit) {
        return { valid: false, error: 'Query must include TOP clause to limit results' };
      }

      // Rule 4: Must have FROM clause (prevent SELECT 1+1 attacks)
      if (!stmt.from || (Array.isArray(stmt.from) && stmt.from.length === 0)) {
        return { valid: false, error: 'Query must include FROM clause' };
      }

      // Rule 5: Check for forbidden functions
      const forbiddenCheck = this.checkForbiddenFunctions(stmt);
      if (!forbiddenCheck.valid) {
        return forbiddenCheck;
      }

      return { valid: true };
    } catch (error: any) {
      this.logger.warn(`SQL parsing failed: ${error?.message || 'Unknown error'}`);
      return { valid: false, error: `Invalid SQL syntax: ${error?.message || 'Unknown error'}` };
    }
  }

  /**
   * Transform SQL Server TOP syntax to LIMIT for parser compatibility
   * e.g., "SELECT TOP 100 * FROM table" -> "SELECT * FROM table LIMIT 100"
   */
  private transformTopToLimit(sql: string): string {
    // Match "SELECT TOP N" pattern (case insensitive)
    const topMatch = sql.match(/SELECT\s+TOP\s+(\d+)\s+/i);
    if (topMatch) {
      const topValue = topMatch[1];
      // Remove TOP N and add LIMIT N at the end
      const withoutTop = sql.replace(/SELECT\s+TOP\s+\d+\s+/i, 'SELECT ');
      return `${withoutTop} LIMIT ${topValue}`;
    }
    return sql;
  }

  sanitize(sql: string): string {
    // Remove trailing semicolons
    let sanitized = sql.trim().replace(/;+$/, '');

    // Remove SQL comments (both line and block)
    sanitized = sanitized.replace(/--.*$/gm, '');
    sanitized = sanitized.replace(/\/\*[\s\S]*?\*\//g, '');

    // Normalize whitespace
    sanitized = sanitized.replace(/\s+/g, ' ').trim();

    return sanitized;
  }

  private checkForbiddenFunctions(node: any): ValidationResult {
    if (!node || typeof node !== 'object') {
      return { valid: true };
    }

    // Check if this node is a function call
    if (node.type === 'function') {
      // Handle different function name structures in AST
      let funcName: string | undefined;
      if (typeof node.name === 'string') {
        funcName = node.name.toLowerCase();
      } else if (node.name?.name) {
        funcName = String(node.name.name).toLowerCase();
      } else if (node.name?.schema) {
        funcName = String(node.name.schema).toLowerCase();
      }

      if (funcName && this.forbiddenFunctions.includes(funcName)) {
        return { valid: false, error: `Forbidden function detected: ${funcName}` };
      }
    }

    // Recursively check all properties
    for (const key of Object.keys(node)) {
      const value = node[key];

      if (Array.isArray(value)) {
        for (const item of value) {
          const result = this.checkForbiddenFunctions(item);
          if (!result.valid) return result;
        }
      } else if (typeof value === 'object') {
        const result = this.checkForbiddenFunctions(value);
        if (!result.valid) return result;
      }
    }

    return { valid: true };
  }
}
