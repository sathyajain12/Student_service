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
        <div className="container" style={{ maxWidth: '900px' }}>
          <div className="glass-card" style={{ padding: '40px' }}>
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
