import React, { useState, useEffect } from 'react';
import Portal from './pages/Portal';
import AdminPortal from './pages/AdminPortal';
import FormBuilder from './components/FormBuilder';
import StatusTracker from './components/StatusTracker';
import LoadingScreen from './components/LoadingScreen';
import InstructionsScreen from './components/InstructionsScreen';
import { FORM_CONFIGS } from './formConfigs';
import './index.css';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState('portal'); // 'portal' | 'instructions' | 'form' | 'status' | 'admin'
  const [currentFormId, setCurrentFormId] = useState(null);
  const [deliveryPreference, setDeliveryPreference] = useState(null);

  // Helper: navigate to a view and push a browser history entry
  const navigateTo = (newView, newFormId = null, newPref = null) => {
    const hashMap = { portal: '', instructions: '#instructions', form: '#form', status: '#status' };
    window.history.pushState(
      { view: newView, currentFormId: newFormId, deliveryPreference: newPref },
      '',
      hashMap[newView] ?? ''
    );
    setView(newView);
    setCurrentFormId(newFormId);
    setDeliveryPreference(newPref);
  };

  // Restore state when browser back/forward is pressed
  useEffect(() => {
    const handlePopState = (e) => {
      const s = e.state;
      if (s?.view) {
        setView(s.view);
        setCurrentFormId(s.currentFormId ?? null);
        setDeliveryPreference(s.deliveryPreference ?? null);
      } else {
        setView('portal');
        setCurrentFormId(null);
        setDeliveryPreference(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    // Check if URL is /admin
    if (window.location.pathname === '/admin') {
      setView('admin');
      setIsLoading(false);
      return;
    }

    // Check if URL has #track hash (from email link)
    if (window.location.hash.startsWith('#track')) {
      window.history.replaceState({ view: 'status', currentFormId: null, deliveryPreference: null }, '', window.location.hash);
      setView('status');
      setIsLoading(false);
      return;
    }

    // Default: portal — seed history state so back works from first page
    window.history.replaceState({ view: 'portal', currentFormId: null, deliveryPreference: null }, '', '');

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view]);

  const selectedConfig = FORM_CONFIGS[currentFormId];

  const handleSelectForm = (id) => {
    navigateTo('instructions', id, null);
  };

  const handleProceedToForm = (pref) => {
    navigateTo('form', currentFormId, pref || null);
  };

  const handleBackToPortal = () => {
    navigateTo('portal', null, null);
  };

  const handleBackToInstructions = () => {
    navigateTo('instructions', currentFormId, null);
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
              onTrackStatus={() => navigateTo('status', null, null)}
            />
          )}

          {view === 'instructions' && (
            <div className="container" style={{ maxWidth: '1050px' }}>
              <div className="glass-card" style={{ padding: '40px' }}>
                {selectedConfig ? (
                  <InstructionsScreen
                    config={selectedConfig}
                    onProceed={handleProceedToForm}
                    onCancel={handleBackToPortal}
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

          {view === 'form' && (
            <div className="container" style={{ maxWidth: '1050px' }}>
              <div className="glass-card" style={{ padding: '40px' }}>
                {selectedConfig ? (
                  <FormBuilder
                    config={selectedConfig}
                    onCancel={handleBackToInstructions}
                    onTrackStatus={() => navigateTo('status', null, null)}
                    hiddenData={deliveryPreference ? { deliveryPreference } : null}
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
            <div className="container" style={{ maxWidth: '1050px' }}>
              <StatusTracker onBack={handleBackToPortal} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;
