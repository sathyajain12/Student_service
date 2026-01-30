import React, { useState } from 'react';

export default function FormBuilder({ config, onSubmit, onCancel }) {
    const [formData, setFormData] = useState({ email: '' });
    const [files, setFiles] = useState({});
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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
            // Note: In real app, replace with actual backend URL from env
            const response = await fetch('http://localhost:8787/submit', {
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
            <div className="form-group">
                <label>Email Address *</label>
                <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="form-input"
                />
            </div>

            {config.fields.map(field => (
                <div key={field.name} className="form-group">
                    <label>{field.label} {field.required && '*'}</label>
                    {field.type === 'textarea' ? (
                        <textarea
                            name={field.name}
                            required={field.required}
                            onChange={handleChange}
                            className="form-input"
                            rows="4"
                        />
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
                </div>
            ))}

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
