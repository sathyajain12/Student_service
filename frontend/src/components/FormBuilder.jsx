import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export default function FormBuilder({ config, onSubmit, onCancel }) {
    const [formData, setFormData] = useState({});
    const [dateRanges, setDateRanges] = useState({});
    const [files, setFiles] = useState({});
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null);

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

    const handleFileChange = (e) => {
        const { name, files: selectedFiles } = e.target;
        setFiles(prev => ({ ...prev, [name]: selectedFiles[0] }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus({ type: 'info', message: 'Submitting application...' });

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
                setStatus({ type: 'success', message: `Submitted! ID: ${result.appId}` });
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
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            

            {config.fields.map(field => (
                <div key={field.name} className={field.type === 'heading' || field.type === 'paragraph' ? '' : 'form-group'}>
                    {field.type === 'heading' ? (
                        <h3 style={{
                            marginTop: '30px',
                            marginBottom: '15px',
                            paddingBottom: '10px',
                            borderBottom: '2px solid rgba(59, 130, 246, 0.3)',
                            color: '#60a5fa',
                            fontSize: '1.3rem',
                            fontWeight: '600'
                        }}>
                            {field.label}
                        </h3>
                    ) : field.type === 'paragraph' ? (
                        <div style={{
                            marginTop: '20px',
                            marginBottom: '20px',
                            padding: '15px',
                            background: 'rgba(156, 163, 175, 0.1)',
                            borderRadius: '8px',
                            lineHeight: '1.6'
                        }}>
                            <p style={{
                                color: '#d1d5db',
                                fontSize: '0.9rem',
                                margin: 0,
                                whiteSpace: 'pre-line'
                            }}>
                                {field.content}
                            </p>
                        </div>
                    ) : (
                        <>
                            <label>{field.label} {field.required && '*'}</label>
                            {field.description && (
                                <p style={{ fontSize: '0.85rem', color: '#9ca3af', marginTop: '4px', marginBottom: '8px', fontStyle: 'italic' }}>
                                    {field.description}
                                </p>
                            )}
                            {field.type === 'textarea' ? (
                        <textarea
                            name={field.name}
                            required={field.required}
                            onChange={handleChange}
                            className="form-input"
                            rows="4"
                        />
                    ) : field.type === 'daterange' ? (
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
                            dateFormat="MM/yyyy"
                            showMonthYearPicker
                            placeholderText={field.placeholder || "Select date range"}
                        />
                    ) : field.type === 'checkbox' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {field.options.map(option => (
                                <label key={option} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        name={field.name}
                                        value={option}
                                        checked={(formData[field.name] || []).includes(option)}
                                        onChange={(e) => handleCheckboxChange(field.name, option, e.target.checked)}
                                        style={{ cursor: 'pointer' }}
                                    />
                                    <span>{option}</span>
                                </label>
                            ))}
                        </div>
                    ) : field.type === 'select' ? (
                        <select name={field.name} required={field.required} onChange={handleChange} className="form-input">
                            <option value="">Select Option</option>
                            {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    ) : (
                        <input
                            type={field.type}
                            name={field.name}
                            required={field.required}
                            placeholder={field.placeholder}
                            onChange={handleChange}
                            className="form-input"
                        />
                    )}
                        </>
                    )}
                </div>
            ))}

            {config.files && config.files.length > 0 && (
                <div style={{ padding: '20px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', marginTop: '20px' }}>
                    <h4 style={{ marginBottom: '15px', color: '#60a5fa' }}>📎 Document Uploads</h4>
                    {config.files.map(file => (
                        <div key={file.name} style={{ marginBottom: '10px' }}>
                            <label style={{ fontSize: '0.9rem' }}>{file.label} {file.required && '*'}</label>
                            <input
                                type="file"
                                name={file.name}
                                required={file.required}
                                accept=".pdf"
                                onChange={handleFileChange}
                                style={{ display: 'block', marginTop: '5px' }}
                            />
                        </div>
                    ))}
                </div>
            )}

            {status && (
                <div style={{
                    padding: '15px',
                    borderRadius: '8px',
                    background: status.type === 'success' ? '#065f46' : status.type === 'error' ? '#991b1b' : '#1e3a8a',
                    color: 'white'
                }}>
                    {status.message}
                </div>
            )}

            <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                <button type="submit" className="btn-primary" disabled={loading} style={{ flexGrow: 1 }}>
                    {loading ? 'Processing...' : 'Submit Application'}
                </button>
                <button type="button" onClick={onCancel} className="btn-secondary" style={{
                    background: 'transparent', border: '1px solid var(--glass-border)', color: 'white'
                }}>
                    Cancel
                </button>
            </div>
        </form>
    );
}
