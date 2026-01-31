import React, { useState } from 'react';
import Portal from './pages/Portal';
import FormBuilder from './components/FormBuilder';
import { FORM_CONFIGS } from './formConfigs';
import './index.css';

function App() {
  const [currentFormId, setCurrentFormId] = useState(null);

  const selectedConfig = FORM_CONFIGS[currentFormId];

  return (
    <div className="App">
      {!currentFormId ? (
        <Portal onSelectForm={setCurrentFormId} />
      ) : (
        <div className="container" style={{ maxWidth: '800px' }}>
          <button
            className="btn-secondary"
            onClick={() => setCurrentFormId(null)}
            style={{ marginBottom: '20px', background: 'transparent', border: '1px solid var(--glass-border)', color: 'white' }}
          >
            ← Back to Portal
          </button>
          <div className="glass-card" style={{ padding: '40px' }}>
            <h2 className="title-gradient" style={{ marginBottom: '30px', fontSize: '2rem' }}>
              {selectedConfig ? selectedConfig.title : 'Application Form'}
            </h2>

            {selectedConfig?.titleLink && (
              <div style={{ marginTop: '-20px', marginBottom: '20px' }}>
                <a
                  href={selectedConfig.titleLink.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: '#60a5fa',
                    textDecoration: 'none',
                    fontSize: '0.95rem',
                    transition: 'color 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.color = '#93c5fd'}
                  onMouseLeave={(e) => e.target.style.color = '#60a5fa'}
                >
                  {selectedConfig.titleLink.text} →
                </a>
              </div>
            )}

            {selectedConfig?.description && (
              <p style={{
                marginTop: selectedConfig?.titleLink ? '0px' : '-20px',
                marginBottom: '20px',
                color: '#9ca3af',
                fontSize: '0.9rem',
                fontStyle: 'italic'
              }}>
                {selectedConfig.description}
              </p>
            )}

            {selectedConfig ? (
              <FormBuilder
                config={selectedConfig}
                onCancel={() => setCurrentFormId(null)}
              />
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>
                This form configuration is coming soon.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
