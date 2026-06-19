import React, { useState, useEffect, useCallback } from 'react';
import { User, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';

const Svg = ({ d, size = 16, color = 'currentColor', strokeWidth = 2, fill = 'none', viewBox = '0 0 24 24' }) => (
    <svg width={size} height={size} viewBox={viewBox} fill={fill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', flexShrink: 0 }}>
        {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
    </svg>
);

const IconRefresh = (p) => <Svg {...p} d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />;
const IconDownload = (p) => <Svg {...p} d={['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'M7 10l5 5 5-5', 'M12 15V3']} />;
const IconBarChart = (p) => <Svg {...p} d={['M18 20V10', 'M12 20V4', 'M6 20v-6']} />;
const IconClipboard = (p) => <Svg {...p} d={['M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2', 'M9 2h6a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z']} />;
const IconCheckCircle = (p) => <Svg {...p} d={['M22 11.08V12a10 10 0 1 1-5.93-9.14', 'M22 4 12 14.01l-3-3']} />;
const IconXCircle = ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', flexShrink: 0 }}>
        <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
    </svg>
);
const IconBell = (p) => <Svg {...p} d={['M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9', 'M13.73 21a2 2 0 0 1-3.46 0']} />;
const IconSearch = ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', flexShrink: 0 }}>
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
);
const IconFilter = (p) => <Svg {...p} d="M22 3H2l8 9.46V19l4 2v-8.54L22 3" />;
const IconGrid = (p) => <Svg {...p} d={['M3 3h7v7H3z', 'M14 3h7v7h-7z', 'M14 14h7v7h-7z', 'M3 14h7v7H3z']} />;
const IconFolder = (p) => <Svg {...p} d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />;
const IconChevronL = (p) => <Svg {...p} d="M15 18l-6-6 6-6" />;
const IconChevronR = (p) => <Svg {...p} d="M9 18l6-6-6-6" />;
const IconArrowLeft = (p) => <Svg {...p} d={['M19 12H5', 'M12 19l-7-7 7-7']} />;
const IconCheck = (p) => <Svg {...p} d="M20 6 9 17l-5-5" />;
const IconX = (p) => <Svg {...p} d={['M18 6 6 18', 'M6 6l12 12']} />;
const IconMail = (p) => <Svg {...p} d={['M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z', 'M22 6l-10 7L2 6']} />;
const IconUpload = (p) => <Svg {...p} d={['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'M17 8l-5-5-5 5', 'M12 3v12']} />;

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

const PROGRAMME_MAP = {
    'Undergraduate': [
        'Bachelor of Arts (Honours) / (Honours with Research) in Economics',
        'Bachelor of Arts (Honours) / (Honours with Research) in English Language and Literature',
        'Bachelor of Business Administration (Honours)',
        'Bachelor of Commerce (Honours) / (Honours with Research)',
        'Bachelor of Education',
        'Bachelor of Science (Honours) / (Honours with Research) in Biosciences',
        'Bachelor of Science (Honours) / (Honours with Research) in Chemistry',
        'Bachelor of Science (Honours) / (Honours with Research) in Computer Science',
        'Bachelor of Science (Honours) / (Honours with Research) in Mathematics',
        'Bachelor of Science (Honours) / (Honours with Research) in Mathematical Sciences and Computing',
        'Bachelor of Science (Honours) / (Honours with Research) in Physics',
    ],
    'Postgraduate': [
        'Master of Arts in Economics',
        'Master of Arts in English Language and Literature',
        'Master of Science in Biosciences',
        'Master of Science in Chemistry',
        'Master of Science in Data Science and Computing',
        'Master of Science in Food and Nutritional Sciences',
        'Master of Science in Mathematics',
        'Master of Science in Physics',
    ],
    'Professional': [
        'Master of Business Administration',
        'Bachelor of Education',
        'Master of Technology in Computer Science',
        'Master of Technology in Optoelectronics and Communications',
    ],
    'Doctor of Philosophy': [],
};

function fmtDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

const ANIM_STYLES = `
@keyframes fadeInUp  { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
@keyframes slideInR  { from { opacity:0; transform:translateX(40px) } to { opacity:1; transform:translateX(0) } }
@keyframes slideDown { from { opacity:0; max-height:0 } to { opacity:1; max-height:80px } }
@keyframes spin      { to { transform:rotate(360deg) } }
@keyframes pulseRing { 0%,100%{ box-shadow:0 0 0 0 rgba(245,158,11,0.45) } 60%{ box-shadow:0 0 0 7px rgba(245,158,11,0) } }
@keyframes modalIn   { from { opacity:0; transform:scale(0.92) } to { opacity:1; transform:scale(1) } }
@keyframes successIn { from { opacity:0; transform:translateY(-8px) } to { opacity:1; transform:translateY(0) } }
`;

function useCountUp(target, duration = 800) {
    const [count, setCount] = useState(0);
    useEffect(() => {
        if (typeof target !== 'number') { setCount(target); return; }
        let start = null;
        const step = (ts) => {
            if (!start) start = ts;
            const progress = Math.min((ts - start) / duration, 1);
            setCount(Math.floor(progress * target));
            if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }, [target, duration]);
    return count;
}

function StatusBadge({ status }) {
    const s = STATUS_COLORS[status] || { bg: '#f1f5f9', color: '#475569', label: status };
    const isPending = status === 'PENDING';
    return (
        <span style={{
            background: s.bg, color: s.color, padding: '3px 10px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '700', whiteSpace: 'nowrap',
            animation: isPending ? 'pulseRing 1.6s ease-in-out infinite' : 'none'
        }}>
            {s.label}
        </span>
    );
}

function StatCard({ label, IconComp, iconColor, value }) {
    const displayed = useCountUp(typeof value === 'number' ? value : 0);
    return (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
                <p style={{ margin: '0 0 12px', fontSize: '0.72rem', fontWeight: '600', color: '#6b7280', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</p>
                <p style={{ margin: 0, fontSize: '2.4rem', fontWeight: '700', color: '#111', lineHeight: 1 }}>{typeof value === 'number' ? displayed : value}</p>
            </div>
            <IconComp size={22} color={iconColor} />
        </div>
    );
}

const pressProps = {
    onMouseDown: e => { e.currentTarget.style.transform = 'scale(0.96)'; },
    onMouseUp: e => { e.currentTarget.style.transform = 'scale(1)'; },
    onMouseLeave: e => { e.currentTarget.style.transform = 'scale(1)'; },
};

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


    // Data
    const [applications, setApplications] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [categoryFilter, setCategoryFilter] = useState('ALL');
    const [programmeFilter, setProgrammeFilter] = useState('ALL');
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

    // Portal navigation
    const [activeNav, setActiveNav] = useState('applications');
    const [currentPage, setCurrentPage] = useState(1);

    // Animation state
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [listKey, setListKey] = useState(0);

    const authHeaders = { Authorization: `Bearer ${token}` };

    const fetchData = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        setIsRefreshing(true);
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
            setListKey(k => k + 1);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
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
            // Local dev bypass — only active on localhost
            if (window.location.hostname === 'localhost' && loginUser === 'admin' && loginPass === 'admin123') {
                const devToken = 'dev-local-token';
                localStorage.setItem(TOKEN_KEY, devToken);
                localStorage.setItem(USERNAME_KEY, loginUser);
                setToken(devToken);
                setUsername(loginUser);
                setIsLoggedIn(true);
                setLoggingIn(false);
                return;
            }

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
                setTimeout(() => setSuccessMsg(''), 3500);
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
                setTimeout(() => setSuccessMsg(''), 3500);
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
                setTimeout(() => setSuccessMsg(''), 3500);
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
        .filter(a => programmeFilter === 'ALL' || a.programme === programmeFilter)
        .filter(a => campusFilter === 'ALL' || a.campus === campusFilter);

    // Bump listKey when filters change so rows re-mount and stagger animation replays
    useEffect(() => { setListKey(k => k + 1); }, [searchQuery, statusFilter, categoryFilter, programmeFilter, campusFilter]);

    // ─── Login screen ───────────────────────────────────────────────────────
    if (!isLoggedIn) {
        return (
            <div className="login-container">
                <style dangerouslySetInnerHTML={{
                    __html: `
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
                        box-shadow: 8px 0 32px 0 rgba(0, 0, 0, 0.35);
                        z-index: 1;
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
                    <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        padding: '28px 32px',
                        background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)',
                    }}>
                        <p style={{ margin: '0 0 4px', color: 'rgba(255,255,255,0.75)', fontSize: '0.78rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Sri Sathya Sai Institute of Higher Learning</p>
                        <h2 style={{ margin: 0, color: '#ffffff', fontSize: '1.4rem', fontWeight: '800', lineHeight: 1.3, letterSpacing: '-0.01em' }}>SSSIHL XLV Annual<br />Convocation 2026</h2>
                    </div>
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


                    </div>
                </div>
            </div>
        );
    }


    const fd = appDetails?.formDetails || {};
    const PAGE_SIZE = 20;
    const totalPages = Math.max(1, Math.ceil(filteredApps.length / PAGE_SIZE));
    const pagedApps = filteredApps.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    const navBtn = (id, label) => (
        <button key={id} onClick={() => { setActiveNav(id); setSelectedApp(null); setAppDetails(null); }}
            style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: '20px 4px', fontSize: '0.9rem', fontWeight: activeNav === id ? '600' : '400',
                color: activeNav === id ? '#111' : '#888',
                borderBottom: activeNav === id ? '2px solid #111' : '2px solid transparent'
            }}>
            {label}
        </button>
    );

    const statCard = (label, value, IconComp, iconColor) => (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
                <p style={{ margin: '0 0 12px', fontSize: '0.72rem', fontWeight: '600', color: '#6b7280', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</p>
                <p style={{ margin: 0, fontSize: '2.4rem', fontWeight: '700', color: '#111', lineHeight: 1 }}>{value}</p>
            </div>
            <IconComp size={22} color={iconColor} />
        </div>
    );

    // ─── Main portal ─────────────────────────────────────────────────────────
    return (
        <div style={{ minHeight: '100vh', background: '#fff', fontFamily: "'Inter', system-ui, sans-serif", display: 'flex', flexDirection: 'column' }}>
            <style>{ANIM_STYLES}</style>

            {/* Top Navbar */}
            <header style={{ borderBottom: '1px solid #e5e7eb', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', position: 'sticky', top: 0, zIndex: 100 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
                    <span style={{ fontWeight: '800', fontSize: '1rem', letterSpacing: '0.04em', color: '#111', whiteSpace: 'nowrap' }}>CONVOCATION ADMIN</span>
                    <nav style={{ display: 'flex', gap: '28px' }}>
                        {navBtn('applications', 'Applications')}
                    </nav>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button onClick={fetchData} title="Refresh" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: '6px', display: 'flex', alignItems: 'center' }}>
                        <span style={{ display: 'inline-flex', animation: isRefreshing ? 'spin 0.8s linear infinite' : 'none' }}><IconRefresh size={18} /></span>
                    </button>
                    <button onClick={handleExport} title="Export CSV" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: '6px', display: 'flex', alignItems: 'center' }}><IconDownload size={18} /></button>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#d1d5db', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: '700', color: '#374151' }}>
                        {username?.[0]?.toUpperCase() || 'A'}
                    </div>
                    <button onClick={handleLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem', color: '#111', letterSpacing: '0.04em' }}>LOGOUT</button>
                </div>
            </header>

            <main style={{ flex: 1, padding: '28px 32px', maxWidth: '1400px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>

                {/* ─── APPLICATIONS VIEW ─── */}
                {activeNav === 'applications' && !selectedApp && (
                    <>
                        {/* Stats row */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0', marginBottom: '28px', border: '1px solid #e5e7eb' }}>
                            <StatCard label="TOTAL" value={stats?.total ?? 0} IconComp={IconBarChart} iconColor="#6b7280" />
                            <div style={{ borderLeft: '1px solid #e5e7eb' }}><StatCard label="PENDING" value={stats?.byStatus?.PENDING ?? 0} IconComp={IconClipboard} iconColor="#f97316" /></div>
                            <div style={{ borderLeft: '1px solid #e5e7eb' }}><StatCard label="APPROVED" value={stats?.byStatus?.APPROVED ?? 0} IconComp={IconCheckCircle} iconColor="#10b981" /></div>
                            <div style={{ borderLeft: '1px solid #e5e7eb' }}><StatCard label="REJECTED" value={stats?.byStatus?.REJECTED ?? 0} IconComp={IconXCircle} iconColor="#ef4444" /></div>
                            <div style={{ borderLeft: '1px solid #e5e7eb' }}><StatCard label="NOTIFIED" value={stats?.byStatus?.DISPATCHED ?? 0} IconComp={IconBell} iconColor="#0ea5e9" /></div>
                        </div>

                        {/* Search + filters + status tabs */}
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
                            <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
                                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', display: 'flex' }}><IconSearch size={15} color="#9ca3af" /></span>
                                <input value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }} placeholder="Quick search applications..."
                                    style={{ width: '100%', padding: '9px 12px 9px 36px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }} />
                            </div>
                            <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setProgrammeFilter('ALL'); setCurrentPage(1); }}
                                style={{
                                    padding: '9px 32px 9px 12px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '0.88rem', fontWeight: '600', color: '#374151', background: '#fff', cursor: 'pointer', appearance: 'none',
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                                    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center'
                                }}>
                                <option value="ALL">CATEGORIES</option>
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            {categoryFilter !== 'ALL' && (PROGRAMME_MAP[categoryFilter]?.length > 0) && (
                                <div style={{ animation: 'slideDown 250ms ease forwards', overflow: 'hidden' }}>
                                    <select value={programmeFilter} onChange={e => { setProgrammeFilter(e.target.value); setCurrentPage(1); }}
                                        style={{
                                            padding: '9px 32px 9px 12px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '0.88rem', fontWeight: '600', color: '#374151', background: '#fff', cursor: 'pointer', appearance: 'none',
                                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                                            backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', maxWidth: '260px'
                                        }}>
                                        <option value="ALL">ALL PROGRAMMES</option>
                                        {PROGRAMME_MAP[categoryFilter].map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                            )}
                            <select value={campusFilter} onChange={e => { setCampusFilter(e.target.value); setCurrentPage(1); }}
                                style={{
                                    padding: '9px 32px 9px 12px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '0.88rem', fontWeight: '600', color: '#374151', background: '#fff', cursor: 'pointer', appearance: 'none',
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                                    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center'
                                }}>
                                <option value="ALL">CAMPUSES</option>
                                {CAMPUSES.map(c => <option key={c} value={c}>{c.replace(' Campus', '')}</option>)}
                            </select>
                            <div style={{ display: 'flex', border: '1px solid #d1d5db', borderRadius: '4px', overflow: 'hidden' }}>
                                {[{ label: 'ALL', value: 'ALL' }, { label: 'PENDING', value: 'PENDING' }, { label: 'APPROVED', value: 'APPROVED' }, { label: 'REJECTED', value: 'REJECTED' }].map(t => (
                                    <button key={t.value} onClick={() => { setStatusFilter(t.value); setCurrentPage(1); }}
                                        style={{
                                            padding: '9px 16px', border: 'none', borderRight: '1px solid #d1d5db', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '700', letterSpacing: '0.04em',
                                            background: statusFilter === t.value ? '#111' : '#fff',
                                            color: statusFilter === t.value ? '#fff' : '#6b7280'
                                        }}>
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Registry table */}
                        <div style={{ border: '1px solid #e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ padding: '14px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#111', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Application Registry</span>
                                <div style={{ display: 'flex', gap: '16px' }}>
                                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '600', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px' }}><IconFilter size={13} color="#6b7280" /> FILTER</button>
                                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '600', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px' }}><IconGrid size={13} color="#6b7280" /> VIEW</button>
                                </div>
                            </div>

                            {loading ? (
                                <div style={{ padding: '80px', textAlign: 'center', color: '#9ca3af', fontSize: '0.9rem' }}>Loading…</div>
                            ) : pagedApps.length === 0 ? (
                                <div style={{ padding: '80px 20px', textAlign: 'center' }}>
                                    <div style={{ width: '72px', height: '72px', background: '#f3f4f6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}><IconFolder size={32} color="#9ca3af" /></div>
                                    <h3 style={{ margin: '0 0 8px', fontSize: '1.1rem', fontWeight: '700', color: '#111' }}>System Empty</h3>
                                    <p style={{ margin: '0 0 24px', color: '#6b7280', fontSize: '0.9rem' }}>There are currently no records matching your active filter configuration.</p>
                                    <button onClick={() => { setSearchQuery(''); setStatusFilter('ALL'); setCategoryFilter('ALL'); setProgrammeFilter('ALL'); setCampusFilter('ALL'); setCurrentPage(1); }}
                                        style={{ padding: '10px 24px', background: '#111', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: '700', fontSize: '0.82rem', letterSpacing: '0.05em', cursor: 'pointer' }}>
                                        RESET REGISTRY VIEW
                                    </button>
                                </div>
                            ) : (
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                        <thead>
                                            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                                                {['App ID', 'Name', 'Reg No', 'Category', 'Programme', 'Campus', 'Attendance', 'Status', 'Submitted'].map(h => (
                                                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: '700', color: '#374151', fontSize: '0.75rem', letterSpacing: '0.04em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody key={listKey}>
                                            {pagedApps.map((app, index) => (
                                                <tr key={app.id} onClick={() => openDetail(app)}
                                                    style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer', animation: 'fadeInUp 300ms ease forwards', animationDelay: `${index * 40}ms`, opacity: 0 }}
                                                    onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '0.8rem', color: '#4338ca', fontWeight: '700' }}>{app.id}</td>
                                                    <td style={{ padding: '12px 16px', fontWeight: '600', color: '#111' }}>{app.applicant_name}</td>
                                                    <td style={{ padding: '12px 16px', color: '#6b7280' }}>{app.reg_no || '—'}</td>
                                                    <td style={{ padding: '12px 16px', color: '#6b7280' }}>{app.category || '—'}</td>
                                                    <td style={{ padding: '12px 16px', color: '#6b7280', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.programme || '—'}</td>
                                                    <td style={{ padding: '12px 16px', color: '#6b7280', whiteSpace: 'nowrap' }}>{(app.campus || '—').replace(' Campus', '')}</td>
                                                    <td style={{ padding: '12px 16px', color: '#6b7280', whiteSpace: 'nowrap' }}>{app.attendance_type || '—'}</td>
                                                    <td style={{ padding: '12px 16px' }}><StatusBadge status={app.status} /></td>
                                                    <td style={{ padding: '12px 16px', color: '#9ca3af', whiteSpace: 'nowrap' }}>{fmtDate(app.created_at)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Table footer */}
                            <div style={{ padding: '12px 20px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', letterSpacing: '0.04em' }}>DISPLAYING {filteredApps.length} RECORDS</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                                        style={{ background: 'none', border: 'none', cursor: currentPage === 1 ? 'default' : 'pointer', color: currentPage === 1 ? '#d1d5db' : '#374151', display: 'flex', alignItems: 'center', padding: '4px' }}>
                                        <IconChevronL size={16} color={currentPage === 1 ? '#d1d5db' : '#374151'} />
                                    </button>
                                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#374151', letterSpacing: '0.04em' }}>PAGE {String(currentPage).padStart(2, '0')} / {String(totalPages).padStart(2, '0')}</span>
                                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                                        style={{ background: 'none', border: 'none', cursor: currentPage === totalPages ? 'default' : 'pointer', color: currentPage === totalPages ? '#d1d5db' : '#374151', display: 'flex', alignItems: 'center', padding: '4px' }}>
                                        <IconChevronR size={16} color={currentPage === totalPages ? '#d1d5db' : '#374151'} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* ─── DETAIL VIEW ─── */}
                {selectedApp && (
                    <div style={{ animation: 'slideInR 300ms ease forwards' }}>
                        <button onClick={() => { setSelectedApp(null); setAppDetails(null); setSuccessMsg(''); setActiveNav('applications'); }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem', color: '#6b7280', marginBottom: '20px', padding: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <IconArrowLeft size={16} color="#6b7280" /> Back to Applications
                        </button>

                        {successMsg && (
                            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '4px', padding: '12px 16px', marginBottom: '20px', color: '#065f46', fontWeight: '600', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', animation: 'successIn 300ms ease forwards' }}>
                                <IconCheck size={16} color="#065f46" /> {successMsg}
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px', alignItems: 'start' }}>
                            {/* Left */}
                            <div>
                                <div style={{ border: '1px solid #e5e7eb', borderRadius: '4px', padding: '28px', marginBottom: '20px', background: '#fff' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: '#111', letterSpacing: '0.02em' }}>APPLICANT INFORMATION</h3>
                                        <StatusBadge status={selectedApp.status} />
                                    </div>
                                    {detailLoading ? <p style={{ color: '#9ca3af' }}>Loading…</p> : (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
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
                                                ['Prev Qualification', fd.prev_qualification_programme],
                                                ['Certificate No.', fd.prev_qualification_certificate_no],
                                                ['Declaration', fd.declaration],
                                                ['Submitted On', fmtDate(appDetails?.created_at)],
                                            ].map(([label, value]) => (
                                                <div key={label}>
                                                    <p style={{ margin: '0 0 3px', fontSize: '0.7rem', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</p>
                                                    <p style={{ margin: 0, color: '#111', fontWeight: '500', fontSize: '0.9rem', wordBreak: 'break-word' }}>{value || '—'}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {appDetails?.files && appDetails.files.length > 0 && (
                                    <div style={{ border: '1px solid #e5e7eb', borderRadius: '4px', padding: '24px', background: '#fff' }}>
                                        <h3 style={{ margin: '0 0 16px', fontSize: '0.75rem', fontWeight: '800', color: '#111', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Documents</h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {appDetails.files.map(f => (
                                                <div key={f.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: f.is_response ? '#f0fdf4' : '#f9fafb', borderRadius: '4px', border: `1px solid ${f.is_response ? '#bbf7d0' : '#e5e7eb'}` }}>
                                                    <div>
                                                        <span style={{ fontWeight: '600', color: '#111', fontSize: '0.88rem' }}>{f.file_name}</span>
                                                        {f.is_response && <span style={{ marginLeft: '8px', fontSize: '0.7rem', color: '#10b981', fontWeight: '800', letterSpacing: '0.04em' }}>RESPONSE</span>}
                                                        {f.uploaded_by && <span style={{ marginLeft: '8px', fontSize: '0.75rem', color: '#9ca3af' }}>by {f.uploaded_by}</span>}
                                                    </div>
                                                    <button onClick={() => window.open(`${API_URL}/convocation-admin/file/${f.id}`, '_blank')}
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.82rem', color: '#4338ca', fontWeight: '700' }}>View ↗</button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Right sidebar */}
                            <div style={{ position: 'sticky', top: '80px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ border: '1px solid #e5e7eb', borderRadius: '4px', padding: '20px', background: '#fff' }}>
                                    <p style={{ margin: '0 0 16px', fontSize: '0.7rem', fontWeight: '800', color: '#6b7280', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Actions</p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {selectedApp.status !== 'APPROVED' && (
                                            <button onClick={() => setConfirmModal({ action: 'approve', label: 'Approve this application?' })} disabled={!!actionLoading}
                                                {...pressProps}
                                                style={{ padding: '10px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem', letterSpacing: '0.03em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'transform 0.1s ease' }}>
                                                <IconCheck size={15} color="#fff" /> APPROVE
                                            </button>
                                        )}
                                        {selectedApp.status !== 'REJECTED' && (
                                            <>
                                                <button onClick={() => setShowRejectInput(s => !s)} disabled={!!actionLoading}
                                                    {...pressProps}
                                                    style={{ padding: '10px', background: '#fff', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '4px', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem', letterSpacing: '0.03em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'transform 0.1s ease' }}>
                                                    <IconX size={15} color="#ef4444" /> REJECT
                                                </button>
                                                {showRejectInput && (
                                                    <div>
                                                        <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Reason (optional)" rows={3}
                                                            style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '0.85rem', resize: 'vertical', boxSizing: 'border-box', marginBottom: '6px' }} />
                                                        <button onClick={() => updateStatus('REJECTED', rejectReason)} disabled={!!actionLoading}
                                                            style={{ width: '100%', padding: '9px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem' }}>
                                                            {actionLoading === 'REJECTED' ? 'Rejecting…' : 'Confirm Reject'}
                                                        </button>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '12px', marginTop: '4px' }}>
                                            <p style={{ margin: '0 0 8px', fontSize: '0.75rem', fontWeight: '700', color: '#374151' }}>Upload Response Document</p>
                                            <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setUploadFile(e.target.files[0] || null)}
                                                style={{ width: '100%', fontSize: '0.8rem', marginBottom: '8px' }} />
                                            <button onClick={handleUploadResponse} disabled={!uploadFile || !!actionLoading}
                                                {...pressProps}
                                                style={{ width: '100%', padding: '9px', background: '#111', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: '700', cursor: uploadFile ? 'pointer' : 'not-allowed', opacity: uploadFile ? 1 : 0.4, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'transform 0.1s ease' }}>
                                                <IconUpload size={14} color="#fff" /> {actionLoading === 'upload' ? 'Uploading…' : 'UPLOAD'}
                                            </button>
                                        </div>
                                        <button onClick={() => setConfirmModal({ action: 'notify', label: 'Send notification email to candidate?' })} disabled={!!actionLoading}
                                            {...pressProps}
                                            style={{ padding: '10px', background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem', letterSpacing: '0.03em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'transform 0.1s ease' }}>
                                            <IconMail size={15} color="#fff" /> NOTIFY CANDIDATE
                                        </button>
                                    </div>
                                </div>
                                <div style={{ border: '1px solid #e5e7eb', borderRadius: '4px', padding: '16px', background: '#f9fafb' }}>
                                    <p style={{ margin: '0 0 4px', fontSize: '0.7rem', fontWeight: '700', color: '#9ca3af', letterSpacing: '0.06em' }}>APPLICATION ID</p>
                                    <p style={{ margin: 0, fontFamily: 'monospace', fontSize: '0.82rem', color: '#374151', fontWeight: '600', wordBreak: 'break-all' }}>{selectedApp.id}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer style={{ borderTop: '1px solid #e5e7eb', padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                    <p style={{ margin: '0 0 2px', fontWeight: '800', fontSize: '0.82rem', color: '#111', letterSpacing: '0.04em' }}>CONVOCATION ADMIN</p>
                    <p style={{ margin: 0, fontSize: '0.72rem', color: '#9ca3af' }}>© 2026 SSSIHL. ALL RIGHTS RESERVED.</p>
                </div>
                <div style={{ display: 'flex', gap: '20px' }}>
                    {['PRIVACY', 'TERMS', 'HELP', 'SUPPORT'].map(l => (
                        <span key={l} style={{ fontSize: '0.72rem', fontWeight: '700', color: '#6b7280', cursor: 'pointer', letterSpacing: '0.04em' }}>{l}</span>
                    ))}
                </div>
            </footer>

            {/* Confirm modal */}
            {confirmModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
                    <div style={{ background: '#fff', borderRadius: '4px', padding: '28px', maxWidth: '380px', width: '90%', textAlign: 'center', border: '1px solid #e5e7eb', animation: 'modalIn 200ms ease forwards' }}>
                        <p style={{ fontSize: '1rem', fontWeight: '700', color: '#111', marginBottom: '20px' }}>{confirmModal.label}</p>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            <button onClick={() => setConfirmModal(null)} style={{ padding: '9px 24px', border: '1px solid #d1d5db', borderRadius: '4px', background: '#fff', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}>Cancel</button>
                            <button onClick={() => confirmModal.action === 'notify' ? handleNotify() : updateStatus('APPROVED')}
                                style={{ padding: '9px 24px', background: '#111', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem' }}>
                                {actionLoading ? '…' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
