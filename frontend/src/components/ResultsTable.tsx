import { AskResponse } from '../types';

interface ResultsTableProps {
  result: AskResponse;
}

function ResultsTable({ result }: ResultsTableProps) {
  const { title, summary, columns, rows } = result;

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'number') {
      // Check if it's a price/total column
      if (
        String(value).includes('.') && 
        (value < 10000 || String(value).split('.')[1]?.length <= 2)
      ) {
        return `$${Number(value).toFixed(2)}`;
      }
      return value.toLocaleString();
    }
    if (typeof value === 'string' && !isNaN(Date.parse(value))) {
      // Format dates
      return new Date(value).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }
    return String(value);
  };

  return (
    <div className="card">
      <div className="results-header">
        <h2 className="results-title">{title}</h2>
        <p className="results-summary">{summary}</p>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}
                >
                  No results found
                </td>
              </tr>
            ) : (
              rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {columns.map((col) => (
                    <td key={`${rowIndex}-${col.key}`}>
                      {formatValue(row[col.key])}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ResultsTable;
