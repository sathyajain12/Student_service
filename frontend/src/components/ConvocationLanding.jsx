import { useState, useRef, useEffect } from 'react';
import { FORM_CONFIGS } from '../formConfigs';
import ConvocationForm from './ConvocationForm';

const convConfig = FORM_CONFIGS['convocation-2026'];
const allInstructions = convConfig?.instructions || [];
const sectionIdx = allInstructions.findIndex(i => i?.type === 'sectionHeader');
const generalItems = sectionIdx === -1 ? allInstructions : allInstructions.slice(0, sectionIdx);
const inAbsentiaItems = sectionIdx === -1 ? [] : allInstructions.slice(sectionIdx + 1);

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8787';

export default function ConvocationLanding({ onTrackStatus }) {
    const [showForm, setShowForm] = useState(() => window.location.pathname === '/convocation/register');
    const [loadingForm, setLoadingForm] = useState(false);
    const [formStep, setFormStep] = useState(1);
    const [formEnabled, setFormEnabled] = useState(true);

    const STEP_IMAGES = [
        '/SSSIHL-Convocation-Discourses-1980s.jpg',
        '/SSSIHL-Convocation-Discourses-1990s-v2.jpg',
        '/SSSIHL-Convocation-Discourses-2000s-v3.jpg',
    ];
    const [btnHover, setBtnHover] = useState(false);
    const [generalVisible, setGeneralVisible] = useState(false);
    const [absVisible, setAbsVisible] = useState(false);
    const [ctaVisible, setCtaVisible] = useState(false);
    const infoRef = useRef(null);
    const generalRef = useRef(null);
    const absRef = useRef(null);
    const ctaRef = useRef(null);

    const scrollToInfo = (e) => { e?.preventDefault(); infoRef.current?.scrollIntoView({ behavior: 'smooth' }); };
    const openForm = () => {
        window.history.pushState({}, '', '/convocation/register');
        setLoadingForm(true);
        window.scrollTo(0, 0);
        setTimeout(() => { setLoadingForm(false); setShowForm(true); }, 1800);
    };
    const closeForm = () => {
        window.history.pushState({}, '', '/convocation');
        setShowForm(false);
        window.scrollTo(0, 0);
    };

    useEffect(() => {
        fetch(`${API_URL}/form-settings`)
            .then(r => r.json())
            .then(data => { if (typeof data['convocation-2026'] === 'boolean') setFormEnabled(data['convocation-2026']); })
            .catch(() => {});
    }, []);

    useEffect(() => {
        if (showForm) return;
        const targets = [
            { ref: generalRef, setVisible: setGeneralVisible },
            { ref: absRef, setVisible: setAbsVisible },
            { ref: ctaRef, setVisible: setCtaVisible },
        ];
        const observers = targets.map(({ ref, setVisible }) => {
            const el = ref.current;
            if (!el) return null;
            const obs = new IntersectionObserver(([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true);
                    obs.disconnect();
                }
            }, { threshold: 0.15 });
            obs.observe(el);
            return obs;
        });
        return () => observers.forEach(o => o?.disconnect());
    }, [showForm]);

    if (showForm) {
        return (
            <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: "'Inter', -apple-system, sans-serif" }}>
                <style>{`@keyframes panelFade { from { opacity: 0; } to { opacity: 1; } }`}</style>

                {/* ── Left panel: full-bleed portrait ── */}
                <div style={{ width: '40%', flexShrink: 0, position: 'relative', overflow: 'hidden', boxShadow: '8px 0 32px rgba(0,0,0,0.35)', zIndex: 1 }}>
                    <img
                        key={formStep}
                        src={STEP_IMAGES[formStep - 1]}
                        alt="SSSIHL Convocation"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block', animation: 'panelFade 0.7s ease both' }}
                    />
                    {/* Logo + name overlay at bottom */}
                    <div style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0,
                        background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0) 100%)',
                        padding: '48px 20px 18px',
                        display: 'flex', alignItems: 'center', gap: '10px',
                    }}>
                        <img src="/SSSIHL-Logo_White.png" alt="SSSIHL" style={{ width: '36px', height: '36px', objectFit: 'contain', flexShrink: 0 }} />
                        <div>
                            <p style={{ color: '#fff', fontWeight: '700', fontSize: '0.78rem', margin: 0, lineHeight: 1.3 }}>Sri Sathya Sai Institute of Higher Learning</p>
                            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.65rem', margin: 0 }}>(Deemed to be University)</p>
                        </div>
                    </div>
                </div>

                {/* ── Right form panel ── */}
                <div style={{ flex: 1, overflowY: 'auto', background: '#fff', display: 'flex', flexDirection: 'column' }}>
                    {/* Top bar */}
                    <div style={{ padding: '16px 48px', borderBottom: '1px solid #f1f5f9', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '3px', height: '20px', background: '#991b1b', borderRadius: '2px' }} />
                            <span style={{ color: '#0f172a', fontWeight: '700', fontSize: '0.82rem' }}>Convocation Registration</span>
                        </div>
                        <button
                            onClick={() => { closeForm(); }}
                            style={{ background: 'none', border: '1px solid #e2e8f0', color: '#64748b', cursor: 'pointer', fontWeight: '500', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 14px', borderRadius: '6px' }}
                        >
                            ← Back
                        </button>
                    </div>
                    <div style={{ maxWidth: '560px', margin: '0 auto', padding: '40px 40px 60px', width: '100%', boxSizing: 'border-box' }}>
                        <ConvocationForm
                            hiddenData={null}
                            onCancel={() => { closeForm(); }}
                            onTrackStatus={onTrackStatus}
                            onStepChange={setFormStep}
                        />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", color: '#1e293b' }}>
            <style>{`
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(28px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-100%); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes kenBurns {
                    from { transform: scale(1.0); }
                    to   { transform: scale(1.06); }
                }
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50%      { transform: translateY(8px); }
                }
                @keyframes fadeIn    { from { opacity: 0; } to { opacity: 1; } }
                @keyframes spin      { to { transform: rotate(360deg); } }
                @keyframes progress  { from { width: 0%; } to { width: 85%; } }
                @keyframes softPulse {
                    0%, 100% { opacity: 0.7; transform: scale(0.97); }
                    50%      { opacity: 1;   transform: scale(1.03); }
                }
            `}</style>

            {/* ── Hero ── */}
            <div style={{ position: 'relative', height: '100vh', minHeight: '580px', overflow: 'hidden', background: '#1a0000' }}>
                <div style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: "url('/Divine-Benedictions-v2.jpg')",
                    backgroundSize: 'cover', backgroundPosition: 'center 15%',
                    opacity: 0.72,
                    animation: 'kenBurns 12s ease-in-out infinite alternate',
                }} />
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to right, rgba(90,5,5,0.42) 0%, rgba(90,5,5,0.18) 55%, rgba(0,0,0,0.05) 100%)',
                }} />
                {/* Top branding bar */}
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 2,
                    padding: '20px 32px', display: 'flex', alignItems: 'center', gap: '14px',
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, transparent 100%)',
                    animation: 'slideDown 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
                }}>
                    <img src="/SSSIHL-Logo_White.png" alt="SSSIHL" style={{ width: '52px', height: '52px', objectFit: 'contain', flexShrink: 0 }} />
                    <div>
                        <p style={{ color: '#fff', fontWeight: '700', fontSize: '0.95rem', margin: 0, lineHeight: '1.3' }}>Sri Sathya Sai Institute of Higher Learning</p>
                        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', margin: 0 }}>(Deemed to be University)</p>
                    </div>
                </div>

                <div style={{
                    position: 'relative', zIndex: 1, maxWidth: '1200px', margin: '0 auto',
                    padding: '0 32px', height: '100%',
                    display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: '90px',
                }}>
                    <span style={{
                        display: 'inline-block', background: '#991b1b', color: '#fff',
                        fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.12em',
                        padding: '4px 12px', borderRadius: '4px', marginBottom: '18px', width: 'fit-content',
                        animation: 'fadeUp 0.65s cubic-bezier(0.22, 1, 0.36, 1) 0ms both',
                    }}>NOVEMBER 2026</span>
                    <h1 style={{
                        color: '#fff', fontSize: '3.2rem', fontWeight: '800', lineHeight: '1.1', marginBottom: '18px', maxWidth: '580px',
                        animation: 'fadeUp 0.65s cubic-bezier(0.22, 1, 0.36, 1) 120ms both',
                    }}>
                        XLV Annual Convocation<br />Registration
                    </h1>
                    <p style={{
                        color: 'rgba(255,255,255,0.85)', fontSize: '1.05rem', maxWidth: '460px', marginBottom: '32px', lineHeight: '1.65',
                        animation: 'fadeUp 0.65s cubic-bezier(0.22, 1, 0.36, 1) 240ms both',
                    }}>
                        Honoring academic excellence and the pursuit of truth. Join us for the most prestigious event in the SSSIHL academic calendar.
                    </p>
                    <button onClick={scrollToInfo} style={{
                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                        background: 'transparent', color: '#fff',
                        border: '1.5px solid rgba(255,255,255,0.65)', borderRadius: '6px',
                        padding: '10px 22px', fontWeight: '500', fontSize: '0.93rem', cursor: 'pointer', width: 'fit-content',
                        animation: 'fadeUp 0.65s cubic-bezier(0.22, 1, 0.36, 1) 360ms both',
                    }}>
                        View Instructions ↓
                    </button>
                </div>
                <button onClick={scrollToInfo} style={{
                    position: 'absolute', bottom: '32px', left: '50%', transform: 'translateX(-50%)',
                    background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
                    fontSize: '1.6rem', lineHeight: 1, padding: 0, zIndex: 2,
                    animation: 'bounce 1.6s ease-in-out infinite',
                }}>↓</button>
            </div>

            {/* ── Registration Information Hub ── */}
            <div ref={infoRef} style={{ background: '#f8fafc', padding: '80px 32px' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '56px' }}>
                        <h2 style={{ fontSize: '1.9rem', fontWeight: '700', color: '#0f172a', marginBottom: '12px' }}>Registration Information Hub</h2>
                        <p style={{ color: '#64748b', maxWidth: '560px', margin: '0 auto', lineHeight: '1.65', fontSize: '0.95rem' }}>
                            Please review all guidelines carefully before submitting your application. The registration process is fully digital and requires specific documentation.
                        </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', alignItems: 'start' }}>

                        {/* General Guidelines */}
                        <div ref={generalRef} style={{ opacity: generalVisible ? 1 : 0, transform: generalVisible ? 'translateY(0)' : 'translateY(24px)', transition: 'opacity 0.6s ease, transform 0.6s ease' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '22px' }}>
                                <div style={{ width: '32px', height: '32px', background: '#eff6ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <span style={{ color: '#2563eb', fontSize: '15px', fontWeight: '700' }}>ℹ</span>
                                </div>
                                <h3 style={{ color: '#2563eb', fontWeight: '600', fontSize: '1rem', margin: 0 }}>General Guidelines</h3>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {generalItems.map((item, i) => (
                                    <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                        <span style={{
                                            flexShrink: 0, width: '22px', height: '22px', background: '#991b1b',
                                            color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center',
                                            justifyContent: 'center', fontSize: '0.7rem', fontWeight: '700', marginTop: '2px',
                                        }}>{i + 1}</span>
                                        <p style={{ color: '#374151', fontSize: '0.88rem', lineHeight: '1.65', margin: 0 }}>
                                            {typeof item === 'string' ? item : item.text}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* In-Absentia Details */}
                        <div ref={absRef} style={{ opacity: absVisible ? 1 : 0, transform: absVisible ? 'translateY(0)' : 'translateY(24px)', transition: 'opacity 0.6s ease, transform 0.6s ease', transitionDelay: absVisible ? '120ms' : '0ms' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '22px' }}>
                                <div style={{ width: '32px', height: '32px', background: '#fff1f2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <span style={{ color: '#e11d48', fontSize: '14px' }}>✉</span>
                                </div>
                                <h3 style={{ color: '#e11d48', fontWeight: '600', fontSize: '1rem', margin: 0 }}>In-Absentia Details</h3>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {inAbsentiaItems.map((item, i) => {
                                    const num = generalItems.length + 1 + i;
                                    if (item?.type === 'address') {
                                        const d = item.details || {};
                                        return (
                                            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                <p style={{ color: '#374151', fontSize: '0.88rem', lineHeight: '1.65', margin: 0 }}>{item.text}</p>
                                                <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '16px' }}>
                                                    <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                                                        <span style={{ color: '#991b1b', fontSize: '16px', flexShrink: 0 }}>📍</span>
                                                        <div>
                                                            <p style={{ fontWeight: '700', fontSize: '0.88rem', color: '#0f172a', margin: '0 0 4px' }}>{d.title}</p>
                                                            <p style={{ color: '#64748b', fontSize: '0.82rem', lineHeight: '1.65', margin: 0 }}>
                                                                {d.office}{d.institution ? `, ${d.institution}` : ''}<br />
                                                                {d.location}<br />{d.district}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {(d.phone || d.email) && (
                                                        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                            {d.phone && <span style={{ color: '#64748b', fontSize: '0.82rem' }}>📞 {d.phone}</span>}
                                                            {d.email && <span style={{ color: '#64748b', fontSize: '0.82rem' }}>✉ {d.email}</span>}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    }
                                    return (
                                        <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                            <span style={{
                                                flexShrink: 0, width: '22px', height: '22px', background: '#991b1b',
                                                color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center',
                                                justifyContent: 'center', fontSize: '0.7rem', fontWeight: '700', marginTop: '2px',
                                            }}>{num}</span>
                                            <p style={{ color: '#374151', fontSize: '0.88rem', lineHeight: '1.65', margin: 0 }}>
                                                {typeof item === 'string' ? item : item.text}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* ── Register CTA ── */}
            <div ref={ctaRef} style={{ background: '#fff', padding: '56px 32px', textAlign: 'center', borderTop: '1px solid #e5e7eb', opacity: ctaVisible ? 1 : 0, transform: ctaVisible ? 'translateY(0)' : 'translateY(24px)', transition: 'opacity 0.6s ease, transform 0.6s ease' }}>
                <h2 style={{ fontSize: '1.6rem', fontWeight: '700', color: '#0f172a', marginBottom: '10px' }}>Ready to Register?</h2>
                <p style={{ color: '#64748b', marginBottom: '28px', fontSize: '0.95rem' }}>Complete your convocation registration online in a few simple steps.</p>
                {formEnabled ? (
                    <button
                        onClick={openForm}
                        onMouseEnter={() => setBtnHover(true)}
                        onMouseLeave={() => setBtnHover(false)}
                        style={{
                            background: '#991b1b', color: '#fff', border: 'none', borderRadius: '8px',
                            padding: '14px 36px', fontWeight: '700', fontSize: '1rem', cursor: 'pointer',
                            transition: 'box-shadow 0.2s ease',
                            boxShadow: btnHover ? '0 0 0 4px rgba(153,27,27,0.25)' : 'none',
                        }}>
                        Register Now →
                    </button>
                ) : (
                    <div style={{ display: 'inline-block', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '16px 32px' }}>
                        <p style={{ margin: 0, fontWeight: '700', color: '#991b1b', fontSize: '1rem' }}>Registration is currently closed</p>
                        <p style={{ margin: '6px 0 0', color: '#7f1d1d', fontSize: '0.88rem' }}>The convocation registration form is not accepting new applications at this time. Please check back later or contact convocation@sssihl.edu.in.</p>
                    </div>
                )}
            </div>

            {/* ── Quote ── */}
            <div style={{ background: '#0f172a', padding: '80px 32px', textAlign: 'center' }}>
                <p style={{ color: '#991b1b', fontSize: '5rem', lineHeight: '0.6', marginBottom: '24px', fontFamily: 'Georgia, serif', fontWeight: '700' }}>"</p>
                <blockquote style={{
                    color: '#e2e8f0', fontSize: '1.35rem', fontStyle: 'italic', lineHeight: '1.75',
                    maxWidth: '720px', margin: '0 auto 24px', fontWeight: '300',
                }}>
                    Education is not for a living, but for life. The end of wisdom is freedom. The end of culture is perfection. The end of education is character.
                </blockquote>
                <div style={{ width: '40px', height: '2px', background: '#991b1b', margin: '0 auto 16px' }} />
                <p style={{ color: '#991b1b', fontWeight: '700', letterSpacing: '0.12em', fontSize: '0.82rem' }}>SRI SATHYA SAI BABA</p>
            </div>

            {/* ── Soft loading screen ── */}
            {loadingForm && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 200,
                    background: '#fff',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px',
                    animation: 'fadeIn 0.25s ease both',
                    fontFamily: "'Inter', -apple-system, sans-serif",
                }}>
                    {/* progress bar */}
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: '#f1f5f9' }}>
                        <div style={{ height: '100%', background: '#991b1b', animation: 'progress 1.6s cubic-bezier(0.4,0,0.2,1) forwards' }} />
                    </div>
                    <img src="/logo.png" alt="SSSIHL" style={{ width: '64px', height: '64px', objectFit: 'contain', animation: 'softPulse 1.6s ease-in-out infinite' }} />
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ color: '#1e293b', fontWeight: '600', fontSize: '0.95rem', margin: '0 0 4px' }}>Sri Sathya Sai Institute of Higher Learning</p>
                        <p style={{ color: '#94a3b8', fontSize: '0.78rem', margin: 0 }}>Convocation 2026 · Registration</p>
                    </div>
                    <p style={{ color: '#cbd5e1', fontSize: '0.72rem', letterSpacing: '0.1em', margin: 0 }}>PREPARING YOUR FORM</p>
                </div>
            )}
        </div>
    );
}
