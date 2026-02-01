import React, { useState, useRef } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
    Upload,
    X,
    ChevronDown,
    Calendar,
    CheckCircle2,
    AlertCircle,
    FileText,
    Paperclip,
    ArrowLeft,
    Loader2
} from 'lucide-react';

export default function FormBuilder({ config, onSubmit, onCancel }) {
    const [formData, setFormData] = useState({});
    const [dateRanges, setDateRanges] = useState({});
    const [files, setFiles] = useState({});
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null);
    const fileInputRefs = useRef({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCheckboxChange = (fieldName, option, checked) => {
        setFormData(prev => {
            const currentValues = prev[fieldName] || [];
            const newValues = checked
                ? [...currentValues, option]
                : currentValues.filter(v => v !== option);
            return { ...prev, [fieldName]: newValues };
        });
    };

    const handleFileChange = (e, fieldName) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFiles(prev => ({ ...prev, [fieldName]: selectedFile }));
        }
    };

    const triggerFileInput = (fieldName) => {
        fileInputRefs.current[fieldName]?.click();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus({ type: 'info', message: 'Securing your application...' });

        const bundle = new FormData();
        bundle.append('formId', config.id);
        bundle.append('formType', config.title);
        Object.entries(formData).forEach(([k, v]) => bundle.append(k, v));
        Object.entries(files).forEach(([k, v]) => bundle.append(k, v));

        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8787';
            const response = await fetch(`${backendUrl}/submit`, {
                method: 'POST',
                body: bundle
            });
            const result = await response.json();

            if (result.success) {
                setStatus({ type: 'success', message: `Successfully Submitted! Application ID: ${result.appId}` });
            } else {
                throw new Error(result.error || 'Submission failed');
            }
        } catch (err) {
            setStatus({ type: 'error', message: err.message });
        } finally {
            setLoading(false);
        }
    };

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
                    <h2 style={{ fontSize: '1.8rem', color: 'white', marginBottom: '8px' }}>{config.title}</h2>

                    {config.titleLink && (
                        <div style={{ marginBottom: '12px' }}>
                            <a
                                href={config.titleLink.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    color: 'var(--accent-light)',
                                    textDecoration: 'none',
                                    fontSize: '0.9rem',
                                    fontWeight: '500',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px'
                                }}
                            >
                                {config.titleLink.text} <ArrowLeft size={14} style={{ transform: 'rotate(180deg)' }} />
                            </a>
                        </div>
                    )}

                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5' }}>
                        {config.description || "Please fill in all required fields accurately to ensure smooth processing of your application."}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {config.fields.map(field => (
                    <div key={field.name} className={field.type === 'heading' || field.type === 'paragraph' ? '' : 'form-group'}>
                        {field.type === 'heading' ? (
                            <div style={{
                                marginTop: '40px',
                                marginBottom: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                                paddingBottom: '12px'
                            }}>
                                <div style={{ width: '4px', height: '24px', background: 'var(--accent-gradient)', borderRadius: '2px' }}></div>
                                <h3 style={{
                                    color: 'var(--accent-light)',
                                    fontSize: '1.3rem',
                                    fontWeight: '600'
                                }}>
                                    {field.label}
                                </h3>
                            </div>
                        ) : field.type === 'paragraph' ? (
                            <div style={{
                                marginTop: '10px',
                                marginBottom: '25px',
                                padding: '20px',
                                background: 'rgba(59, 130, 246, 0.03)',
                                border: '1px solid rgba(59, 130, 246, 0.1)',
                                borderRadius: '14px',
                                lineHeight: '1.6'
                            }}>
                                <p style={{
                                    color: '#d1d5db',
                                    fontSize: '0.92rem',
                                    margin: 0,
                                    whiteSpace: 'pre-line'
                                }}>
                                    {field.content}
                                </p>
                            </div>
                        ) : (
                            <>
                                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>{field.label} {field.required && <span style={{ color: 'var(--error)' }}>*</span>}</span>
                                </label>
                                {field.description && (
                                    <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '-4px', marginBottom: '8px' }}>
                                        {field.description}
                                    </p>
                                )}

                                <div style={{ position: 'relative' }}>
                                    {field.type === 'textarea' ? (
                                        <textarea
                                            name={field.name}
                                            required={field.required}
                                            onChange={handleChange}
                                            className="form-input"
                                            rows="4"
                                            style={{ width: '100%', resize: 'vertical' }}
                                        />
                                    ) : field.type === 'daterange' ? (
                                        <div style={{ position: 'relative' }}>
                                            <DatePicker
                                                selectsRange={true}
                                                startDate={dateRanges[field.name]?.[0]}
                                                endDate={dateRanges[field.name]?.[1]}
                                                onChange={(dates) => {
                                                    const [start, end] = dates;
                                                    setDateRanges(prev => ({ ...prev, [field.name]: dates }));
                                                    if (start && end) {
                                                        const formattedRange = `${start.toLocaleDateString('en-US', { month: '2-digit', year: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: '2-digit', year: 'numeric' })}`;
                                                        setFormData(prev => ({ ...prev, [field.name]: formattedRange }));
                                                    }
                                                }}
                                                className="form-input"
                                                style={{ width: '100%' }}
                                                dateFormat="MM/yyyy"
                                                showMonthYearPicker
                                                placeholderText={field.placeholder || "Select date range"}
                                            />
                                            <Calendar size={18} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                        </div>
                                    ) : field.type === 'checkbox' ? (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                                            {field.options.map(option => (
                                                <label key={option} className="custom-checkbox">
                                                    <input
                                                        type="checkbox"
                                                        name={field.name}
                                                        value={option}
                                                        checked={(formData[field.name] || []).includes(option)}
                                                        onChange={(e) => handleCheckboxChange(field.name, option, e.target.checked)}
                                                    />
                                                    <span style={{ fontSize: '0.95rem' }}>{option}</span>
                                                </label>
                                            ))}
                                        </div>
                                    ) : field.type === 'select' ? (
                                        <div style={{ position: 'relative' }}>
                                            <select
                                                name={field.name}
                                                required={field.required}
                                                onChange={handleChange}
                                                className="form-input"
                                                style={{ width: '100%', appearance: 'none' }}
                                            >
                                                <option value="">Select Option</option>
                                                {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                            <ChevronDown size={18} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                                        </div>
                                    ) : (
                                        <input
                                            type={field.type}
                                            name={field.name}
                                            required={field.required}
                                            placeholder={field.placeholder}
                                            onChange={handleChange}
                                            className="form-input"
                                            style={{ width: '100%' }}
                                        />
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                ))}

                {config.files && config.files.length > 0 && (
                    <div style={{
                        padding: '30px',
                        background: 'rgba(59, 130, 246, 0.03)',
                        border: '1px solid rgba(59, 130, 246, 0.1)',
                        borderRadius: '20px',
                        marginTop: '30px',
                        marginBottom: '30px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '25px' }}>
                            <Paperclip size={20} color="var(--accent-light)" />
                            <h4 style={{ fontSize: '1.2rem', color: 'white' }}>Required Documents (PDF)</h4>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                            {config.files.map(file => (
                                <div key={file.name}>
                                    <p style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
                                        {file.label} {file.required && <span style={{ color: 'var(--error)' }}>*</span>}
                                    </p>
                                    <div
                                        className="file-upload-container"
                                        onClick={() => triggerFileInput(file.name)}
                                    >
                                        <input
                                            type="file"
                                            ref={el => fileInputRefs.current[file.name] = el}
                                            name={file.name}
                                            required={file.required}
                                            accept=".pdf"
                                            onChange={(e) => handleFileChange(e, file.name)}
                                            style={{ display: 'none' }}
                                        />
                                        {files[file.name] ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                                <FileText size={32} />
                                                <span style={{ fontSize: '0.9rem', color: 'white', fontWeight: '500' }}>{files[file.name].name}</span>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--success)' }}>File Ready</span>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                                <Upload size={32} />
                                                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Click to upload PDF</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {status && (
                    <div style={{
                        padding: '20px',
                        borderRadius: '16px',
                        marginBottom: '30px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        background: status.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : status.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                        border: `1px solid ${status.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : status.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)'}`,
                        color: 'white',
                        animation: 'fadeIn 0.4s ease'
                    }}>
                        {status.type === 'success' ? <CheckCircle2 size={24} color="var(--success)" /> :
                            status.type === 'error' ? <AlertCircle size={24} color="var(--error)" /> :
                                <Loader2 size={24} className="animate-spin" color="var(--accent-light)" />}
                        <span style={{ fontSize: '0.95rem', fontWeight: '500' }}>{status.message}</span>
                    </div>
                )}

                <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                    <button type="submit" className="btn-primary" disabled={loading} style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                        {loading && <Loader2 size={18} className="animate-spin" />}
                        {loading ? 'Processing...' : 'Submit Application'}
                    </button>
                    <button type="button" onClick={onCancel} className="btn-secondary">
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}
