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
    Loader2,
    Plus,
    Trash2
} from 'lucide-react';

// Country and State/Province data
const COUNTRIES = [
    'India', 'United States', 'United Kingdom', 'Canada', 'Australia',
    'Germany', 'France', 'Japan', 'China', 'Brazil', 'South Africa',
    'United Arab Emirates', 'Singapore', 'Malaysia', 'New Zealand',
    'Italy', 'Spain', 'Netherlands', 'Sweden', 'Switzerland',
    'Saudi Arabia', 'Qatar', 'Kuwait', 'Oman', 'Bahrain',
    'Sri Lanka', 'Bangladesh', 'Nepal', 'Pakistan', 'Afghanistan',
    'Thailand', 'Vietnam', 'Indonesia', 'Philippines', 'South Korea',
    'Russia', 'Mexico', 'Argentina', 'Chile', 'Colombia',
    'Nigeria', 'Kenya', 'Egypt', 'Morocco', 'Ghana'
].sort();

const COUNTRY_STATES = {
    'India': [
        'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
        'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
        'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
        'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
        'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
        'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
        'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
    ],
    'United States': [
        'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
        'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
        'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
        'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
        'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey',
        'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma',
        'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
        'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
        'West Virginia', 'Wisconsin', 'Wyoming', 'District of Columbia'
    ],
    'United Kingdom': [
        'England', 'Scotland', 'Wales', 'Northern Ireland'
    ],
    'Canada': [
        'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick',
        'Newfoundland and Labrador', 'Northwest Territories', 'Nova Scotia',
        'Nunavut', 'Ontario', 'Prince Edward Island', 'Quebec', 'Saskatchewan', 'Yukon'
    ],
    'Australia': [
        'Australian Capital Territory', 'New South Wales', 'Northern Territory',
        'Queensland', 'South Australia', 'Tasmania', 'Victoria', 'Western Australia'
    ],
    'Germany': [
        'Baden-Württemberg', 'Bavaria', 'Berlin', 'Brandenburg', 'Bremen',
        'Hamburg', 'Hesse', 'Lower Saxony', 'Mecklenburg-Vorpommern',
        'North Rhine-Westphalia', 'Rhineland-Palatinate', 'Saarland',
        'Saxony', 'Saxony-Anhalt', 'Schleswig-Holstein', 'Thuringia'
    ],
    'United Arab Emirates': [
        'Abu Dhabi', 'Ajman', 'Dubai', 'Fujairah', 'Ras Al Khaimah', 'Sharjah', 'Umm Al Quwain'
    ]
};

export default function FormBuilder({ config, onSubmit, onCancel, onTrackStatus }) {
    const [formData, setFormData] = useState({});
    const [dateRanges, setDateRanges] = useState({});
    const [files, setFiles] = useState({});
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null);
    const fileInputRefs = useRef({});
    const [paperTables, setPaperTables] = useState({});

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
            // Validate that the file is a PDF
            const isPDF = selectedFile.type === 'application/pdf' || selectedFile.name.toLowerCase().endsWith('.pdf');

            if (!isPDF) {
                alert('❌ Invalid file type!\n\nOnly PDF files are allowed. Please select a PDF file and try again.');
                e.target.value = ''; // Clear the file input
                return;
            }

            setFiles(prev => ({ ...prev, [fieldName]: selectedFile }));
        }
    };

    const triggerFileInput = (fieldName) => {
        fileInputRefs.current[fieldName]?.click();
    };

    const initializePaperTable = (fieldName) => {
        if (!paperTables[fieldName]) {
            setPaperTables(prev => ({
                ...prev,
                [fieldName]: [{ paperCode: '', paperTitle: '', semester: '' }]
            }));
        }
    };

    const handlePaperTableChange = (fieldName, rowIndex, column, value) => {
        setPaperTables(prev => {
            const newTable = [...(prev[fieldName] || [])];
            newTable[rowIndex] = { ...newTable[rowIndex], [column]: value };

            // Update formData with stringified table data
            const tableData = JSON.stringify(newTable);
            setFormData(fd => ({ ...fd, [fieldName]: tableData }));

            return { ...prev, [fieldName]: newTable };
        });
    };

    const addPaperTableRow = (fieldName) => {
        setPaperTables(prev => {
            const newTable = [...(prev[fieldName] || []), { paperCode: '', paperTitle: '', semester: '' }];
            setFormData(fd => ({ ...fd, [fieldName]: JSON.stringify(newTable) }));
            return { ...prev, [fieldName]: newTable };
        });
    };

    const removePaperTableRow = (fieldName, rowIndex) => {
        setPaperTables(prev => {
            const newTable = (prev[fieldName] || []).filter((_, i) => i !== rowIndex);
            if (newTable.length === 0) {
                newTable.push({ paperCode: '', paperTitle: '', semester: '' });
            }
            setFormData(fd => ({ ...fd, [fieldName]: JSON.stringify(newTable) }));
            return { ...prev, [fieldName]: newTable };
        });
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
                    <h2 style={{ fontSize: '1.8rem', color: 'var(--text-main)', marginBottom: '8px' }}>{config.title}</h2>

                    {config.titleLink && (
                        <div style={{ marginBottom: '12px' }}>
                            <a
                                href={config.titleLink.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    color: 'var(--accent)',
                                    textDecoration: 'none',
                                    fontSize: '0.9rem',
                                    fontWeight: '600',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px'
                                }}
                            >
                                {config.titleLink.text} <ArrowLeft size={14} style={{ transform: 'rotate(180deg)' }} />
                            </a>
                            <ol style={{ margin: '8px 0 0 0', paddingLeft: '20px', color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.8' }}>
                                <li>Click on the link — it will open SBI Collect homepage.</li>
                                <li>Search <strong>"SSSIHL-ADMN" it will redirect to payment page.</strong></li>
                                <li>Select payment Category (Application name will be seen in the dropdown).</li>
                                <li>Complete the payment process and keep your receipt for upload.</li>
                            </ol>
                        </div>
                    )}

                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5' }}>
                        {"Please fill in all required fields accurately to ensure smooth processing of your application."}
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '8px' }}>
                        Fields marked with <span style={{ color: '#ef4444', fontWeight: '700' }}>*</span> are mandatory.
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {config.fields.map(field => (
                    <div key={field.name} className={field.type === 'heading' || field.type === 'paragraph' || field.type === 'separator' ? '' : 'form-group'}>
                        {field.type === 'separator' ? (
                            <hr style={{
                                border: 'none',
                                borderTop: '1px solid var(--glass-border)',
                                margin: '10px 0'
                            }} />
                        ) : field.type === 'heading' ? (
                            <div style={{
                                marginTop: '40px',
                                marginBottom: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                borderBottom: '1px solid var(--glass-border)',
                                paddingBottom: '12px'
                            }}>
                                <div style={{ width: '4px', height: '24px', background: 'var(--accent-gradient)', borderRadius: '2px' }}></div>
                                <h3 style={{
                                    color: 'var(--accent)',
                                    fontSize: '1.3rem',
                                    fontWeight: '700'
                                }}>
                                    {field.label}
                                </h3>
                            </div>
                        ) : field.type === 'paragraph' ? (
                            <div style={{
                                marginTop: '10px',
                                marginBottom: '25px',
                                padding: '20px',
                                background: 'rgba(15, 23, 42, 0.03)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '14px',
                                lineHeight: '1.6'
                            }}>
                                <p style={{
                                    color: 'var(--text-main)',
                                    fontSize: '0.92rem',
                                    margin: 0,
                                    whiteSpace: 'pre-line'
                                }}>
                                    {field.content}
                                </p>
                            </div>
                        ) : (
                            <>
                                {field.type !== 'singleCheckbox' && (
                                    <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span>{field.label} {field.required && <span style={{ color: 'var(--error)' }}>*</span>}</span>
                                    </label>
                                )}
                                {field.description && (
                                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '-4px', marginBottom: '8px' }}>
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
                                        <div style={{ position: 'relative', maxWidth: '280px' }}>
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
                                            <Calendar size={18} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
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
                                    ) : field.type === 'radio' ? (
                                        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                                            {field.options.map(option => (
                                                <label key={option} style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '10px',
                                                    cursor: 'pointer',
                                                    padding: '12px 20px',
                                                    borderRadius: '12px',
                                                    border: formData[field.name] === option ? '2px solid var(--accent)' : '2px solid var(--glass-border)',
                                                    background: formData[field.name] === option ? 'rgba(37, 99, 235, 0.05)' : 'white',
                                                    transition: 'all 0.2s ease'
                                                }}>
                                                    <input
                                                        type="radio"
                                                        name={field.name}
                                                        value={option}
                                                        checked={formData[field.name] === option}
                                                        onChange={(e) => {
                                                            handleChange(e);
                                                            // Clear dependent fields when examType changes
                                                            if (field.name === 'examType') {
                                                                setFormData(prev => ({ ...prev, examMonth: '' }));
                                                            }
                                                        }}
                                                        required={field.required}
                                                        style={{
                                                            width: '18px',
                                                            height: '18px',
                                                            accentColor: 'var(--accent)'
                                                        }}
                                                    />
                                                    <span style={{
                                                        fontSize: '0.95rem',
                                                        fontWeight: formData[field.name] === option ? '600' : '500',
                                                        color: formData[field.name] === option ? 'var(--accent)' : 'var(--text-main)'
                                                    }}>{option}</span>
                                                </label>
                                            ))}
                                        </div>
                                    ) : field.type === 'singleCheckbox' ? (
                                        <label style={{
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            gap: '14px',
                                            cursor: 'pointer',
                                            padding: '20px',
                                            borderRadius: '14px',
                                            border: formData[field.name] ? '2px solid var(--accent)' : '2px solid var(--glass-border)',
                                            background: formData[field.name] ? 'rgba(37, 99, 235, 0.05)' : 'white',
                                            transition: 'all 0.2s ease'
                                        }}>
                                            <input
                                                type="checkbox"
                                                name={field.name}
                                                checked={formData[field.name] || false}
                                                onChange={(e) => setFormData(prev => ({ ...prev, [field.name]: e.target.checked }))}
                                                required={field.required}
                                                style={{
                                                    width: '22px',
                                                    height: '22px',
                                                    accentColor: 'var(--accent)',
                                                    flexShrink: 0,
                                                    marginTop: '2px'
                                                }}
                                            />
                                            <span style={{
                                                fontSize: '0.95rem',
                                                fontWeight: '500',
                                                color: formData[field.name] ? 'var(--accent)' : 'var(--text-main)',
                                                lineHeight: '1.6',
                                                whiteSpace: 'pre-wrap'
                                            }}>{field.label}</span>
                                        </label>
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
                                    ) : field.type === 'conditionalSelect' ? (
                                        <div style={{ position: 'relative' }}>
                                            <select
                                                name={field.name}
                                                required={field.required}
                                                value={formData[field.name] || ''}
                                                onChange={(e) => {
                                                    handleChange(e);
                                                }}
                                                className="form-input"
                                                style={{ width: '100%', appearance: 'none' }}
                                                disabled={!formData[field.dependsOn]}
                                            >
                                                <option value="">
                                                    {formData[field.dependsOn] ? 'Select Month' : 'Select Examination Type First'}
                                                </option>
                                                {formData[field.dependsOn] && field.optionsMap[formData[field.dependsOn]]?.map(option => (
                                                    <option key={option} value={option}>{option}</option>
                                                ))}
                                            </select>
                                            <ChevronDown size={18} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                                        </div>
                                    ) : field.type === 'countrySelect' ? (
                                        <div style={{ position: 'relative' }}>
                                            <select
                                                name={field.name}
                                                required={field.required}
                                                value={formData[field.name] || ''}
                                                onChange={(e) => {
                                                    handleChange(e);
                                                    // Clear state when country changes
                                                    setFormData(prev => ({ ...prev, stateProvince: '' }));
                                                }}
                                                className="form-input"
                                                style={{ width: '100%', appearance: 'none' }}
                                            >
                                                <option value="">Select Country</option>
                                                {COUNTRIES.map(country => (
                                                    <option key={country} value={country}>{country}</option>
                                                ))}
                                            </select>
                                            <ChevronDown size={18} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                                        </div>
                                    ) : field.type === 'stateSelect' ? (
                                        <div style={{ position: 'relative' }}>
                                            <select
                                                name={field.name}
                                                required={field.required}
                                                value={formData[field.name] || ''}
                                                onChange={handleChange}
                                                className="form-input"
                                                style={{ width: '100%', appearance: 'none' }}
                                                disabled={!formData.country}
                                            >
                                                <option value="">
                                                    {formData.country ? 'Select State/Province/Region' : 'Select Country First'}
                                                </option>
                                                {formData.country && COUNTRY_STATES[formData.country] ? (
                                                    COUNTRY_STATES[formData.country].map(state => (
                                                        <option key={state} value={state}>{state}</option>
                                                    ))
                                                ) : formData.country ? (
                                                    <option value={formData.country}>{formData.country}</option>
                                                ) : null}
                                            </select>
                                            <ChevronDown size={18} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                                        </div>
                                    ) : field.type === 'paperTable' ? (
                                        <div style={{ width: '100%' }}>
                                            {(() => {
                                                if (!paperTables[field.name]) {
                                                    initializePaperTable(field.name);
                                                }
                                                return null;
                                            })()}
                                            <table style={{
                                                width: '100%',
                                                borderCollapse: 'collapse',
                                                border: '1px solid var(--glass-border)',
                                                borderRadius: '12px',
                                                overflow: 'hidden'
                                            }}>
                                                <thead>
                                                    <tr style={{ background: 'rgba(15, 23, 42, 0.03)' }}>
                                                        <th style={{
                                                            padding: '14px 16px',
                                                            textAlign: 'left',
                                                            fontWeight: '700',
                                                            fontSize: '0.85rem',
                                                            color: 'var(--text-main)',
                                                            borderBottom: '1px solid var(--glass-border)',
                                                            textTransform: 'uppercase',
                                                            letterSpacing: '0.03em'
                                                        }}>Paper Code</th>
                                                        <th style={{
                                                            padding: '14px 16px',
                                                            textAlign: 'left',
                                                            fontWeight: '700',
                                                            fontSize: '0.85rem',
                                                            color: 'var(--text-main)',
                                                            borderBottom: '1px solid var(--glass-border)',
                                                            textTransform: 'uppercase',
                                                            letterSpacing: '0.03em'
                                                        }}>Paper Title</th>
                                                        <th style={{
                                                            padding: '14px 16px',
                                                            textAlign: 'left',
                                                            fontWeight: '700',
                                                            fontSize: '0.85rem',
                                                            color: 'var(--text-main)',
                                                            borderBottom: '1px solid var(--glass-border)',
                                                            textTransform: 'uppercase',
                                                            letterSpacing: '0.03em'
                                                        }}>Semester Number</th>
                                                        <th style={{
                                                            padding: '14px 16px',
                                                            width: '60px',
                                                            borderBottom: '1px solid var(--glass-border)'
                                                        }}></th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {(paperTables[field.name] || [{ paperCode: '', paperTitle: '', semester: '' }]).map((row, rowIndex) => (
                                                        <tr key={rowIndex} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                                            <td style={{ padding: '10px 12px' }}>
                                                                <input
                                                                    type="text"
                                                                    value={row.paperCode}
                                                                    onChange={(e) => handlePaperTableChange(field.name, rowIndex, 'paperCode', e.target.value)}
                                                                    className="form-input"
                                                                    style={{ width: '100%', padding: '10px 12px' }}
                                                                    placeholder="e.g., CS101"
                                                                    required={field.required && rowIndex === 0}
                                                                />
                                                            </td>
                                                            <td style={{ padding: '10px 12px' }}>
                                                                <input
                                                                    type="text"
                                                                    value={row.paperTitle}
                                                                    onChange={(e) => handlePaperTableChange(field.name, rowIndex, 'paperTitle', e.target.value)}
                                                                    className="form-input"
                                                                    style={{ width: '100%', padding: '10px 12px' }}
                                                                    placeholder="e.g., Data Structures"
                                                                    required={field.required && rowIndex === 0}
                                                                />
                                                            </td>
                                                            <td style={{ padding: '10px 12px' }}>
                                                                <select
                                                                    value={row.semester}
                                                                    onChange={(e) => handlePaperTableChange(field.name, rowIndex, 'semester', e.target.value)}
                                                                    className="form-input"
                                                                    style={{ width: '100%', padding: '10px 12px', appearance: 'none' }}
                                                                    required={field.required && rowIndex === 0}
                                                                >
                                                                    <option value="">Select</option>
                                                                    {['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'].map(sem => (
                                                                        <option key={sem} value={sem}>{sem}</option>
                                                                    ))}
                                                                </select>
                                                            </td>
                                                            <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removePaperTableRow(field.name, rowIndex)}
                                                                    style={{
                                                                        background: 'rgba(220, 38, 38, 0.08)',
                                                                        border: 'none',
                                                                        borderRadius: '8px',
                                                                        padding: '8px',
                                                                        cursor: 'pointer',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        color: 'var(--error)',
                                                                        transition: 'all 0.2s ease'
                                                                    }}
                                                                    onMouseEnter={(e) => {
                                                                        e.currentTarget.style.background = 'rgba(220, 38, 38, 0.15)';
                                                                    }}
                                                                    onMouseLeave={(e) => {
                                                                        e.currentTarget.style.background = 'rgba(220, 38, 38, 0.08)';
                                                                    }}
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            <button
                                                type="button"
                                                onClick={() => addPaperTableRow(field.name)}
                                                style={{
                                                    marginTop: '12px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    padding: '10px 18px',
                                                    background: 'rgba(37, 99, 235, 0.08)',
                                                    border: '1px dashed var(--accent)',
                                                    borderRadius: '10px',
                                                    color: 'var(--accent)',
                                                    fontWeight: '600',
                                                    fontSize: '0.9rem',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s ease'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = 'rgba(37, 99, 235, 0.15)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = 'rgba(37, 99, 235, 0.08)';
                                                }}
                                            >
                                                <Plus size={18} /> Add Another Paper
                                            </button>
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
                                            {...(field.step && { step: field.step })}
                                            {...(field.min && { min: field.min })}
                                            {...(field.max && { max: field.max })}
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
                        background: 'rgba(15, 23, 42, 0.02)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '20px',
                        marginTop: '30px',
                        marginBottom: '30px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '25px' }}>
                            <Paperclip size={20} color="var(--accent)" />
                            <h4 style={{ fontSize: '1.2rem', color: 'var(--text-main)' }}>Required Documents (PDF)</h4>
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
                                                <span style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: '600' }}>{files[file.name].name}</span>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: '700' }}>File Ready</span>
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

                {config.declarations && config.declarations.length > 0 && (
                    <div style={{
                        padding: '30px',
                        background: 'rgba(15, 23, 42, 0.02)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '20px',
                        marginTop: '30px',
                        marginBottom: '30px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '25px' }}>
                            <div style={{ width: '4px', height: '24px', background: 'var(--accent-gradient)', borderRadius: '2px' }}></div>
                            <h4 style={{ fontSize: '1.2rem', color: 'var(--accent)', fontWeight: '700' }}>Declaration by the Applicant</h4>
                        </div>

                        {config.declarations.map(decl => (
                            <label key={decl.name} style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '14px',
                                cursor: 'pointer',
                                padding: '20px',
                                borderRadius: '14px',
                                border: formData[decl.name] ? '2px solid var(--accent)' : '2px solid var(--glass-border)',
                                background: formData[decl.name] ? 'rgba(37, 99, 235, 0.05)' : 'white',
                                transition: 'all 0.2s ease'
                            }}>
                                <input
                                    type="checkbox"
                                    name={decl.name}
                                    checked={formData[decl.name] || false}
                                    onChange={(e) => setFormData(prev => ({ ...prev, [decl.name]: e.target.checked }))}
                                    required={decl.required}
                                    style={{
                                        width: '22px',
                                        height: '22px',
                                        accentColor: 'var(--accent)',
                                        flexShrink: 0,
                                        marginTop: '2px'
                                    }}
                                />
                                <span style={{
                                    fontSize: '0.95rem',
                                    fontWeight: '500',
                                    color: formData[decl.name] ? 'var(--accent)' : 'var(--text-main)',
                                    lineHeight: '1.6'
                                }}>
                                    {decl.label} {decl.required && <span style={{ color: 'var(--error)' }}>*</span>}
                                </span>
                            </label>
                        ))}
                    </div>
                )}

                {status && (
                    <div style={{
                        padding: '24px',
                        borderRadius: '20px',
                        marginBottom: '30px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '15px',
                        background: status.type === 'success' ? 'rgba(5, 150, 105, 0.08)' : status.type === 'error' ? 'rgba(220, 38, 38, 0.08)' : 'rgba(37, 99, 235, 0.08)',
                        border: `1px solid ${status.type === 'success' ? 'rgba(5, 150, 105, 0.2)' : status.type === 'error' ? 'rgba(220, 38, 38, 0.2)' : 'rgba(37, 99, 235, 0.2)'}`,
                        color: 'var(--text-main)',
                        animation: 'fadeIn 0.4s ease'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {status.type === 'success' ? <CheckCircle2 size={24} color="var(--success)" /> :
                                status.type === 'error' ? <AlertCircle size={24} color="var(--error)" /> :
                                    <Loader2 size={24} className="animate-spin" color="var(--accent)" />}
                            <span style={{ fontSize: '1rem', fontWeight: '700' }}>{status.message}</span>
                        </div>

                        {status.type === 'success' && (
                            <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                                <button
                                    type="button"
                                    onClick={onTrackStatus}
                                    className="btn-primary"
                                    style={{ padding: '10px 20px', fontSize: '0.9rem' }}
                                >
                                    Track Status Now
                                </button>
                                <button
                                    type="button"
                                    onClick={onCancel}
                                    className="btn-secondary"
                                    style={{ padding: '10px 20px', fontSize: '0.9rem' }}
                                >
                                    Return to Portal
                                </button>
                            </div>
                        )}
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
