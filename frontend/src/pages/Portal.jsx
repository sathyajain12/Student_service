import React from 'react';
import {
  FileText,
  BarChart3,
  PenTool,
  GraduationCap,
  UserCircle,
  RotateCcw,
  Hash,
  ScrollText,
  Send,
  CheckCircle2,
  Info,
  Search
} from 'lucide-react';

const FORMS = [
  { id: 'duplicate-grade-card', title: 'Application for Duplicate Grade Card', Icon: FileText, category: 'Academic'},
  { id: 'cgpa-conversion', title: 'Application for CGPA to Percentage Conversion', Icon: BarChart3, category: 'Academic'},
  { id: 'supplementary-exam', title: 'Application for Supplementary Examinations Registration', Icon: PenTool, category: 'Exam'},
  { id: 'duplicate-degree', title: 'Application for Duplicate Degree Certificate', Icon: GraduationCap, category: 'Degree'},
  { id: 'name-change', title: 'Application for Registration of Student Name change in the Institute Records', Icon: UserCircle, category: 'Records'},
  { id: 'repeat-paper', title: 'Application for Repeating Examinations Registration (CIE and ESE)', Icon: RotateCcw, category: 'Exam'},
  { id: 'retotaling', title: 'Application for Re-Totalling of Marks', Icon: Hash, category: 'Exam'},
  { id: 'on-request-degree', title: 'Application for On-Request Degree Certificate', Icon: ScrollText, category: 'Degree'},
  { id: 'migration', title: 'Application for Migration Certificate', Icon: Send, category: 'Transfer'},
];

export default function Portal({ onSelectForm, onTrackStatus }) {
  const [formSettings, setFormSettings] = React.useState({});
  const [navigating, setNavigating] = React.useState(false);

  React.useEffect(() => {
    fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8787'}/form-settings`)
      .then(r => r.json())
      .then(settings => setFormSettings(settings))
      .catch(() => {});
  }, []);

  const handleConvocationRegister = () => {
    setNavigating(true);
    setTimeout(() => onSelectForm('convocation-2026'), 1400);
  };


  return (
    <>
    <div className="container animate-fade-in">
      <header style={{ textAlign: 'center', marginBottom: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ marginBottom: '25px', display: 'flex', justifyContent: 'center' }}>
          <img
            src="/Examinations_Service.png"
            alt="SSSIHL Examination Services"
            style={{ maxWidth: '100%', height: 'auto', objectFit: 'contain' }}
          />
        </div>


        <button
          onClick={onTrackStatus}
          className="btn-secondary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 24px',
            border: '2px solid var(--accent)',
            color: 'var(--accent)',
            background: 'white'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--accent)';
            e.currentTarget.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'white';
            e.currentTarget.style.color = 'var(--accent)';
          }}
        >
          <Search size={18} /> Track Your Application Status
        </button>
      </header>

      <div className="glass-card" style={{ padding: '40px', marginBottom: '60px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--accent-gradient)' }}></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '25px' }}>
          <Info size={24} color="var(--accent)" />
          <h2 style={{ fontSize: '1.6rem', color: 'var(--accent)' }}>Submission Guidelines</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '25px' }}>
          {[
            'Select a service from the options below',
            'Keep Supporting Documents ready in PDF format (max 3MB each)',
            'Save your Application ID for future reference',
            'Notifications will be sent to your registered email'
          ].map((text, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <CheckCircle2 size={18} color="var(--success)" style={{ marginTop: '4px', flexShrink: 0 }} />
              <p style={{ color: 'var(--text-main)', fontSize: '0.95rem', fontWeight: '500' }}>{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Convocation announcement banner — hidden when admin disables the form */}
      {formSettings['convocation-2026'] !== false && (
        <>
          <style>{`
            @keyframes convoBannerIn {
              from { opacity: 0; transform: translateY(18px); }
              to   { opacity: 1; transform: translateY(0); }
            }
            @keyframes convoPulse {
              0%, 100% { box-shadow: 0 0 0 0 rgba(250,204,21,0.7); }
              50%       { box-shadow: 0 0 0 7px rgba(250,204,21,0); }
            }
            @keyframes convoFloat {
              0%, 100% { transform: translateY(0px); }
              50%       { transform: translateY(-5px); }
            }
            @keyframes convoOrb1 {
              0%, 100% { transform: translate(0, 0) scale(1); }
              50%       { transform: translate(-15px, 10px) scale(1.08); }
            }
            @keyframes convoOrb2 {
              0%, 100% { transform: translate(0, 0) scale(1); }
              50%       { transform: translate(12px, -8px) scale(1.05); }
            }
          `}</style>
          <div style={{
            marginBottom: '40px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #0f2d6e 0%, #1a4db8 55%, #2563eb 100%)',
            padding: '28px 36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '24px',
            flexWrap: 'wrap',
            boxShadow: '0 12px 40px -8px rgba(15,45,110,0.45)',
            position: 'relative',
            overflow: 'hidden',
            animation: 'convoBannerIn 0.6s cubic-bezier(0.22,1,0.36,1) both',
          }}>
            {/* animated orbs */}
            <div style={{ position: 'absolute', right: '-40px', top: '-40px', width: '180px', height: '180px', borderRadius: '50%', background: 'rgba(255,255,255,0.07)', pointerEvents: 'none', animation: 'convoOrb1 6s ease-in-out infinite' }} />
            <div style={{ position: 'absolute', right: '100px', bottom: '-60px', width: '220px', height: '220px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none', animation: 'convoOrb2 8s ease-in-out infinite' }} />
            <div style={{ position: 'absolute', left: '38%', top: '-30px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none', animation: 'convoOrb1 10s ease-in-out infinite reverse' }} />


            <div style={{ display: 'flex', alignItems: 'center', gap: '18px', position: 'relative' }}>
              {/* floating icon */}
              <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, animation: 'convoFloat 3s ease-in-out infinite' }}>
                <GraduationCap size={28} color="#ffffff" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <span style={{ background: '#facc15', color: '#0f2d6e', fontSize: '0.65rem', fontWeight: '800', letterSpacing: '0.1em', padding: '3px 8px', borderRadius: '20px', textTransform: 'uppercase', animation: 'convoPulse 2s ease-in-out infinite' }}>Now Open</span>
                </div>
                <p style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: '#ffffff', lineHeight: 1.3 }}>XLV Annual Convocation — November 2026</p>
                <p style={{ margin: '4px 0 0', fontSize: '0.88rem', color: 'rgba(255,255,255,0.75)', fontWeight: '400' }}>Eligible graduates may register for in-person or in-absentia participation.</p>
              </div>
            </div>

            <button
              onClick={handleConvocationRegister}
              disabled={navigating}
              style={{
                background: '#ffffff',
                color: '#0f2d6e',
                border: 'none',
                borderRadius: '12px',
                padding: '13px 28px',
                fontWeight: '800',
                fontSize: '0.92rem',
                cursor: navigating ? 'default' : 'pointer',
                flexShrink: 0,
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                position: 'relative',
              }}
              onMouseEnter={e => { if (!navigating) { e.currentTarget.style.transform = 'translateY(-2px) scale(1.03)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.25)'; }}}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'; }}
              onMouseDown={e => { if (!navigating) e.currentTarget.style.transform = 'scale(0.97)'; }}
              onMouseUp={e => { if (!navigating) e.currentTarget.style.transform = 'translateY(-2px) scale(1.03)'; }}
            >
              {navigating ? 'Opening…' : 'Register Now →'}
            </button>
          </div>
        </>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '30px' }}>
        {FORMS.map((form) => {
          const Icon = form.Icon;
          const isDisabled = formSettings[form.id] === false;
          return (
            <div
              key={form.id}
              className="glass-card"
              style={{
                padding: '35px',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                background: isDisabled ? '#f8fafc' : 'white',
                border: form.id === 'convocation-2026' && !isDisabled ? '2px solid #1a4db8' : '1px solid var(--glass-border)',
                opacity: isDisabled ? 0.55 : 1,
                pointerEvents: isDisabled ? 'none' : 'auto',
                transition: 'all 0.3s ease'
              }}
              onClick={isDisabled ? undefined : () => onSelectForm(form.id)}
              onMouseEnter={isDisabled ? undefined : (e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.borderColor = 'var(--accent)';
                e.currentTarget.style.boxShadow = '0 20px 40px -15px rgba(15, 23, 42, 0.15)';
              }}
              onMouseLeave={isDisabled ? undefined : (e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'var(--glass-border)';
                e.currentTarget.style.boxShadow = 'var(--card-shadow)';
              }}
            >
              {form.id === 'convocation-2026' && !isDisabled && (
                <span style={{
                  position: 'absolute', top: '16px', right: '16px',
                  background: '#1a4db8', color: '#ffffff',
                  fontSize: '0.62rem', fontWeight: '800', letterSpacing: '0.1em',
                  padding: '3px 9px', borderRadius: '20px', textTransform: 'uppercase'
                }}>NOW OPEN</span>
              )}
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '16px',
                background: form.id === 'convocation-2026' && !isDisabled ? 'rgba(26,77,184,0.08)' : 'rgba(37, 99, 235, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
                color: 'var(--accent)'
              }}>
                <Icon size={32} />
              </div>
              <h3 style={{ fontSize: '1.45rem', marginBottom: '12px', color: 'var(--primary)' }}>{form.title}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', flexGrow: 1, leading: '1.5' }}>{form.desc}</p>

              <div style={{
                marginTop: '30px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '20px',
                borderTop: '1px solid var(--glass-border)'
              }}>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  background: 'rgba(15, 23, 42, 0.05)',
                  color: 'var(--text-muted)',
                  padding: '6px 12px',
                  borderRadius: '10px'
                }}>
                  {form.category}
                </span>
                {isDisabled ? (
                  <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#94a3b8' }}>
                    Currently Unavailable
                  </span>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent)', fontWeight: '700', fontSize: '0.9rem' }}>
                    Apply Now <Send size={14} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <footer className="glass-card" style={{
        marginTop: '60px',
        padding: '30px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '40px',
        flexWrap: 'wrap',
        borderTop: '1px solid var(--glass-border)'
      }}>
        <div>
          <h4 style={{ fontSize: '1rem', fontWeight: '700', margin: 0, marginBottom: '12px', color: 'var(--primary)' }}>Address</h4>
          <div style={{ fontSize: '0.9rem', lineHeight: '1.6', color: 'var(--text-muted)' }}>
            <p style={{ margin: 0 }}>The Controller of Examinations</p>
            <p style={{ margin: 0 }}>Administrative Office</p>
            <p style={{ margin: 0 }}>Sri Sathya Sai Institute of Higher Learning</p>
            <p style={{ margin: 0 }}>Prasanthi Nilayam – 515134</p>
            <p style={{ margin: 0 }}>Sri Sathya Sai District, Andhra Pradesh</p>
          </div>
        </div>
        <div>
          <h4 style={{ fontSize: '1rem', fontWeight: '700', margin: 0, marginBottom: '12px', color: 'var(--primary)' }}>Contact Details</h4>
          <div style={{ fontSize: '0.9rem', lineHeight: '1.6', color: 'var(--text-muted)' }}>
            <p style={{ margin: 0 }}>Tel: <span style={{ color: 'var(--text-main)' }}>+91 8555 287 191</span></p>
            <p style={{ margin: 0 }}>Email: <a href="mailto:controller@sssihl.edu.in" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: '500' }}>controller@sssihl.edu.in</a></p>
            <p style={{ margin: 0 }}>Web: <a href="https://sssihl.edu.in" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: '500' }}>sssihl.edu.in</a></p>
          </div>
        </div>
      </footer>
    </div >

    {/* Full-page loading overlay when navigating to convocation form */}
    {navigating && (
      <>
        <style>{`
          @keyframes convLoadFadeIn { from { opacity:0; } to { opacity:1; } }
          @keyframes convLoadSpin { to { transform: rotate(360deg); } }
          @keyframes convLoadPulse { 0%,100%{ opacity:0.6; transform:scale(1); } 50%{ opacity:1; transform:scale(1.04); } }
          @keyframes convLoadDot { 0%,80%,100%{ opacity:0.2; transform:scale(0.8); } 40%{ opacity:1; transform:scale(1); } }
        `}</style>
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'linear-gradient(135deg, #0f2d6e 0%, #1a4db8 55%, #2563eb 100%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '28px',
          animation: 'convLoadFadeIn 0.35s ease forwards',
        }}>
          {/* Logo */}
          <div style={{ width: '90px', height: '90px', borderRadius: '50%', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px', boxSizing: 'border-box', boxShadow: '0 8px 32px rgba(0,0,0,0.25)', animation: 'convLoadPulse 1.5s ease-in-out infinite' }}>
            <img src="/logo.png" alt="SSSIHL" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>

          {/* Text */}
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: '0 0 6px', color: '#ffffff', fontWeight: '800', fontSize: '1.25rem', letterSpacing: '0.02em' }}>XLV Annual Convocation 2026</p>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', fontWeight: '400' }}>Loading registration form…</p>
          </div>

          {/* Animated dots */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {[0, 1, 2].map(i => (
              <span key={i} style={{
                width: '10px', height: '10px', borderRadius: '50%', background: '#facc15',
                display: 'inline-block',
                animation: `convLoadDot 1.2s ease-in-out ${i * 0.2}s infinite`,
              }} />
            ))}
          </div>
        </div>
      </>
    )}
    </>
  );
}
