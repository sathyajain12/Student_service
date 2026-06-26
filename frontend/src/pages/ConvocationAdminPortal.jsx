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
    ARCHIVED: { bg: '#f3f4f6', color: '#4b5563', label: 'Archived' },
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

function StatCard({ label, IconComp, iconColor, tintColor, value }) {
    const displayed = useCountUp(typeof value === 'number' ? value : 0);
    const isZero = value === 0;
    return (
        <div style={{
            background: isZero ? '#dde1e7' : `color-mix(in srgb, ${tintColor} 8%, #dde1e7)`,
            borderRadius: '16px', padding: '20px 24px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
            boxShadow: isZero ? '4px 4px 8px #b2bec9, -4px -4px 8px #ffffff' : `6px 6px 14px #b2bec9, -6px -6px 14px #ffffff`,
            opacity: isZero ? 0.5 : 1,
            transition: 'opacity 0.3s',
            borderLeft: isZero ? 'none' : `3px solid ${tintColor}`,
        }}>
            <div>
                <p style={{ margin: '0 0 10px', fontSize: '0.72rem', fontWeight: '700', color: isZero ? '#718096' : tintColor, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</p>
                <p style={{ margin: 0, fontSize: '2.6rem', fontWeight: '800', color: isZero ? '#4a5568' : tintColor, lineHeight: 1 }}>{typeof value === 'number' ? displayed : value}</p>
            </div>
            <IconComp size={22} color={isZero ? '#a0aec0' : tintColor} />
        </div>
    );
}

const pressProps = {
    onMouseDown: e => { e.currentTarget.style.transform = 'scale(0.96)'; },
    onMouseUp: e => { e.currentTarget.style.transform = 'scale(1)'; },
    onMouseLeave: e => { e.currentTarget.style.transform = 'scale(1)'; },
};

function NeuSelect({ value, onChange, options, placeholder }) {
    const [open, setOpen] = useState(false);
    const ref = React.useRef(null);

    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const selected = options.find(o => o.value === value);

    return (
        <div ref={ref} style={{ position: 'relative', userSelect: 'none' }}>
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px',
                    padding: '10px 14px', border: 'none', borderRadius: '12px', cursor: 'pointer',
                    background: '#dde1e7', color: value === (options[0]?.value) ? '#718096' : '#2d3748',
                    fontWeight: value === (options[0]?.value) ? '500' : '600', fontSize: '0.88rem',
                    minWidth: '140px', whiteSpace: 'nowrap',
                    boxShadow: open
                        ? 'inset 4px 4px 8px #b2bec9, inset -4px -4px 8px #ffffff'
                        : '4px 4px 8px #b2bec9, -4px -4px 8px #ffffff',
                    transition: 'box-shadow 0.2s',
                }}>
                <span>{selected?.label || placeholder}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#718096" strokeWidth="2.5" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', flexShrink: 0 }}>
                    <polyline points="6 9 12 15 18 9" />
                </svg>
            </button>
            {open && (
                <div style={{
                    position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 999, minWidth: '100%',
                    background: '#dde1e7', borderRadius: '14px', overflow: 'hidden',
                    boxShadow: '10px 10px 20px #b2bec9, -10px -10px 20px #ffffff',
                    animation: 'fadeInUp 150ms ease forwards',
                }}>
                    {options.map(o => (
                        <div key={o.value}
                            onClick={() => { onChange(o.value); setOpen(false); }}
                            style={{
                                padding: '10px 16px', fontSize: '0.88rem', cursor: 'pointer', whiteSpace: 'nowrap',
                                fontWeight: o.value === value ? '700' : '400',
                                color: o.value === value ? '#1e40af' : '#2d3748',
                                background: o.value === value ? 'rgba(30,64,175,0.06)' : 'transparent',
                                transition: 'background 0.15s',
                            }}
                            onMouseEnter={e => { if (o.value !== value) e.currentTarget.style.background = 'rgba(178,190,201,0.3)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = o.value === value ? 'rgba(30,64,175,0.06)' : 'transparent'; }}
                        >
                            {o.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
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

    // Form enable/disable
    const [formEnabled, setFormEnabled] = useState(true);
    const [togglingForm, setTogglingForm] = useState(false);

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
        if (isLoggedIn) {
            fetchData();
            fetch(`${API_URL}/form-settings`)
                .then(r => r.json())
                .then(data => { if (typeof data['convocation-2026'] === 'boolean') setFormEnabled(data['convocation-2026']); })
                .catch(() => {});
        }
    }, [isLoggedIn, fetchData]);

    const handleToggleForm = async () => {
        setTogglingForm(true);
        try {
            const res = await fetch(`${API_URL}/convocation-admin/toggle-form`, {
                method: 'POST',
                headers: { ...authHeaders, 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !formEnabled }),
            });
            const data = await res.json();
            if (data.success) setFormEnabled(!formEnabled);
        } catch (e) {
            console.error(e);
        } finally {
            setTogglingForm(false);
        }
    };

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
                await fetchData();
                setShowRejectInput(false);
                setRejectReason('');
            } else {
                alert(`Action failed: ${data.error || 'Unknown error'}`);
            }
        } catch (e) {
            console.error(e);
            alert('Network error. Please try again.');
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
        .filter(a => statusFilter === 'ALL' ? a.status !== 'ARCHIVED' : a.status === statusFilter)
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
                        background-color: #dde1e7;
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
                        background-color: #dde1e7;
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
                        background: #dde1e7;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin: 0 auto 24px;
                        padding: 12px;
                        box-shadow: 8px 8px 16px #b2bec9, -8px -8px 16px #ffffff;
                        border: none;
                    }

                    .login-title {
                        font-family: 'Outfit', sans-serif;
                        font-size: 2.2rem;
                        font-weight: 700;
                        color: #1e40af;
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
                        color: #1e40af;
                        text-decoration: none;
                        font-weight: 600;
                        transition: color 0.2s ease;
                    }

                    .login-forgot-link:hover {
                        color: #1d4ed8;
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
                        border: none;
                        font-size: 0.95rem;
                        box-sizing: border-box;
                        outline: none;
                        transition: all 0.2s ease;
                        background: #dde1e7;
                        color: #2d3748;
                        box-shadow: inset 5px 5px 10px #b2bec9, inset -5px -5px 10px #ffffff;
                    }

                    .login-input:focus {
                        box-shadow: inset 6px 6px 12px #b2bec9, inset -6px -6px 12px #ffffff;
                    }

                    .login-input:focus + .login-input-icon {
                        color: #1e40af;
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
                        color: #b45309;
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
                        accent-color: #1e40af;
                        cursor: pointer;
                    }

                    .login-submit-button {
                        width: 100%;
                        padding: 14px;
                        background: #dde1e7;
                        color: #1e40af;
                        border: none;
                        border-radius: 12px;
                        font-size: 1rem;
                        font-weight: 700;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 8px;
                        box-shadow: 6px 6px 12px #b2bec9, -6px -6px 12px #ffffff;
                        transition: all 0.2s ease;
                    }

                    .login-submit-button:hover:not(:disabled) {
                        box-shadow: 8px 8px 16px #b2bec9, -8px -8px 16px #ffffff;
                    }

                    .login-submit-button:active:not(:disabled) {
                        box-shadow: inset 4px 4px 8px #b2bec9, inset -4px -4px 8px #ffffff;
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
                    <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        padding: '28px 32px',
                        background: 'linear-gradient(to top, rgba(0,0,0,0.70) 0%, rgba(0,0,0,0.15) 55%, transparent 100%)',
                        display: 'flex',
                        alignItems: 'flex-end',
                        gap: '16px',
                    }}>
                        {/* University logo on the left panel */}
                        <div style={{
                            width: '56px', height: '56px', borderRadius: '50%',
                            background: 'rgba(255,255,255,0.92)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0, padding: '6px', boxSizing: 'border-box',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
                        }}>
                            <img src="/logo.png" alt="SSSIHL" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        </div>
                        <div>
                            <p style={{ margin: '0 0 4px', color: 'rgba(255,255,255,0.82)', fontSize: '0.78rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Sri Sathya Sai Institute of Higher Learning</p>
                            <h2 style={{ margin: 0, color: '#ffffff', fontSize: '1.4rem', fontWeight: '800', lineHeight: 1.3, letterSpacing: '-0.01em' }}>SSSIHL XLV Annual<br />Convocation 2026</h2>
                        </div>
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
                background: 'none', border: 'none', cursor: 'pointer', padding: '20px 4px', fontSize: '0.9rem', fontWeight: activeNav === id ? '700' : '400',
                color: activeNav === id ? '#1e40af' : '#718096',
                borderBottom: activeNav === id ? '2px solid #1e40af' : '2px solid transparent'
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
        <div style={{ minHeight: '100vh', background: '#dde1e7', fontFamily: "'Inter', system-ui, sans-serif", display: 'flex', flexDirection: 'column' }}>
            <style>{ANIM_STYLES}</style>

            {/* Top Navbar */}
            <header style={{ padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#dde1e7', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 4px 12px #b2bec9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#dde1e7', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '4px 4px 8px #b2bec9, -4px -4px 8px #ffffff', padding: '5px', flexShrink: 0 }}>
                            <img src="/logo.png" alt="SSSIHL" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        </div>
                        <div>
                            <div style={{ fontWeight: '800', fontSize: '0.95rem', letterSpacing: '0.04em', color: '#1e40af', whiteSpace: 'nowrap', lineHeight: 1.2 }}>CONVOCATION ADMIN</div>
                            <div style={{ fontSize: '0.68rem', color: '#4a5568', fontWeight: '600', letterSpacing: '0.03em', lineHeight: 1.2 }}>SSSIHL · XLV Annual Convocation 2026</div>
                        </div>
                    </div>
                    <nav style={{ display: 'flex', gap: '28px' }}>
                        {navBtn('applications', 'Applications')}
                    </nav>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button onClick={fetchData} title="Refresh data"
                        style={{ background: '#dde1e7', border: 'none', cursor: 'pointer', color: '#4a5568', padding: '7px 12px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '5px', boxShadow: '3px 3px 6px #b2bec9, -3px -3px 6px #ffffff', fontSize: '0.72rem', fontWeight: '600', letterSpacing: '0.04em' }}>
                        <span style={{ display: 'inline-flex', animation: isRefreshing ? 'spin 0.8s linear infinite' : 'none' }}><IconRefresh size={14} color="#4a5568" /></span>
                        REFRESH
                    </button>
                    <button onClick={handleExport} title="Export to CSV"
                        style={{ background: '#dde1e7', border: 'none', cursor: 'pointer', color: '#4a5568', padding: '7px 12px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '5px', boxShadow: '3px 3px 6px #b2bec9, -3px -3px 6px #ffffff', fontSize: '0.72rem', fontWeight: '600', letterSpacing: '0.04em' }}>
                        <IconDownload size={14} color="#4a5568" /> EXPORT
                    </button>
                    <button
                        onClick={handleToggleForm}
                        disabled={togglingForm}
                        title={formEnabled ? 'Click to close registration' : 'Click to open registration'}
                        style={{
                            padding: '7px 14px', borderRadius: '10px', fontWeight: '700', fontSize: '0.78rem',
                            cursor: togglingForm ? 'not-allowed' : 'pointer', opacity: togglingForm ? 0.7 : 1,
                            border: `1.5px solid ${formEnabled ? '#15803d' : '#b45309'}`,
                            background: '#dde1e7',
                            color: formEnabled ? '#15803d' : '#b45309',
                            letterSpacing: '0.04em', transition: 'all 0.2s',
                            boxShadow: '3px 3px 6px #b2bec9, -3px -3px 6px #ffffff',
                            display: 'flex', alignItems: 'center', gap: '6px',
                        }}>
                        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: formEnabled ? '#15803d' : '#b45309', flexShrink: 0 }} />
                        {togglingForm ? '…' : `Form: ${formEnabled ? 'Open' : 'Closed'}`}
                    </button>
                    <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#dde1e7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: '700', color: '#1e40af', boxShadow: '3px 3px 6px #b2bec9, -3px -3px 6px #ffffff' }}>
                        {username?.[0]?.toUpperCase() || 'A'}
                    </div>
                    <button onClick={handleLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem', color: '#718096', letterSpacing: '0.04em' }}>LOGOUT</button>
                </div>
            </header>

            <main style={{ flex: 1, padding: '28px 32px', maxWidth: '1400px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>

                {/* ─── APPLICATIONS VIEW ─── */}
                {activeNav === 'applications' && !selectedApp && (
                    <>
                        {/* Stats row */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '28px' }}>
                            <StatCard label="TOTAL"    value={stats?.total ?? 0}                IconComp={IconBarChart}    iconColor="#1e40af" tintColor="#1e40af" />
                            <StatCard label="PENDING"  value={stats?.byStatus?.PENDING ?? 0}    IconComp={IconClipboard}   iconColor="#b45309" tintColor="#b45309" />
                            <StatCard label="APPROVED" value={stats?.byStatus?.APPROVED ?? 0}   IconComp={IconCheckCircle} iconColor="#15803d" tintColor="#15803d" />
                            <StatCard label="REJECTED" value={stats?.byStatus?.REJECTED ?? 0}   IconComp={IconXCircle}     iconColor="#dc2626" tintColor="#dc2626" />
                            <StatCard label="NOTIFIED" value={stats?.byStatus?.DISPATCHED ?? 0} IconComp={IconBell}        iconColor="#6d28d9" tintColor="#6d28d9" />
                        </div>

                        {/* Search + filters + status tabs */}
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
                            <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
                                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#718096', display: 'flex' }}><IconSearch size={15} color="#718096" /></span>
                                <input value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }} placeholder="Quick search applications..."
                                    style={{ width: '100%', padding: '10px 12px 10px 36px', border: 'none', borderRadius: '12px', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box', background: '#dde1e7', color: '#2d3748', boxShadow: 'inset 4px 4px 8px #b2bec9, inset -4px -4px 8px #ffffff' }} />
                            </div>
                            <NeuSelect
                                value={categoryFilter}
                                onChange={v => { setCategoryFilter(v); setProgrammeFilter('ALL'); setCurrentPage(1); }}
                                placeholder="CATEGORIES"
                                options={[
                                    { value: 'ALL', label: 'CATEGORIES' },
                                    ...CATEGORIES.map(c => ({ value: c, label: c }))
                                ]}
                            />
                            {categoryFilter !== 'ALL' && (PROGRAMME_MAP[categoryFilter]?.length > 0) && (
                                <NeuSelect
                                    value={programmeFilter}
                                    onChange={v => { setProgrammeFilter(v); setCurrentPage(1); }}
                                    placeholder="ALL PROGRAMMES"
                                    options={[
                                        { value: 'ALL', label: 'ALL PROGRAMMES' },
                                        ...PROGRAMME_MAP[categoryFilter].map(p => ({ value: p, label: p }))
                                    ]}
                                />
                            )}
                            <NeuSelect
                                value={campusFilter}
                                onChange={v => { setCampusFilter(v); setCurrentPage(1); }}
                                placeholder="CAMPUSES"
                                options={[
                                    { value: 'ALL', label: 'CAMPUSES' },
                                    ...CAMPUSES.map(c => ({ value: c, label: c.replace(' Campus', '') }))
                                ]}
                            />
                            <div style={{ display: 'flex', borderRadius: '12px', overflow: 'hidden', boxShadow: 'inset 4px 4px 8px #b2bec9, inset -4px -4px 8px #ffffff', background: '#dde1e7' }}>
                                {[
                                    { label: 'ALL',      value: 'ALL',      activeColor: '#1e40af' },
                                    { label: 'PENDING',  value: 'PENDING',  activeColor: '#b45309' },
                                    { label: 'APPROVED', value: 'APPROVED', activeColor: '#15803d' },
                                    { label: 'REJECTED', value: 'REJECTED', activeColor: '#dc2626' },
                                    { label: 'ARCHIVED', value: 'ARCHIVED', activeColor: '#4a5568' },
                                ].map(t => (
                                    <button key={t.value} onClick={() => { setStatusFilter(t.value); setCurrentPage(1); }}
                                        style={{
                                            padding: '9px 14px', border: 'none', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '700', letterSpacing: '0.04em', transition: 'all 0.2s',
                                            background: statusFilter === t.value ? '#dde1e7' : 'transparent',
                                            color: statusFilter === t.value ? t.activeColor : '#718096',
                                            boxShadow: statusFilter === t.value ? '3px 3px 6px #b2bec9, -3px -3px 6px #ffffff' : 'none',
                                            borderRadius: statusFilter === t.value ? '10px' : '0',
                                            margin: statusFilter === t.value ? '3px' : '0',
                                        }}>
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Registry table */}
                        <div style={{ borderRadius: '20px', overflow: 'hidden', boxShadow: '12px 12px 24px #a8b4c2, -12px -12px 24px #ffffff', background: '#dde1e7', border: '1px solid rgba(178,190,201,0.25)' }}>
                            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(178,190,201,0.4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#2d3748', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Application Registry</span>
                                <span style={{ fontSize: '0.72rem', fontWeight: '600', color: '#4a5568', letterSpacing: '0.04em' }}>{filteredApps.length} record{filteredApps.length !== 1 ? 's' : ''}</span>
                            </div>

                            {loading ? (
                                <div style={{ padding: '80px', textAlign: 'center', color: '#9ca3af', fontSize: '0.9rem' }}>Loading…</div>
                            ) : pagedApps.length === 0 ? (
                                <div style={{ padding: '80px 20px', textAlign: 'center' }}>
                                    <div style={{ width: '72px', height: '72px', background: '#f3f4f6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}><IconFolder size={32} color="#9ca3af" /></div>
                                    <h3 style={{ margin: '0 0 8px', fontSize: '1.1rem', fontWeight: '700', color: '#111' }}>System Empty</h3>
                                    <p style={{ margin: '0 0 24px', color: '#6b7280', fontSize: '0.9rem' }}>There are currently no records matching your active filter configuration.</p>
                                    <button onClick={() => { setSearchQuery(''); setStatusFilter('ALL'); setCategoryFilter('ALL'); setProgrammeFilter('ALL'); setCampusFilter('ALL'); setCurrentPage(1); }}
                                        style={{ padding: '10px 24px', background: '#dde1e7', color: '#1e40af', border: 'none', borderRadius: '12px', fontWeight: '700', fontSize: '0.82rem', letterSpacing: '0.05em', cursor: 'pointer', boxShadow: '4px 4px 8px #b2bec9, -4px -4px 8px #ffffff' }}>
                                        RESET REGISTRY VIEW
                                    </button>
                                </div>
                            ) : (
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                        <thead>
                                            <tr style={{ background: '#c8d0db' }}>
                                                {['App ID', 'Name', 'Reg No', 'Category', 'Programme', 'Campus', 'Attendance', 'Status', 'Submitted'].map(h => (
                                                    <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontWeight: '800', color: '#1e3a5f', fontSize: '0.72rem', letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody key={listKey}>
                                            {pagedApps.map((app, index) => (
                                                <tr key={app.id} onClick={() => openDetail(app)}
                                                    style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer', animation: 'fadeInUp 300ms ease forwards', animationDelay: `${index * 40}ms`, opacity: 0 }}
                                                    onMouseEnter={e => e.currentTarget.style.background = '#d5dae2'}
                                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                                    <td style={{ padding: '12px 16px' }}>
                                                        <span title={app.id} style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#1e40af', fontWeight: '700', display: 'block', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.id}</span>
                                                    </td>
                                                    <td style={{ padding: '12px 16px', fontWeight: '600', color: '#2d3748' }}>{app.applicant_name}</td>
                                                    <td style={{ padding: '12px 16px', color: '#4a5568', fontFamily: 'monospace', fontSize: '0.82rem' }}>{app.reg_no || '—'}</td>
                                                    <td style={{ padding: '12px 16px', color: '#4a5568' }}>{app.category || '—'}</td>
                                                    <td style={{ padding: '12px 16px', color: '#4a5568', maxWidth: '180px' }} title={app.programme || ''}><span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.35 }}>{app.programme || '—'}</span></td>
                                                    <td style={{ padding: '12px 16px', color: '#4a5568', whiteSpace: 'nowrap' }}>{(app.campus || '—').replace(' Campus', '')}</td>
                                                    <td style={{ padding: '12px 16px', color: '#4a5568', whiteSpace: 'nowrap' }}>{app.attendance_type || '—'}</td>
                                                    <td style={{ padding: '12px 16px' }}><StatusBadge status={app.status} /></td>
                                                    <td style={{ padding: '12px 16px', color: '#64748b', whiteSpace: 'nowrap', fontSize: '0.82rem' }}>{fmtDate(app.created_at)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Table footer */}
                            <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(178,190,201,0.4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#4a5568', letterSpacing: '0.04em' }}>DISPLAYING {filteredApps.length} RECORDS</span>
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
                                <div style={{ borderRadius: '20px', padding: '28px', marginBottom: '20px', background: '#dde1e7', boxShadow: '8px 8px 16px #b2bec9, -8px -8px 16px #ffffff' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: '#2d3748', letterSpacing: '0.02em' }}>APPLICANT INFORMATION</h3>
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
                                                    <p style={{ margin: '0 0 3px', fontSize: '0.7rem', fontWeight: '700', color: '#718096', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</p>
                                                    <p style={{ margin: 0, color: '#2d3748', fontWeight: '500', fontSize: '0.9rem', wordBreak: 'break-word' }}>{value || '—'}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {appDetails?.files && appDetails.files.length > 0 && (
                                    <div style={{ borderRadius: '20px', padding: '24px', background: '#dde1e7', boxShadow: '8px 8px 16px #b2bec9, -8px -8px 16px #ffffff' }}>
                                        <h3 style={{ margin: '0 0 16px', fontSize: '0.75rem', fontWeight: '800', color: '#2d3748', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Documents</h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {appDetails.files.map(f => (
                                                <div key={f.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#dde1e7', borderRadius: '12px', boxShadow: !!f.is_response ? 'inset 3px 3px 6px #b2bec9, inset -3px -3px 6px #ffffff' : '3px 3px 6px #b2bec9, -3px -3px 6px #ffffff' }}>
                                                    <div>
                                                        <span style={{ fontWeight: '600', color: '#111', fontSize: '0.88rem' }}>{f.file_name}</span>
                                                        {!!f.is_response && <span style={{ marginLeft: '8px', fontSize: '0.7rem', color: '#10b981', fontWeight: '800', letterSpacing: '0.04em' }}>RESPONSE</span>}
                                                        {f.uploaded_by && <span style={{ marginLeft: '8px', fontSize: '0.75rem', color: '#9ca3af' }}>by {f.uploaded_by}</span>}
                                                    </div>
                                                    <button onClick={() => window.open(`${API_URL}/convocation-admin/file/${f.id}?token=${encodeURIComponent(token)}`, '_blank')}
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.82rem', color: '#4338ca', fontWeight: '700' }}>View ↗</button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Right sidebar */}
                            <div style={{ position: 'sticky', top: '80px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ borderRadius: '20px', padding: '20px', background: '#dde1e7', boxShadow: '8px 8px 16px #b2bec9, -8px -8px 16px #ffffff' }}>
                                    <p style={{ margin: '0 0 16px', fontSize: '0.7rem', fontWeight: '800', color: '#718096', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Actions</p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {selectedApp.status !== 'APPROVED' && (
                                            <button onClick={() => setConfirmModal({ action: 'approve', label: 'Approve this application?' })} disabled={!!actionLoading}
                                                {...pressProps}
                                                style={{ padding: '11px', background: '#dde1e7', color: '#15803d', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem', letterSpacing: '0.03em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'transform 0.1s ease', boxShadow: '4px 4px 8px #b2bec9, -4px -4px 8px #ffffff' }}>
                                                <IconCheck size={15} color="#15803d" /> APPROVE
                                            </button>
                                        )}
                                        {selectedApp.status !== 'ARCHIVED' && (
                                            <button onClick={() => setConfirmModal({ action: 'archive', label: 'Archive this application? It will be hidden from the main list.' })} disabled={!!actionLoading}
                                                {...pressProps}
                                                style={{ padding: '11px', background: '#dde1e7', color: '#718096', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem', letterSpacing: '0.03em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'transform 0.1s ease', boxShadow: '4px 4px 8px #b2bec9, -4px -4px 8px #ffffff' }}>
                                                <Svg d="M5 8h14M5 8a2 2 0 1 0 0-4h14a2 2 0 1 0 0 4M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8" size={15} color="#718096" /> {actionLoading === 'ARCHIVED' ? 'Archiving…' : 'ARCHIVE'}
                                            </button>
                                        )}
                                        {selectedApp.status === 'ARCHIVED' && (
                                            <button onClick={() => updateStatus('PENDING')} disabled={!!actionLoading}
                                                {...pressProps}
                                                style={{ padding: '11px', background: '#dde1e7', color: '#1e40af', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem', letterSpacing: '0.03em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'transform 0.1s ease', boxShadow: '4px 4px 8px #b2bec9, -4px -4px 8px #ffffff' }}>
                                                {actionLoading === 'PENDING' ? 'Restoring…' : 'RESTORE'}
                                            </button>
                                        )}
                                        {selectedApp.status !== 'REJECTED' && (
                                            <>
                                                <button onClick={() => setShowRejectInput(s => !s)} disabled={!!actionLoading}
                                                    {...pressProps}
                                                    style={{ padding: '11px', background: '#dde1e7', color: '#dc2626', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem', letterSpacing: '0.03em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'transform 0.1s ease', boxShadow: '4px 4px 8px #b2bec9, -4px -4px 8px #ffffff' }}>
                                                    <IconX size={15} color="#dc2626" /> REJECT
                                                </button>
                                                {showRejectInput && (
                                                    <div>
                                                        <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Reason (optional)" rows={3}
                                                            style={{ width: '100%', padding: '8px', border: 'none', borderRadius: '10px', fontSize: '0.85rem', resize: 'vertical', boxSizing: 'border-box', marginBottom: '8px', background: '#dde1e7', color: '#2d3748', outline: 'none', boxShadow: 'inset 3px 3px 6px #b2bec9, inset -3px -3px 6px #ffffff' }} />
                                                        <button onClick={() => updateStatus('REJECTED', rejectReason)} disabled={!!actionLoading}
                                                            style={{ width: '100%', padding: '10px', background: '#dde1e7', color: '#dc2626', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem', boxShadow: '4px 4px 8px #b2bec9, -4px -4px 8px #ffffff' }}>
                                                            {actionLoading === 'REJECTED' ? 'Rejecting…' : 'Confirm Reject'}
                                                        </button>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div style={{ borderRadius: '16px', padding: '16px', background: '#dde1e7', boxShadow: 'inset 4px 4px 8px #b2bec9, inset -4px -4px 8px #ffffff' }}>
                                    <p style={{ margin: '0 0 4px', fontSize: '0.7rem', fontWeight: '700', color: '#718096', letterSpacing: '0.06em' }}>APPLICATION ID</p>
                                    <p style={{ margin: 0, fontFamily: 'monospace', fontSize: '0.82rem', color: '#1e40af', fontWeight: '600', wordBreak: 'break-all' }}>{selectedApp.id}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>


            {/* Confirm modal */}
            {confirmModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
                    <div style={{ background: '#dde1e7', borderRadius: '24px', padding: '28px', maxWidth: '380px', width: '90%', textAlign: 'center', boxShadow: '20px 20px 40px #b2bec9, -20px -20px 40px #ffffff', animation: 'modalIn 200ms ease forwards' }}>
                        <p style={{ fontSize: '1rem', fontWeight: '700', color: '#2d3748', marginBottom: '20px' }}>{confirmModal.label}</p>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            <button onClick={() => setConfirmModal(null)} style={{ padding: '10px 24px', border: 'none', borderRadius: '12px', background: '#dde1e7', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem', color: '#718096', boxShadow: '4px 4px 8px #b2bec9, -4px -4px 8px #ffffff' }}>Cancel</button>
                            <button onClick={() => confirmModal.action === 'notify' ? handleNotify() : confirmModal.action === 'archive' ? updateStatus('ARCHIVED') : updateStatus('APPROVED')}
                                style={{ padding: '10px 24px', background: '#dde1e7', color: '#1e40af', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem', boxShadow: '4px 4px 8px #b2bec9, -4px -4px 8px #ffffff' }}>
                                {actionLoading ? '…' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
