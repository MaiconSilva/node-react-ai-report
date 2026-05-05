interface QueryLogProps {
  question: string;
  sql: string;
  executionTimeMs: number;
  rowCount: number;
}

function QueryLog({ question, sql, executionTimeMs, rowCount }: QueryLogProps) {
  const formatSql = (sql: string): string => {
    // Format SQL with line breaks for readability
    return sql
      .replace(/\s+/g, ' ')
      .replace(/\s*,\s*/g, ', ')
      .replace(/\s*\(\s*/g, ' (')
      .replace(/\s*\)\s*/g, ') ')
      .replace(/\s+(SELECT|FROM|WHERE|JOIN|LEFT|RIGHT|INNER|OUTER|ON|GROUP|ORDER|HAVING|LIMIT|OFFSET|UNION|INSERT|UPDATE|DELETE|VALUES|SET|AND|OR)\s+/gi, '\n$1 ')
      .trim();
  };

  return (
    <div className="card">
      <h3 className="card-title">Query Details</h3>
      
      <div className="sql-log">
        <pre className="sql-code">{formatSql(sql)}</pre>
      </div>

      <div className="meta-info">
        <div className="meta-item">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 6v6l4 2"/>
          </svg>
          {executionTimeMs}ms
        </div>
        <div className="meta-item">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <line x1="3" y1="9" x2="21" y2="9"/>
            <line x1="9" y1="21" x2="9" y2="9"/>
          </svg>
          {rowCount} rows
        </div>
      </div>
    </div>
  );
}

export default QueryLog;
