import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';

export default function LoadingScreen() {
    const logoUrl = "https://www.sssihl.edu.in/wp-content/uploads/2020/11/cropped-SSSIHL-Logo_Site_Title-150x150.png";

    return (
        <div className="loading-overlay">
            <div style={{ textAlign: 'center', maxWidth: '400px', width: '90%' }}>
                <div style={{ position: 'relative', marginBottom: '40px', display: 'inline-block' }}>
                    <div className="animate-spin-slow" style={{
                        width: '140px',
                        height: '140px',
                        borderRadius: '50%',
                        border: '2px solid rgba(15, 23, 42, 0.05)',
                        borderTop: '2px solid var(--accent)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                    </div>
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        background: 'white',
                        width: '100px',
                        height: '100px',
                        borderRadius: '30%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.1)',
                        border: '1px solid var(--glass-border)',
                        overflow: 'hidden',
                        padding: '10px'
                    }}>
                        <img
                            src={logoUrl}
                            alt="Institute Logo"
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain'
                            }}
                        />
                    </div>
                    <div className="animate-pulse-slow" style={{
                        position: 'absolute',
                        top: '-10px',
                        right: '-10px',
                        color: '#7c3aed'
                    }}>
                        <Sparkles size={24} />
                    </div>
                </div>

                <div className="animate-slide-up">
                    <h2 style={{
                        fontSize: '1.8rem',
                        marginBottom: '10px',
                        background: 'linear-gradient(to right, #1e293b, #334155)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        fontWeight: '800'
                    }}>
                        SSSIHL Portal
                    </h2>
                    <p style={{
                        color: 'var(--text-muted)',
                        fontSize: '0.95rem',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                    }}>
                        <Loader2 size={16} className="animate-spin" />
                        Initializing secure session...
                    </p>
                </div>
            </div>

            <div style={{
                position: 'fixed',
                bottom: '40px',
                left: '0',
                width: '100%',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: '0.8rem',
                opacity: 0.6
            }} className="animate-fade-in">
                Sri Sathya Sai Institute of Higher Learning
            </div>
        </div>
    );
}
