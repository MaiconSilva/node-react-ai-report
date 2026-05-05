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
   * Handles multiple SELECT statements (UNION ALL, subqueries, etc.)
   */
  private transformTopToLimit(sql: string): string {
    // Match all "SELECT TOP N" patterns globally (case insensitive)
    const topRegex = /SELECT\s+TOP\s+(\d+)\s+/gi;
    const matches = [...sql.matchAll(topRegex)];

    if (matches.length === 0) {
      return sql;
    }

    // For single SELECT, simple transformation
    if (matches.length === 1) {
      const topValue = matches[0][1];
      const withoutTop = sql.replace(topRegex, 'SELECT ');
      return `${withoutTop} LIMIT ${topValue}`;
    }

    // For multiple SELECTs (UNION ALL), we need to place LIMIT in each SELECT
    // Transform: "SELECT TOP N ... UNION ALL SELECT TOP M ..." 
    // Into:      "SELECT ... LIMIT N UNION ALL SELECT ... LIMIT M"
    // Matches: UNION, UNION ALL, UNION DISTINCT (with surrounding whitespace)
    const unionRegex = /\s+UNION\s+(?:ALL\s+|DISTINCT\s+)?/gi;
    const unionMatches = [...sql.matchAll(unionRegex)];

    if (unionMatches.length === 0) {
      // No UNION, single SELECT with multiple TOPs - use first TOP
      const topValue = matches[0][1];
      const withoutTop = sql.replace(topRegex, 'SELECT ');
      return `${withoutTop} LIMIT ${topValue}`;
    }

    // Process each SELECT segment (between UNIONs)
    let currentPos = 0;
    const segments: Array<{ sql: string; limit: string; union?: string }> = [];

    for (let i = 0; i <= unionMatches.length; i++) {
      const unionStart = i < unionMatches.length ? unionMatches[i].index! : sql.length;
      const segment = sql.slice(currentPos, unionStart).trim();

      // Extract TOP value from this segment
      const topMatch = segment.match(/SELECT\s+TOP\s+(\d+)/i);
      const limit = topMatch ? topMatch[1] : '100';

      // Remove TOP from segment
      const withoutTop = segment.replace(/SELECT\s+TOP\s+\d+/i, 'SELECT');

      // Get the UNION clause for this segment (if not the last one)
      const union = i < unionMatches.length ? unionMatches[i][0].trim() : undefined;

      segments.push({ sql: withoutTop, limit, union });

      // Move position past this UNION clause for next iteration
      if (i < unionMatches.length) {
        currentPos = unionStart + unionMatches[i][0].length;
      }
    }

    // Reconstruct with LIMIT in each SELECT
    let result = '';
    for (let i = 0; i < segments.length; i++) {
      result += segments[i].sql + ` LIMIT ${segments[i].limit}`;
      if (segments[i].union) {
        result += ' ' + segments[i].union + ' ';
      }
    }

    return result.trim();
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
