import { Injectable } from '@nestjs/common';

@Injectable()
export class SqlValidatorService {
  // SQL keywords that are forbidden (case insensitive)
  private readonly forbiddenKeywords = [
    'INSERT',
    'UPDATE',
    'DELETE',
    'DROP',
    'CREATE',
    'ALTER',
    'TRUNCATE',
    'MERGE',
    'UPSERT',
    'EXEC',
    'EXECUTE',
    'SP_',
    'XP_',
    'UNION', // Only allow if specifically needed - we'll check context
    'INTO',  // Often used with INSERT
    'VALUES', // Often used with INSERT
  ];

  // Patterns that could indicate SQL injection or dangerous queries
  private readonly suspiciousPatterns = [
    /;\s*\w+/, // Semicolon followed by another statement
    /--.*$/m, // SQL comments (line ending)
    /\/\*[\s\S]*?\*\//, // SQL block comments
    /\x00/, // Null bytes
    /0x[0-9a-f]/i, // Hex encoding prefix
    /CHAR\s*\(/i,
    /CONCAT\s*\(/i,
    /EXEC\s*\(/i,
    /WAITFOR/i,
    /DELAY/i,
    /SHUTDOWN/i,
    /RECONFIGURE/i,
    /sp_configure/i,
    /xp_cmdshell/i,
    /xp_regread/i,
    /xp_regwrite/i,
    /BULK\s+INSERT/i,
    /OPENROWSET/i,
    /OPENDATASOURCE/i,
  ];

  validate(sql: string): { valid: boolean; error?: string } {
    const normalized = sql.toUpperCase().trim();

    // Rule 1: Must start with SELECT
    if (!normalized.startsWith('SELECT')) {
      return {
        valid: false,
        error: 'Query must start with SELECT',
      };
    }

    // Rule 2: Must contain TOP keyword
    if (!normalized.includes('TOP')) {
      return {
        valid: false,
        error: 'Query must include TOP to limit results',
      };
    }

    // Rule 2b: TOP must come immediately after SELECT (allowing for whitespace)
    // In SQL Server, TOP must be: SELECT TOP N ... not at the end
    const topMatch = normalized.match(/SELECT\s+(TOP\s+\d+)/);
    if (!topMatch) {
      return {
        valid: false,
        error: 'TOP must be placed immediately after SELECT (e.g., SELECT TOP 100 column FROM table)',
      };
    }

    // Rule 3: Check for forbidden keywords
    for (const keyword of this.forbiddenKeywords) {
      // Use word boundary check for most keywords
      const pattern = keyword.includes('_') 
        ? new RegExp(keyword, 'i') // For stored procedure prefixes
        : new RegExp(`\\b${keyword}\\b`, 'i');
      
      if (pattern.test(normalized)) {
        return {
          valid: false,
          error: `Forbidden keyword detected: ${keyword}`,
        };
      }
    }

    // Rule 4: Check for suspicious patterns
    for (const pattern of this.suspiciousPatterns) {
      if (pattern.test(sql)) {
        return {
          valid: false,
          error: 'Suspicious pattern detected in query',
        };
      }
    }

    // Rule 5: Basic structure validation
    // Must have FROM clause
    if (!normalized.includes('FROM')) {
      return {
        valid: false,
        error: 'Query must include FROM clause',
      };
    }

    // Rule 6: Check for multiple statements (semicolons)
    const semicolonCount = (sql.match(/;/g) || []).length;
    if (semicolonCount > 0) {
      return {
        valid: false,
        error: 'Multiple statements are not allowed (semicolon detected)',
      };
    }

    // Rule 7: Length check (prevent extremely long queries)
    if (sql.length > 5000) {
      return {
        valid: false,
        error: 'Query exceeds maximum length',
      };
    }

    return { valid: true };
  }

  sanitize(sql: string): string {
    // Remove any trailing semicolons
    let sanitized = sql.trim().replace(/;+$/, '');

    // Remove SQL comments
    sanitized = sanitized.replace(/--.*$/gm, '');
    sanitized = sanitized.replace(/\/\*[\s\S]*?\*\//g, '');

    // Fix misplaced TOP clause (when AI puts it at the end instead of after SELECT)
    // Pattern: SELECT ... TOP N (at the end, possibly with nothing after TOP N)
    const misplacedTopMatch = sanitized.match(/^(SELECT\s+)(.+?)(\s+TOP\s+\d+)\s*$/i);
    if (misplacedTopMatch) {
      const selectPart = misplacedTopMatch[1];
      const middlePart = misplacedTopMatch[2].trim();
      const topPart = misplacedTopMatch[3].trim();
      sanitized = `${selectPart}${topPart} ${middlePart}`;
    }

    // Trim again after comment removal
    sanitized = sanitized.trim();

    return sanitized;
  }
}
