import React, { useState, useEffect } from 'react';
import { LogOut, FileText, Download, Users, Clock, CheckCircle, XCircle, ArrowLeft, RefreshCw } from 'lucide-react';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8787';

// Styles
const styles = {
    page: {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)',
        padding: '24px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif'
    },
    container: {
        maxWidth: '1200px',
        margin: '0 auto'
    },
    card: {
        background: 'rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(20px)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '24px'
    },
    loginCard: {
        background: 'rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(20px)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '40px',
        width: '100%',
        maxWidth: '400px'
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px'
    },
    title: {
        fontSize: '28px',
        fontWeight: 'bold',
        color: '#ffffff',
        margin: 0
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '32px'
    },
    statCard: {
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
    },
    statIcon: {
        padding: '12px',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    statLabel: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: '14px',
        margin: 0
    },
    statValue: {
        color: '#ffffff',
        fontSize: '28px',
        fontWeight: 'bold',
        margin: 0
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse'
    },
    th: {
        textAlign: 'left',
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: '12px',
        fontWeight: '600',
        padding: '16px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
    },
    td: {
        padding: '16px',
        color: '#ffffff',
        fontSize: '14px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
    },
    button: {
        padding: '10px 20px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: '#ffffff',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '14px',
        transition: 'all 0.3s ease'
    },
    logoutButton: {
        padding: '10px 20px',
        background: 'rgba(239, 68, 68, 0.2)',
        color: '#ef4444',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '14px'
    },
    input: {
        width: '100%',
        padding: '14px 16px',
        background: 'rgba(255, 255, 255, 0.08)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '10px',
        color: '#ffffff',
        fontSize: '15px',
        outline: 'none',
        boxSizing: 'border-box'
    },
    label: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: '14px',
        marginBottom: '8px',
        display: 'block'
    },
    badge: {
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '600',
        textTransform: 'uppercase'
    },
    backButton: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        color: 'rgba(255, 255, 255, 0.7)',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontSize: '14px',
        marginBottom: '24px'
    },
    fileRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(255, 255, 255, 0.05)',
        padding: '16px',
        borderRadius: '10px',
        marginBottom: '8px'
    },
    detailGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
    },
    detailCard: {
        background: 'rgba(255, 255, 255, 0.05)',
        padding: '16px',
        borderRadius: '10px'
    },
    detailLabel: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: '12px',
        marginBottom: '4px'
    },
    detailValue: {
        color: '#ffffff',
        fontSize: '14px',
        fontWeight: '500'
    }
};

const getStatusStyle = (status) => {
    const baseStyle = { ...styles.badge };
    switch (status) {
        case 'COMPLETED':
        case 'APPROVED':
            return { ...baseStyle, background: '#10b981', color: '#ffffff' };
        case 'REJECTED':
            return { ...baseStyle, background: '#ef4444', color: '#ffffff' };
        case 'PENDING':
        default:
            return { ...baseStyle, background: '#f59e0b', color: '#ffffff' };
    }
};

export default function AdminPortal() {
    const [token, setToken] = useState(localStorage.getItem('adminToken') || '');
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('adminToken'));
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [loading, setLoading] = useState(false);

    const [stats, setStats] = useState(null);
    const [applications, setApplications] = useState([]);
    const [selectedApp, setSelectedApp] = useState(null);
    const [appDetails, setAppDetails] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        if (isLoggedIn) {
            fetchStats();
            fetchApplications();
        }
    }, [isLoggedIn]);

    // Auto-refresh every 30 seconds when logged in
    useEffect(() => {
        if (!isLoggedIn) return;

        const interval = setInterval(() => {
            fetchStats();
            fetchApplications();
        }, 30000); // 30 seconds

        return () => clearInterval(interval);
    }, [isLoggedIn]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setLoginError('');

        try {
            const response = await fetch(`${API_URL}/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (data.success) {
                localStorage.setItem('adminToken', data.token);
                setToken(data.token);
                setIsLoggedIn(true);
            } else {
                setLoginError(data.error || 'Login failed');
            }
        } catch (err) {
            setLoginError('Connection error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        setToken('');
        setIsLoggedIn(false);
        setApplications([]);
        setStats(null);
    };

    const fetchStats = async () => {
        const currentToken = localStorage.getItem('adminToken');
        if (!currentToken) return;
        try {
            const response = await fetch(`${API_URL}/admin/stats`, {
                headers: { 'Authorization': `Bearer ${currentToken}` }
            });
            if (response.status === 401) {
                handleLogout();
                return;
            }
            if (response.ok) {
                const data = await response.json();
                setStats(data);
                setLastUpdated(new Date());
            }
        } catch (err) {
            console.error('Failed to fetch stats:', err);
        }
    };

    const fetchApplications = async () => {
        const currentToken = localStorage.getItem('adminToken');
        if (!currentToken) return;
        try {
            const response = await fetch(`${API_URL}/admin/applications`, {
                headers: { 'Authorization': `Bearer ${currentToken}` }
            });
            if (response.status === 401) {
                handleLogout();
                return;
            }
            if (response.ok) {
                const data = await response.json();
                setApplications(data);
                setLastUpdated(new Date());
            }
        } catch (err) {
            console.error('Failed to fetch applications:', err);
        }
    };

    const handleManualRefresh = async () => {
        setIsRefreshing(true);
        await Promise.all([fetchStats(), fetchApplications()]);
        setTimeout(() => setIsRefreshing(false), 500);
    };

    const fetchAppDetails = async (id) => {
        try {
            const response = await fetch(`${API_URL}/admin/application/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setAppDetails(data);
                setSelectedApp(id);
            }
        } catch (err) {
            console.error('Failed to fetch app details:', err);
        }
    };

    const downloadFile = (fileId, fileName) => {
        fetch(`${API_URL}/admin/file/${fileId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.blob())
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                window.URL.revokeObjectURL(url);
            });
    };

    const markAsCompleted = async (applicationId) => {
        if (!confirm('Are you sure you want to mark this application as Completed & Dispatched?')) {
            return;
        }

        try {
            const response = await fetch(`${API_URL}/admin/complete`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ applicationId })
            });

            const data = await response.json();

            if (response.ok) {
                alert('Application marked as Completed & Dispatched!');
                // Refresh the application details and list
                fetchAppDetails(applicationId);
                fetchStats();
                fetchApplications();
            } else {
                alert('Error: ' + (data.error || 'Failed to update status'));
            }
        } catch (err) {
            console.error('Failed to mark as completed:', err);
            alert('Failed to update status. Please try again.');
        }
    };

    // Login Screen
    if (!isLoggedIn) {
        return (
            <div style={{ ...styles.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={styles.loginCard}>
                    <h2 style={{ ...styles.title, textAlign: 'center', marginBottom: '32px' }}>Admin Login</h2>

                    <form onSubmit={handleLogin}>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={styles.label}>Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                style={styles.input}
                                placeholder="Enter username"
                                required
                            />
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={styles.label}>Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={styles.input}
                                placeholder="Enter password"
                                required
                            />
                        </div>

                        {loginError && (
                            <p style={{ color: '#ef4444', fontSize: '14px', textAlign: 'center', marginBottom: '16px' }}>{loginError}</p>
                        )}

                        <button type="submit" disabled={loading} style={{ ...styles.button, width: '100%', padding: '14px' }}>
                            {loading ? 'Logging in...' : 'Login'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // Application Details View
    if (selectedApp && appDetails) {
        return (
            <div style={styles.page}>
                <div style={styles.container}>
                    <button onClick={() => { setSelectedApp(null); setAppDetails(null); }} style={styles.backButton}>
                        <ArrowLeft size={18} /> Back to Applications
                    </button>

                    <div style={styles.card}>
                        <h2 style={{ ...styles.title, marginBottom: '24px' }}>Application Details</h2>

                        <div style={styles.detailGrid}>
                            <div style={styles.detailCard}>
                                <p style={styles.detailLabel}>Application ID</p>
                                <p style={styles.detailValue}>{appDetails.application.id}</p>
                            </div>
                            <div style={styles.detailCard}>
                                <p style={styles.detailLabel}>Status</p>
                                <span style={getStatusStyle(appDetails.application.status)}>
                                    {appDetails.application.status}
                                </span>
                            </div>
                            <div style={styles.detailCard}>
                                <p style={styles.detailLabel}>Form Type</p>
                                <p style={styles.detailValue}>{appDetails.application.form_type}</p>
                            </div>
                            <div style={styles.detailCard}>
                                <p style={styles.detailLabel}>Applicant</p>
                                <p style={styles.detailValue}>{appDetails.application.applicant_name}</p>
                            </div>
                            <div style={styles.detailCard}>
                                <p style={styles.detailLabel}>Email</p>
                                <p style={styles.detailValue}>{appDetails.application.student_email}</p>
                            </div>
                            <div style={styles.detailCard}>
                                <p style={styles.detailLabel}>Campus</p>
                                <p style={styles.detailValue}>{appDetails.application.campus}</p>
                            </div>
                            <div style={styles.detailCard}>
                                <p style={styles.detailLabel}>Submitted</p>
                                <p style={styles.detailValue}>{new Date(appDetails.application.created_at).toLocaleString()}</p>
                            </div>
                            <div style={styles.detailCard}>
                                <p style={styles.detailLabel}>Registration No</p>
                                <p style={styles.detailValue}>{appDetails.application.reg_no || 'N/A'}</p>
                            </div>
                        </div>

                        {/* Mark as Completed Button - only show for APPROVED or PENDING status */}
                        {(appDetails.application.status === 'APPROVED' || appDetails.application.status === 'PENDING') && (
                            <div style={{ marginBottom: '24px', padding: '20px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                                    <div>
                                        <h4 style={{ color: '#10b981', margin: 0, marginBottom: '4px' }}>Ready to Complete?</h4>
                                        <p style={{ color: 'rgba(255,255,255,0.6)', margin: 0, fontSize: '14px' }}>Mark this application as completed and dispatched</p>
                                    </div>
                                    <button
                                        onClick={() => markAsCompleted(appDetails.application.id)}
                                        style={{
                                            padding: '12px 24px',
                                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                            color: '#ffffff',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontWeight: '600',
                                            fontSize: '14px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}
                                    >
                                        <CheckCircle size={18} /> Mark as Completed & Dispatched
                                    </button>
                                </div>
                            </div>
                        )}

                        <h3 style={{ color: '#ffffff', marginBottom: '16px' }}>Attached Files</h3>
                        {appDetails.files && appDetails.files.length > 0 ? (
                            <div>
                                {appDetails.files.map((file) => (
                                    <div key={file.id} style={styles.fileRow}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <FileText style={{ color: '#a78bfa' }} size={20} />
                                            <div>
                                                <p style={{ color: '#ffffff', margin: 0, fontWeight: '500' }}>{file.file_name}</p>
                                                <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0, fontSize: '12px' }}>
                                                    {file.file_type} • {(file.file_size / 1024).toFixed(1)} KB
                                                </p>
                                            </div>
                                        </div>
                                        <button onClick={() => downloadFile(file.id, file.file_name)} style={styles.button}>
                                            <Download size={16} style={{ marginRight: '6px' }} /> Download
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ color: 'rgba(255,255,255,0.5)' }}>No files attached</p>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Dashboard View
    return (
        <>
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
            <div style={styles.page}>
                <div style={styles.container}>
                {/* Header */}
                <div style={styles.header}>
                    <h1 style={styles.title}>Admin Dashboard</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <button
                            onClick={handleManualRefresh}
                            disabled={isRefreshing}
                            style={{
                                padding: '10px 20px',
                                background: 'rgba(59, 130, 246, 0.2)',
                                color: '#3b82f6',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: isRefreshing ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '14px',
                                opacity: isRefreshing ? 0.6 : 1
                            }}
                        >
                            <RefreshCw size={18} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
                            {isRefreshing ? 'Refreshing...' : 'Refresh'}
                        </button>
                        {lastUpdated && (
                            <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '12px' }}>
                                Last updated: {lastUpdated.toLocaleTimeString()}
                            </span>
                        )}
                        <button onClick={handleLogout} style={styles.logoutButton}>
                            <LogOut size={18} /> Logout
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                {stats && (
                    <div style={styles.statsGrid}>
                        <div style={styles.statCard}>
                            <div style={{ ...styles.statIcon, background: 'rgba(59, 130, 246, 0.2)' }}>
                                <Users style={{ color: '#3b82f6' }} size={24} />
                            </div>
                            <div>
                                <p style={styles.statLabel}>Total Applications</p>
                                <p style={styles.statValue}>{stats.total}</p>
                            </div>
                        </div>

                        <div style={styles.statCard}>
                            <div style={{ ...styles.statIcon, background: 'rgba(245, 158, 11, 0.2)' }}>
                                <Clock style={{ color: '#f59e0b' }} size={24} />
                            </div>
                            <div>
                                <p style={styles.statLabel}>Pending</p>
                                <p style={styles.statValue}>{stats.pending}</p>
                            </div>
                        </div>

                        <div style={styles.statCard}>
                            <div style={{ ...styles.statIcon, background: 'rgba(16, 185, 129, 0.2)' }}>
                                <CheckCircle style={{ color: '#10b981' }} size={24} />
                            </div>
                            <div>
                                <p style={styles.statLabel}>Approved</p>
                                <p style={styles.statValue}>{stats.approved}</p>
                            </div>
                        </div>

                        <div style={styles.statCard}>
                            <div style={{ ...styles.statIcon, background: 'rgba(239, 68, 68, 0.2)' }}>
                                <XCircle style={{ color: '#ef4444' }} size={24} />
                            </div>
                            <div>
                                <p style={styles.statLabel}>Rejected</p>
                                <p style={styles.statValue}>{stats.rejected}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Applications Table */}
                <div style={styles.card}>
                    <h2 style={{ color: '#ffffff', marginBottom: '20px' }}>Recent Applications</h2>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>ID</th>
                                    <th style={styles.th}>Form Type</th>
                                    <th style={styles.th}>Applicant</th>
                                    <th style={styles.th}>Campus</th>
                                    <th style={styles.th}>Status</th>
                                    <th style={styles.th}>Date</th>
                                    <th style={styles.th}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {applications.map((app) => (
                                    <tr key={app.id} style={{ cursor: 'pointer' }}>
                                        <td style={{ ...styles.td, fontFamily: 'monospace', fontSize: '12px' }}>{app.id}</td>
                                        <td style={{ ...styles.td, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.form_type}</td>
                                        <td style={styles.td}>{app.applicant_name}</td>
                                        <td style={styles.td}>{app.campus}</td>
                                        <td style={styles.td}>
                                            <span style={getStatusStyle(app.status)}>{app.status}</span>
                                        </td>
                                        <td style={styles.td}>{new Date(app.created_at).toLocaleDateString()}</td>
                                        <td style={styles.td}>
                                            <button onClick={() => fetchAppDetails(app.id)} style={styles.button}>
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {applications.length === 0 && (
                            <p style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.5)' }}>
                                No applications found
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
        </>
    );
}
