import React, { useState, useEffect } from 'react';
import { LogOut, FileText, Download, Users, Clock, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8787';

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

    useEffect(() => {
        if (isLoggedIn) {
            fetchStats();
            fetchApplications();
        }
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
        try {
            const response = await fetch(`${API_URL}/admin/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setStats(data);
            }
        } catch (err) {
            console.error('Failed to fetch stats:', err);
        }
    };

    const fetchApplications = async () => {
        try {
            const response = await fetch(`${API_URL}/admin/applications`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setApplications(data);
            }
        } catch (err) {
            console.error('Failed to fetch applications:', err);
        }
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
        const link = document.createElement('a');
        link.href = `${API_URL}/admin/file/${fileId}`;
        link.download = fileName;

        // Add auth header via fetch and create blob URL
        fetch(`${API_URL}/admin/file/${fileId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.blob())
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                a.click();
                window.URL.revokeObjectURL(url);
            });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'COMPLETED':
            case 'APPROVED':
                return 'bg-green-500';
            case 'REJECTED':
                return 'bg-red-500';
            case 'PENDING':
            default:
                return 'bg-yellow-500';
        }
    };

    if (!isLoggedIn) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md border border-white/20 shadow-2xl">
                    <h2 className="text-2xl font-bold text-white text-center mb-6">Admin Login</h2>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="text-white/80 text-sm block mb-1">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="Enter username"
                                required
                            />
                        </div>

                        <div>
                            <label className="text-white/80 text-sm block mb-1">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="Enter password"
                                required
                            />
                        </div>

                        {loginError && (
                            <p className="text-red-400 text-sm text-center">{loginError}</p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Logging in...' : 'Login'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    if (selectedApp && appDetails) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
                <div className="max-w-4xl mx-auto">
                    <button
                        onClick={() => { setSelectedApp(null); setAppDetails(null); }}
                        className="flex items-center gap-2 text-white/80 hover:text-white mb-6"
                    >
                        <ArrowLeft size={20} /> Back to Applications
                    </button>

                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                        <h2 className="text-2xl font-bold text-white mb-4">
                            Application Details
                        </h2>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-white/5 p-4 rounded-lg">
                                <p className="text-white/60 text-sm">Application ID</p>
                                <p className="text-white font-semibold">{appDetails.application.id}</p>
                            </div>
                            <div className="bg-white/5 p-4 rounded-lg">
                                <p className="text-white/60 text-sm">Status</p>
                                <span className={`px-3 py-1 rounded-full text-white text-sm ${getStatusColor(appDetails.application.status)}`}>
                                    {appDetails.application.status}
                                </span>
                            </div>
                            <div className="bg-white/5 p-4 rounded-lg">
                                <p className="text-white/60 text-sm">Form Type</p>
                                <p className="text-white">{appDetails.application.form_type}</p>
                            </div>
                            <div className="bg-white/5 p-4 rounded-lg">
                                <p className="text-white/60 text-sm">Applicant</p>
                                <p className="text-white">{appDetails.application.applicant_name}</p>
                            </div>
                            <div className="bg-white/5 p-4 rounded-lg">
                                <p className="text-white/60 text-sm">Email</p>
                                <p className="text-white">{appDetails.application.student_email}</p>
                            </div>
                            <div className="bg-white/5 p-4 rounded-lg">
                                <p className="text-white/60 text-sm">Campus</p>
                                <p className="text-white">{appDetails.application.campus}</p>
                            </div>
                            <div className="bg-white/5 p-4 rounded-lg">
                                <p className="text-white/60 text-sm">Submitted</p>
                                <p className="text-white">{new Date(appDetails.application.created_at).toLocaleString()}</p>
                            </div>
                            <div className="bg-white/5 p-4 rounded-lg">
                                <p className="text-white/60 text-sm">Registration No</p>
                                <p className="text-white">{appDetails.application.reg_no || 'N/A'}</p>
                            </div>
                        </div>

                        <h3 className="text-xl font-semibold text-white mb-4">Attached Files</h3>
                        {appDetails.files && appDetails.files.length > 0 ? (
                            <div className="space-y-2">
                                {appDetails.files.map((file) => (
                                    <div
                                        key={file.id}
                                        className="flex items-center justify-between bg-white/5 p-4 rounded-lg"
                                    >
                                        <div className="flex items-center gap-3">
                                            <FileText className="text-purple-400" size={20} />
                                            <div>
                                                <p className="text-white font-medium">{file.file_name}</p>
                                                <p className="text-white/60 text-sm">
                                                    {file.file_type} • {(file.file_size / 1024).toFixed(1)} KB
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => downloadFile(file.id, file.file_name)}
                                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                                        >
                                            <Download size={16} /> Download
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-white/60">No files attached</p>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                    >
                        <LogOut size={18} /> Logout
                    </button>
                </div>

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-500/20 rounded-lg">
                                    <Users className="text-blue-400" size={24} />
                                </div>
                                <div>
                                    <p className="text-white/60 text-sm">Total Applications</p>
                                    <p className="text-2xl font-bold text-white">{stats.total}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-yellow-500/20 rounded-lg">
                                    <Clock className="text-yellow-400" size={24} />
                                </div>
                                <div>
                                    <p className="text-white/60 text-sm">Pending</p>
                                    <p className="text-2xl font-bold text-white">{stats.pending}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-green-500/20 rounded-lg">
                                    <CheckCircle className="text-green-400" size={24} />
                                </div>
                                <div>
                                    <p className="text-white/60 text-sm">Approved</p>
                                    <p className="text-2xl font-bold text-white">{stats.approved}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-red-500/20 rounded-lg">
                                    <XCircle className="text-red-400" size={24} />
                                </div>
                                <div>
                                    <p className="text-white/60 text-sm">Rejected</p>
                                    <p className="text-2xl font-bold text-white">{stats.rejected}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Applications Table */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden">
                    <div className="p-6 border-b border-white/10">
                        <h2 className="text-xl font-semibold text-white">Recent Applications</h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-white/5">
                                    <th className="text-left text-white/60 text-sm font-medium px-6 py-4">ID</th>
                                    <th className="text-left text-white/60 text-sm font-medium px-6 py-4">Form Type</th>
                                    <th className="text-left text-white/60 text-sm font-medium px-6 py-4">Applicant</th>
                                    <th className="text-left text-white/60 text-sm font-medium px-6 py-4">Campus</th>
                                    <th className="text-left text-white/60 text-sm font-medium px-6 py-4">Status</th>
                                    <th className="text-left text-white/60 text-sm font-medium px-6 py-4">Date</th>
                                    <th className="text-left text-white/60 text-sm font-medium px-6 py-4">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {applications.map((app) => (
                                    <tr key={app.id} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 text-white font-mono text-sm">{app.id}</td>
                                        <td className="px-6 py-4 text-white text-sm max-w-xs truncate">{app.form_type}</td>
                                        <td className="px-6 py-4 text-white text-sm">{app.applicant_name}</td>
                                        <td className="px-6 py-4 text-white text-sm">{app.campus}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-white text-xs ${getStatusColor(app.status)}`}>
                                                {app.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-white/60 text-sm">
                                            {new Date(app.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => fetchAppDetails(app.id)}
                                                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors"
                                            >
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {applications.length === 0 && (
                            <div className="text-center py-12 text-white/60">
                                No applications found
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
