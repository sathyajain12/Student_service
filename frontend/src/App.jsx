import React, { useState, useEffect } from 'react';
import Portal from './pages/Portal';
import AdminPortal from './pages/AdminPortal';
import FormBuilder from './components/FormBuilder';
import StatusTracker from './components/StatusTracker';
import LoadingScreen from './components/LoadingScreen';
import { FORM_CONFIGS } from './formConfigs';
import './index.css';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState('portal'); // 'portal' | 'form' | 'status' | 'admin'
  const [currentFormId, setCurrentFormId] = useState(null);

  useEffect(() => {
    // Check if URL is /admin
    if (window.location.pathname === '/admin') {
      setView('admin');
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  const selectedConfig = FORM_CONFIGS[currentFormId];

  const handleSelectForm = (id) => {
    setCurrentFormId(id);
    setView('form');
  };

  const handleBackToPortal = () => {
    setCurrentFormId(null);
    setView('portal');
  };

  // Admin portal (no loading screen)
  if (view === 'admin') {
    return <AdminPortal />;
  }

  return (
    <div className="App">
      {isLoading && <LoadingScreen />}

      {!isLoading && (
        <>
          {view === 'portal' && (
            <Portal
              onSelectForm={handleSelectForm}
              onTrackStatus={() => setView('status')}
            />
          )}

          {view === 'form' && (
            <div className="container" style={{ maxWidth: '900px' }}>
              <div className="glass-card" style={{ padding: '40px' }}>
                {selectedConfig ? (
                  <FormBuilder
                    config={selectedConfig}
                    onCancel={handleBackToPortal}
                    onTrackStatus={() => setView('status')}
                  />
                ) : (
                  <p style={{ color: 'var(--text-muted)' }}>
                    This form configuration is coming soon.
                    <button onClick={handleBackToPortal} className="btn-secondary" style={{ marginTop: '20px' }}>Back</button>
                  </p>
                )}
              </div>
            </div>
          )}

          {view === 'status' && (
            <div className="container" style={{ maxWidth: '900px' }}>
              <StatusTracker onBack={handleBackToPortal} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;
