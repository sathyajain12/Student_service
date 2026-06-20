import React, { useState, useRef } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'https://sssihl-student-services-backend.coeoffice.workers.dev';

const CAMPUSES = ['Prasanthi Nilayam Campus', 'Anantapur Campus', 'Brindavan Campus', 'Nandigiri Campus'];

const CAMPUS_NAME_MAP = {
    'Prasanthi Nilayam': 'Prasanthi Nilayam Campus',
    'Anantapur': 'Anantapur Campus',
    'Brindavan': 'Brindavan Campus',
    'Nandigiri': 'Nandigiri Campus',
};

const UG_PROGRAMMES = [
    'Bachelor of Arts (Honours) / (Honours with Research) in Economics',
    'Bachelor of Arts (Honours) / (Honours with Research) in English Language and Literature',
    'Bachelor of Business Administration (Honours)',
    'Bachelor of Commerce (Honours) / (Honours with Research)',
    'Bachelor of Education',
    'Bachelor of Performing Arts (Honours) in Music',
    'Bachelor of Performing Arts in Music',
    'Bachelor of Science (Honours) / (Honours with Research) in Actuarial Data Science',
    'Bachelor of Science (Honours) / (Honours with Research) in Artificial Intelligence and Computational Biology',
    'Bachelor of Science (Honours) / (Honours with Research) in Biosciences and Biotechnology',
    'Bachelor of Science (Honours) / (Hons. with Research) in Chemistry',
    'Bachelor of Science (Honours) / (Honours with Research) in Computer Science',
    'Bachelor of Science (Honours) / (Honours with Research) in Computer Science and Artificial Intelligence',
    'Bachelor of Science (Honours) / (Honours with Research) in Economics',
    'Bachelor of Science (Honours) / (Honours with Research) in Finance, Economics & Data Analytics',
    'Bachelor of Science (Honours) / (Honours with Research) in Food and Nutritional Sciences',
    'Bachelor of Science (Honours) / (Honours with Research) in Mathematics',
    'Bachelor of Science (Honours) / (Honours with Research) in Mathematical Sciences and Computing',
    'Bachelor of Science (Honours) / (Honours with Research) in Physics',
];

const PG_PROGRAMMES = [
    'Master of Arts in Economics',
    'Master of Arts in English Language and Literature',
    'Master of Science in Biosciences',
    'Master of Science in Chemistry',
    'Master of Science in Data Science and Computing',
    'Master of Science in Food and Nutritional Sciences',
    'Master of Science in Mathematics',
    'Master of Science in Physics',
];

const PROFESSIONAL_PROGRAMMES = [
    'Master of Business Administration',
    'Bachelor of Education',
    'Master of Technology in Computer Science',
    'Master of Technology in Optoelectronics and Communications',
];

const PROGRAMME_MAP = {
    'Undergraduate': UG_PROGRAMMES,
    'Postgraduate': PG_PROGRAMMES,
    'Professional': PROFESSIONAL_PROGRAMMES,
    'Doctor of Philosophy': [],
};

const FORM_TYPE = 'SSSIHL - XLV Annual Convocation November 2026 - Registration Form';

export default function ConvocationForm({ onCancel, onTrackStatus, hiddenData }) {
    const [category, setCategory] = useState('');
    const isPhD = category === 'Doctor of Philosophy';
    const programmes = PROGRAMME_MAP[category] || [];
    const [step, setStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [appId, setAppId] = useState('');
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const fileRef = useRef(null);

    const [formData, setFormData] = useState({
        programme: '',
        regNo: '',
        studentName: '',
        campus: '',
        email: '',
        attendanceType: '',
        dob: '',
        postalAddress: '',
        activeMobile: '',
        alternateMobile: '',
        prevBoardUniversity: '',
        prevQualProgramme: '',
        prevQualCertNo: '',
        declaration: false,
    });
    const [docFile, setDocFile] = useState(null);
    const [lookupStatus, setLookupStatus] = useState('idle'); // idle | loading | found | not_found
    const [prefilledFields, setPrefilledFields] = useState([]);

    const set = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setFieldErrors(prev => ({ ...prev, [field]: '' }));
    };

    const lookupStudent = async (regNo) => {
        if (!regNo || regNo.trim().length < 3) return;
        setLookupStatus('loading');
        try {
            const res = await fetch(`${API_URL}/convocation/student-lookup?regNo=${encodeURIComponent(regNo.trim())}`);
            const data = await res.json();
            if (data.found) {
                const filled = [];
                if (data.category)      { setCategory(data.category);          filled.push('category'); }
                if (data.name)          { set('studentName', data.name);        filled.push('studentName'); }
                if (data.email)         { set('email', data.email);             filled.push('email'); }
                if (data.campus)        { set('campus', CAMPUS_NAME_MAP[data.campus] || data.campus); filled.push('campus'); }
                if (data.programme)     { set('programme', data.programme);     filled.push('programme'); }
                setPrefilledFields(filled);
                setLookupStatus('found');
            } else {
                setPrefilledFields([]);
                setLookupStatus('not_found');
            }
        } catch {
            setLookupStatus('idle');
        }
    };

    const validateStep = () => {
        const errs = {};
        if (step === 1) {
            if (!formData.regNo) errs.regNo = 'Registered number is required.';
            if (!category) errs.category = 'Please select your degree category.';
            if (!isPhD && !formData.programme) errs.programme = 'Please select a programme.';
            if (!formData.studentName) errs.studentName = 'Student name is required.';
            if (!formData.campus) errs.campus = 'Campus is required.';
            if (!formData.email) errs.email = 'Email address is required.';
            if (!formData.attendanceType) errs.attendanceType = 'Please select In Person or In Absentia.';
        } else if (step === 2) {
            if (!formData.dob) errs.dob = 'Date of birth is required.';
            if (!formData.postalAddress) errs.postalAddress = 'Postal address is required.';
            if (!formData.activeMobile) errs.activeMobile = 'Active mobile number is required.';
        } else if (step === 3) {
            if (!docFile) errs.docFile = 'Please upload scanned documents.';
            if (!formData.prevBoardUniversity) errs.prevBoardUniversity = 'Board / university name is required.';
            if (!formData.prevQualProgramme) errs.prevQualProgramme = 'Previous qualification programme is required.';
            if (!formData.prevQualCertNo) errs.prevQualCertNo = 'Certificate number is required.';
            if (!formData.declaration) errs.declaration = 'You must accept the declaration to submit.';
        }
        setFieldErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleNext = () => {
        if (!validateStep()) return;
        setStep(s => s + 1);
        window.scrollTo(0, 0);
    };

    const handleBack = () => {
        setStep(s => Math.max(s - 1, 1));
        window.scrollTo(0, 0);
    };

    const handleSubmit = async () => {
        if (!validateStep()) return;
        setSubmitting(true);
        setError('');
        try {
            const fd = new FormData();
            fd.append('formType', FORM_TYPE);
            fd.append('email', formData.email);
            fd.append('applicantName', formData.studentName);
            fd.append('regNo', formData.regNo);
            fd.append('campus', formData.campus);
            fd.append('program', formData.programme);
            fd.append('category', category);
            fd.append('attendanceType', formData.attendanceType);
            fd.append('dob', formData.dob);
            fd.append('postalAddress', formData.postalAddress);
            fd.append('activeMobile', formData.activeMobile);
            fd.append('alternateMobile', formData.alternateMobile || '');
            fd.append('prevBoardUniversity', formData.prevBoardUniversity);
            fd.append('prevQualProgramme', formData.prevQualProgramme);
            fd.append('prevQualCertNo', formData.prevQualCertNo);
            fd.append('declaration', formData.declaration ? 'Yes' : 'No');
            if (docFile) fd.append('scannedDocuments', docFile);

            const res = await fetch(`${API_URL}/submit`, { method: 'POST', body: fd });
            const data = await res.json();
            if (data.success) {
                setAppId(data.appId);
                setSubmitted(true);
            } else {
                setError(data.error || 'Submission failed. Please try again.');
            }
        } catch (e) {
            setError('Network error. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const isPrefilled = (field) => prefilledFields.includes(field);
    const inputStyle = (field) => ({
        width: '100%', padding: '10px 12px', borderRadius: '8px',
        border: `1.5px solid ${fieldErrors[field] ? '#ef4444' : isPrefilled(field) ? '#6ee7b7' : '#e2e8f0'}`,
        fontSize: '0.95rem', fontFamily: 'inherit', outline: 'none',
        background: isPrefilled(field) ? '#f0fdf4' : '#fff', boxSizing: 'border-box',
    });
    const labelStyle = { display: 'block', fontWeight: '600', marginBottom: '6px', color: '#374151', fontSize: '0.9rem' };
    const errorStyle = { color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' };
    const fieldWrap = { marginBottom: '18px' };

    const stepTitles = ['Registration & Academic Details', 'Personal Details', 'Previous Qualification'];
    const currentStepIndex = step - 1;

    if (submitted) {
        return (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
                <h2 style={{ color: '#10b981', marginBottom: '12px' }}>Registration Submitted!</h2>
                <p style={{ color: '#374151', marginBottom: '8px' }}>Your convocation registration has been received.</p>
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '16px', display: 'inline-block', margin: '16px 0' }}>
                    <p style={{ margin: 0, fontWeight: '700', color: '#065f46', fontSize: '1.1rem' }}>Application ID: {appId}</p>
                    <p style={{ margin: '4px 0 0', color: '#047857', fontSize: '0.85rem' }}>Save this ID to track your application status.</p>
                </div>
                <br />
                <button onClick={onTrackStatus} className="btn-primary" style={{ marginTop: '12px' }}>Track Application Status</button>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: '28px' }}>
                <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6366f1', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px', fontSize: '0.9rem', fontWeight: '600', padding: 0 }}>
                    ← Back
                </button>
                <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>
                    SSSIHL - XLV Annual Convocation November 2026
                </h2>
                {category && <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Category: <strong>{category}</strong></p>}
            </div>

            {/* Step progress */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '28px', flexWrap: 'wrap' }}>
                {stepTitles.map((title, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{
                            width: '26px', height: '26px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.75rem', fontWeight: '700',
                            background: i < currentStepIndex ? '#10b981' : i === currentStepIndex ? '#4F46E5' : '#e2e8f0',
                            color: i <= currentStepIndex ? '#fff' : '#94a3b8',
                        }}>{i < currentStepIndex ? '✓' : i + 1}</div>
                        <span style={{ fontSize: '0.82rem', fontWeight: i === currentStepIndex ? '700' : '400', color: i === currentStepIndex ? '#4F46E5' : '#64748b' }}>{title}</span>
                        {i < stepTitles.length - 1 && <span style={{ color: '#e2e8f0', marginLeft: '4px' }}>›</span>}
                    </div>
                ))}
            </div>

            <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' }}>

                {/* Step 1 — Registration & Academic Details */}
                {step === 1 && (
                    <div>
                        <h3 style={{ marginBottom: '20px', color: '#1e293b' }}>Registration & Academic Details</h3>
                        <div style={fieldWrap}>
                            <label style={labelStyle}>Registered Number <span style={{ color: '#ef4444' }}>*</span></label>
                            <input
                                type="text"
                                value={formData.regNo}
                                onChange={e => { set('regNo', e.target.value); setLookupStatus('idle'); setPrefilledFields([]); setCategory(''); }}
                                onBlur={e => lookupStudent(e.target.value)}
                                style={inputStyle('regNo')}
                                placeholder="Enter your registered number"
                            />
                            {lookupStatus === 'loading' && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '8px 0 0' }}>
                                    <style>{`@keyframes cfSpin{to{transform:rotate(360deg)}}@keyframes cfPulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
                                    <div style={{ width: '16px', height: '16px', border: '2px solid #e2e8f0', borderTopColor: '#4F46E5', borderRadius: '50%', animation: 'cfSpin 0.7s linear infinite', flexShrink: 0 }} />
                                    <span style={{ color: '#4F46E5', fontSize: '0.82rem', fontWeight: '600', animation: 'cfPulse 1.2s ease infinite' }}>Fetching student record…</span>
                                </div>
                            )}
                            {lookupStatus === 'found'     && <p style={{ color: '#059669', fontSize: '0.8rem', margin: '6px 0 0', fontWeight: '600' }}>✓ Student record found — fields have been pre-filled</p>}
                            {lookupStatus === 'not_found' && <p style={{ color: '#92400e', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px', padding: '6px 10px', fontSize: '0.82rem', margin: '6px 0 0' }}>Your registration number was not found in our records. You may still proceed — please fill in all details below manually.</p>}
                            {fieldErrors.regNo && <p style={errorStyle}>{fieldErrors.regNo}</p>}
                        </div>
                        <div style={fieldWrap}>
                            <label style={labelStyle}>Degree Category <span style={{ color: '#ef4444' }}>*</span></label>
                            <select
                                value={category}
                                onChange={e => { setCategory(e.target.value); set('programme', ''); setFieldErrors(prev => ({ ...prev, category: '' })); }}
                                style={{
                                    width: '100%', padding: '10px 12px', borderRadius: '8px',
                                    border: `1.5px solid ${fieldErrors.category ? '#ef4444' : isPrefilled('category') ? '#6ee7b7' : '#e2e8f0'}`,
                                    fontSize: '0.95rem', fontFamily: 'inherit', outline: 'none',
                                    background: isPrefilled('category') ? '#f0fdf4' : '#fff', boxSizing: 'border-box',
                                }}
                            >
                                <option value="">-- Select Category --</option>
                                {['Undergraduate', 'Postgraduate', 'Professional', 'Doctor of Philosophy'].map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                            {fieldErrors.category && <p style={errorStyle}>{fieldErrors.category}</p>}
                        </div>
                        {category && !isPhD && (
                            <div style={fieldWrap}>
                                <label style={labelStyle}>Programme <span style={{ color: '#ef4444' }}>*</span></label>
                                <select value={formData.programme} onChange={e => set('programme', e.target.value)} style={inputStyle('programme')}>
                                    <option value="">-- Select Programme --</option>
                                    {programmes.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                                {fieldErrors.programme && <p style={errorStyle}>{fieldErrors.programme}</p>}
                            </div>
                        )}
                        <div style={fieldWrap}>
                            <label style={labelStyle}>Student Name <span style={{ color: '#ef4444' }}>*</span></label>
                            <input type="text" value={formData.studentName} onChange={e => set('studentName', e.target.value)} style={inputStyle('studentName')} placeholder="As per official records" />
                            {fieldErrors.studentName && <p style={errorStyle}>{fieldErrors.studentName}</p>}
                        </div>
                        <div style={fieldWrap}>
                            <label style={labelStyle}>Campus <span style={{ color: '#ef4444' }}>*</span></label>
                            <select value={formData.campus} onChange={e => set('campus', e.target.value)} style={inputStyle('campus')}>
                                <option value="">-- Select Campus --</option>
                                {CAMPUSES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            {fieldErrors.campus && <p style={errorStyle}>{fieldErrors.campus}</p>}
                        </div>
                        <div style={fieldWrap}>
                            <label style={labelStyle}>Email Address <span style={{ color: '#ef4444' }}>*</span></label>
                            <input type="email" value={formData.email} onChange={e => set('email', e.target.value)} style={inputStyle('email')} placeholder="Your active email address" />
                            {fieldErrors.email && <p style={errorStyle}>{fieldErrors.email}</p>}
                        </div>
                        <div style={fieldWrap}>
                            <label style={labelStyle}>Attendance Type <span style={{ color: '#ef4444' }}>*</span></label>
                            <div style={{ display: 'flex', gap: '20px', marginTop: '6px' }}>
                                {['In Person', 'In Absentia'].map(opt => (
                                    <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '500', color: '#374151' }}>
                                        <input type="radio" name="attendanceType" value={opt} checked={formData.attendanceType === opt} onChange={e => set('attendanceType', e.target.value)} />
                                        {opt}
                                    </label>
                                ))}
                            </div>
                            {fieldErrors.attendanceType && <p style={errorStyle}>{fieldErrors.attendanceType}</p>}
                        </div>
                    </div>
                )}

                {/* Step 2 — Personal Details */}
                {step === 2 && (
                    <div>
                        <h3 style={{ marginBottom: '20px', color: '#1e293b' }}>Personal Details</h3>
                        <div style={fieldWrap}>
                            <label style={labelStyle}>Date of Birth <span style={{ color: '#ef4444' }}>*</span></label>
                            <input type="date" value={formData.dob} onChange={e => set('dob', e.target.value)} style={inputStyle('dob')} />
                            {fieldErrors.dob && <p style={errorStyle}>{fieldErrors.dob}</p>}
                        </div>
                        <div style={fieldWrap}>
                            <label style={labelStyle}>Postal Address for Communication <span style={{ color: '#ef4444' }}>*</span></label>
                            <textarea rows={4} value={formData.postalAddress} onChange={e => set('postalAddress', e.target.value)} style={{ ...inputStyle('postalAddress'), resize: 'vertical' }} placeholder="Full postal address including pin code" />
                            {fieldErrors.postalAddress && <p style={errorStyle}>{fieldErrors.postalAddress}</p>}
                        </div>
                        <div style={fieldWrap}>
                            <label style={labelStyle}>Active Mobile Number <span style={{ color: '#ef4444' }}>*</span></label>
                            <input type="tel" value={formData.activeMobile} onChange={e => set('activeMobile', e.target.value)} style={inputStyle('activeMobile')} placeholder="10-digit mobile number" />
                            {fieldErrors.activeMobile && <p style={errorStyle}>{fieldErrors.activeMobile}</p>}
                        </div>
                        <div style={fieldWrap}>
                            <label style={labelStyle}>Alternate Mobile Number</label>
                            <input type="tel" value={formData.alternateMobile} onChange={e => set('alternateMobile', e.target.value)} style={inputStyle('alternateMobile')} placeholder="Optional" />
                        </div>
                    </div>
                )}

                {/* Step 3 — Previous Qualification */}
                {step === 3 && (
                    <div>
                        <h3 style={{ marginBottom: '20px', color: '#1e293b' }}>Details of Previous Qualification</h3>
                        <div style={fieldWrap}>
                            <label style={labelStyle}>Scanned Documents <span style={{ color: '#ef4444' }}>*</span></label>
                            <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => { setDocFile(e.target.files[0] || null); setFieldErrors(prev => ({ ...prev, docFile: '' })); }} style={{ ...inputStyle('docFile'), padding: '6px' }} />
                            {fieldErrors.docFile && <p style={errorStyle}>{fieldErrors.docFile}</p>}
                        </div>
                        <div style={fieldWrap}>
                            <label style={labelStyle}>Name of the Previous Board / University <span style={{ color: '#ef4444' }}>*</span></label>
                            <input type="text" value={formData.prevBoardUniversity} onChange={e => set('prevBoardUniversity', e.target.value)} style={inputStyle('prevBoardUniversity')} placeholder="e.g. CBSE, State Board, University name" />
                            {fieldErrors.prevBoardUniversity && <p style={errorStyle}>{fieldErrors.prevBoardUniversity}</p>}
                        </div>
                        <div style={fieldWrap}>
                            <label style={labelStyle}>Name of the Previous Qualification Programme <span style={{ color: '#ef4444' }}>*</span></label>
                            <input type="text" value={formData.prevQualProgramme} onChange={e => set('prevQualProgramme', e.target.value)} style={inputStyle('prevQualProgramme')} placeholder="e.g. Higher Secondary, Bachelor's Degree" />
                            {fieldErrors.prevQualProgramme && <p style={errorStyle}>{fieldErrors.prevQualProgramme}</p>}
                        </div>
                        <div style={fieldWrap}>
                            <label style={labelStyle}>Previous Qualification Programme Certificate No. <span style={{ color: '#ef4444' }}>*</span></label>
                            <input type="text" value={formData.prevQualCertNo} onChange={e => set('prevQualCertNo', e.target.value)} style={inputStyle('prevQualCertNo')} placeholder="Certificate number" />
                            {fieldErrors.prevQualCertNo && <p style={errorStyle}>{fieldErrors.prevQualCertNo}</p>}
                        </div>
                        <div style={{ ...fieldWrap, background: '#fefce8', border: '1.5px solid #fde68a', borderRadius: '10px', padding: '14px' }}>
                            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                                <input type="checkbox" checked={formData.declaration} onChange={e => set('declaration', e.target.checked)} style={{ marginTop: '3px', width: '16px', height: '16px', flexShrink: 0 }} />
                                <span style={{ fontSize: '0.9rem', color: '#374151', lineHeight: '1.5' }}>
                                    I hereby solemnly affirm that all the information provided above is true and correct to the best of my knowledge and belief. <span style={{ color: '#ef4444' }}>*</span>
                                </span>
                            </label>
                            {fieldErrors.declaration && <p style={{ ...errorStyle, marginLeft: '26px' }}>{fieldErrors.declaration}</p>}
                        </div>
                    </div>
                )}
            </div>

            {error && <p style={{ color: '#ef4444', marginTop: '12px', fontWeight: '500' }}>{error}</p>}

            {/* Navigation */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                {step > 1 && (
                    <button onClick={handleBack} className="btn-secondary" style={{ minWidth: '100px' }}>← Back</button>
                )}
                {step < 3 ? (
                    <button onClick={handleNext} className="btn-primary" style={{ flexGrow: 1 }}>Next →</button>
                ) : (
                    <button onClick={handleSubmit} disabled={submitting} className="btn-primary" style={{ flexGrow: 1, opacity: submitting ? 0.7 : 1 }}>
                        {submitting ? 'Submitting…' : 'Submit Registration'}
                    </button>
                )}
            </div>
        </div>
    );
}
