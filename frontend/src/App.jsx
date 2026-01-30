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
