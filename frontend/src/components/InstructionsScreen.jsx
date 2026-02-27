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
    Globe,
    FlaskConical,
    Palette
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
    const [examType, setExamType] = useState(null);
    const [calcScale, setCalcScale] = useState('5');
    const [calcCgpa, setCalcCgpa] = useState('');
    const [calcTable, setCalcTable] = useState('1');

    const CGPA_TABLES = {
        '1': {
            label: 'Science & M.Tech', rows: [
                { LP: 4.50, UP: 5.00, L: 75, H: 100 },
                { LP: 3.50, UP: 4.50, L: 60, H: 75 },
                { LP: 2.50, UP: 3.50, L: 50, H: 60 },
                { LP: 2.00, UP: 2.50, L: 40, H: 50 },
            ]
        },
        '2': {
            label: 'Arts, Management, Commerce, M.B.A., B.Ed. & Music', rows: [
                { LP: 4.50, UP: 5.00, L: 70, H: 100 },
                { LP: 3.50, UP: 4.50, L: 60, H: 70 },
                { LP: 2.50, UP: 3.50, L: 50, H: 60 },
                { LP: 2.00, UP: 2.50, L: 40, H: 50 },
            ]
        },
    };

    const cgpaVal = parseFloat(calcCgpa);
    let calcResult = null;
    if (!isNaN(cgpaVal) && calcCgpa !== '') {
        if (calcScale === '10') {
            if (cgpaVal < 0 || cgpaVal > 10) {
                calcResult = { error: 'CGPA must be between 0.00 and 10.00' };
            } else {
                const pct = (cgpaVal * 10).toFixed(2);
                calcResult = { result: pct, formulaStr: `${cgpaVal} × 10 = ${pct}%` };
            }
        } else {
            if (cgpaVal < 2.00 || cgpaVal > 5.00) {
                calcResult = { error: 'CGPA must be between 2.00 and 5.00 for 5-point scale' };
            } else {
                const row = CGPA_TABLES[calcTable].rows.find(r => cgpaVal >= r.LP && cgpaVal <= r.UP);
                if (!row) {
                    calcResult = { error: 'Value out of table range' };
                } else {
                    const pct = (row.L + ((row.H - row.L) / (row.UP - row.LP)) * (cgpaVal - row.LP)).toFixed(2);
                    calcResult = {
                        result: pct,
                        formulaStr: `${row.L} + ((${row.H} – ${row.L}) / (${row.UP} – ${row.LP})) × (${cgpaVal} – ${row.LP}) = ${pct}%`
                    };
                }
            }
        }
    }

    const hasDeliveryOptions = config.instructions?.some(i => i?.type === 'deliveryOptions');
    const deliveryOptionsInstruction = config.instructions?.find(i => i?.type === 'deliveryOptions');
    const proceedDisabled = hasDeliveryOptions && !hardCopy && !softCopy;
    const isCgpaCalculator = deliveryOptionsInstruction?.softCopyContent === 'cgpaFormula';
    const hideProceedButton = isCgpaCalculator && softCopy && !hardCopy;

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
                        const isExamTypeSelector = isObject && instruction.type === 'examTypeSelector';
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
                                            Please select your preferred option for the {instruction.certificateName || 'Migration Certificate'}:
                                        </p>
                                        {/* Checkboxes */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                                            {[
                                                { id: 'hardCopy', label: instruction.hardCopyLabel || 'Hard Copy', desc: instruction.hardCopyDesc || 'Certificate dispatched by Speed Post', checked: hardCopy, setter: setHardCopy },
                                                { id: 'softCopy', label: isCgpaCalculator ? 'Calculate' : (instruction.softCopyLabel || 'Soft Copy'), desc: instruction.softCopyDesc || 'Download from DigiLocker', checked: softCopy, setter: setSoftCopy }
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
                                                {instruction.addressDetails && (
                                                    <>
                                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', margin: '0 0 16px 0' }}>
                                                            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--accent)', flexShrink: 0, marginTop: '6px' }} />
                                                            <p style={{ color: 'var(--text-main)', fontSize: '0.95rem', fontWeight: '500', lineHeight: '1.6', margin: 0, textAlign: 'justify' }}>
                                                                {instruction.addressText}
                                                            </p>
                                                        </div>
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
                                                    </>
                                                )}
                                                {instruction.envelopeNotes?.map((note, i) => (
                                                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', margin: '0 0 8px 0' }}>
                                                        <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--accent)', flexShrink: 0, marginTop: '6px' }} />
                                                        <p style={{ color: 'var(--text-main)', fontSize: '0.9rem', lineHeight: '1.6', margin: 0 }}>{note}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {/* Soft Copy: CGPA formula or DigiLocker note */}
                                        {softCopy && (
                                            instruction.softCopyContent === 'cgpaFormula' ? (
                                                <div style={{
                                                    padding: '20px', borderRadius: '12px',
                                                    background: 'rgba(37, 99, 235, 0.04)',
                                                    border: '1px solid rgba(37, 99, 235, 0.2)'
                                                }}>
                                                    {/* 5-Point Scale Section */}
                                                    <div style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '20px', marginBottom: '20px' }}>
                                                        <p style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--accent)', margin: '0 0 10px 0' }}>
                                                            For GPA / CGPA on a 5-Point Scale
                                                        </p>
                                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 14px 0', lineHeight: '1.5' }}>
                                                            Fix the relevant range from the tables below, then apply the formula:
                                                        </p>
                                                        {/* Formula */}
                                                        <div style={{ textAlign: 'center', margin: '0 0 14px 0', fontSize: '1rem', color: 'var(--text-main)', fontWeight: '500' }}>
                                                            <span style={{ verticalAlign: 'middle' }}>L% + </span>
                                                            <span style={{ display: 'inline-block', verticalAlign: 'middle', margin: '0 4px' }}>
                                                                <span style={{ display: 'block', borderBottom: '1.5px solid var(--text-main)', textAlign: 'center', padding: '0 6px 2px 6px', fontSize: '0.95rem' }}>H% – L%</span>
                                                                <span style={{ display: 'block', textAlign: 'center', padding: '2px 6px 0 6px', fontSize: '0.95rem' }}>UP – LP</span>
                                                            </span>
                                                            <span style={{ verticalAlign: 'middle' }}> × (CGPA / GPA in question – LP)</span>
                                                        </div>
                                                        {/* Abbreviations */}
                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '20px' }}>
                                                            {[
                                                                { abbr: 'LP', full: 'Lower Point of CGPA range' },
                                                                { abbr: 'UP', full: 'Upper Point of CGPA range' },
                                                                { abbr: 'L%', full: 'Lower Percentage equivalent' },
                                                                { abbr: 'H%', full: 'Higher Percentage equivalent' },
                                                            ].map(({ abbr, full }) => (
                                                                <div key={abbr} style={{
                                                                    display: 'flex', alignItems: 'center', gap: '6px',
                                                                    padding: '5px 12px', borderRadius: '20px',
                                                                    background: 'rgba(37, 99, 235, 0.08)',
                                                                    border: '1px solid rgba(37, 99, 235, 0.25)'
                                                                }}>
                                                                    <span style={{ fontWeight: '800', color: 'var(--accent)', fontSize: '0.82rem' }}>{abbr}</span>
                                                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: '600' }}>=</span>
                                                                    <span style={{ color: 'var(--text-main)', fontSize: '0.78rem' }}>{full}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        {/* Conversion Tables */}
                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                                                            {[
                                                                {
                                                                    title: 'Table 1',
                                                                    note: 'Science & M.Tech',
                                                                    rows: [
                                                                        ['4.50', '5.00', '75', '100'],
                                                                        ['3.50', '4.50', '60', '75'],
                                                                        ['2.50', '3.50', '50', '60'],
                                                                        ['2.00', '2.50', '40', '50'],
                                                                    ]
                                                                },
                                                                {
                                                                    title: 'Table 2',
                                                                    note: 'Arts, Management, Commerce, M.B.A., B.Ed. & Music',
                                                                    rows: [
                                                                        ['4.50', '5.00', '70', '100'],
                                                                        ['3.50', '4.50', '60', '70'],
                                                                        ['2.50', '3.50', '50', '60'],
                                                                        ['2.00', '2.50', '40', '50'],
                                                                    ]
                                                                }
                                                            ].map(({ title, note, rows }) => (
                                                                <div key={title} style={{ background: '#fff', border: '2px solid rgba(37, 99, 235, 0.3)', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(37, 99, 235, 0.08)' }}>
                                                                    <div style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.15) 0%, rgba(37,99,235,0.08) 100%)', padding: '10px 14px', borderBottom: '2px solid rgba(37, 99, 235, 0.2)' }}>
                                                                        <p style={{ fontWeight: '800', fontSize: '0.85rem', color: 'var(--accent)', margin: '0 0 2px 0' }}>{title}</p>
                                                                        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0, lineHeight: '1.3' }}>{note}</p>
                                                                    </div>
                                                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                                                                        <thead>
                                                                            <tr style={{ background: 'rgba(37, 99, 235, 0.12)' }}>
                                                                                <th colSpan={2} style={{ padding: '7px 8px', textAlign: 'center', color: 'var(--accent)', fontWeight: '700', borderBottom: '1px solid rgba(37,99,235,0.2)', fontSize: '0.75rem' }}>CGPA/GPA Range</th>
                                                                                <th colSpan={2} style={{ padding: '7px 8px', textAlign: 'center', color: 'var(--accent)', fontWeight: '700', borderBottom: '1px solid rgba(37,99,235,0.2)', fontSize: '0.75rem' }}>Equivalent %</th>
                                                                            </tr>
                                                                            <tr style={{ background: 'rgba(37, 99, 235, 0.06)' }}>
                                                                                {['LP', 'UP', 'L%', 'H%'].map(h => (
                                                                                    <th key={h} style={{ padding: '5px 8px', textAlign: 'center', color: 'var(--accent)', fontWeight: '700', borderBottom: '1px solid rgba(37,99,235,0.2)', fontSize: '0.73rem' }}>{h}</th>
                                                                                ))}
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {rows.map(([lp, up, lperc, hperc], i) => (
                                                                                <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : 'rgba(37, 99, 235, 0.03)', borderBottom: i < rows.length - 1 ? '1px solid rgba(37,99,235,0.1)' : 'none' }}>
                                                                                    {[lp, up, lperc, hperc].map((val, j) => (
                                                                                        <td key={j} style={{ padding: '7px 8px', textAlign: 'center', color: j >= 2 ? 'var(--accent)' : 'var(--text-main)', fontWeight: j >= 2 ? '700' : '400' }}>{val}</td>
                                                                                    ))}
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        {/* 10-Point Scale Section */}
                                                        <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '16px' }}>
                                                            <p style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--accent)', margin: '0 0 8px 0' }}>
                                                                For GPA / CGPA on a 10-Point Scale
                                                            </p>
                                                            <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', margin: '0 0 6px 0', lineHeight: '1.6' }}>
                                                                Equivalent Percentage of Marks = GPA / CGPA × 10
                                                            </p>
                                                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, lineHeight: '1.6' }}>
                                                                e.g., GPA of 7.2 is equivalent to 72%, GPA of 6.3 is equivalent to 63%
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {/* Calculator Section — clean light card */}
                                                    <div style={{
                                                        background: '#fff', borderRadius: '24px', padding: '24px',
                                                        boxShadow: '0 4px 24px rgba(37,99,235,0.08)',
                                                        border: '1px solid #e8eef8'
                                                    }}>
                                                        {/* Title */}
                                                        <p style={{ fontSize: '1.25rem', fontWeight: '800', color: '#1e293b', margin: '0 0 20px 0' }}>
                                                            CGPA to Percentage Converter
                                                        </p>
                                                        {/* Input */}
                                                        <div style={{ marginBottom: '16px' }}>
                                                            <p style={{ fontSize: '0.68rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 8px 0' }}>
                                                                CGPA / GPA
                                                            </p>
                                                            <input
                                                                type="number"
                                                                value={calcCgpa}
                                                                onChange={e => setCalcCgpa(e.target.value)}
                                                                placeholder="0.00"
                                                                min="0"
                                                                max={calcScale === '10' ? '10' : '5'}
                                                                step="0.01"
                                                                style={{
                                                                    width: '100%', padding: '16px 20px', borderRadius: '14px',
                                                                    fontSize: '1.4rem', fontWeight: '600',
                                                                    border: '2px solid #e2e8f0', background: '#f8fafc',
                                                                    color: '#1e293b', outline: 'none',
                                                                    boxSizing: 'border-box'
                                                                }}
                                                            />
                                                        </div>
                                                        {/* Scale toggle */}
                                                        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                                                            {[{ val: '5', label: '5-Point Scale' }, { val: '10', label: '10-Point Scale' }].map(({ val, label }) => (
                                                                <button key={val} onClick={() => { setCalcScale(val); setCalcCgpa(''); }}
                                                                    style={{
                                                                        flex: 1, padding: '14px', borderRadius: '50px', border: 'none', cursor: 'pointer',
                                                                        fontWeight: '700', fontSize: '0.9rem',
                                                                        background: calcScale === val ? '#2563eb' : '#f1f5f9',
                                                                        color: calcScale === val ? '#fff' : '#64748b',
                                                                        transition: 'all 0.2s', boxShadow: calcScale === val ? '0 4px 12px rgba(37,99,235,0.3)' : 'none'
                                                                    }}>
                                                                    {label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                        {/* Programme type (5-point only) */}
                                                        {calcScale === '5' && (
                                                            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                                                                {[
                                                                    { val: '1', label: 'Science & M.Tech', Icon: FlaskConical },
                                                                    { val: '2', label: 'Arts, Management, Commerce, M.B.A., B.Ed. & Music', Icon: Palette }
                                                                ].map(({ val, label, Icon }) => (
                                                                    <button key={val} onClick={() => setCalcTable(val)} style={{
                                                                        flex: 1, padding: '22px 16px', borderRadius: '18px', cursor: 'pointer', textAlign: 'center',
                                                                        border: `2px solid ${calcTable === val ? '#2563eb' : '#e2e8f0'}`,
                                                                        background: '#fff', transition: 'all 0.2s'
                                                                    }}>
                                                                        <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'center' }}>
                                                                            <Icon size={30} color={calcTable === val ? '#2563eb' : '#94a3b8'} strokeWidth={1.5} />
                                                                        </div>
                                                                        <p style={{ fontSize: '0.85rem', fontWeight: '700', color: calcTable === val ? '#2563eb' : '#475569', margin: 0 }}>{label}</p>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                        {/* Display */}
                                                        <div style={{
                                                            background: 'linear-gradient(135deg, #eef2ff 0%, #f0f7ff 100%)',
                                                            borderRadius: '18px', padding: '24px', textAlign: 'center'
                                                        }}>
                                                            <p style={{ fontSize: '0.68rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 10px 0' }}>
                                                                Equivalent Percentage
                                                            </p>
                                                            {calcResult && !calcResult.error ? (
                                                                <>
                                                                    <div style={{ lineHeight: 1, margin: '0 0 18px 0' }}>
                                                                        <span style={{ fontSize: '3.8rem', fontWeight: '900', color: '#1e293b' }}>
                                                                            {calcResult.result.split('.')[0]}
                                                                        </span>
                                                                        <span style={{ fontSize: '2.2rem', fontWeight: '900', color: '#1e293b' }}>
                                                                            .{calcResult.result.split('.')[1]}
                                                                        </span>
                                                                        <span style={{ fontSize: '1.8rem', fontWeight: '700', color: '#94a3b8' }}>%</span>
                                                                    </div>
                                                                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '14px' }}>
                                                                        {[25, 50, 75, 100].map((threshold, i) => {
                                                                            const pct = parseFloat(calcResult.result);
                                                                            const filled = pct >= threshold;
                                                                            return (
                                                                                <div key={i} style={{
                                                                                    height: '4px', width: '44px', borderRadius: '2px',
                                                                                    background: filled ? '#2563eb' : '#dde5f4',
                                                                                    transition: 'background 0.3s'
                                                                                }} />
                                                                            );
                                                                        })}
                                                                    </div>
                                                                    <p style={{
                                                                        fontSize: '0.75rem', color: '#64748b', margin: 0,
                                                                        fontFamily: 'monospace', lineHeight: '1.5',
                                                                        background: 'rgba(255,255,255,0.6)', borderRadius: '8px',
                                                                        padding: '8px 12px', display: 'inline-block'
                                                                    }}>
                                                                        {calcResult.formulaStr}
                                                                    </p>
                                                                </>
                                                            ) : calcResult?.error ? (
                                                                <p style={{ color: '#ef4444', fontSize: '0.9rem', fontWeight: '600', margin: '8px 0' }}>{calcResult.error}</p>
                                                            ) : (
                                                                <div style={{ lineHeight: 1, margin: '0 0 18px 0' }}>
                                                                    <span style={{ fontSize: '3.8rem', fontWeight: '900', color: '#cbd5e1' }}>—.—</span>
                                                                    <span style={{ fontSize: '1.8rem', fontWeight: '700', color: '#cbd5e1' }}>%</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div style={{
                                                    padding: '14px 16px', borderRadius: '10px',
                                                    background: 'rgba(37, 99, 235, 0.06)',
                                                    border: '1px solid rgba(37, 99, 235, 0.2)'
                                                }}>
                                                    <p style={{ color: 'var(--text-main)', fontSize: '0.9rem', margin: 0, lineHeight: '1.6' }}>
                                                        Once your application is processed, you will be able to download the Migration Certificate from your DigiLocker account.
                                                    </p>
                                                </div>
                                            )
                                        )}
                                    </div>
                                ) : isExamTypeSelector ? (
                                    <div style={{ flex: 1 }}>
                                        <p style={{ color: 'var(--text-main)', fontSize: '0.95rem', fontWeight: '500', lineHeight: '1.6', margin: '0 0 14px 0' }}>
                                            Select the type of examination you appeared for:
                                        </p>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            {instruction.options.map(opt => {
                                                const months = instruction.optionsMap?.[opt] || [];
                                                return (
                                                    <label key={opt} style={{
                                                        display: 'flex', alignItems: 'center', gap: '12px',
                                                        cursor: 'pointer',
                                                        padding: '12px 16px', borderRadius: '10px',
                                                        border: `2px solid ${examType === opt ? 'var(--accent)' : 'var(--glass-border)'}`,
                                                        background: examType === opt ? 'rgba(37, 99, 235, 0.06)' : 'transparent',
                                                        transition: 'all 0.2s'
                                                    }}>
                                                        <input type="radio" name="examTypeSelector" value={opt}
                                                            checked={examType === opt}
                                                            onChange={() => setExamType(opt)}
                                                            style={{ width: '18px', height: '18px', accentColor: 'var(--accent)', cursor: 'pointer', flexShrink: 0 }} />
                                                        <div>
                                                            <span style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '0.95rem' }}>{opt}</span>
                                                            {months.length > 0
                                                                ? <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginLeft: '8px' }}>{months[0]}</span>
                                                                : <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginLeft: '8px' }}>No recent exam yet</span>
                                                            }
                                                        </div>
                                                    </label>
                                                );
                                            })}
                                        </div>
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

            {!(isCgpaCalculator && softCopy && !hardCopy) && (
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
            )}

            <div style={{ display: 'flex', gap: '15px' }}>
                {!hideProceedButton && (
                    <button
                        onClick={() => {
                            const hcVal = deliveryOptionsInstruction?.hardCopyValue || 'Hard Copy';
                            const scVal = deliveryOptionsInstruction?.softCopyValue || 'Soft Copy';
                            const pref = isCgpaCalculator
                                ? (hardCopy ? hcVal : null)
                                : (hardCopy && softCopy ? `Both ${hcVal} and ${scVal}`
                                    : hardCopy ? hcVal
                                        : softCopy ? scVal
                                            : null);
                            onProceed({ deliveryPreference: pref, examType: examType });
                        }}
                        disabled={proceedDisabled}
                        className="btn-primary"
                        style={{
                            flexGrow: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            opacity: proceedDisabled ? 0.5 : 1,
                            cursor: proceedDisabled ? 'not-allowed' : 'pointer'
                        }}
                    >
                        <CheckCircle2 size={18} />
                        I Understand, Proceed to Form
                        <ArrowRight size={18} />
                    </button>
                )}
                <button onClick={onCancel} className="btn-secondary">
                    Cancel
                </button>
            </div>
        </div>
    );
}
