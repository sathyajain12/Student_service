import React, { useState } from 'react';
import {
    ArrowLeft,
    ArrowRight,
    AlertCircle,
    CheckCircle2,
    BookOpen,
    MapPin,
    Phone,
    Mail,
    Globe
} from 'lucide-react';

// Helper function to parse **bold** text and signature blocks
const formatText = (text) => {
    if (!text || typeof text !== 'string') return text;
    // First, convert literal \n strings to actual newlines, then split
    const normalizedText = text.replace(/\\n/g, '\n');
    const lines = normalizedText.split('\n');

    return lines.map((line, lineIndex) => {
        // Check for side-by-side patterns separated by tab(s) — render as flex space-between
        if (line.includes('\t')) {
            const sides = line.split(/\t+/).map(s => s.trim()).filter(Boolean);
            if (sides.length === 2) {
                const parseBold = (str) => {
                    const parts = str.split(/(\*\*.*?\*\*)/g);
                    return parts.map((p, i) => p.startsWith('**') && p.endsWith('**')
                        ? <strong key={i}>{p.slice(2, -2)}</strong> : p);
                };
                return (
                    <span key={lineIndex} style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <span>{parseBold(sides[0])}</span>
                        <span>{parseBold(sides[1])}</span>
                        {lineIndex < lines.length - 1 && '\n'}
                    </span>
                );
            }
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
    const [hardCopy, setHardCopy] = useState(false);
    const [softCopy, setSoftCopy] = useState(false);

    return (
        <div className="animate-fade-in">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px', marginBottom: '20px' }}>
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
                </div>
            </div>

            {(config.description || config.descriptionLink) && (
                <div style={{
                    marginBottom: '20px',
                    padding: '14px 18px',
                    background: 'rgba(245, 158, 11, 0.08)',
                    border: '1px solid rgba(245, 158, 11, 0.25)',
                    borderRadius: '12px',
                }}>
                    {config.description && (
                        <div style={{ marginBottom: config.descriptionLink ? '8px' : '0' }}>
                            <p style={{ color: '#92400e', fontSize: '0.95rem', lineHeight: '1.5', margin: 0, fontWeight: '500' }}>
                                {(() => {
                                    let text = config.description;
                                    const isNote = text.startsWith('Note:');
                                    const notePrefix = isNote ? <span style={{ fontWeight: '700' }}>Note:</span> : null;
                                    if (isNote) text = text.slice(5);

                                    const parts = text.split(/(\[.*?\]\(.*?\))/g);
                                    const rendered = parts.map((part, i) => {
                                        const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
                                        if (linkMatch) {
                                            return <a key={i} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" style={{ color: '#1d4ed8', fontWeight: '600', textDecoration: 'underline' }}>{linkMatch[1]}</a>;
                                        }
                                        return part;
                                    });
                                    return <>{notePrefix}{rendered}</>;
                                })()}
                            </p>
                        </div>
                    )}
                    {config.descriptionLink && (
                        <div>
                            <p style={{ color: '#92400e', fontSize: '0.95rem', lineHeight: '1.5', margin: 0, fontWeight: '500' }}>
                                {config.descriptionLink.text}{' '}
                                <a href={config.descriptionLink.url} target="_blank" rel="noopener noreferrer" style={{ color: '#1d4ed8', fontWeight: '600', textDecoration: 'underline' }}>
                                    {config.descriptionLink.linkText}
                                </a>
                            </p>
                        </div>
                    )}
                </div>
            )}

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
                    {instructions.map((instruction, index) => {
                        const isObject = typeof instruction === 'object' && instruction !== null;
                        const isFormat = isObject && instruction.type === 'format';
                        const isTextWithFormat = isObject && instruction.type === 'textWithFormat';
                        const isAddress = isObject && instruction.type === 'address';
                        const isDeliveryOptions = isObject && instruction.type === 'deliveryOptions';
                        const text = isObject ? instruction.text : instruction;

                        return (
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
                                    marginTop: '2px',
                                    flexShrink: 0
                                }}>
                                    {index + 1}
                                </div>
                                {isFormat ? (
                                    <div style={{
                                        flex: 1,
                                        background: 'rgba(37, 99, 235, 0.06)',
                                        border: '2px solid rgba(37, 99, 235, 0.35)',
                                        borderRadius: '10px',
                                        padding: '16px 20px',
                                        fontFamily: 'monospace',
                                        fontSize: '0.875rem',
                                        fontWeight: '500',
                                        lineHeight: '1.7',
                                        color: 'var(--text-main)',
                                        whiteSpace: 'pre-wrap'
                                    }}>
                                        {formatText(text)}
                                    </div>
                                ) : isTextWithFormat ? (
                                    <div style={{ flex: 1 }}>
                                        <p style={{
                                            color: 'var(--text-main)',
                                            fontSize: '0.95rem',
                                            fontWeight: '500',
                                            lineHeight: '1.6',
                                            margin: 0,
                                            whiteSpace: 'pre-wrap',
                                            textAlign: 'justify'
                                        }}>
                                            {formatText(text)}
                                        </p>
                                        <div style={{
                                            marginTop: '12px',
                                            background: 'rgba(37, 99, 235, 0.06)',
                                            border: '2px solid rgba(37, 99, 235, 0.35)',
                                            borderRadius: '10px',
                                            padding: '16px 20px',
                                            fontSize: '0.9rem',
                                            fontWeight: '500',
                                            lineHeight: '1.7',
                                            color: 'var(--text-main)',
                                            whiteSpace: 'pre-wrap'
                                        }}>
                                            {formatText(instruction.format)}
                                        </div>
                                    </div>
                                ) : isAddress ? (
                                    <div style={{ flex: 1 }}>
                                        <p style={{
                                            color: 'var(--text-main)',
                                            fontSize: '0.95rem',
                                            fontWeight: '500',
                                            lineHeight: '1.6',
                                            margin: '0 0 16px 0',
                                            whiteSpace: 'pre-wrap',
                                            textAlign: 'justify'
                                        }}>
                                            {formatText(text)}
                                        </p>
                                        <div style={{
                                            background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '16px',
                                            padding: '24px',
                                            boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '20px'
                                        }}>
                                            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                                                <div style={{ background: 'rgba(37, 99, 235, 0.1)', padding: '10px', borderRadius: '10px' }}>
                                                    <MapPin size={20} color="var(--accent)" />
                                                </div>
                                                <div>
                                                    <h4 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '4px' }}>
                                                        {instruction.details.title}
                                                    </h4>
                                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.5', margin: 0 }}>
                                                        {instruction.details.office}<br />
                                                        {instruction.details.institution}<br />
                                                        {instruction.details.location}<br />
                                                        {instruction.details.district}
                                                    </p>
                                                </div>
                                            </div>

                                            <div style={{ height: '1px', background: '#e2e8f0', width: '100%' }}></div>

                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                    <div style={{ background: '#f1f5f9', padding: '8px', borderRadius: '8px' }}>
                                                        <Phone size={16} color="#475569" />
                                                    </div>
                                                    <div>
                                                        <p style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '1px', letterSpacing: '0.025em' }}>Call Us</p>
                                                        <p style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-main)', margin: 0 }}>{instruction.details.contact.tel}</p>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                    <div style={{ background: '#f1f5f9', padding: '8px', borderRadius: '8px' }}>
                                                        <Mail size={16} color="#475569" />
                                                    </div>
                                                    <div>
                                                        <p style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '1px', letterSpacing: '0.025em' }}>Email</p>
                                                        <p style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--accent)', margin: 0 }}>{instruction.details.contact.email}</p>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                    <div style={{ background: '#f1f5f9', padding: '8px', borderRadius: '8px' }}>
                                                        <Globe size={16} color="#475569" />
                                                    </div>
                                                    <div>
                                                        <p style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '1px', letterSpacing: '0.025em' }}>Website</p>
                                                        <p style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-main)', margin: 0 }}>{instruction.details.contact.web}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : isDeliveryOptions ? (
                                    <div style={{ flex: 1 }}>
                                        <p style={{ color: 'var(--text-main)', fontSize: '0.95rem', fontWeight: '500', lineHeight: '1.6', margin: '0 0 16px 0' }}>
                                            Please select your preferred delivery option for the Migration Certificate:
                                        </p>
                                        {/* Checkboxes */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                                            {[
                                                { id: 'hardCopy', label: 'Hard Copy', desc: 'Certificate dispatched by Speed Post', checked: hardCopy, setter: setHardCopy },
                                                { id: 'softCopy', label: 'Soft Copy', desc: 'Download from DigiLocker', checked: softCopy, setter: setSoftCopy }
                                            ].map(({ id, label, desc, checked, setter }) => (
                                                <label key={id} style={{
                                                    display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer',
                                                    padding: '12px 16px', borderRadius: '10px',
                                                    border: `2px solid ${checked ? 'var(--accent)' : 'var(--glass-border)'}`,
                                                    background: checked ? 'rgba(37, 99, 235, 0.06)' : 'transparent',
                                                    transition: 'all 0.2s'
                                                }}>
                                                    <input type="checkbox" checked={checked} onChange={e => setter(e.target.checked)}
                                                        style={{ width: '18px', height: '18px', accentColor: 'var(--accent)', cursor: 'pointer', flexShrink: 0 }} />
                                                    <div>
                                                        <span style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '0.95rem' }}>{label}</span>
                                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginLeft: '8px' }}>{desc}</span>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                        {/* Hard Copy: address card + envelope notes */}
                                        {hardCopy && (
                                            <div style={{ marginBottom: softCopy ? '20px' : '0' }}>
                                                <p style={{ color: 'var(--text-main)', fontSize: '0.95rem', fontWeight: '500', lineHeight: '1.6', margin: '0 0 16px 0', textAlign: 'justify' }}>
                                                    {instruction.addressText}
                                                </p>
                                                <div style={{
                                                    background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
                                                    border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px',
                                                    boxShadow: '0 4px 15px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', gap: '20px',
                                                    marginBottom: '12px'
                                                }}>
                                                    <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                                                        <div style={{ background: 'rgba(37, 99, 235, 0.1)', padding: '10px', borderRadius: '10px' }}>
                                                            <MapPin size={20} color="var(--accent)" />
                                                        </div>
                                                        <div>
                                                            <h4 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '4px' }}>
                                                                {instruction.addressDetails.title}
                                                            </h4>
                                                            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.5', margin: 0 }}>
                                                                {instruction.addressDetails.office}<br />
                                                                {instruction.addressDetails.institution}<br />
                                                                {instruction.addressDetails.location}<br />
                                                                {instruction.addressDetails.district}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div style={{ height: '1px', background: '#e2e8f0', width: '100%' }}></div>
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                            <div style={{ background: '#f1f5f9', padding: '8px', borderRadius: '8px' }}><Phone size={16} color="#475569" /></div>
                                                            <div>
                                                                <p style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '1px', letterSpacing: '0.025em' }}>Call Us</p>
                                                                <p style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-main)', margin: 0 }}>{instruction.addressDetails.contact.tel}</p>
                                                            </div>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                            <div style={{ background: '#f1f5f9', padding: '8px', borderRadius: '8px' }}><Mail size={16} color="#475569" /></div>
                                                            <div>
                                                                <p style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '1px', letterSpacing: '0.025em' }}>Email</p>
                                                                <p style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--accent)', margin: 0 }}>{instruction.addressDetails.contact.email}</p>
                                                            </div>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                            <div style={{ background: '#f1f5f9', padding: '8px', borderRadius: '8px' }}><Globe size={16} color="#475569" /></div>
                                                            <div>
                                                                <p style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '1px', letterSpacing: '0.025em' }}>Website</p>
                                                                <p style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-main)', margin: 0 }}>{instruction.addressDetails.contact.web}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                {instruction.envelopeNotes?.map((note, i) => (
                                                    <p key={i} style={{ color: 'var(--text-main)', fontSize: '0.9rem', lineHeight: '1.6', margin: '0 0 6px 0', paddingLeft: '4px' }}>
                                                        • {note}
                                                    </p>
                                                ))}
                                            </div>
                                        )}
                                        {/* Soft Copy: informational note */}
                                        {softCopy && (
                                            <div style={{
                                                padding: '14px 16px', borderRadius: '10px',
                                                background: 'rgba(37, 99, 235, 0.06)',
                                                border: '1px solid rgba(37, 99, 235, 0.2)'
                                            }}>
                                                <p style={{ color: 'var(--text-main)', fontSize: '0.9rem', margin: 0, lineHeight: '1.6' }}>
                                                    Once your application is processed, you will be able to download the Migration Certificate from your DigiLocker account.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p style={{
                                        color: 'var(--text-main)',
                                        fontSize: '0.95rem',
                                        fontWeight: '500',
                                        lineHeight: '1.6',
                                        margin: 0,
                                        whiteSpace: 'pre-wrap',
                                        textAlign: 'justify'
                                    }}>
                                        {formatText(text)}
                                    </p>
                                )}
                            </div>
                        );
                    })}
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
                    {config.files?.length > 0 && ' Please ensure all required documents are ready before filling the form.'}
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
