import React, { useState, useEffect, useCallback } from 'react';
import { User, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://sssihl-student-services-backend.coeoffice.workers.dev';
const TOKEN_KEY = 'convAdminToken';
const USERNAME_KEY = 'convAdminUsername';

const STATUS_COLORS = {
    PENDING: { bg: '#fef3c7', color: '#92400e', label: 'Pending' },
    APPROVED: { bg: '#d1fae5', color: '#065f46', label: 'Approved' },
    REJECTED: { bg: '#fee2e2', color: '#991b1b', label: 'Rejected' },
    DISPATCHED: { bg: '#dbeafe', color: '#1e40af', label: 'Notified' },
    COMPLETED: { bg: '#d1fae5', color: '#065f46', label: 'Completed' },
};

const CATEGORIES = ['Undergraduate', 'Postgraduate', 'Professional', 'Doctor of Philosophy'];
const CAMPUSES = ['Prasanthi Nilayam Campus', 'Anantapur Campus', 'Brindavan Campus', 'Nandigiri Campus'];

function fmtDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function StatusBadge({ status }) {
    const s = STATUS_COLORS[status] || { bg: '#f1f5f9', color: '#475569', label: status };
    return (
        <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '700', whiteSpace: 'nowrap' }}>
            {s.label}
        </span>
    );
}

export default function ConvocationAdminPortal() {
    const [token, setToken] = useState(localStorage.getItem(TOKEN_KEY) || '');
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem(TOKEN_KEY));
    const [username, setUsername] = useState(localStorage.getItem(USERNAME_KEY) || '');

    // Login form
    const [loginUser, setLoginUser] = useState('');
    const [loginPass, setLoginPass] = useState('');
    const [loginError, setLoginError] = useState('');
    const [loggingIn, setLoggingIn] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const [rememberDevice, setRememberDevice] = useState(false);

    // Data
    const [applications, setApplications] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [categoryFilter, setCategoryFilter] = useState('ALL');
    const [campusFilter, setCampusFilter] = useState('ALL');

    // Detail view
    const [selectedApp, setSelectedApp] = useState(null);
    const [appDetails, setAppDetails] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);

    // Action state
    const [actionLoading, setActionLoading] = useState('');
    const [rejectReason, setRejectReason] = useState('');
    const [showRejectInput, setShowRejectInput] = useState(false);
    const [uploadFile, setUploadFile] = useState(null);
    const [confirmModal, setConfirmModal] = useState(null);
    const [successMsg, setSuccessMsg] = useState('');

    // Create user modal
    const [showCreateUser, setShowCreateUser] = useState(false);
    const [newUser, setNewUser] = useState({ username: '', password: '' });
    const [createUserMsg, setCreateUserMsg] = useState('');

    const authHeaders = { Authorization: `Bearer ${token}` };

    const fetchData = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const [appsRes, statsRes] = await Promise.all([
                fetch(`${API_URL}/convocation-admin/applications`, { headers: authHeaders }),
                fetch(`${API_URL}/convocation-admin/stats`, { headers: authHeaders }),
            ]);
            if (appsRes.status === 401) { handleLogout(); return; }
            const apps = await appsRes.json();
            const st = await statsRes.json();
            setApplications(Array.isArray(apps) ? apps : []);
            setStats(st);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (isLoggedIn) fetchData();
    }, [isLoggedIn, fetchData]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoggingIn(true);
        setLoginError('');
        try {
            const res = await fetch(`${API_URL}/convocation-admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: loginUser, password: loginPass }),
            });
            const data = await res.json();
            if (data.success) {
                localStorage.setItem(TOKEN_KEY, data.token);
                localStorage.setItem(USERNAME_KEY, data.username);
                setToken(data.token);
                setUsername(data.username);
                setIsLoggedIn(true);
            } else {
                setLoginError(data.error || 'Invalid credentials');
            }
        } catch {
            setLoginError('Network error. Please try again.');
        } finally {
            setLoggingIn(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USERNAME_KEY);
        setToken('');
        setIsLoggedIn(false);
        setUsername('');
        setApplications([]);
        setSelectedApp(null);
        setAppDetails(null);
    };

    const openDetail = async (app) => {
        setSelectedApp(app);
        setAppDetails(null);
        setDetailLoading(true);
        setShowRejectInput(false);
        setRejectReason('');
        setUploadFile(null);
        setSuccessMsg('');
        try {
            const res = await fetch(`${API_URL}/convocation-admin/application/${app.id}`, { headers: authHeaders });
            const data = await res.json();
            setAppDetails(data);
        } catch (e) {
            console.error(e);
        } finally {
            setDetailLoading(false);
        }
    };

    const refreshDetail = async () => {
        if (!selectedApp) return;
        const res = await fetch(`${API_URL}/convocation-admin/application/${selectedApp.id}`, { headers: authHeaders });
        const data = await res.json();
        setAppDetails(data);
        setApplications(prev => prev.map(a => a.id === selectedApp.id ? { ...a, status: data.status } : a));
        setSelectedApp(prev => ({ ...prev, status: data.status }));
    };

    const updateStatus = async (status, reason) => {
        setActionLoading(status);
        try {
            const res = await fetch(`${API_URL}/convocation-admin/application/${selectedApp.id}`, {
                method: 'PATCH',
                headers: { ...authHeaders, 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, reason }),
            });
            const data = await res.json();
            if (data.success) {
                setSuccessMsg(`Application ${status.toLowerCase()} successfully.`);
                await refreshDetail();
                setShowRejectInput(false);
                setRejectReason('');
            }
        } catch (e) {
            console.error(e);
        } finally {
            setActionLoading('');
            setConfirmModal(null);
        }
    };

    const handleUploadResponse = async () => {
        if (!uploadFile) return;
        setActionLoading('upload');
        try {
            const fd = new FormData();
            fd.append('applicationId', selectedApp.id);
            fd.append('responseDocument', uploadFile);
            const res = await fetch(`${API_URL}/convocation-admin/upload-response`, { method: 'POST', headers: authHeaders, body: fd });
            const data = await res.json();
            if (data.success) {
                setSuccessMsg('Document uploaded successfully.');
                setUploadFile(null);
                await refreshDetail();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setActionLoading('');
        }
    };

    const handleNotify = async () => {
        setActionLoading('notify');
        try {
            const res = await fetch(`${API_URL}/convocation-admin/notify`, {
                method: 'POST',
                headers: { ...authHeaders, 'Content-Type': 'application/json' },
                body: JSON.stringify({ applicationId: selectedApp.id }),
            });
            const data = await res.json();
            if (data.success) {
                setSuccessMsg('Candidate notified by email.');
                await refreshDetail();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setActionLoading('');
            setConfirmModal(null);
        }
    };

    const handleExport = async () => {
        const res = await fetch(`${API_URL}/convocation-admin/export`, { headers: authHeaders });
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'convocation-2026-registrations.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setCreateUserMsg('');
        try {
            const res = await fetch(`${API_URL}/convocation-admin/create-user`, {
                method: 'POST',
                headers: { ...authHeaders, 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser),
            });
            const data = await res.json();
            if (data.success) {
                setCreateUserMsg('User created successfully.');
                setNewUser({ username: '', password: '' });
            } else {
                setCreateUserMsg(data.error || 'Failed to create user.');
            }
        } catch {
            setCreateUserMsg('Network error.');
        }
    };

    const filteredApps = applications
        .filter(a => {
            if (!searchQuery.trim()) return true;
            const q = searchQuery.toLowerCase();
            return [a.id, a.applicant_name, a.reg_no, a.student_email, a.category, a.programme]
                .some(f => f?.toLowerCase().includes(q));
        })
        .filter(a => statusFilter === 'ALL' || a.status === statusFilter)
        .filter(a => categoryFilter === 'ALL' || a.category === categoryFilter)
        .filter(a => campusFilter === 'ALL' || a.campus === campusFilter);

    // ─── Login screen ───────────────────────────────────────────────────────
    if (!isLoggedIn) {
        return (
            <div className="login-container">
                <style dangerouslySetInnerHTML={{ __html: `
                    .login-container {
                        min-height: 100vh;
                        display: flex;
                        background-color: #ffffff;
                        font-family: 'Inter', sans-serif;
                    }

                    .login-left-panel {
                        flex: 1.1;
                        position: relative;
                        background-image: url('/Divine-Benedictions-v2.jpg');
                        background-size: cover;
                        background-position: center 20%;
                        display: block;
                    }

                    @media (max-width: 1024px) {
                        .login-left-panel {
                            display: none;
                        }
                    }

                    .login-left-overlay {
                        position: absolute;
                        inset: 0;
                    }

                    .login-right-panel {
                        flex: 0.9;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        background-color: #f8fafc;
                        padding: 40px;
                        position: relative;
                    }

                    @media (max-width: 1024px) {
                        .login-right-panel {
                            flex: 1;
                            padding: 24px;
                        }
                    }

                    .login-form-wrapper {
                        width: 100%;
                        max-width: 400px;
                        animation: fadeIn 0.6s ease-out;
                    }

                    .login-logo-container {
                        width: 80px;
                        height: 80px;
                        border-radius: 50%;
                        background: #ffffff;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin: 0 auto 24px;
                        padding: 12px;
                        box-shadow: 0 10px 25px -5px rgba(67, 56, 202, 0.15), 0 8px 10px -6px rgba(67, 56, 202, 0.1);
                        border: 1px solid rgba(226, 232, 240, 0.8);
                    }

                    .login-title {
                        font-family: 'Outfit', sans-serif;
                        font-size: 2.2rem;
                        font-weight: 700;
                        color: #1e1b4b;
                        margin: 0 0 6px;
                        text-align: center;
                        letter-spacing: -0.02em;
                    }

                    .login-subtitle {
                        color: #64748b;
                        font-size: 0.9rem;
                        margin: 0 0 32px;
                        text-align: center;
                        font-weight: 500;
                    }

                    .login-field-group {
                        margin-bottom: 20px;
                    }

                    .login-field-label-row {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 6px;
                    }

                    .login-field-label {
                        font-size: 0.88rem;
                        font-weight: 600;
                        color: #334155;
                    }

                    .login-forgot-link {
                        font-size: 0.82rem;
                        color: #4f46e5;
                        text-decoration: none;
                        font-weight: 600;
                        transition: color 0.2s ease;
                    }

                    .login-forgot-link:hover {
                        color: #4338ca;
                    }

                    .login-input-wrapper {
                        position: relative;
                        display: flex;
                        align-items: center;
                    }

                    .login-input-icon {
                        position: absolute;
                        left: 16px;
                        color: #94a3b8;
                        transition: color 0.2s ease;
                    }

                    .login-input {
                        width: 100%;
                        padding: 13px 44px 13px 48px;
                        border-radius: 12px;
                        border: 1.5px solid #e2e8f0;
                        font-size: 0.95rem;
                        box-sizing: border-box;
                        outline: none;
                        transition: all 0.2s ease;
                        background: #ffffff;
                        color: #1e293b;
                    }

                    .login-input:focus {
                        border-color: #4f46e5;
                        box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1);
                    }

                    .login-input:focus + .login-input-icon {
                        color: #4f46e5;
                    }

                    .login-password-toggle {
                        position: absolute;
                        right: 16px;
                        background: none;
                        border: none;
                        cursor: pointer;
                        color: #94a3b8;
                        padding: 0;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: color 0.2s ease;
                    }

                    .login-password-toggle:hover {
                        color: #4f46e5;
                    }

                    .login-checkbox-row {
                        display: flex;
                        align-items: center;
                        margin-bottom: 24px;
                    }

                    .login-checkbox-label {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        font-size: 0.88rem;
                        color: #475569;
                        cursor: pointer;
                        user-select: none;
                    }

                    .login-checkbox {
                        width: 16px;
                        height: 16px;
                        accent-color: #4f46e5;
                        cursor: pointer;
                    }

                    .login-submit-button {
                        width: 100%;
                        padding: 14px;
                        background: #4f46e5;
                        color: #ffffff;
                        border: none;
                        border-radius: 12px;
                        font-size: 1rem;
                        font-weight: 700;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 8px;
                        box-shadow: 0 4px 12px rgba(79, 70, 229, 0.2);
                        transition: all 0.2s ease;
                    }

                    .login-submit-button:hover:not(:disabled) {
                        background: #4338ca;
                        transform: translateY(-1px);
                        box-shadow: 0 6px 16px rgba(79, 70, 229, 0.3);
                    }

                    .login-submit-button:active:not(:disabled) {
                        transform: translateY(0);
                    }

                    .login-submit-button:disabled {
                        opacity: 0.7;
                        cursor: not-allowed;
                    }

                    .login-footer-text {
                        font-size: 0.78rem;
                        color: #94a3b8;
                        text-align: center;
                        margin-top: 32px;
                        font-weight: 500;
                        line-height: 1.5;
                    }

                    @keyframes fadeIn {
                        from {
                            opacity: 0;
                            transform: translateY(10px);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }
                ` }} />

                <div className="login-left-panel">
                    <div className="login-left-overlay" />
                </div>

                <div className="login-right-panel">
                    <div className="login-form-wrapper">
                        <div className="login-logo-container">
                            <img src="/logo.png" alt="University Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        </div>
                        <h2 className="login-title">Convocation Admin</h2>
                        <p className="login-subtitle">SSSIHL XLV Annual Convocation 2026</p>

                        <form onSubmit={handleLogin}>
                            <div className="login-field-group">
                                <div className="login-field-label-row">
                                    <label className="login-field-label">Username</label>
                                </div>
                                <div className="login-input-wrapper">
                                    <input
                                        type="text"
                                        className="login-input"
                                        value={loginUser}
                                        onChange={e => setLoginUser(e.target.value)}
                                        required
                                        placeholder="Enter your administrative ID"
                                    />
                                    <User size={18} className="login-input-icon" />
                                </div>
                            </div>

                            <div className="login-field-group">
                                <div className="login-field-label-row">
                                    <label className="login-field-label">Password</label>
                                    <a href="#" onClick={e => { e.preventDefault(); alert("Please contact the Administrator to reset your password."); }} className="login-forgot-link">
                                        Forgot password?
                                    </a>
                                </div>
                                <div className="login-input-wrapper">
                                    <input
                                        type={showPass ? 'text' : 'password'}
                                        className="login-input"
                                        value={loginPass}
                                        onChange={e => setLoginPass(e.target.value)}
                                        required
                                        placeholder="••••••••"
                                    />
                                    <Lock size={18} className="login-input-icon" />
                                    <button
                                        type="button"
                                        onClick={() => setShowPass(s => !s)}
                                        className="login-password-toggle"
                                    >
                                        {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="login-checkbox-row">
                                <label className="login-checkbox-label">
                                    <input
                                        type="checkbox"
                                        className="login-checkbox"
                                        checked={rememberDevice}
                                        onChange={e => setRememberDevice(e.target.checked)}
                                    />
                                    Remember this device
                                </label>
                            </div>

                            {loginError && (
                                <p style={{ color: '#ef4444', fontSize: '0.87rem', marginBottom: '16px', textAlign: 'center', fontWeight: '500' }}>
                                    {loginError}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={loggingIn}
                                className="login-submit-button"
                            >
                                {loggingIn ? (
                                    'Signing in…'
                                ) : (
                                    <>
                                        Sign In <ArrowRight size={18} />
                                    </>
                                )}
                            </button>
                        </form>

                        <p className="login-footer-text">
                            Authorized Personnel Only. Access is monitored and logged.
                        </p>
                    </div>
                </div>
            </div>
        );
    }


    const fd = appDetails?.formDetails || {};

    // ─── Main portal ─────────────────────────────────────────────────────────
    return (
        <div style={{ minHeight: '100vh', background: '#f1f5f9', fontFamily: 'system-ui, sans-serif' }}>
            {/* Navbar */}
            <div style={{ background: 'linear-gradient(135deg, #1e1b4b, #4338ca)', padding: '0 24px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 12px rgba(0,0,0,0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {selectedApp && (
                        <button onClick={() => { setSelectedApp(null); setAppDetails(null); setSuccessMsg(''); }} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontSize: '0.85rem' }}>← Back</button>
                    )}
                    <span style={{ color: '#fff', fontWeight: '800', fontSize: '1rem' }}>🎓 Convocation Admin 2026</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {!selectedApp && (
                        <>
                            <button onClick={fetchData} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontSize: '0.85rem' }}>↻ Refresh</button>
                            <button onClick={handleExport} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontSize: '0.85rem' }}>⬇ Export CSV</button>
                            <button onClick={() => setShowCreateUser(s => !s)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontSize: '0.85rem' }}>+ Add User</button>
                        </>
                    )}
                    <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>{username}</span>
                    <button onClick={handleLogout} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontSize: '0.85rem' }}>Logout</button>
                </div>
            </div>

            {/* Create user panel */}
            {showCreateUser && (
                <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '16px 24px', display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>New Username</label>
                        <input value={newUser.username} onChange={e => setNewUser(p => ({ ...p, username: e.target.value }))} style={{ padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '0.9rem', width: '180px' }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>Password</label>
                        <input type="password" value={newUser.password} onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))} style={{ padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '0.9rem', width: '180px' }} />
                    </div>
                    <button onClick={handleCreateUser} style={{ padding: '8px 20px', background: '#4338ca', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Create</button>
                    {createUserMsg && <span style={{ fontSize: '0.85rem', color: createUserMsg.includes('success') ? '#10b981' : '#ef4444' }}>{createUserMsg}</span>}
                </div>
            )}

            <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>

                {/* ─── LIST VIEW ─── */}
                {!selectedApp && (
                    <>
                        {/* Stats */}
                        {stats && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                                {[
                                    { label: 'Total', value: stats.total, color: '#4338ca' },
                                    { label: 'Pending', value: stats.byStatus?.PENDING || 0, color: '#f59e0b' },
                                    { label: 'Approved', value: stats.byStatus?.APPROVED || 0, color: '#10b981' },
                                    { label: 'Rejected', value: stats.byStatus?.REJECTED || 0, color: '#ef4444' },
                                    { label: 'Notified', value: stats.byStatus?.DISPATCHED || 0, color: '#0ea5e9' },
                                ].map(s => (
                                    <div key={s.label} style={{ background: '#fff', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', borderTop: `3px solid ${s.color}`, textAlign: 'center' }}>
                                        <div style={{ fontSize: '1.8rem', fontWeight: '800', color: s.color }}>{s.value}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>{s.label}</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Filters */}
                        <div style={{ background: '#fff', borderRadius: '12px', padding: '16px 20px', marginBottom: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search by name, reg no, app ID…"
                                style={{ flex: 1, minWidth: '200px', padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '0.9rem', outline: 'none' }} />
                            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '0.9rem' }}>
                                <option value="ALL">All Categories</option>
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <select value={campusFilter} onChange={e => setCampusFilter(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '0.9rem' }}>
                                <option value="ALL">All Campuses</option>
                                {CAMPUSES.map(c => <option key={c} value={c}>{c.replace(' Campus', '')}</option>)}
                            </select>
                        </div>

                        {/* Status filter tabs */}
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                            {[
                                { label: 'All', value: 'ALL' },
                                { label: 'Pending', value: 'PENDING' },
                                { label: 'Approved', value: 'APPROVED' },
                                { label: 'Rejected', value: 'REJECTED' },
                                { label: 'Notified', value: 'DISPATCHED' },
                            ].map(t => (
                                <button key={t.value} onClick={() => setStatusFilter(t.value)}
                                    style={{ padding: '7px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600',
                                        background: statusFilter === t.value ? '#4338ca' : '#fff',
                                        color: statusFilter === t.value ? '#fff' : '#475569',
                                        boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                                    {t.label}
                                </button>
                            ))}
                        </div>

                        {/* Applications table */}
                        <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                            {loading ? (
                                <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading applications…</div>
                            ) : filteredApps.length === 0 ? (
                                <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No applications found.</div>
                            ) : (
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                                        <thead>
                                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                                {['App ID', 'Name', 'Reg No', 'Category', 'Programme', 'Campus', 'Attendance', 'Status', 'Submitted'].map(h => (
                                                    <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontWeight: '700', color: '#374151', whiteSpace: 'nowrap' }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredApps.map((app, i) => (
                                                <tr key={app.id} onClick={() => openDetail(app)} style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', background: i % 2 === 0 ? '#fff' : '#fafafa' }}
                                                    onMouseEnter={e => e.currentTarget.style.background = '#f0f4ff'}
                                                    onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#fafafa'}>
                                                    <td style={{ padding: '11px 14px', fontFamily: 'monospace', fontSize: '0.8rem', color: '#4338ca', fontWeight: '700' }}>{app.id}</td>
                                                    <td style={{ padding: '11px 14px', fontWeight: '600', color: '#1e293b' }}>{app.applicant_name}</td>
                                                    <td style={{ padding: '11px 14px', color: '#475569' }}>{app.reg_no || '—'}</td>
                                                    <td style={{ padding: '11px 14px', color: '#475569' }}>{app.category || '—'}</td>
                                                    <td style={{ padding: '11px 14px', color: '#475569', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.programme || '—'}</td>
                                                    <td style={{ padding: '11px 14px', color: '#475569' }}>{(app.campus || '—').replace(' Campus', '')}</td>
                                                    <td style={{ padding: '11px 14px', color: '#475569' }}>{app.attendance_type || '—'}</td>
                                                    <td style={{ padding: '11px 14px' }}><StatusBadge status={app.status} /></td>
                                                    <td style={{ padding: '11px 14px', color: '#94a3b8', whiteSpace: 'nowrap' }}>{fmtDate(app.created_at)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                        <p style={{ color: '#94a3b8', fontSize: '0.82rem', marginTop: '8px' }}>{filteredApps.length} application{filteredApps.length !== 1 ? 's' : ''} shown</p>
                    </>
                )}

                {/* ─── DETAIL VIEW ─── */}
                {selectedApp && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px', alignItems: 'start' }}>

                        {/* Left: applicant details */}
                        <div>
                            {successMsg && (
                                <div style={{ background: '#d1fae5', border: '1px solid #a7f3d0', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', color: '#065f46', fontWeight: '600', fontSize: '0.9rem' }}>
                                    ✓ {successMsg}
                                </div>
                            )}

                            <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: '16px' }}>
                                <h3 style={{ margin: '0 0 20px', color: '#1e293b', fontSize: '1.1rem', fontWeight: '700' }}>Applicant Information</h3>
                                {detailLoading ? (
                                    <p style={{ color: '#94a3b8' }}>Loading…</p>
                                ) : (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                                        {[
                                            ['Application ID', selectedApp.id],
                                            ['Student Name', fd.student_name || selectedApp.applicant_name],
                                            ['Registered Number', fd.registration_number || selectedApp.reg_no],
                                            ['Category', fd.category],
                                            ['Programme', fd.programme],
                                            ['Campus', fd.campus],
                                            ['Attendance Type', fd.attendance_type],
                                            ['Email', appDetails?.student_email],
                                            ['Date of Birth', fd.date_of_birth],
                                            ['Active Mobile', fd.active_mobile],
                                            ['Alternate Mobile', fd.alternate_mobile || '—'],
                                            ['Postal Address', fd.postal_address],
                                            ['Prev Board / University', fd.prev_board_university],
                                            ['Prev Qualification Programme', fd.prev_qualification_programme],
                                            ['Certificate No.', fd.prev_qualification_certificate_no],
                                            ['Declaration', fd.declaration],
                                            ['Submitted On', fmtDate(appDetails?.created_at)],
                                        ].map(([label, value]) => (
                                            <div key={label}>
                                                <p style={{ margin: '0 0 2px', fontSize: '0.78rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
                                                <p style={{ margin: 0, color: '#1e293b', fontWeight: '500', fontSize: '0.92rem', wordBreak: 'break-word' }}>{value || '—'}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Files */}
                            {appDetails?.files && appDetails.files.length > 0 && (
                                <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: '16px' }}>
                                    <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: '700', color: '#1e293b' }}>Documents</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {appDetails.files.map(f => (
                                            <div key={f.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: f.is_response ? '#f0fdf4' : '#f8fafc', borderRadius: '8px', border: `1px solid ${f.is_response ? '#bbf7d0' : '#e2e8f0'}` }}>
                                                <div>
                                                    <span style={{ fontWeight: '600', color: '#1e293b', fontSize: '0.9rem' }}>{f.file_name}</span>
                                                    {f.is_response && <span style={{ marginLeft: '8px', fontSize: '0.75rem', color: '#10b981', fontWeight: '700' }}>RESPONSE</span>}
                                                    {f.uploaded_by && <span style={{ marginLeft: '8px', fontSize: '0.75rem', color: '#94a3b8' }}>by {f.uploaded_by}</span>}
                                                </div>
                                                <a href={`${API_URL}/convocation-admin/file/${f.id}`}
                                                    onClick={e => { e.preventDefault(); window.open(`${API_URL}/convocation-admin/file/${f.id}`, '_blank'); }}
                                                    style={{ fontSize: '0.82rem', color: '#4338ca', fontWeight: '600', textDecoration: 'none' }}>View ↗</a>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right: actions sidebar */}
                        <div style={{ position: 'sticky', top: '80px' }}>
                            <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: '16px' }}>
                                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                                    <StatusBadge status={selectedApp.status} />
                                    <p style={{ margin: '8px 0 0', fontFamily: 'monospace', fontSize: '0.8rem', color: '#94a3b8' }}>{selectedApp.id}</p>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {/* Approve */}
                                    {selectedApp.status !== 'APPROVED' && (
                                        <button onClick={() => setConfirmModal({ action: 'approve', label: 'Approve this application?' })}
                                            disabled={!!actionLoading}
                                            style={{ padding: '10px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem' }}>
                                            ✓ Approve
                                        </button>
                                    )}

                                    {/* Reject */}
                                    {selectedApp.status !== 'REJECTED' && (
                                        <>
                                            <button onClick={() => setShowRejectInput(s => !s)}
                                                disabled={!!actionLoading}
                                                style={{ padding: '10px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem' }}>
                                                ✗ Reject
                                            </button>
                                            {showRejectInput && (
                                                <div>
                                                    <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Reason for rejection (optional)" rows={3}
                                                        style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '0.85rem', resize: 'vertical', boxSizing: 'border-box' }} />
                                                    <button onClick={() => updateStatus('REJECTED', rejectReason)} disabled={!!actionLoading}
                                                        style={{ width: '100%', marginTop: '6px', padding: '8px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '0.87rem' }}>
                                                        {actionLoading === 'REJECTED' ? 'Rejecting…' : 'Confirm Reject'}
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '4px 0' }} />

                                    {/* Upload response */}
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#374151', marginBottom: '6px' }}>Upload Response Document</label>
                                        <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setUploadFile(e.target.files[0] || null)}
                                            style={{ width: '100%', fontSize: '0.82rem', marginBottom: '6px' }} />
                                        <button onClick={handleUploadResponse} disabled={!uploadFile || !!actionLoading}
                                            style={{ width: '100%', padding: '8px', background: '#4338ca', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: uploadFile ? 'pointer' : 'not-allowed', opacity: uploadFile ? 1 : 0.5, fontSize: '0.87rem' }}>
                                            {actionLoading === 'upload' ? 'Uploading…' : 'Upload'}
                                        </button>
                                    </div>

                                    {/* Notify */}
                                    <button onClick={() => setConfirmModal({ action: 'notify', label: 'Send notification email to candidate?' })}
                                        disabled={!!actionLoading}
                                        style={{ padding: '10px', background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem' }}>
                                        📧 Notify Candidate
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Confirm modal */}
            {confirmModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
                    <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', maxWidth: '380px', width: '90%', textAlign: 'center' }}>
                        <p style={{ fontSize: '1rem', fontWeight: '600', color: '#1e293b', marginBottom: '20px' }}>{confirmModal.label}</p>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            <button onClick={() => setConfirmModal(null)} style={{ padding: '9px 24px', border: '1.5px solid #e2e8f0', borderRadius: '8px', background: '#fff', cursor: 'pointer', fontWeight: '600' }}>Cancel</button>
                            <button onClick={() => confirmModal.action === 'notify' ? handleNotify() : updateStatus('APPROVED')}
                                style={{ padding: '9px 24px', background: '#4338ca', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' }}>
                                {actionLoading ? '…' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
