import React, { useState } from 'react';
import {
    Search,
    MapPin,
    Calendar,
    User,
    FileText,
    CheckCircle2,
    Clock,
    AlertCircle,
    ArrowLeft,
    Loader2,
    ChevronRight,
    X,
    Download,
    Send
} from 'lucide-react';

export default function StatusTracker({ onBack }) {
    const [appId, setAppId] = useState('');
    const [loading, setLoading] = useState(false);
    const [application, setApplication] = useState(null);
    const [error, setError] = useState(null);
    const [submittingToCOE, setSubmittingToCOE] = useState(false);
    const [coeSubmitStatus, setCoeSubmitStatus] = useState(null);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!appId.trim()) return;

        setLoading(true);
        setError(null);
        setApplication(null);

        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8787';
            const response = await fetch(`${backendUrl}/status?id=${appId.trim()}`);
            const result = await response.json();

            if (response.ok) {
                setApplication(result);
            } else {
                setError(result.error || 'Application not found');
            }
        } catch (err) {
            setError('Failed to fetch status. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const downloadResponseDocument = async (fileId, fileName, applicationId) => {
        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8787';
            const response = await fetch(`${backendUrl}/download/${fileId}?appId=${applicationId}`);

            if (!response.ok) {
                throw new Error('Failed to download file');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            console.error('Download failed:', err);
            alert('Failed to download document. Please try again.');
        }
    };

    const handleSubmitToCOE = async (applicationId) => {
        setSubmittingToCOE(true);
        setCoeSubmitStatus(null);

        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8787';
            const response = await fetch(`${backendUrl}/submit-to-coe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ appId: applicationId })
            });
            const result = await response.json();

            if (result.success) {
                setCoeSubmitStatus({ type: 'success', message: 'Your application has been successfully submitted to COE for processing!' });
                const statusResponse = await fetch(`${backendUrl}/status?id=${applicationId}`);
                const updatedApp = await statusResponse.json();
                if (statusResponse.ok) {
                    setApplication(updatedApp);
                }
            } else {
                throw new Error(result.error || 'Failed to submit to COE');
            }
        } catch (err) {
            setCoeSubmitStatus({ type: 'error', message: err.message });
        } finally {
            setSubmittingToCOE(false);
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'AWAITING_DIRECTOR': return 'Awaiting Director Approval';
            case 'DIRECTOR_APPROVED': return 'Director Approved - Submit to COE';
            default: return status;
        }
    };

    const getStatusDetails = (app) => {
        const stages = [
            { id: 'submitted', label: 'Submitted', status: 'COMPLETED', icon: FileText, date: app.created_at },
        ];

        if (app.needs_director_approval) {
            stages.push({
                id: 'director',
                label: 'Director Approval',
                status: app.director_status === 'APPROVED' ? 'COMPLETED' : (app.director_status === 'REJECTED' ? 'REJECTED' : 'PENDING'),
                icon: User,
                date: app.director_status !== 'PENDING' ? app.updated_at : null
            });

            const coeSubmitted = app.status !== 'AWAITING_DIRECTOR' && app.status !== 'DIRECTOR_APPROVED';
            stages.push({
                id: 'coe-submission',
                label: 'Submitted to COE',
                status: coeSubmitted ? 'COMPLETED' : 'PENDING',
                icon: Send,
                date: null
            });
        }

        stages.push({
            id: 'controller',
            label: 'Under-Process',
            status: app.controller_status === 'APPROVED' ? 'COMPLETED' : (app.controller_status === 'REJECTED' ? 'REJECTED' : 'PENDING'),
            icon: CheckCircle2,
            date: app.controller_status !== 'PENDING' ? app.updated_at : null
        });

        stages.push({
            id: 'complete',
            label: 'Completed',
            status: app.status === 'COMPLETED' ? 'COMPLETED' : (app.status === 'REJECTED' ? 'REJECTED' : (app.status === 'APPROVED' ? 'IN_PROGRESS' : 'PENDING')),
            icon: Clock
        });

        return stages;
    };

    return (
        <div className="animate-fade-in">
            <div style={{ textAlign: 'center', marginBottom: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <img
                    src="/Examinations_Service.png"
                    alt="SSSIHL Examination Services"
                    style={{ maxWidth: '100%', height: 'auto', objectFit: 'contain', marginBottom: '10px' }}
                />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '40px' }}>
                <button
                    onClick={onBack}
                    className="btn-secondary"
                    style={{ padding: '10px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h2 style={{ fontSize: '1.8rem', color: 'var(--text-main)' }}>Track Application</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Enter your Application ID to see real-time progress.</p>
                </div>
            </div>

            <div className="glass-card" style={{ padding: '30px', marginBottom: '40px' }}>
                <form onSubmit={handleSearch} style={{ display: 'flex', gap: '15px' }}>
                    <div style={{ position: 'relative', flexGrow: 1 }}>
                        <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="e.g., APP-173840..."
                            value={appId}
                            onChange={(e) => setAppId(e.target.value)}
                            className="form-input"
                            style={{ width: '100%', paddingLeft: '48px' }}
                            required
                        />
                    </div>
                    <button type="submit" className="btn-primary" disabled={loading} style={{ minWidth: '140px' }}>
                        {loading ? <Loader2 size={18} className="animate-spin" /> : 'Track Status'}
                    </button>
                </form>
            </div>

            {error && (
                <div style={{
                    padding: '20px',
                    borderRadius: '16px',
                    background: 'rgba(220, 38, 38, 0.08)',
                    border: '1px solid rgba(220, 38, 38, 0.2)',
                    color: 'var(--error)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '40px'
                }}>
                    <AlertCircle size={24} />
                    <span style={{ fontWeight: '600' }}>{error}</span>
                </div>
            )}

            {application && (
                <div className="animate-fade-in">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', marginBottom: '40px' }}>
                        <div className="glass-card" style={{ padding: '25px', borderLeft: '4px solid var(--accent)' }}>
                            <p style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Applicant Details</p>
                            <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)', marginBottom: '15px' }}>{application.applicant_name}</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                    <MapPin size={16} /> {application.campus}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                    <FileText size={16} /> {application.form_type}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                    <Calendar size={16} /> Submitted on {new Date(application.created_at).toLocaleDateString()}
                                </div>
                            </div>
                        </div>

                        <div className="glass-card" style={{ padding: '25px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                            <p style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px' }}>Current Status</p>
                            <div style={{
                                padding: '10px 20px',
                                borderRadius: '30px',
                                background: application.status === 'COMPLETED' ? 'rgba(5, 150, 105, 0.1)' : application.status === 'REJECTED' ? 'rgba(220, 38, 38, 0.1)' : 'rgba(37, 99, 235, 0.1)',
                                color: application.status === 'COMPLETED' ? 'var(--success)' : application.status === 'REJECTED' ? 'var(--error)' : 'var(--accent)',
                                fontWeight: '800',
                                fontSize: '1.1rem',
                                letterSpacing: '0.05em'
                            }}>
                                {getStatusLabel(application.status)}
                            </div>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '12px' }}>
                                Last updated: {new Date(application.updated_at).toLocaleString()}
                            </p>
                        </div>
                    </div>

                    <div className="glass-card" style={{ padding: '40px' }}>
                        <h4 style={{ fontSize: '1.2rem', color: 'var(--text-main)', marginBottom: '30px', textAlign: 'center' }}>Application Timeline</h4>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: '0', overflowX: 'auto', padding: '20px 0' }}>
                            {getStatusDetails(application).map((stage, index, array) => {
                                const Icon = stage.icon;
                                const isLast = index === array.length - 1;
                                const isCompleted = stage.status === 'COMPLETED';
                                const isRejected = stage.status === 'REJECTED';
                                const isInProgress = stage.status === 'IN_PROGRESS';
                                const isPending = stage.status === 'PENDING';

                                return (
                                    <div key={stage.id} style={{ display: 'flex', alignItems: 'flex-start', minWidth: '140px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                                            <div style={{
                                                width: '50px',
                                                height: '50px',
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                background: isCompleted ? 'var(--success)' : isRejected ? 'var(--error)' : isInProgress ? 'var(--accent)' : 'white',
                                                border: isPending ? '3px solid #cbd5e1' : 'none',
                                                color: (isCompleted || isRejected || isInProgress) ? 'white' : '#cbd5e1',
                                                zIndex: 1,
                                                boxShadow: (isCompleted || isInProgress) ? '0 4px 12px rgba(0,0,0,0.15)' : 'none'
                                            }}>
                                                {isCompleted ? <CheckCircle2 size={26} /> : isRejected ? <X size={26} /> : <Icon size={26} />}
                                            </div>
                                            <div style={{ marginTop: '15px', maxWidth: '120px' }}>
                                                <h5 style={{
                                                    fontSize: '0.9rem',
                                                    color: isPending ? 'var(--text-muted)' : 'var(--text-main)',
                                                    fontWeight: isPending ? '500' : '700',
                                                    marginBottom: '6px'
                                                }}>
                                                    {stage.label}
                                                </h5>
                                                <p style={{ fontSize: '0.75rem', color: isCompleted ? 'var(--success)' : isRejected ? 'var(--error)' : isInProgress ? 'var(--accent)' : 'var(--text-muted)' }}>
                                                    {isCompleted ? 'Approved' : isRejected ? 'Rejected' : isInProgress ? 'In Progress' : 'Pending'}
                                                </p>
                                                {stage.date && (
                                                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                                        {new Date(stage.date).toLocaleDateString()}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        {!isLast && (
                                            <div style={{
                                                height: '3px',
                                                width: '60px',
                                                background: isCompleted ? 'var(--success)' : '#e2e8f0',
                                                marginTop: '24px',
                                                flexShrink: 0
                                            }}></div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Submit to COE button - shown when director has approved */}
                    {application.needs_director_approval && application.status === 'DIRECTOR_APPROVED' && (
                        <div className="glass-card" style={{
                            padding: '30px',
                            marginTop: '30px',
                            borderLeft: '4px solid var(--success)',
                            textAlign: 'center'
                        }}>
                            <CheckCircle2 size={40} style={{ color: 'var(--success)', marginBottom: '15px' }} />
                            <h4 style={{ fontSize: '1.2rem', color: 'var(--text-main)', marginBottom: '10px' }}>
                                Director's Approval Received!
                            </h4>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '20px' }}>
                                Your application has been approved by the Director. Please click the button below to submit your application to the Controller of Examinations (COE) for further processing.
                            </p>
                            <button
                                onClick={() => handleSubmitToCOE(application.id)}
                                className="btn-primary"
                                disabled={submittingToCOE}
                                style={{
                                    padding: '14px 32px',
                                    fontSize: '1rem',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '10px'
                                }}
                            >
                                {submittingToCOE && <Loader2 size={18} className="animate-spin" />}
                                {submittingToCOE ? 'Submitting...' : 'Submit to COE'}
                            </button>

                            {coeSubmitStatus && (
                                <div style={{
                                    marginTop: '15px',
                                    padding: '12px 20px',
                                    borderRadius: '12px',
                                    background: coeSubmitStatus.type === 'success' ? 'rgba(5, 150, 105, 0.08)' : 'rgba(220, 38, 38, 0.08)',
                                    color: coeSubmitStatus.type === 'success' ? 'var(--success)' : 'var(--error)',
                                    fontWeight: '600'
                                }}>
                                    {coeSubmitStatus.message}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Response Documents Download Section */}
                    {application.responseDocuments && application.responseDocuments.length > 0 && (
                        <div className="glass-card" style={{ padding: '30px', marginTop: '30px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '10px',
                                    background: 'rgba(5, 150, 105, 0.1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <FileText size={20} style={{ color: 'var(--success)' }} />
                                </div>
                                <div>
                                    <h4 style={{ fontSize: '1.1rem', color: 'var(--text-main)', margin: 0 }}>
                                        Your Documents are Ready!
                                    </h4>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                                        Download your requested documents below
                                    </p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {application.responseDocuments.map((doc) => (
                                    <div
                                        key={doc.id}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '16px 20px',
                                            background: 'rgba(5, 150, 105, 0.05)',
                                            border: '1px solid rgba(5, 150, 105, 0.2)',
                                            borderRadius: '12px',
                                            flexWrap: 'wrap',
                                            gap: '12px'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <FileText size={24} style={{ color: 'var(--success)' }} />
                                            <div>
                                                <p style={{
                                                    color: 'var(--text-main)',
                                                    fontWeight: '600',
                                                    margin: 0,
                                                    fontSize: '0.95rem'
                                                }}>
                                                    {doc.file_name}
                                                </p>
                                                <p style={{
                                                    color: 'var(--text-muted)',
                                                    fontSize: '0.8rem',
                                                    margin: 0,
                                                    marginTop: '4px'
                                                }}>
                                                    {(doc.file_size / 1024).toFixed(1)} KB •
                                                    Uploaded {new Date(doc.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => downloadResponseDocument(doc.id, doc.file_name, application.id)}
                                            className="btn-primary"
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                padding: '10px 20px',
                                                background: 'var(--success)',
                                                fontSize: '0.9rem'
                                            }}
                                        >
                                            <Download size={18} />
                                            Download
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
