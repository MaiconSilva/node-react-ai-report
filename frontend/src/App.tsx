import { useState, useEffect } from 'react';
import { AskResponse, QueryMemoryEntry } from './types';
import { 
  askQuestion, 
  extractSchema, 
  checkSchemaExists,
  getRules,
  updateRules,
  getMemoryQueries,
  deleteMemoryQuery,
  initializeSystem
} from './api';
import QuestionInput from './components/QuestionInput';
import ResultsTable from './components/ResultsTable';
import QueryLog from './components/QueryLog';
import Loading from './components/Loading';
import ErrorMessage from './components/ErrorMessage';
import EmptyState from './components/EmptyState';

function App() {
  const [result, setResult] = useState<AskResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [schemaExists, setSchemaExists] = useState<boolean | null>(null);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showMemoryModal, setShowMemoryModal] = useState(false);
  const [rulesContent, setRulesContent] = useState('');
  const [memoryQueries, setMemoryQueries] = useState<QueryMemoryEntry[]>([]);

  useEffect(() => {
    checkSchemaStatus();
    initialize();
  }, []);

  const initialize = async () => {
    try {
      await initializeSystem();
    } catch (err) {
      console.log('Initialization error (non-critical):', err);
    }
  };

  const checkSchemaStatus = async () => {
    try {
      const { exists } = await checkSchemaExists();
      setSchemaExists(exists);
    } catch (err) {
      setSchemaExists(false);
    }
  };

  const handleAsk = async (question: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await askQuestion(question);
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleExtractSchema = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await extractSchema(true);
      if (response.success) {
        setSchemaExists(true);
        setError(null);
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract schema');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadRules = async () => {
    try {
      const { content } = await getRules();
      setRulesContent(content);
      setShowRulesModal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load rules');
    }
  };

  const handleSaveRules = async () => {
    try {
      await updateRules(rulesContent);
      setShowRulesModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save rules');
    }
  };

  const handleLoadMemory = async () => {
    try {
      const { queries } = await getMemoryQueries();
      setMemoryQueries(queries);
      setShowMemoryModal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load memory');
    }
  };

  const handleDeleteQuery = async (id: number) => {
    try {
      await deleteMemoryQuery(id);
      setMemoryQueries(memoryQueries.filter(q => q.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete query');
    }
  };

  return (
    <div className="container">
      <header className="header">
        <h1>AI SQL Reports</h1>
        <p>Explore your database by asking questions about your data in natural language</p>
      </header>

      <div className="toolbar">
        <button
          onClick={handleExtractSchema}
          disabled={loading}
          className="button button-secondary"
        >
          {loading ? (
            'Extracting...'
          ) : (
            <>
              {schemaExists && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ marginRight: '6px' }}>
                  <path d="M5 12l5 5L20 7" stroke="#3fb950" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
              Sync Schema
            </>
          )}
        </button>
        <button 
          onClick={handleLoadRules}
          className="button button-secondary"
        >
          Edit Rules
        </button>
        <button 
          onClick={handleLoadMemory}
          className="button button-secondary"
        >
          View Memory
        </button>
      </div>

      {schemaExists === false && (
        <div className="card" style={{ background: 'rgba(187, 128, 9, 0.15)', border: '1px solid rgba(187, 128, 9, 0.3)' }}>
          <div style={{ color: '#d29922' }}>
            <strong>Schema not found.</strong> Click "Generate Schema" to extract database schema first.
          </div>
        </div>
      )}

      {error && <ErrorMessage message={error} />}

      <QuestionInput onSubmit={handleAsk} disabled={loading} />

      {loading && <Loading />}

      {!loading && !error && !result && <EmptyState />}

      {result && result.success && (
        <>
          <ResultsTable result={result} />
          <QueryLog 
            question={result.question}
            sql={result.generatedSql}
            executionTimeMs={result.executionTimeMs}
            rowCount={result.rowCount}
          />
        </>
      )}

      {/* Rules Modal */}
      {showRulesModal && (
        <div className="modal-overlay" onClick={() => setShowRulesModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Business Rules</h2>
              <button className="close-btn" onClick={() => setShowRulesModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <textarea
                className="rules-textarea"
                value={rulesContent}
                onChange={(e) => setRulesContent(e.target.value)}
                rows={20}
                style={{ width: '100%', fontFamily: 'monospace', fontSize: '14px' }}
              />
            </div>
            <div className="modal-footer">
              <button className="button button-secondary" onClick={() => setShowRulesModal(false)}>
                Cancel
              </button>
              <button className="button button-primary" onClick={handleSaveRules}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Memory Modal */}
      {showMemoryModal && (
        <div className="modal-overlay" onClick={() => setShowMemoryModal(false)}>
          <div className="modal modal-large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Query Memory</h2>
              <button className="close-btn" onClick={() => setShowMemoryModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Question</th>
                    <th>Uses</th>
                    <th>Last Used</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {memoryQueries.map((query) => (
                    <tr key={query.id}>
                      <td>{query.id}</td>
                      <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {query.questionOriginal}
                      </td>
                      <td>{query.metadata.usageCount}</td>
                      <td>{new Date(query.metadata.lastUsedAt).toLocaleDateString()}</td>
                      <td>
                        <button 
                          className="button button-secondary"
                          style={{ padding: '4px 8px', fontSize: '12px' }}
                          onClick={() => handleDeleteQuery(query.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="modal-footer">
              <button className="button button-secondary" onClick={() => setShowMemoryModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
