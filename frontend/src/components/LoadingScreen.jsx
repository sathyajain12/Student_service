import React from 'react';

export default function LoadingScreen() {
    const logoUrl = "/logo.png";

    return (
        <div className="loading-overlay">
            <div className="glass-card" style={{
                textAlign: 'center',
                maxWidth: '400px',
                width: '90%',
                padding: '40px 20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '24px'
            }}>
                {/* Breathing Logo Container */}
                <div className="animate-breathe" style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    background: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '15px',
                    boxShadow: '0 8px 32px rgba(37, 99, 235, 0.1)'
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

                {/* Text Content */}
                <div className="animate-slide-up">
                    <h2 style={{
                        fontSize: '1.5rem',
                        marginBottom: '8px',
                        color: 'var(--primary)',
                        fontWeight: '700',
                        letterSpacing: '-0.02em'
                    }}>
                        SSSIHL Examination Services
                    </h2>
                    <p style={{
                        color: 'var(--text-muted)',
                        fontSize: '0.9rem',
                        fontWeight: '500',
                        opacity: 0.8
                    }}>
                        Securing connection...
                    </p>
                </div>

                {/* Sleek Progress Bar */}
                <div style={{
                    width: '100%',
                    height: '4px',
                    background: 'rgba(15, 23, 42, 0.05)',
                    borderRadius: '999px',
                    overflow: 'hidden',
                    marginTop: '10px'
                }}>
                    <div className="animate-shimmer" style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '999px'
                    }}></div>
                </div>
            </div>

            {/* Footer Text */}
            <div style={{
                position: 'fixed',
                bottom: '40px',
                left: '0',
                width: '100%',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: '0.8rem',
                opacity: 0.6,
                letterSpacing: '0.05em',
                textTransform: 'uppercase'
            }} className="animate-fade-in">
                Sri Sathya Sai Institute of Higher Learning
            </div>
        </div>
    );
}
