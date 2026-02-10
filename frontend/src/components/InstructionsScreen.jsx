import React from 'react';
import {
    ArrowLeft,
    ArrowRight,
    AlertCircle,
    CheckCircle2,
    BookOpen
} from 'lucide-react';

// Helper function to parse **bold** text and signature blocks
const formatText = (text) => {
    // First, convert literal \n strings to actual newlines, then split
    const normalizedText = text.replace(/\\n/g, '\n');
    const lines = normalizedText.split('\n');

    return lines.map((line, lineIndex) => {
        // Check for signature block pattern (Date and Student Signature on same line)
        if (line.match(/^Date\s+Student Signature$/) || line.match(/^Date\t+Student Signature$/)) {
            return (
                <span key={lineIndex} style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <span>Date</span>
                    <span>Student Signature</span>
                    {lineIndex < lines.length - 1 && '\n'}
                </span>
            );
        }

        // Parse bold text within the line
        const parts = line.split(/(\*\*.*?\*\*)/g);
        const formattedParts = parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i}>{part.slice(2, -2)}</strong>;
            }
            return part;
        });

        // Add newline if not the last line
        if (lineIndex < lines.length - 1) {
            return <React.Fragment key={lineIndex}>{formattedParts}{'\n'}</React.Fragment>;
        }
        return <React.Fragment key={lineIndex}>{formattedParts}</React.Fragment>;
    });
};

export default function InstructionsScreen({ config, onProceed, onCancel }) {
    const instructions = config.instructions || [];

    return (
        <div className="animate-fade-in">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px', marginBottom: '40px' }}>
                <button
                    onClick={onCancel}
                    className="btn-secondary"
                    style={{ padding: '10px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '4px' }}
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h2 style={{ fontSize: '1.8rem', color: 'var(--text-main)', marginBottom: '8px' }}>{config.title}</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5' }}>
                        Please read the following instructions carefully before proceeding.
                    </p>
                    {config.descriptionLink && (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5', marginTop: '6px' }}>
                            {config.descriptionLink.text}{' '}
                            <a href={config.descriptionLink.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>
                                {config.descriptionLink.linkText}
                            </a>
                        </p>
                    )}
                </div>
            </div>

            <div style={{
                padding: '30px',
                background: 'rgba(37, 99, 235, 0.03)',
                border: '1px solid var(--glass-border)',
                borderRadius: '20px',
                marginBottom: '30px',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--accent-gradient)' }}></div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '25px' }}>
                    <BookOpen size={24} color="var(--accent)" />
                    <h3 style={{ fontSize: '1.3rem', color: 'var(--accent)', fontWeight: '700' }}>Instructions</h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {instructions.map((instruction, index) => (
                        <div key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                            <div style={{
                                minWidth: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                background: 'var(--accent)',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.85rem',
                                fontWeight: '700',
                                marginTop: '2px'
                            }}>
                                {index + 1}
                            </div>
                            <p style={{
                                color: 'var(--text-main)',
                                fontSize: '0.95rem',
                                fontWeight: '500',
                                lineHeight: '1.6',
                                margin: 0,
                                whiteSpace: 'pre-wrap'
                            }}>
                                {formatText(instruction)}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            <div style={{
                padding: '20px',
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.2)',
                borderRadius: '16px',
                marginBottom: '30px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px'
            }}>
                <AlertCircle size={22} color="#f59e0b" style={{ marginTop: '2px', flexShrink: 0 }} />
                <p style={{ color: 'var(--text-main)', fontSize: '0.9rem', margin: 0, lineHeight: '1.5' }}>
                    By proceeding, you acknowledge that you have read and understood the above instructions.
                    Please ensure all required documents are ready before filling the form.
                </p>
            </div>

            <div style={{ display: 'flex', gap: '15px' }}>
                <button
                    onClick={onProceed}
                    className="btn-primary"
                    style={{
                        flexGrow: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px'
                    }}
                >
                    <CheckCircle2 size={18} />
                    I Understand, Proceed to Form
                    <ArrowRight size={18} />
                </button>
                <button onClick={onCancel} className="btn-secondary">
                    Cancel
                </button>
            </div>
        </div>
    );
}
