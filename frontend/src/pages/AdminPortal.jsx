import React, { useState, useEffect, useRef } from 'react';
import DOMPurify from 'dompurify';
import * as XLSX from 'xlsx';
import { LogOut, FileText, Download, Users, Clock, CheckCircle, XCircle, ArrowLeft, RefreshCw, Upload, Trash2, Archive, X, AlertTriangle, Search, Eye } from 'lucide-react';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8787';

const getTabTokenKey = () => {
    let tabId = sessionStorage.getItem('adminTabId');
    if (!tabId) {
        tabId = Math.random().toString(36).substring(2);
        sessionStorage.setItem('adminTabId', tabId);
    }
    return `adminToken_${tabId}`;
};
const TOKEN_KEY = getTabTokenKey();

const escapeHtml = (str) => String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#x27;');

// Styles
const styles = {
    page: {
        minHeight: '100vh',
        background: '#f1f5f9',
        backgroundImage: 'radial-gradient(at 0% 0%, rgba(37, 99, 235, 0.05) 0, transparent 50%), radial-gradient(at 50% 0%, rgba(124, 58, 237, 0.03) 0, transparent 50%), radial-gradient(at 100% 0%, rgba(37, 99, 235, 0.05) 0, transparent 50%)',
        padding: '24px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif'
    },
    container: {
        maxWidth: '1200px',
        margin: '0 auto'
    },
    card: {
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(20px)',
        borderRadius: '16px',
        border: '1px solid rgba(15, 23, 42, 0.08)',
        padding: '24px',
        boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.05)'
    },
    loginCard: {
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(20px)',
        borderRadius: '16px',
        border: '1px solid rgba(15, 23, 42, 0.08)',
        padding: '40px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.05)'
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
        color: '#0f172a',
        margin: 0
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '32px'
    },
    statCard: {
        background: 'rgba(255, 255, 255, 0.6)',
        backdropFilter: 'blur(10px)',
        borderRadius: '12px',
        border: '1px solid rgba(15, 23, 42, 0.08)',
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
        color: '#64748b',
        fontSize: '14px',
        margin: 0
    },
    statValue: {
        color: '#0f172a',
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
        color: '#64748b',
        fontSize: '12px',
        fontWeight: '600',
        padding: '16px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        borderBottom: '1px solid rgba(15, 23, 42, 0.08)'
    },
    td: {
        padding: '16px',
        color: '#0f172a',
        fontSize: '14px',
        borderBottom: '1px solid rgba(15, 23, 42, 0.05)'
    },
    button: {
        padding: '8px 16px',
        background: 'white',
        color: '#2563eb',
        border: '1.5px solid #e0e7ff',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: '500',
        fontSize: '13px',
        transition: 'all 0.2s ease'
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
        background: 'white',
        border: '1px solid #cbd5e1',
        borderRadius: '10px',
        color: '#0f172a',
        fontSize: '15px',
        outline: 'none',
        boxSizing: 'border-box'
    },
    label: {
        color: '#64748b',
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
        color: '#64748b',
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
        background: 'rgba(15, 23, 42, 0.03)',
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
        background: 'rgba(15, 23, 42, 0.03)',
        padding: '16px',
        borderRadius: '10px'
    },
    detailLabel: {
        color: '#64748b',
        fontSize: '12px',
        marginBottom: '4px'
    },
    detailValue: {
        color: '#0f172a',
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
        case 'DISPATCHED':
            return { ...baseStyle, background: '#0ea5e9', color: '#ffffff' };
        case 'REJECTED':
            return { ...baseStyle, background: '#ef4444', color: '#ffffff' };
        case 'DIRECTOR_COMMENTED':
            return { ...baseStyle, background: '#7c3aed', color: '#ffffff' };
        case 'AWAITING_DIRECTOR':
            return { ...baseStyle, background: '#8b5cf6', color: '#ffffff' };
        case 'DIRECTOR_APPROVED':
            return { ...baseStyle, background: '#0284c7', color: '#ffffff' };
        case 'PENDING':
        default:
            return { ...baseStyle, background: '#f59e0b', color: '#ffffff' };
    }
};

const getAuditActionStyle = (action) => {
    const base = { fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', whiteSpace: 'nowrap' };
    const colors = {
        APPROVED: { background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' },
        COMPLETED: { background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' },
        REJECTED: { background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' },
        DELETED: { background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' },
        DISPATCHED: { background: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd' },
        HOLD_RESOLVED: { background: '#faf5ff', color: '#7c3aed', border: '1px solid #e9d5ff' },
        RESPONSE_UPLOADED: { background: '#eef2ff', color: '#4338ca', border: '1px solid #c7d2fe' },
        FORM_TOGGLED: { background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0' },
        LOGIN: { background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0' },
    };
    return { ...base, ...(colors[action] || colors.LOGIN) };
};

export default function AdminPortal() {
    const [token, setToken] = useState(localStorage.getItem(TOKEN_KEY) || '');
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem(TOKEN_KEY));
    const [adminRole, setAdminRole] = useState(localStorage.getItem('adminRole') || 'admin');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const [stats, setStats] = useState(null);
    const [applications, setApplications] = useState([]);
    const [selectedApp, setSelectedApp] = useState(null);
    const [appDetails, setAppDetails] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState(null);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [toast, setToast] = useState(null);
    const [confirmModal, setConfirmModal] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editFields, setEditFields] = useState({});
    const [editSaving, setEditSaving] = useState(false);
    const [showDispatchModal, setShowDispatchModal] = useState(false);
    const [dispatchAppId, setDispatchAppId] = useState(null);
    const [dispatchFormType, setDispatchFormType] = useState(null);
    const dispatchTrackingRef = useRef(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [campusFilter, setCampusFilter] = useState('ALL');
    const [formSettings, setFormSettings] = useState(null);
    const [formsDrawerOpen, setFormsDrawerOpen] = useState(false);
    const [showTestEmailModal, setShowTestEmailModal] = useState(false);
    const [testEmailForm, setTestEmailForm] = useState({ testEmail: '', campus: 'Prasanthi Nilayam Campus', formType: 'Application for Supplementary Examinations Registration' });
    const [testEmailStatus, setTestEmailStatus] = useState(null);
    const [showCampusExamTestModal, setShowCampusExamTestModal] = useState(false);
    const [campusExamTestForm, setCampusExamTestForm] = useState({ testEmail: '', campus: 'Prasanthi Nilayam Campus', formType: 'Application for Supplementary Examinations Registration', emailVariant: 'campus_exam' });
    const [campusExamTestStatus, setCampusExamTestStatus] = useState(null);
    const urgencySort = true;

    const [pdfViewerUrl, setPdfViewerUrl] = useState(null);
    const [pdfViewerName, setPdfViewerName] = useState('');

    const [showStudentLookup, setShowStudentLookup] = useState(false);
    const [studentLookupQuery, setStudentLookupQuery] = useState('');

    const [showExportModal, setShowExportModal] = useState(false);
    const [exportTab, setExportTab] = useState('app'); // 'app' | 'formtype'
    const [exportSearch, setExportSearch] = useState('');
    const [exportingId, setExportingId] = useState(null);
    const [exportingFormType, setExportingFormType] = useState(null);

    const [showAuditLog, setShowAuditLog] = useState(false);
    const [auditEntries, setAuditEntries] = useState([]);
    const [auditActionFilter, setAuditActionFilter] = useState('ALL');
    const [auditLoading, setAuditLoading] = useState(false);
    const [showArchivedPanel, setShowArchivedPanel] = useState(false);
    const [archivedApplications, setArchivedApplications] = useState([]);
    const [archivedLoading, setArchivedLoading] = useState(false);

    const CAMPUS_COLORS = {
        'Prasanthi Nilayam Campus': '#6366f1',
        'Anantapur Campus': '#10b981',
        'Brindavan Campus': '#f59e0b',
        'Nandigiri Campus': '#ec4899',
    };
    const getCampusColor = (campus) => CAMPUS_COLORS[campus] || '#94a3b8';

    const FORM_SHORT = {
        'Application for Duplicate Grade Card': 'Duplicate Grade Card',
        'Application for CGPA to Percentage Conversion': 'CGPA Conversion',
        'Application for Supplementary Examinations Registration': 'Supplementary Exam',
        'Application for Duplicate Degree Certificate': 'Duplicate Degree',
        'Application for Registration of Student Name change in the Institute Records': 'Name Change',
        'Application for Repeating Examinations Registration (CIE and ESE)': 'Repeat Paper',
        'Application for Re-Totalling of Marks': 'Re-Totalling',
        'Application for On-Request Degree Certificate': 'On-Request Degree',
        'Application for Migration Certificate': 'Migration',
    };
    const getShortLabel = (ft) => FORM_SHORT[ft] || ft;

    const getTimeAgo = (dateStr) => {
        if (!dateStr) return '';
        const ms = Date.now() - new Date(dateStr.endsWith('Z') ? dateStr : dateStr + 'Z').getTime();
        const min = Math.floor(ms / 60000);
        if (min < 2) return 'just now';
        if (min < 60) return `${min} min ago`;
        const hr = Math.floor(min / 60);
        if (hr < 24) return `${hr} hr ago`;
        const d = Math.floor(hr / 24);
        return `${d} day${d !== 1 ? 's' : ''} ago`;
    };

    const getUrgencyScore = (app) => {
        if (app.status === 'PENDING') {
            const ageDays = (Date.now() - new Date((app.created_at || '') + 'Z').getTime()) / 86400000;
            return ageDays >= 3 ? 0 : 1;
        }
        if (app.status === 'REJECTED') return 3;
        return 2;
    };

    const getAgeBadge = (app) => {
        if (!['PENDING', 'AWAITING_DIRECTOR'].includes(app.status)) return null;
        const ageDays = Math.floor((Date.now() - new Date(app.created_at + 'Z').getTime()) / 86400000);
        if (ageDays >= 3) return { label: `${ageDays}d overdue`, bg: '#fef2f2', color: '#dc2626', border: '#fecaca' };
        if (ageDays >= 1) return { label: `${ageDays}d`, bg: '#fffbeb', color: '#d97706', border: '#fde68a' };
        return null;
    };

    const sortByUrgency = (apps) => [...apps].sort((a, b) => {
        const sd = getUrgencyScore(a) - getUrgencyScore(b);
        if (sd !== 0) return sd;
        return new Date((b.created_at || '') + 'Z') - new Date((a.created_at || '') + 'Z');
    });

    const getSparklineData = (apps) => Array.from({ length: 7 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (6 - i));
        const ds = d.toISOString().split('T')[0];
        return apps.filter(a => (a.created_at || '').startsWith(ds)).length;
    });

    const doExportCSV = async (appId) => {
        setExportingId(appId);
        try {
            const res = await fetch(`${API_URL}/admin/export-application/${appId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) { showToast('Failed to fetch application data', 'error'); return; }
            const data = await res.json();

            // Merge application fields + form-specific fields into one flat object
            const flat = { ...data.application, ...data.formData };
            delete flat.file_data; // never export raw base64

            const escape = (v) => {
                if (v === null || v === undefined) return '';
                const s = String(v).replace(/"/g, '""');
                return /[,"\n]/.test(s) ? `"${s}"` : s;
            };

            const headers = Object.keys(flat);
            const values = Object.values(flat);
            const csv = [headers.map(escape).join(','), values.map(escape).join(',')].join('\n');
            const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' }));
            const a = document.createElement('a');
            a.href = url; a.download = `${appId}_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a); a.click(); document.body.removeChild(a);
            URL.revokeObjectURL(url);
            setShowExportModal(false);
            setExportSearch('');
            showToast('XLSX exported successfully!', 'success');
        } catch (err) {
            showToast('Export failed. Please try again.', 'error');
        } finally {
            setExportingId(null);
        }
    };

    const doExportByFormType = async (formType) => {
        setExportingFormType(formType);
        try {
            const res = await fetch(`${API_URL}/admin/export-form-type?formType=${encodeURIComponent(formType)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) { showToast('Failed to fetch data', 'error'); return; }
            const { rows } = await res.json();
            if (!rows || rows.length === 0) { showToast('No applications found for this form type', 'error'); return; }

            // Build XLSX rows: Registration No | Full Name | Course Code
            // Each paper code gets its own row; reg no + name only on the first row per student
            const sheetRows = [['Registration No', 'Full Name', 'Course Code']];
            for (const row of rows) {
                const regNo = row.Registration_Number || row.reg_no || '';
                const name = row.student_name || row.applicant_name || '';
                const rawCodes = (row.paper_codes || '').trim();
                const codes = rawCodes
                    ? rawCodes.split(/[,\n]+/).map(c => c.trim()).filter(Boolean)
                    : [''];
                codes.forEach((code, i) => {
                    sheetRows.push([i === 0 ? regNo : '', i === 0 ? name : '', code]);
                });
            }

            const ws = XLSX.utils.aoa_to_sheet(sheetRows);
            // Column widths: A=20, B=30, C=20
            ws['!cols'] = [{ wch: 20 }, { wch: 30 }, { wch: 20 }];
            const wb = XLSX.utils.book_new();
            const slug = formType.replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_').toLowerCase();
            XLSX.utils.book_append_sheet(wb, ws, 'Applications');
            XLSX.writeFile(wb, `${slug}_${new Date().toISOString().split('T')[0]}.xlsx`);

            setShowExportModal(false);
            showToast(`Exported ${rows.length} application${rows.length !== 1 ? 's' : ''} successfully!`, 'success');
        } catch (err) {
            showToast('Export failed. Please try again.', 'error');
        } finally {
            setExportingFormType(null);
        }
    };

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    useEffect(() => {
        if (isLoggedIn) {
            fetchStats();
            fetchApplications();
            fetchFormSettings();
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

    useEffect(() => { setCurrentPage(1); }, [searchQuery]);
    useEffect(() => { setCurrentPage(1); }, [statusFilter]);
    useEffect(() => { setCurrentPage(1); }, [campusFilter]);

    useEffect(() => {
        if (showAuditLog) fetchAuditLog(auditActionFilter === 'ALL' ? null : auditActionFilter);
    }, [showAuditLog, auditActionFilter]);

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
                localStorage.setItem(TOKEN_KEY, data.token);
                localStorage.setItem('adminRole', data.role || 'admin');
                setToken(data.token);
                setAdminRole(data.role || 'admin');
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
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem('adminRole');
        setToken('');
        setAdminRole('admin');
        setIsLoggedIn(false);
        setApplications([]);
        setStats(null);
    };

    const fetchStats = async () => {
        const currentToken = localStorage.getItem(TOKEN_KEY);
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
        const currentToken = localStorage.getItem(TOKEN_KEY);
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

    const fetchFormSettings = async () => {
        try {
            const response = await fetch(`${API_URL}/form-settings`);
            if (response.ok) {
                const data = await response.json();
                setFormSettings(data);
            }
        } catch (err) {
            console.error('Failed to fetch form settings:', err);
        }
    };

    const fetchAuditLog = async (actionFilter = null) => {
        setAuditLoading(true);
        try {
            const currentToken = localStorage.getItem(TOKEN_KEY);
            const qs = actionFilter && actionFilter !== 'ALL' ? `?action=${actionFilter}` : '';
            const res = await fetch(`${API_URL}/admin/audit-log${qs}`, {
                headers: { 'Authorization': `Bearer ${currentToken}` }
            });
            if (res.ok) setAuditEntries(await res.json());
        } catch (e) {
            console.error('Failed to fetch audit log:', e);
        } finally {
            setAuditLoading(false);
        }
    };

    const fetchArchivedApplications = async () => {
        setArchivedLoading(true);
        try {
            const res = await fetch(`${API_URL}/admin/archived`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem(TOKEN_KEY)}` }
            });
            if (res.ok) {
                const data = await res.json();
                setArchivedApplications(data.archived || []);
            }
        } catch (e) {
            console.error('Failed to fetch archived applications:', e);
        } finally {
            setArchivedLoading(false);
        }
    };

    const unarchiveApplication = async (applicationId) => {
        try {
            const res = await fetch(`${API_URL}/admin/unarchive/${applicationId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem(TOKEN_KEY)}` }
            });
            const data = await res.json();
            if (res.ok) {
                showToast(`Application ${applicationId} restored successfully!`, 'success');
                fetchArchivedApplications();
                fetchApplications();
                fetchStats();
            } else {
                showToast('Error: ' + (data.error || 'Failed to restore'), 'error');
            }
        } catch (e) {
            showToast('Failed to restore application. Please try again.', 'error');
        }
    };

    const toggleForm = async (formId, label) => {
        const currentToken = localStorage.getItem(TOKEN_KEY);
        const currentActive = formSettings?.[formId] ?? true;
        try {
            const response = await fetch(`${API_URL}/admin/form-settings`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${currentToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ formId, isActive: !currentActive })
            });
            const data = await response.json();
            if (response.ok) {
                setFormSettings(prev => ({ ...prev, [formId]: !currentActive }));
                showToast(`${label} form ${!currentActive ? 'activated' : 'deactivated'} successfully.`, 'success');
            } else {
                showToast('Error: ' + (data.error || 'Failed to update'), 'error');
            }
        } catch {
            showToast('Failed to update. Please try again.', 'error');
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

    const generatePDF = (appData, details) => {
        const app = appData;
        const fd = details.formData || {};
        const files = details.files || [];
        const responseDocuments = details.responseDocuments || [];
        const stageTimestamps = details.stageTimestamps || {};

        const fmtDate = (ts) => {
            if (!ts) return '';
            const d = new Date(ts);
            return `${String(d.getDate()).padStart(2,'0')}-${String(d.getMonth()+1).padStart(2,'0')}-${d.getFullYear()}`;
        };

        // ── SUPPLEMENTARY EXAM: OFFICIAL PRINTED FORM LAYOUT ──────────────────
        if (app.form_type === 'Application for Supplementary Examinations Registration') {
            const currentYear = new Date().getFullYear();
            const fullAddress = [fd.address_line1, fd.address_line2].filter(Boolean).join(', ');
            const submissionDate = fmtDate(app.created_at ? app.created_at + (app.created_at.includes('Z') ? '' : 'Z') : null)
                || (app.created_at ? new Date(app.created_at).toLocaleDateString('en-IN') : '');
            const codes = (fd.paper_codes || '').split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
            const titles = (fd.paper_titles || '').split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
            const numRows = codes.length || 1;
            const courseRows = Array.from({ length: numRows }, (_, i) =>
                `<tr>
                  <td style="text-align:center">${i + 1}.</td>
                  <td>${escapeHtml(fd.Semester || '')}</td>
                  <td>${escapeHtml(codes[i] || '')}</td>
                  <td>${escapeHtml(titles[i] || '')}</td>
                </tr>`
            ).join('');

            const suppHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Supplementary Exam Application – ${escapeHtml(app.id)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Times New Roman', Times, serif; font-size: 12px; color: #000; padding: 28px; }
    .header { text-align: center; margin-bottom: 8px; display: flex; align-items: center; justify-content: center; gap: 16px; }
    .header-text { text-align: center; }
    .institute-name { font-size: 15px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; }
    .deemed { font-size: 11px; margin-top: 2px; }
    .address { font-size: 11px; margin-top: 4px; }
    hr { border: none; border-top: 1.5px solid #000; margin: 10px 0 14px 0; }
    .form-title { text-align: center; font-weight: bold; font-size: 13px; text-transform: uppercase; margin-bottom: 4px; }
    .form-subtitle { text-align: center; font-size: 12px; margin-bottom: 3px; }
    .section-label { font-weight: bold; padding: 4px 8px; border: 1px solid #000; border-bottom: none; background: #fff; margin-top: 14px; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; }
    td, th { border: 1px solid #000; padding: 5px 8px; font-size: 11px; vertical-align: top; }
    th { font-weight: bold; text-align: center; background: #fff; }
    .num-col { width: 28px; text-align: center; }
    .label-col { width: 44%; }
    .decl-note { font-size: 10px; font-style: italic; margin-top: 3px; }
    .course-note { font-size: 11px; margin: 12px 0 5px 0; }
    @media print { body { padding: 15px; } }
  </style>
</head>
<body>
  <div class="header">
    <img src="https://sssihl-student-service.pages.dev/logo.png" alt="SSSIHL Logo" style="height:60px;width:auto;" />
    <div class="header-text">
      <div class="institute-name">Sri Sathya Sai Institute of Higher Learning</div>
      <div class="deemed">(Deemed to be University)</div>
      <div class="address">Vidyagiri, Prasanthi Nilayam – 515 134, Sri Sathya Sai Dist., A.P.</div>
    </div>
  </div>
  <hr>

  <div class="form-title">Application for Supplementary Examinations Registration</div>
  <div class="form-subtitle">JUNE / DECEMBER &nbsp; ${currentYear}</div>
  <div class="form-subtitle">(Application is forwarded through Director of Campus)</div>

  <div class="section-label">Applicant Information:</div>
  <table>
    <tbody>
      <tr>
        <td class="num-col">1</td>
        <td class="label-col">Name of Candidate<br><span style="font-size:10px;font-style:italic">(as printed on the Original Grade Card)</span></td>
        <td>${escapeHtml(app.applicant_name || '')}</td>
      </tr>
      <tr>
        <td class="num-col">2</td>
        <td class="label-col">Full Address</td>
        <td>${escapeHtml(fullAddress)}</td>
      </tr>
      <tr>
        <td class="num-col">3</td>
        <td class="label-col">City</td>
        <td>${escapeHtml(fd.city || '')}</td>
      </tr>
      <tr>
        <td class="num-col">4</td>
        <td class="label-col">State / Province</td>
        <td>${escapeHtml(fd.state_province || '')}</td>
      </tr>
      <tr>
        <td class="num-col">5</td>
        <td class="label-col">Country</td>
        <td>${escapeHtml(fd.country || '')}</td>
      </tr>
      <tr>
        <td class="num-col">6</td>
        <td class="label-col">Postal Code</td>
        <td>${escapeHtml(fd.postal_code || '')}</td>
      </tr>
      <tr>
        <td class="num-col">7</td>
        <td class="label-col">Mobile Number</td>
        <td>${escapeHtml(fd.Mobile_Number || '')}</td>
      </tr>
      <tr>
        <td class="num-col">8</td>
        <td class="label-col">E-mail ID</td>
        <td>${escapeHtml(app.student_email || '')}</td>
      </tr>
      <tr>
        <td class="num-col">9</td>
        <td class="label-col">Declaration</td>
        <td>
          ${escapeHtml(fd.declaration || '')}
          <div class="decl-note">(If on medical Grounds, find it difficult to take the examination, I will duly inform the Director of the Campus and the Controller of Examinations in advance, so that my candidature for the next examination may not stand forfeited.)</div>
        </td>
      </tr>
      <tr>
        <td class="num-col">10</td>
        <td class="label-col">Date of Submission</td>
        <td>${escapeHtml(submissionDate)}</td>
      </tr>
    </tbody>
  </table>

  <div class="section-label">Official Information:</div>
  <table>
    <tbody>
      <tr>
        <td class="num-col">1</td>
        <td class="label-col">Campus</td>
        <td>${escapeHtml(app.campus || '')}</td>
      </tr>
      <tr>
        <td class="num-col">2</td>
        <td class="label-col">Registered Number</td>
        <td>${escapeHtml(app.reg_no || '')}</td>
      </tr>
      <tr>
        <td class="num-col">3</td>
        <td class="label-col">Programme</td>
        <td>${escapeHtml(fd.Programme || '')}</td>
      </tr>
      <tr>
        <td class="num-col">4</td>
        <td class="label-col">Period of Study</td>
        <td>${escapeHtml(fd.Period_of_Study || '')}</td>
      </tr>
      <tr>
        <td class="num-col">5</td>
        <td class="label-col">Campus forwarded to Director</td>
        <td>${escapeHtml(fmtDate(stageTimestamps.campusForwardedAt))}</td>
      </tr>
      <tr>
        <td class="num-col">6</td>
        <td class="label-col">Director Approved on</td>
        <td>${escapeHtml(fmtDate(stageTimestamps.directorApprovedAt))}</td>
      </tr>
    </tbody>
  </table>

  <p class="course-note">Details of Course(s) in which the candidate intends appearing for the Supplementary Examinations.</p>
  <table>
    <thead>
      <tr>
        <th style="width:50px;">S. No.</th>
        <th style="width:110px;">Semester Number</th>
        <th style="width:110px;">Course Code</th>
        <th>Title of the Course</th>
      </tr>
    </thead>
    <tbody>${courseRows}</tbody>
  </table>
</body>
</html>`;

            const pw = window.open('', '_blank', 'width=800,height=900');
            pw.document.documentElement.innerHTML = suppHtml;
            pw.focus();
            setTimeout(() => { pw.print(); }, 400);
            return;
        }

        // ── CGPA TO PERCENTAGE CONVERSION: OFFICIAL PRINTED FORM LAYOUT ──────
        if (app.form_type === 'Application for CGPA to Percentage Conversion') {
            const fullAddress = [fd.address_line1, fd.address_line2].filter(Boolean).join(', ');
            const submissionDate = fmtDate(app.created_at ? app.created_at + (app.created_at.includes('Z') ? '' : 'Z') : null)
                || (app.created_at ? new Date(app.created_at).toLocaleDateString('en-IN') : '');

            const cgpaHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>CGPA to Percentage Conversion – ${escapeHtml(app.id)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Times New Roman', Times, serif; font-size: 12px; color: #000; padding: 28px; }
    .header { text-align: center; margin-bottom: 8px; display: flex; align-items: center; justify-content: center; gap: 16px; }
    .header-text { text-align: center; }
    .institute-name { font-size: 15px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; }
    .deemed { font-size: 11px; margin-top: 2px; }
    .address { font-size: 11px; margin-top: 4px; }
    hr { border: none; border-top: 1.5px solid #000; margin: 10px 0 14px 0; }
    .form-title { text-align: center; font-weight: bold; font-size: 13px; text-transform: uppercase; margin-bottom: 14px; }
    .section-label { font-weight: bold; padding: 4px 8px; border: 1px solid #000; border-bottom: none; background: #fff; margin-top: 14px; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; }
    td { border: 1px solid #000; padding: 5px 8px; font-size: 11px; vertical-align: top; }
    .num-col { width: 28px; text-align: center; }
    .label-col { width: 44%; }
    @media print { body { padding: 15px; } }
  </style>
</head>
<body>
  <div class="header">
    <img src="https://sssihl-student-service.pages.dev/logo.png" alt="SSSIHL Logo" style="height:60px;width:auto;" />
    <div class="header-text">
      <div class="institute-name">Sri Sathya Sai Institute of Higher Learning</div>
      <div class="deemed">(Deemed to be University)</div>
      <div class="address">Vidyagiri, Prasanthi Nilayam – 515 134, Sri Sathya Sai Dist., A.P.</div>
    </div>
  </div>
  <hr>
  <div class="form-title">Application for CGPA to Percentage Conversion</div>

  <div class="section-label">Applicant Information:</div>
  <table>
    <tbody>
      <tr>
        <td class="num-col">1</td>
        <td class="label-col">Name of Candidate<br><span style="font-size:10px;font-style:italic">(as printed on the Original Grade Card)</span></td>
        <td>${escapeHtml(app.applicant_name || '')}</td>
      </tr>
      <tr>
        <td class="num-col">2</td>
        <td class="label-col">Full Address</td>
        <td>${escapeHtml(fullAddress)}</td>
      </tr>
      <tr>
        <td class="num-col">3</td>
        <td class="label-col">City</td>
        <td>${escapeHtml(fd.city || '')}</td>
      </tr>
      <tr>
        <td class="num-col">4</td>
        <td class="label-col">State / Province</td>
        <td>${escapeHtml(fd.state_province || '')}</td>
      </tr>
      <tr>
        <td class="num-col">5</td>
        <td class="label-col">Country</td>
        <td>${escapeHtml(fd.country || '')}</td>
      </tr>
      <tr>
        <td class="num-col">6</td>
        <td class="label-col">Postal Code</td>
        <td>${escapeHtml(fd.postal_code || '')}</td>
      </tr>
      <tr>
        <td class="num-col">7</td>
        <td class="label-col">Mobile Number</td>
        <td>${escapeHtml(fd.Mobile_Number || '')}</td>
      </tr>
      <tr>
        <td class="num-col">8</td>
        <td class="label-col">E-mail Address</td>
        <td>${escapeHtml(app.student_email || '')}</td>
      </tr>
      <tr>
        <td class="num-col">9</td>
        <td class="label-col">Date of Submission</td>
        <td>${escapeHtml(submissionDate)}</td>
      </tr>
    </tbody>
  </table>

  <div class="section-label">Official Information:</div>
  <table>
    <tbody>
      <tr>
        <td class="num-col">1</td>
        <td class="label-col">Campus</td>
        <td>${escapeHtml(app.campus || '')}</td>
      </tr>
      <tr>
        <td class="num-col">2</td>
        <td class="label-col">Registered Number</td>
        <td>${escapeHtml(fd.Registration_Number || app.reg_no || '')}</td>
      </tr>
      <tr>
        <td class="num-col">3</td>
        <td class="label-col">Programme</td>
        <td>${escapeHtml(fd.Programme || app.programme || '')}</td>
      </tr>
      <tr>
        <td class="num-col">4</td>
        <td class="label-col">Period of Study</td>
        <td>${escapeHtml(fd.Period_of_Study || '')}</td>
      </tr>
      <tr>
        <td class="num-col">5</td>
        <td class="label-col">Month and Year of Passing</td>
        <td>${escapeHtml(fd.graduation_year || '')}</td>
      </tr>
      <tr>
        <td class="num-col">6</td>
        <td class="label-col">CGPA</td>
        <td>${escapeHtml(fd.CGPA || '')}</td>
      </tr>
    </tbody>
  </table>
</body>
</html>`;

            const pw = window.open('', '_blank', 'width=800,height=900');
            pw.document.documentElement.innerHTML = cgpaHtml;
            pw.focus();
            setTimeout(() => { pw.print(); }, 400);
            return;
        }

        // ── RE-TOTALLING: OFFICIAL PRINTED FORM LAYOUT ────────────────────────
        if (app.form_type === 'Application for Re-Totalling of Marks') {
            const fullAddress = [fd.address_line1, fd.address_line2].filter(Boolean).join(', ');
            const submissionDate = fmtDate(app.created_at ? app.created_at + (app.created_at.includes('Z') ? '' : 'Z') : null)
                || (app.created_at ? new Date(app.created_at).toLocaleDateString('en-IN') : '');
            const examPeriod = fd.period_of_examination || '';
            const sbiUploaded = files.some(f => f.field_name === 'sbiReceipt') ? 'Yes' : 'No';

            // Parse paperTable JSON for courses
            let courseRows = '';
            try {
                const courses = JSON.parse(fd.paper_codes_titles_for_retotaling || '[]');
                if (Array.isArray(courses) && courses.length > 0) {
                    courseRows = courses.map((c, i) => `
                      <tr>
                        <td class="num-col">${6 + i}</td>
                        <td class="label-col">Course Code</td>
                        <td>${escapeHtml(c.code || c.Code || '')}</td>
                      </tr>
                      <tr>
                        <td class="num-col"></td>
                        <td class="label-col">Title of the Course</td>
                        <td>${escapeHtml(c.title || c.Title || '')}</td>
                      </tr>
                      <tr>
                        <td class="num-col"></td>
                        <td class="label-col">Semester</td>
                        <td>${escapeHtml(String(c.semester || c.Semester || ''))}</td>
                      </tr>`).join('');
                } else {
                    // Fallback: display raw value
                    courseRows = `
                      <tr><td class="num-col">6</td><td class="label-col">Course Details</td><td>${escapeHtml(fd.paper_codes_titles_for_retotaling || '')}</td></tr>`;
                }
            } catch {
                courseRows = `
                  <tr><td class="num-col">6</td><td class="label-col">Course Code</td><td>${escapeHtml(fd.paper_codes_titles_for_retotaling || '')}</td></tr>`;
            }

            const retotalHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Re-Totalling Application – ${escapeHtml(app.id)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Times New Roman', Times, serif; font-size: 12px; color: #000; padding: 28px; }
    .header { text-align: center; margin-bottom: 8px; display: flex; align-items: center; justify-content: center; gap: 16px; }
    .header-text { text-align: center; }
    .institute-name { font-size: 15px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; }
    .deemed { font-size: 11px; margin-top: 2px; }
    .address { font-size: 11px; margin-top: 4px; }
    hr { border: none; border-top: 1.5px solid #000; margin: 10px 0 14px 0; }
    .form-title { text-align: center; font-weight: bold; font-size: 13px; text-transform: uppercase; margin-bottom: 4px; }
    .form-subtitle { text-align: center; font-size: 11px; font-style: italic; margin-bottom: 14px; }
    .section-label { font-weight: bold; padding: 4px 8px; border: 1px solid #000; border-bottom: none; background: #fff; margin-top: 14px; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; }
    td { border: 1px solid #000; padding: 5px 8px; font-size: 11px; vertical-align: top; }
    .num-col { width: 28px; text-align: center; }
    .label-col { width: 44%; }
    @media print { body { padding: 15px; } }
  </style>
</head>
<body>
  <div class="header">
    <img src="https://sssihl-student-service.pages.dev/logo.png" alt="SSSIHL Logo" style="height:60px;width:auto;" />
    <div class="header-text">
      <div class="institute-name">Sri Sathya Sai Institute of Higher Learning</div>
      <div class="deemed">(Deemed to be University)</div>
      <div class="address">Vidyagiri, Prasanthi Nilayam – 515 134, Sri Sathya Sai Dist., A.P.</div>
    </div>
  </div>
  <hr>
  <div class="form-title">Application for Re-Totalling${examPeriod ? ' – ' + escapeHtml(examPeriod) : ''}</div>
  <div class="form-subtitle">(Application for re-totalling is submitted by the candidate, directly to the Controller of Examinations)</div>

  <div class="section-label">Applicant Information:</div>
  <table>
    <tbody>
      <tr>
        <td class="num-col">1</td>
        <td class="label-col">Name of Candidate</td>
        <td>${escapeHtml(app.applicant_name || '')}</td>
      </tr>
      <tr>
        <td class="num-col">2</td>
        <td class="label-col">Full Postal Address</td>
        <td>${escapeHtml(fullAddress)}</td>
      </tr>
      <tr>
        <td class="num-col">3</td>
        <td class="label-col">City</td>
        <td>${escapeHtml(fd.city || '')}</td>
      </tr>
      <tr>
        <td class="num-col">4</td>
        <td class="label-col">State / Province</td>
        <td>${escapeHtml(fd.state_province || '')}</td>
      </tr>
      <tr>
        <td class="num-col">5</td>
        <td class="label-col">Country</td>
        <td>${escapeHtml(fd.country || '')}</td>
      </tr>
      <tr>
        <td class="num-col">6</td>
        <td class="label-col">Postal Code</td>
        <td>${escapeHtml(fd.postal_code || '')}</td>
      </tr>
      <tr>
        <td class="num-col">7</td>
        <td class="label-col">Mobile Number</td>
        <td>${escapeHtml(fd.Mobile_Number || '')}</td>
      </tr>
      <tr>
        <td class="num-col">8</td>
        <td class="label-col">E-mail ID</td>
        <td>${escapeHtml(app.student_email || '')}</td>
      </tr>
      <tr>
        <td class="num-col">9</td>
        <td class="label-col">ABC / APAAR ID</td>
        <td>${escapeHtml(app.abc_apaar_id || '')}</td>
      </tr>
      <tr>
        <td class="num-col">10</td>
        <td class="label-col">Date of Submission</td>
        <td>${escapeHtml(submissionDate)}</td>
      </tr>
    </tbody>
  </table>

  <div class="section-label">Official Information:</div>
  <table>
    <tbody>
      <tr>
        <td class="num-col">1</td>
        <td class="label-col">Campus</td>
        <td>${escapeHtml(app.campus || '')}</td>
      </tr>
      <tr>
        <td class="num-col">2</td>
        <td class="label-col">Registered Number</td>
        <td>${escapeHtml(String(app.reg_no || fd.reg_no || ''))}</td>
      </tr>
      <tr>
        <td class="num-col">3</td>
        <td class="label-col">Academic Programme</td>
        <td>${escapeHtml(fd.Programme || app.programme || '')}</td>
      </tr>
      <tr>
        <td class="num-col">4</td>
        <td class="label-col">Examination Type</td>
        <td>${escapeHtml(fd.exam_type || '')}</td>
      </tr>
      <tr>
        <td class="num-col">5</td>
        <td class="label-col">SBI Collect Receipt uploaded</td>
        <td>${sbiUploaded}</td>
      </tr>
      ${courseRows}
    </tbody>
  </table>
</body>
</html>`;

            const pw = window.open('', '_blank', 'width=800,height=900');
            pw.document.documentElement.innerHTML = retotalHtml;
            pw.focus();
            setTimeout(() => { pw.print(); }, 400);
            return;
        }
        // ───────────────────────────────────────────────────────────────────────

        // Human-readable labels for each form table's columns
        const FORM_FIELD_LABELS = {
            'Application for Duplicate Grade Card': [
                ['Programme', 'Academic Programme'],
                ['Period_of_Study', 'Period of Study'],
                ['Semester', 'Semester'],
                ['Mobile_Number', 'Mobile Number'],
                ['address_line1', 'Address Line 1'],
                ['address_line2', 'Address Line 2'],
                ['country', 'Country'],
                ['state_province', 'State/Province/Region'],
                ['city', 'City'],
                ['postal_code', 'Postal Code'],
                ['Reason', 'Reason for Loss'],
            ],
            'Application for CGPA to Percentage Conversion': [
                ['Registration_Number', 'Registration Number'],
                ['Programme', 'Academic Programme'],
                ['Period_of_Study', 'Period of Study'],
                ['graduation_year', 'Month & Year of Passing'],
                ['CGPA', 'CGPA'],
                ['Mobile_Number', 'Mobile Number'],
                ['address_line1', 'Address Line 1'],
                ['address_line2', 'Address Line 2'],
                ['country', 'Country'],
                ['state_province', 'State/Province/Region'],
                ['city', 'City'],
                ['postal_code', 'Postal Code'],
            ],
            'Application for Supplementary Examinations Registration': [
                ['Programme', 'Academic Programme'],
                ['Period_of_Study', 'Period of Study'],
                ['Semester', 'Semester'],
                ['paper_codes', 'Paper Code(s)'],
                ['paper_titles', 'Paper Title(s)'],
                ['Mobile_Number', 'Mobile Number'],
                ['address_line1', 'Address Line 1'],
                ['address_line2', 'Address Line 2'],
                ['country', 'Country'],
                ['state_province', 'State/Province/Region'],
                ['city', 'City'],
                ['postal_code', 'Postal Code'],
                ['declaration', 'Declaration'],
            ],
            'Application for Duplicate Degree Certificate': [
                ['Programme', 'Academic Programme'],
                ['Period_of_Study', 'Period of Study'],
                ['year_of_passing', 'Year of Original Degree Issue'],
                ['address_line1', 'Address Line 1'],
                ['address_line2', 'Address Line 2'],
                ['country', 'Country'],
                ['state_province', 'State/Province/Region'],
                ['city', 'City'],
                ['postal_code', 'Postal Code'],
                ['Reason', 'Reason for Loss'],
            ],
            'Application for Registration of Student Name change in the Institute Records': [
                ['existing_name', 'Current Name'],
                ['Father_name', "Father's Name"],
                ['changed_name', 'Changed Name (as per Gazette)'],
                ['Mobile_Number', 'Mobile Number'],
                ['Period_of_Study', 'Period of Study'],
                ['address_line1', 'Address Line 1'],
                ['address_line2', 'Address Line 2'],
                ['country', 'Country'],
                ['state_province', 'State/Province/Region'],
                ['city', 'City'],
                ['postal_code', 'Postal Code'],
            ],
            'Application for Repeating Examinations Registration (CIE and ESE)': [
                ['Programme', 'Academic Programme'],
                ['Period_of_Study', 'Period of Study'],
                ['Semester', 'Semester'],
                ['paper_codes', 'Paper Code(s)'],
                ['paper_titles', 'Paper Title(s)'],
                ['Mobile_Number', 'Mobile Number'],
                ['address_line1', 'Address Line 1'],
                ['address_line2', 'Address Line 2'],
                ['country', 'Country'],
                ['state_province', 'State/Province/Region'],
                ['city', 'City'],
                ['postal_code', 'Postal Code'],
                ['declaration', 'Declaration'],
            ],
            'Application for Re-Totalling of Marks': [
                ['Programme', 'Academic Programme'],
                ['exam_type', 'Examination Type'],
                ['period_of_examination', 'Examination Month & Year'],
                ['paper_codes_titles_for_retotaling', 'Subject Code'],
                ['Mobile_Number', 'Mobile Number'],
                ['address_line1', 'Address Line 1'],
                ['address_line2', 'Address Line 2'],
                ['country', 'Country'],
                ['state_province', 'State/Province/Region'],
                ['city', 'City'],
                ['postal_code', 'Postal Code'],
            ],
            'Application for On-Request Degree Certificate': [
                ['Degree_applied_for', 'Degree Applied For'],
                ['Mobile_Number', 'Mobile Number'],
                ['address_line1', 'Address Line 1'],
                ['address_line2', 'Address Line 2'],
                ['country', 'Country'],
                ['state_province', 'State/Province/Region'],
                ['city', 'City'],
                ['postal_code', 'Postal Code'],
            ],
            'SSSIHL - XLV Annual Convocation November 2026 - Registration Form': [
                ['category', 'Category'],
                ['programme', 'Programme'],
                ['registration_number', 'Registered Number'],
                ['attendance_type', 'Attendance Type'],
                ['date_of_birth', 'Date of Birth'],
                ['postal_address', 'Postal Address'],
                ['active_mobile', 'Active Mobile Number'],
                ['alternate_mobile', 'Alternate Mobile Number'],
                ['prev_board_university', 'Previous Board / University'],
                ['prev_qualification_programme', 'Previous Qualification Programme'],
                ['prev_qualification_certificate_no', 'Certificate No.'],
                ['declaration', 'Declaration'],
            ],
            'Application for Migration Certificate': [
                ['Registration_Number', 'Registration Number'],
                ['programme', 'Academic Programme'],
                ['date_of_birth', 'Date of Birth'],
                ['admission_year', 'Year of Admission'],
                ['Campus_of_admission', 'Campus of Admission'],
                ['last_examination_passed', 'Last Examination Details'],
                ['degree_recieved', 'Degree Certificate Received'],
                ['university_to_migrate', 'University/Institute to Join'],
                ['delivery_preference', 'Delivery Preference'],
                ['Mobile_Number', 'Mobile Number'],
                ['address_line1', 'Address Line 1'],
                ['address_line2', 'Address Line 2'],
                ['country', 'Country'],
                ['state_province', 'State/Province/Region'],
                ['city', 'City'],
                ['postal_code', 'Postal Code'],
                ['correspondence_address', 'Correspondence Address'],
            ],
        };

        const statusColors = { APPROVED: '#10b981', COMPLETED: '#059669', DISPATCHED: '#0ea5e9', REJECTED: '#ef4444', PENDING: '#f59e0b' };
        const statusColor = statusColors[app.status] || '#64748b';

        const DATE_FIELDS = new Set(['date_of_birth', 'admission_year', 'graduation_year', 'year_of_passing']);
        const formatDateValue = (key, value) => {
            if (!DATE_FIELDS.has(key)) return value;
            const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
            return match ? `${match[3]}-${match[2]}-${match[1]}` : value;
        };

        const fieldDefs = FORM_FIELD_LABELS[app.form_type] || [];
        const formFieldRows = fieldDefs
            .filter(([key]) => fd[key] !== null && fd[key] !== undefined && fd[key] !== '')
            .map(([key, label]) => `<tr><td style="font-weight:600;width:40%">${escapeHtml(label)}</td><td>${escapeHtml(formatDateValue(key, fd[key]))}</td></tr>`)
            .join('');

        const fileListRows = files.map(f =>
            `<tr><td>${escapeHtml(f.file_name)}</td><td>${escapeHtml(f.file_type)}</td><td>${(f.file_size / 1024).toFixed(1)} KB</td></tr>`
        ).join('');

        const responseListRows = responseDocuments.map(f =>
            `<tr><td>${escapeHtml(f.file_name)}</td><td>${escapeHtml(f.file_type)}</td><td>${(f.file_size / 1024).toFixed(1)} KB</td><td>${escapeHtml(f.uploaded_by || 'Admin')}</td></tr>`
        ).join('');

        const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Application – ${escapeHtml(app.id)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 13px; color: #0f172a; padding: 32px; }
    .header { border-bottom: 3px solid #1e3a5f; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end; }
    .institute { font-size: 18px; font-weight: bold; color: #1e3a5f; }
    .sub-institute { font-size: 12px; color: #64748b; margin-top: 2px; }
    .app-id { font-size: 11px; font-family: monospace; color: #64748b; text-align: right; }
    .form-title { font-size: 15px; font-weight: bold; color: #1e3a5f; text-align: right; max-width: 280px; }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: bold; color: white; background: ${statusColor}; margin-top: 6px; }
    .section { margin-bottom: 22px; }
    .section-title { font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; color: #2563eb; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 12px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .info-item label { font-size: 11px; color: #64748b; display: block; margin-bottom: 2px; }
    .info-item span { font-size: 13px; font-weight: 600; color: #0f172a; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { background: #f1f5f9; padding: 8px 10px; text-align: left; font-weight: 700; color: #475569; border: 1px solid #e2e8f0; }
    td { padding: 7px 10px; border: 1px solid #e2e8f0; color: #0f172a; vertical-align: top; }
    tr:nth-child(even) td { background: #f8fafc; }
    .footer { border-top: 1px solid #e2e8f0; padding-top: 12px; margin-top: 32px; font-size: 11px; color: #94a3b8; display: flex; justify-content: space-between; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div style="display:flex;align-items:center;gap:14px;">
      <img src="https://sssihl-student-service.pages.dev/logo.png" alt="SSSIHL Logo" style="height:64px;width:auto;" />
      <div>
        <div class="institute">Sri Sathya Sai Institute of Higher Learning</div>
        <div class="sub-institute">Office of the Controller of Examinations</div>
      </div>
    </div>
    <div style="text-align:right">
      <div class="form-title">${escapeHtml(app.form_type)}</div>
      <div class="app-id">App ID: ${escapeHtml(app.id)}</div>
      <span class="status-badge">${escapeHtml(app.status)}</span>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Applicant Information</div>
    <div class="info-grid">
      <div class="info-item"><label>Full Name</label><span>${escapeHtml(app.applicant_name || 'N/A')}</span></div>
      <div class="info-item"><label>Registration Number</label><span>${escapeHtml(app.reg_no || 'N/A')}</span></div>
      <div class="info-item"><label>Campus</label><span>${escapeHtml(app.campus || 'N/A')}</span></div>
      <div class="info-item"><label>Email Address</label><span>${escapeHtml(app.student_email || 'N/A')}</span></div>
      ${app.abc_apaar_id ? `<div class="info-item"><label>ABC / APAAR ID</label><span>${escapeHtml(app.abc_apaar_id)}</span></div>` : ''}
      <div class="info-item"><label>Date of Submission</label><span>${new Date(app.created_at + 'Z').toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</span></div>
    </div>
  </div>

  ${formFieldRows ? `
  <div class="section">
    <div class="section-title">Form Details</div>
    <table>
      <tbody>${formFieldRows}</tbody>
    </table>
  </div>` : ''}

  ${files.length > 0 ? `
  <div class="section">
    <div class="section-title">Student Submitted Documents</div>
    <table>
      <thead><tr><th>File Name</th><th>Type</th><th>Size</th></tr></thead>
      <tbody>${fileListRows}</tbody>
    </table>
  </div>` : ''}

  ${responseDocuments.length > 0 ? `
  <div class="section">
    <div class="section-title">Response Documents (Uploaded by Admin)</div>
    <table>
      <thead><tr><th>File Name</th><th>Type</th><th>Size</th><th>Uploaded By</th></tr></thead>
      <tbody>${responseListRows}</tbody>
    </table>
  </div>` : ''}

  ${app.director_comment ? `
  <div class="section">
    <div class="section-title">Director's Comments</div>
    <div style="padding:10px 12px;background:#faf5ff;border:1px solid #e9d5ff;border-radius:6px;font-size:13px;color:#4c1d95;">${escapeHtml(app.director_comment)}</div>
  </div>` : ''}

  <div class="footer">
    <span>Generated on ${new Date().toLocaleString()}</span>
    <span>SSSIHL — Student Services Portal</span>
  </div>
</body>
</html>`;

        const printWindow = window.open('', '_blank', 'width=800,height=900');
        printWindow.document.documentElement.innerHTML = html;
        printWindow.focus();
        setTimeout(() => { printWindow.print(); }, 400);
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
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            });
    };

    const viewFile = async (fileId, fileName) => {
        try {
            const currentToken = localStorage.getItem(TOKEN_KEY);
            const response = await fetch(`${API_URL}/admin/file/${fileId}`, {
                headers: { 'Authorization': `Bearer ${currentToken}` }
            });
            if (!response.ok) throw new Error('Failed to fetch file');
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            setPdfViewerName(fileName);
            setPdfViewerUrl(url);
        } catch (e) {
            showToast('Failed to load file for viewing.', 'error');
        }
    };

    const closePdfViewer = () => {
        if (pdfViewerUrl) URL.revokeObjectURL(pdfViewerUrl);
        setPdfViewerUrl(null);
        setPdfViewerName('');
    };

    const markAsCompleted = (applicationId) => {
        setConfirmModal({
            title: 'Confirm Completion',
            message: 'Are you sure you want to mark this application as Completed & Dispatched?',
            confirmText: 'Yes, Complete',
            confirmColor: '#10b981',
            confirmGradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            onConfirm: () => {
                setConfirmModal(null);
                doMarkAsCompleted(applicationId);
            }
        });
    };

    const doMarkAsCompleted = async (applicationId) => {
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
                showToast('Application marked as Completed & Dispatched!', 'success');
                // Refresh the application details and list
                fetchAppDetails(applicationId);
                fetchStats();
                fetchApplications();
            } else {
                showToast('Error: ' + (data.error || 'Failed to update status'), 'error');
            }
        } catch (err) {
            console.error('Failed to mark as completed:', err);
            showToast('Failed to update status. Please try again.', 'error');
        }
    };

    const resolveHold = (applicationId) => {
        setConfirmModal({
            title: 'Resolve On Hold',
            message: 'This will move the application back to "Under Process" and send the student an email. Are you sure?',
            confirmText: 'Yes, Resolve & Proceed',
            confirmColor: '#7c3aed',
            confirmGradient: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
            onConfirm: () => { setConfirmModal(null); doResolveHold(applicationId); }
        });
    };

    const doResolveHold = async (applicationId) => {
        try {
            const response = await fetch(`${API_URL}/admin/resolve-hold`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ applicationId })
            });
            const data = await response.json();
            if (response.ok) {
                showToast('Hold resolved — application is now Under Process!', 'success');
                fetchAppDetails(applicationId);
                fetchStats();
                fetchApplications();
            } else {
                showToast('Error: ' + (data.error || 'Failed to resolve hold'), 'error');
            }
        } catch (err) {
            console.error('Failed to resolve hold:', err);
            showToast('Failed to resolve hold. Please try again.', 'error');
        }
    };

    const notifyDispatched = (applicationId, formType) => {
        setDispatchAppId(applicationId);
        setDispatchFormType(formType);
        if (dispatchTrackingRef.current) dispatchTrackingRef.current.value = '';
        setShowDispatchModal(true);
    };

    const doNotifyDispatched = async (applicationId, trackingNumber, formType) => {
        try {
            const response = await fetch(`${API_URL}/admin/notify-dispatched`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ applicationId, trackingNumber: trackingNumber || null })
            });

            const data = await response.json();

            if (response.ok) {
                const word = formType === 'Application for Migration Certificate' ? 'uploaded' : 'dispatched';
                showToast(`Student notified — document marked as ${word}!`, 'success');
                fetchAppDetails(applicationId);
                fetchStats();
                fetchApplications();
            } else {
                showToast('Error: ' + (data.error || 'Failed to notify student'), 'error');
            }
        } catch (err) {
            console.error('Failed to notify dispatch:', err);
            showToast('Failed to send notification. Please try again.', 'error');
        }
    };

    const archiveApplication = (applicationId) => {
        setConfirmModal({
            title: 'Archive Application',
            message: `Are you sure you want to archive application ${applicationId}? The application data will be preserved in the archive, but the student will no longer be able to track it.`,
            confirmText: 'Yes, Archive',
            confirmColor: '#f59e0b',
            confirmGradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            onConfirm: () => {
                setConfirmModal(null);
                doArchiveApplication(applicationId);
            }
        });
    };

    const doArchiveApplication = async (applicationId) => {
        try {
            const response = await fetch(`${API_URL}/admin/application/${applicationId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                showToast('Application archived successfully!', 'success');
                setSelectedApp(null);
                setAppDetails(null);
                fetchStats();
                fetchApplications();
            } else {
                showToast('Error: ' + (data.error || 'Failed to archive application'), 'error');
            }
        } catch (err) {
            console.error('Failed to archive application:', err);
            showToast('Failed to archive application. Please try again.', 'error');
        }
    };

    const uploadResponseDocument = async (applicationId, file) => {
        setUploading(true);
        setUploadError(null);
        setUploadSuccess(false);

        try {
            const formData = new FormData();
            formData.append('applicationId', applicationId);
            formData.append('responseDocument', file);

            const response = await fetch(`${API_URL}/admin/upload-response`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                setUploadSuccess(true);
                // Refresh application details to show the new file
                fetchAppDetails(applicationId);
            } else {
                setUploadError(data.error || 'Failed to upload document');
            }
        } catch (err) {
            console.error('Failed to upload response document:', err);
            setUploadError('Failed to upload document. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const handleFileSelect = (event, applicationId) => {
        const file = event.target.files[0];
        if (file) {
            uploadResponseDocument(applicationId, file);
        }
        // Reset the input so the same file can be selected again
        event.target.value = '';
    };

    const FORM_FIELDS_SKIP = new Set([
        'id', 'application_id', 'created_at', 'updated_at',
        'student_name', 'applicant_name', 'student_email', 'email',
        'reg_no', 'registration_number', 'Registration_Number', 'campus', 'Campus', 'programme',
        'director_approval_status', 'controller_approval_status',
        'director_status', 'controller_status', 'status',
        'delivery_preference', 'file_data',
    ]);
    const APP_EDIT_KEYS = ['applicant_name', 'reg_no', 'campus', 'programme', 'abc_apaar_id'];
    const APP_COLUMNS = new Set(APP_EDIT_KEYS);

    const openEditModal = () => {
        if (!appDetails) return;
        const { application, formData } = appDetails;
        const fields = {};
        for (const key of APP_EDIT_KEYS) {
            if (application[key] != null) fields[key] = application[key];
        }
        if (formData) {
            for (const [key, value] of Object.entries(formData)) {
                if (!FORM_FIELDS_SKIP.has(key.toLowerCase()) && value != null && value !== '') {
                    fields[key] = value;
                }
            }
        }
        setEditFields(fields);
        setShowEditModal(true);
    };

    const saveEdit = async () => {
        setEditSaving(true);
        try {
            const applicationFields = {};
            const formFields = {};
            for (const [key, value] of Object.entries(editFields)) {
                if (APP_COLUMNS.has(key)) applicationFields[key] = value;
                else formFields[key] = value;
            }
            const res = await fetch(`${API_URL}/admin/application/${selectedApp}`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ applicationFields, formFields }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setShowEditModal(false);
                setEditFields({});
                fetchAppDetails(selectedApp);
                showToast('Application updated successfully!', 'success');
            } else {
                showToast('Error: ' + (data.error || 'Failed to save changes'), 'error');
            }
        } catch (err) {
            showToast('Failed to save changes. Please try again.', 'error');
        } finally {
            setEditSaving(false);
        }
    };

    // Toast Notification Component
    const ToastNotification = () => {
        if (!toast) return null;
        const isSuccess = toast.type === 'success';
        return (
            <div style={{
                position: 'fixed',
                top: '24px',
                right: '24px',
                zIndex: 10000,
                animation: 'slideInRight 0.3s ease-out',
                maxWidth: '420px',
                minWidth: '300px'
            }}>
                <div style={{
                    background: isSuccess ? '#f0fdf4' : '#fef2f2',
                    border: `1px solid ${isSuccess ? '#bbf7d0' : '#fecaca'}`,
                    borderRadius: '12px',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.05)',
                    borderLeft: `4px solid ${isSuccess ? '#22c55e' : '#ef4444'}`
                }}>
                    <div style={{
                        padding: '4px',
                        borderRadius: '50%',
                        background: isSuccess ? '#dcfce7' : '#fee2e2',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                    }}>
                        {isSuccess ? <CheckCircle size={18} color="#22c55e" /> : <XCircle size={18} color="#ef4444" />}
                    </div>
                    <div style={{ flex: 1 }}>
                        <p style={{
                            margin: 0,
                            fontWeight: '600',
                            fontSize: '14px',
                            color: isSuccess ? '#166534' : '#991b1b',
                            marginBottom: '2px'
                        }}>
                            {isSuccess ? 'Success' : 'Error'}
                        </p>
                        <p style={{
                            margin: 0,
                            fontSize: '13px',
                            color: isSuccess ? '#15803d' : '#b91c1c',
                            lineHeight: '1.4'
                        }}>
                            {toast.message}
                        </p>
                    </div>
                    <button
                        onClick={() => setToast(null)}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '2px',
                            color: isSuccess ? '#86efac' : '#fca5a5',
                            flexShrink: 0
                        }}
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>
        );
    };

    // Dispatch Modal Component (with tracking number input)
    const DispatchModal = () => {
        if (!showDispatchModal) return null;
        const isMigration = dispatchFormType === 'Application for Migration Certificate';
        return (
            <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)',
                animation: 'fadeIn 0.2s ease-out'
            }}>
                <div style={{
                    background: 'white', borderRadius: '16px', padding: '32px',
                    maxWidth: '440px', width: '90%',
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                    animation: 'scaleIn 0.2s ease-out'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(14,165,233,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: '22px', color: '#0ea5e9' }}>&#9993;</span>
                        </div>
                        <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a', fontWeight: '700' }}>
                            Notify: Document {isMigration ? 'Uploaded' : 'Dispatched'}
                        </h3>
                    </div>
                    <p style={{ color: '#475569', fontSize: '14px', lineHeight: '1.6', margin: '0 0 20px 0' }}>
                        {isMigration
                            ? 'This will send an email to the student informing them that their document has been uploaded and is ready to download.'
                            : 'This will send an email to the student informing them that their document has been dispatched.'}
                    </p>
                    {!isMigration && (
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#0f172a', marginBottom: '6px' }}>
                                Postal Tracking Number <span style={{ color: '#94a3b8', fontWeight: '400' }}>(optional)</span>
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. EW123456789IN"
                                ref={dispatchTrackingRef}
                                defaultValue=""
                                className="form-input"
                                style={{ width: '100%', boxSizing: 'border-box' }}
                                autoFocus
                            />
                        </div>
                    )}
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        <button
                            onClick={() => setShowDispatchModal(false)}
                            style={{ padding: '10px 24px', background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => { setShowDispatchModal(false); doNotifyDispatched(dispatchAppId, isMigration ? null : dispatchTrackingRef.current?.value || null, dispatchFormType); }}
                            style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)', color: '#ffffff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}
                        >
                            &#9993; Notify Student
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // Confirmation Modal Component
    const ConfirmationModal = () => {
        if (!confirmModal) return null;
        return (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(15, 23, 42, 0.5)',
                backdropFilter: 'blur(4px)',
                animation: 'fadeIn 0.2s ease-out'
            }}>
                <div style={{
                    background: 'white',
                    borderRadius: '16px',
                    padding: '32px',
                    maxWidth: '440px',
                    width: '90%',
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                    animation: 'scaleIn 0.2s ease-out'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <div style={{
                            padding: '10px',
                            borderRadius: '12px',
                            background: confirmModal.confirmColor === '#ef4444' ? '#fef2f2' : '#f0fdf4',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <AlertTriangle size={22} color={confirmModal.confirmColor} />
                        </div>
                        <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a', fontWeight: '700' }}>
                            {confirmModal.title}
                        </h3>
                    </div>
                    <p style={{
                        color: '#475569',
                        fontSize: '14px',
                        lineHeight: '1.6',
                        margin: '0 0 28px 0'
                    }}>
                        {confirmModal.message}
                    </p>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        <button
                            className="btn-modal-cancel"
                            onClick={() => setConfirmModal(null)}
                            style={{
                                padding: '10px 24px',
                                background: '#f1f5f9',
                                color: '#475569',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: '600',
                                fontSize: '14px'
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            className="btn-modal-confirm"
                            onClick={confirmModal.onConfirm}
                            style={{
                                padding: '10px 24px',
                                background: confirmModal.confirmGradient,
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: '600',
                                fontSize: '14px'
                            }}
                        >
                            {confirmModal.confirmText}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const EditModal = () => {
        if (!showEditModal) return null;
        const TEXTAREA_KEYS = new Set(['paper_codes', 'paper_titles', 'address_line1', 'address_line2', 'Reason', 'declaration']);
        const formatKey = (k) => k.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\b\w/g, c => c.toUpperCase());
        return (
            <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)' }}>
                <div style={{ background: 'white', borderRadius: '16px', maxWidth: '600px', width: '90%', maxHeight: '82vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Edit Application</h3>
                        <button onClick={() => { setShowEditModal(false); setEditFields({}); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}>
                            <X size={18} />
                        </button>
                    </div>
                    <div style={{ overflowY: 'auto', padding: '20px 24px', flex: 1 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            {Object.entries(editFields).map(([key, value]) => (
                                <div key={key}>
                                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748b', marginBottom: '5px' }}>
                                        {formatKey(key)}
                                    </label>
                                    {TEXTAREA_KEYS.has(key) ? (
                                        <textarea
                                            value={value ?? ''}
                                            onChange={e => setEditFields(prev => ({ ...prev, [key]: e.target.value }))}
                                            rows={3}
                                            style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.875rem', fontFamily: 'inherit', resize: 'vertical', outline: 'none', color: '#0f172a', lineHeight: 1.5 }}
                                        />
                                    ) : (
                                        <input
                                            type="text"
                                            value={value ?? ''}
                                            onChange={e => setEditFields(prev => ({ ...prev, [key]: e.target.value }))}
                                            style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.875rem', fontFamily: 'inherit', outline: 'none', color: '#0f172a' }}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', padding: '16px 24px', borderTop: '1px solid #e2e8f0', flexShrink: 0 }}>
                        <button onClick={() => { setShowEditModal(false); setEditFields({}); }} style={{ padding: '9px 20px', background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', fontFamily: 'inherit' }}>
                            Cancel
                        </button>
                        <button onClick={saveEdit} disabled={editSaving} style={{ padding: '9px 20px', background: editSaving ? '#94a3b8' : '#0f172a', color: 'white', border: 'none', borderRadius: '8px', cursor: editSaving ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '0.875rem', fontFamily: 'inherit' }}>
                            {editSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const PdfViewerModal = () => {
        if (!pdfViewerUrl) return null;
        return (
            <div style={{
                position: 'fixed', inset: 0, zIndex: 10000,
                background: 'rgba(0,0,0,0.85)',
                display: 'flex', flexDirection: 'column'
            }}>
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 20px', background: '#1e293b', flexShrink: 0
                }}>
                    <span style={{ color: 'white', fontSize: '0.9rem', fontWeight: 600, fontFamily: 'monospace' }}>
                        {pdfViewerName}
                    </span>
                    <button
                        onClick={closePdfViewer}
                        style={{
                            background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '6px',
                            color: 'white', cursor: 'pointer', padding: '6px 12px',
                            fontSize: '0.85rem', fontWeight: 600, fontFamily: 'inherit'
                        }}
                    >
                        ✕ Close
                    </button>
                </div>
                <iframe
                    src={pdfViewerUrl}
                    title={pdfViewerName}
                    style={{ flex: 1, border: 'none', width: '100%', height: '100%' }}
                />
            </div>
        );
    };

    const StudentLookupPanel = () => {
        if (!showStudentLookup) return null;
        return (
            <div style={{
                position: 'fixed', inset: 0, zIndex: 9997,
                background: 'rgba(0,0,0,0.5)',
                display: 'flex', justifyContent: 'flex-end'
            }}>
                <div style={{
                    width: 'min(720px, 95vw)', height: '100%', background: 'white',
                    display: 'flex', flexDirection: 'column',
                    boxShadow: '-4px 0 24px rgba(0,0,0,0.12)'
                }}>
                    {/* Header */}
                    <div style={{
                        padding: '20px 24px', borderBottom: '1px solid #e2e8f0',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0
                    }}>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>Student Application History</h2>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Search by registration number</p>
                        </div>
                        <button onClick={() => { setShowStudentLookup(false); setStudentLookupQuery(''); }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' }}>
                            ✕
                        </button>
                    </div>

                    {/* Search input */}
                    <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
                                type="text"
                                value={studentLookupQuery}
                                onChange={e => setStudentLookupQuery(e.target.value)}
                                placeholder="Enter registration number..."
                                autoFocus
                                style={{
                                    width: '100%', paddingLeft: '36px', height: '40px',
                                    border: '1px solid #e2e8f0', borderRadius: '8px',
                                    fontSize: '0.875rem', boxSizing: 'border-box', fontFamily: 'inherit',
                                    outline: 'none'
                                }}
                            />
                        </div>
                    </div>

                    {/* Results */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
                        {studentLookupQuery.trim().length >= 3 && studentLookupResults.length > 0 && (
                            <>
                                {/* Summary stats */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '20px' }}>
                                    {[
                                        { label: 'Total', value: lookupStats.total, color: '#4F46E5' },
                                        { label: 'Pending', value: lookupStats.pending, color: '#f59e0b' },
                                        { label: 'Completed', value: lookupStats.completed, color: '#10b981' },
                                        { label: 'Rejected', value: lookupStats.rejected, color: '#ef4444' },
                                    ].map(s => (
                                        <div key={s.label} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                                            <p style={{ color: s.color, fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>{s.value}</p>
                                            <p style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 600, margin: 0, textTransform: 'uppercase' }}>{s.label}</p>
                                        </div>
                                    ))}
                                </div>
                                {/* Applications table */}
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr>
                                            {['Form Type', 'Status', 'Date', 'Action'].map(h => (
                                                <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', borderBottom: '2px solid #e2e8f0' }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {studentLookupResults.map(a => (
                                            <tr key={a.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={{ padding: '10px 12px' }}>
                                                    <p style={{ fontWeight: 600, fontSize: '0.8rem', margin: 0, color: '#0f172a' }}>{getShortLabel(a.form_type)}</p>
                                                    <p style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: '#94a3b8', margin: 0 }}>{a.id}</p>
                                                </td>
                                                <td style={{ padding: '10px 12px' }}><span style={getStatusStyle(a.status)}>{a.status}</span></td>
                                                <td style={{ padding: '10px 12px', fontSize: '0.78rem', color: '#64748b' }}>
                                                    {new Date(a.created_at + 'Z').toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}
                                                </td>
                                                <td style={{ padding: '10px 12px' }}>
                                                    <button
                                                        onClick={() => { setShowStudentLookup(false); fetchAppDetails(a.id); }}
                                                        style={{ padding: '5px 12px', fontSize: '0.78rem', fontWeight: 600, background: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit' }}
                                                    >View</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </>
                        )}
                        {studentLookupQuery.trim().length >= 3 && studentLookupResults.length === 0 && (
                            <p style={{ color: '#94a3b8', textAlign: 'center', padding: '48px', fontSize: '0.875rem' }}>
                                No applications found for "{studentLookupQuery.trim()}"
                            </p>
                        )}
                        {studentLookupQuery.trim().length < 3 && (
                            <p style={{ color: '#94a3b8', textAlign: 'center', padding: '48px', fontSize: '0.875rem' }}>
                                Enter at least 3 characters to search
                            </p>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const ArchivedPanel = () => {
        if (!showArchivedPanel) return null;
        return (
            <div style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ width: 'min(860px, 95vw)', height: '100%', background: 'white', display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)' }}>
                    <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>Archived Applications</h2>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>{archivedApplications.length} archived application{archivedApplications.length !== 1 ? 's' : ''}</p>
                        </div>
                        <button onClick={() => setShowArchivedPanel(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' }}>✕</button>
                    </div>
                    <div style={{ flex: 1, overflow: 'auto', padding: '16px 24px' }}>
                        {archivedLoading ? (
                            <p style={{ color: '#64748b', textAlign: 'center', marginTop: '40px' }}>Loading...</p>
                        ) : archivedApplications.length === 0 ? (
                            <p style={{ color: '#64748b', textAlign: 'center', marginTop: '40px' }}>No archived applications found.</p>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                <thead>
                                    <tr style={{ background: '#f8fafc' }}>
                                        {['App ID', 'Form Type', 'Applicant', 'Campus', 'Status', 'Archived By', 'Action'].map(h => (
                                            <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#475569', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {archivedApplications.map(app => (
                                        <tr key={app.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: '12px', color: '#4F46E5', fontWeight: 600 }}>{app.id}</td>
                                            <td style={{ padding: '10px 12px', color: '#0f172a', maxWidth: '200px' }}>{app.form_type?.replace('Application for ', '')}</td>
                                            <td style={{ padding: '10px 12px', color: '#0f172a', fontWeight: 600 }}>{app.applicant_name}</td>
                                            <td style={{ padding: '10px 12px', color: '#64748b' }}>{app.campus?.replace(' Campus', '')}</td>
                                            <td style={{ padding: '10px 12px' }}>
                                                <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, background: '#f1f5f9', color: '#475569' }}>{app.status}</span>
                                            </td>
                                            <td style={{ padding: '10px 12px', color: '#64748b', fontSize: '12px' }}>{app.archived_by || 'Admin'}</td>
                                            <td style={{ padding: '10px 12px' }}>
                                                <button
                                                    onClick={() => {
                                                        if (window.confirm(`Restore application ${app.id} for ${app.applicant_name}?`)) {
                                                            unarchiveApplication(app.id);
                                                        }
                                                    }}
                                                    style={{ padding: '5px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                                                >
                                                    Restore
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const AuditLogPanel = () => {
        if (!showAuditLog) return null;
        const ACTION_FILTERS = ['ALL', 'LOGIN', 'APPROVED', 'REJECTED', 'COMPLETED', 'DISPATCHED', 'HOLD_RESOLVED', 'RESPONSE_UPLOADED', 'DELETED', 'FORM_TOGGLED'];
        return (
            <div style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ width: 'min(800px, 95vw)', height: '100%', background: 'white', display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)' }}>
                    {/* Header */}
                    <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>Audit Log</h2>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Last 100 admin actions</p>
                        </div>
                        <button onClick={() => setShowAuditLog(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' }}>✕</button>
                    </div>
                    {/* Filter tabs */}
                    <div style={{ padding: '12px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '6px', flexWrap: 'wrap', flexShrink: 0 }}>
                        {ACTION_FILTERS.map(a => (
                            <button key={a} onClick={() => setAuditActionFilter(a)}
                                style={{ padding: '4px 12px', fontSize: '0.75rem', fontWeight: 600, borderRadius: '999px', cursor: 'pointer', fontFamily: 'inherit', border: auditActionFilter === a ? 'none' : '1px solid #e2e8f0', background: auditActionFilter === a ? '#4F46E5' : 'white', color: auditActionFilter === a ? 'white' : '#475569' }}>
                                {a}
                            </button>
                        ))}
                    </div>
                    {/* Table */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 24px' }}>
                        {auditLoading ? (
                            <p style={{ color: '#94a3b8', textAlign: 'center', padding: '48px' }}>Loading...</p>
                        ) : auditEntries.length === 0 ? (
                            <p style={{ color: '#94a3b8', textAlign: 'center', padding: '48px' }}>No entries found</p>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '16px' }}>
                                <thead>
                                    <tr>
                                        {['Time', 'Admin', 'Action', 'Application ID', 'Details'].map(h => (
                                            <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {auditEntries.map(entry => (
                                        <tr key={entry.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: '0.75rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                                                {new Date(entry.created_at + 'Z').toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })}
                                            </td>
                                            <td style={{ padding: '10px 12px', fontWeight: 600, fontSize: '0.82rem', color: '#0f172a' }}>{entry.admin_username}</td>
                                            <td style={{ padding: '10px 12px' }}><span style={getAuditActionStyle(entry.action)}>{entry.action}</span></td>
                                            <td style={{ padding: '10px 12px' }}>
                                                {entry.application_id ? (
                                                    <button
                                                        onClick={() => { setShowAuditLog(false); fetchAppDetails(entry.application_id); }}
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4F46E5', textDecoration: 'underline', fontSize: '0.75rem', fontFamily: 'monospace', padding: 0 }}
                                                    >{entry.application_id}</button>
                                                ) : <span style={{ color: '#94a3b8' }}>—</span>}
                                            </td>
                                            <td style={{ padding: '10px 12px', fontSize: '0.75rem', color: '#475569', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {entry.details ? entry.details : '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // Login Screen
    if (!isLoggedIn) {
        const inputStyle = {
            display: 'block', width: '100%', height: '52px',
            paddingLeft: '46px', paddingRight: '16px',
            border: '1px solid #e2e8f0', borderRadius: '8px',
            background: 'white', color: '#0F172A',
            fontSize: '0.95rem', outline: 'none',
            boxSizing: 'border-box', fontFamily: 'inherit',
            transition: 'border-color 0.2s, box-shadow 0.2s'
        };
        return (
            <>
                <style>{`
                    .login-input:focus { border-color: #ec5b13 !important; box-shadow: 0 0 0 3px rgba(236,91,19,0.12); }
                    .login-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(236,91,19,0.35) !important; }
                    .login-submit:active:not(:disabled) { transform: translateY(0); }
                    .login-help:hover { color: #ec5b13 !important; }
                    @media (max-width: 1024px) { .login-brand-panel { display: none !important; } .login-form-panel { width: 100% !important; } }
                `}</style>
                <main style={{ display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: '"Public Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>

                    {/* Left brand panel */}
                    <section className="login-brand-panel" style={{ width: '60%', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', overflow: 'hidden' }}>
                        {/* Full-panel image — covers the entire panel */}
                        <img
                            src="/SSSIHL-Ad-Block-2020.jpg"
                            alt="SSSIHL Campus"
                            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
                        />
                        {/* Bottom gradient — darkens only the lower portion so text is readable; upper image is untouched */}
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,18,35,0.88) 0%, rgba(10,18,35,0.35) 40%, transparent 65%)', pointerEvents: 'none' }} />

                        {/* Typography — anchored to the bottom */}
                        <div style={{ position: 'relative', zIndex: 1, padding: '48px' }}>
                            <h1 style={{ color: 'white', fontSize: '2.6rem', fontWeight: 900, lineHeight: 1.15, margin: '0 0 10px 0', letterSpacing: '-0.02em', textShadow: '0 2px 16px rgba(0,0,0,0.5)' }}>
                                Student Service<br />
                                <span style={{ color: '#ec5b13' }}>Admin Portal</span>
                            </h1>
                            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.95rem', margin: 0, fontWeight: 500, textShadow: '0 1px 8px rgba(0,0,0,0.6)', letterSpacing: '0.01em' }}>
                                Sri Sathya Sai Institute of Higher Learning
                            </p>
                        </div>
                    </section>

                    {/* Right login panel */}
                    <section className="login-form-panel" style={{ width: '40%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#F8FAFC', padding: '48px 64px', overflowY: 'auto' }}>
                        <div style={{ width: '100%', maxWidth: '440px' }}>

                            {/* Header */}
                            <div style={{ marginBottom: '40px' }}>
                                <img
                                    src="/Examinations_Service.png"
                                    alt="Examination Services"
                                    style={{ maxWidth: '100%', height: 'auto', objectFit: 'contain', display: 'block', marginBottom: '16px' }}
                                />
                                <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0, textAlign: 'center' }}>Sign in to your admin dashboard</p>
                            </div>

                            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {/* Username */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A' }}>Username or Email</label>
                                    <div style={{ position: 'relative' }}>
                                        <div style={{ position: 'absolute', top: '50%', left: '14px', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                                            <svg width="18" height="18" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                                                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
                                            </svg>
                                        </div>
                                        <input
                                            className="login-input"
                                            type="text"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            style={inputStyle}
                                            placeholder="Enter your admin username"
                                            required
                                            autoComplete="username"
                                        />
                                    </div>
                                </div>

                                {/* Password */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A' }}>Password</label>
                                    </div>
                                    <div style={{ position: 'relative' }}>
                                        <div style={{ position: 'absolute', top: '50%', left: '14px', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                                            <svg width="18" height="18" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
                                            </svg>
                                        </div>
                                        <input
                                            className="login-input"
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            style={{ ...inputStyle, paddingRight: '46px' }}
                                            placeholder="••••••••"
                                            required
                                            autoComplete="current-password"
                                        />
                                        {/* Show/hide toggle */}
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(p => !p)}
                                            style={{ position: 'absolute', top: '50%', right: '14px', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#94a3b8', display: 'flex', alignItems: 'center' }}
                                        >
                                            {showPassword ? (
                                                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                                                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
                                                </svg>
                                            ) : (
                                                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {loginError && (
                                    <p style={{ color: '#ef4444', fontSize: '0.85rem', textAlign: 'center', margin: 0 }}>{loginError}</p>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="login-submit"
                                    style={{
                                        width: '100%', height: '52px', marginTop: '4px',
                                        background: 'linear-gradient(135deg, #ec5b13 0%, #b84209 100%)',
                                        color: 'white', fontWeight: 700, fontSize: '1rem',
                                        border: 'none', borderRadius: '8px',
                                        cursor: loading ? 'not-allowed' : 'pointer',
                                        opacity: loading ? 0.7 : 1,
                                        boxShadow: '0 4px 15px rgba(236,91,19,0.25)',
                                        transition: 'all 0.2s ease',
                                        fontFamily: 'inherit',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                    }}
                                >
                                    <span>{loading ? 'Signing in...' : 'Sign In'}</span>
                                    {!loading && (
                                        <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                                            <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
                                        </svg>
                                    )}
                                </button>
                            </form>

                            {/* Help link */}
                            <div style={{ marginTop: '40px', textAlign: 'center' }}>
                                <button type="button" className="login-help" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '0.875rem', fontWeight: 500, fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: '6px', transition: 'color 0.2s' }}>
                                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                                        <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                                    </svg>
                                    Need help with your account?
                                </button>
                            </div>
                        </div>
                    </section>
                </main>
            </>
        );
    }

    // Detail view locals (use optional chaining since they may be null)
    const app = appDetails?.application;
    const statusIcon = app?.status === 'COMPLETED' || app?.status === 'APPROVED'
        ? <CheckCircle size={16} />
        : app?.status === 'REJECTED' ? <XCircle size={16} /> : <Clock size={16} />;
    const detailLabelStyle = { fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8', margin: '0 0 4px 0' };
    const detailValueStyle = { fontSize: '0.9rem', fontWeight: 600, color: '#0F172A', margin: 0, lineHeight: 1.4 };
    const FIELD_LABEL_OVERRIDES = { paper_codes: 'Course Code(s)', paper_titles: 'Course Title(s)' };
    const formatFieldKey = (key) =>
        FIELD_LABEL_OVERRIDES[key] ||
        key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim().replace(/\b\w/g, c => c.toUpperCase());
    const formatFieldValue = (value) => {
        if (value === null || value === undefined || value === '') return '—';
        try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) {
                return parsed.map((item) =>
                    typeof item === 'object'
                        ? Object.entries(item).map(([k, v]) => `${formatFieldKey(k)}: ${v}`).join(' | ')
                        : item
                ).join('\n');
            }
            return String(value);
        } catch { return String(value); }
    };

    // Dashboard computed values
    const CAMPUS_ORDER = ['Prasanthi Nilayam Campus', 'Anantapur Campus', 'Brindavan Campus', 'Nandigiri Campus'];
    const campusBreakdown = CAMPUS_ORDER.map(c => ({ label: c, count: applications.filter(a => a.campus === c).length }));


    const filteredApplications = (() => {
        let list = applications
            .filter(a => {
                if (!searchQuery.trim()) return true;
                const q = searchQuery.toLowerCase();
                return [a.id, a.applicant_name, a.reg_no, a.student_email, a.form_type, a.campus, a.status]
                    .some(f => f?.toLowerCase().includes(q));
            })
            .filter(a => statusFilter === 'ALL' || a.status === statusFilter || (statusFilter === 'APPROVED' && a.status === 'DIRECTOR_APPROVED'))
            .filter(a => campusFilter === 'ALL' || a.campus === campusFilter);
        return urgencySort ? sortByUrgency(list)
            : list.sort((a, b) => new Date((b.created_at || '') + 'Z') - new Date((a.created_at || '') + 'Z'));
    })();

    const sparklineAll = getSparklineData(applications);
    const sparklinePending = getSparklineData(applications.filter(a => a.status === 'PENDING'));
    const recentActivity = [...applications]
        .sort((a, b) => new Date((b.created_at || '') + 'Z') - new Date((a.created_at || '') + 'Z'))
        .slice(0, 10);

    const studentLookupResults = studentLookupQuery.trim().length >= 3
        ? applications.filter(a => a.reg_no?.toLowerCase().includes(studentLookupQuery.trim().toLowerCase()))
        : [];

    const lookupStats = {
        total: studentLookupResults.length,
        pending: studentLookupResults.filter(a => a.status === 'PENDING').length,
        completed: studentLookupResults.filter(a => ['COMPLETED', 'DISPATCHED'].includes(a.status)).length,
        rejected: studentLookupResults.filter(a => a.status === 'REJECTED').length,
    };

    const sidebarBtnBase = { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '11px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', fontFamily: 'inherit', border: 'none', transition: 'all 0.15s ease' };
    const fileRowStyle = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: '8px', border: '1px solid #f1f5f9', marginBottom: '8px', gap: '12px' };
    const downloadBtnStyle = { display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', background: 'white', color: '#334155', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, fontFamily: 'inherit', flexShrink: 0 };

    const Sparkline = ({ data, color = '#6366f1' }) => {
        const max = Math.max(...data, 1);
        const pts = data.map((v, i) => `${(i / (data.length - 1)) * 60},${24 - (v / max) * 22}`).join(' ');
        return (
            <svg width="60" height="24" style={{ display: 'block', overflow: 'visible' }}>
                <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
            </svg>
        );
    };

    const DonutChart = ({ data, colors }) => {
        const total = data.reduce((s, d) => s + d.count, 0);
        if (!total) return <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: 0 }}>No data</p>;
        const r = 36, cx = 44, cy = 44, sw = 12, circ = 2 * Math.PI * r;
        let offset = 0;
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <svg width="88" height="88">
                    {data.map((d, i) => {
                        if (!d.count) return null;
                        const pct = d.count / total, dash = pct * circ, gap = circ - dash;
                        const seg = (
                            <circle key={d.label} cx={cx} cy={cy} r={r} fill="none"
                                stroke={colors[i % colors.length]} strokeWidth={sw}
                                strokeDasharray={`${dash} ${gap}`} strokeDashoffset={-offset * circ}
                                style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px` }} />
                        );
                        offset += pct; return seg;
                    })}
                    <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle"
                        style={{ fontSize: '13px', fontWeight: 700, fill: '#0f172a' }}>{total}</text>
                </svg>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {data.map((d, i) => (
                        <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: colors[i % colors.length], flexShrink: 0 }} />
                            <span style={{ fontSize: '0.72rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                                {d.label.replace(' Campus', '')} <b style={{ color: '#0f172a' }}>{d.count}</b>
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // NEW SINGLE RETURN
    return (
        <>
            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                .dash-row:hover td { background: #f8fafc !important; }
                .dash-row td { transition: background 0.15s; }
                .dash-row { border-left-width: 4px; border-left-style: solid; }
                .dash-row td:first-child { padding-left: 14px; }
                .btn-complete, .btn-upload, .btn-delete, .btn-archive, .btn-download, .btn-back, .det-dl-btn { transition: all 0.2s ease; }
                .btn-complete:hover:not(:disabled) { filter: brightness(1.08); transform: translateY(-1px); }
                .btn-upload:hover:not(:disabled) { filter: brightness(1.08); transform: translateY(-1px); }
                .btn-delete:hover { background: rgba(239,68,68,0.08) !important; border-color: #ef4444 !important; }
                .btn-archive:hover { background: rgba(245,158,11,0.08) !important; border-color: #f59e0b !important; }
                .det-dl-btn:hover { background: #f8fafc !important; border-color: #94a3b8 !important; }
                .btn-back-det:hover { color: #0F172A !important; }
                .btn-back-det { transition: color 0.15s ease; }
                .detail-pdf-btn:hover { background: #1e293b !important; }
                .detail-pdf-btn { transition: background 0.15s ease; }
                @media (max-width: 900px) { .det-grid { grid-template-columns: 1fr !important; } }
                aside nav button:hover { background: rgba(255,255,255,0.06) !important; color: #e2e8f0 !important; }
                .btn-modal-cancel { transition: all 0.15s ease; }
                .btn-modal-cancel:hover { background: #e2e8f0 !important; }
                .btn-modal-confirm { transition: all 0.15s ease; }
                .btn-modal-confirm:hover { filter: brightness(1.1); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
                .btn-modal-confirm:active { transform: translateY(0); }
            `}</style>
            <ToastNotification />
            <PdfViewerModal />
            <ConfirmationModal />
            <DispatchModal />
            <EditModal />
            <StudentLookupPanel />
            <AuditLogPanel />
            <ArchivedPanel />

            <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>

                {/* TOP NAVBAR */}
                <header style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '52px', background: '#0F172A', display: 'flex', alignItems: 'center', padding: '0 20px', gap: '16px', zIndex: 50, borderBottom: '1px solid #1e293b' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                        <img src="/logo.png" alt="Logo" style={{ height: '28px', width: '28px', objectFit: 'contain' }} />
                        <span style={{ color: 'white', fontWeight: 700, fontSize: '0.82rem', whiteSpace: 'nowrap' }}>Exam Services Admin</span>
                    </div>
                    <div style={{ flex: 1, maxWidth: '320px', position: 'relative' }}>
                        <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }} />
                        <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search by name, App ID, Reg No..."
                            style={{ width: '100%', height: '32px', paddingLeft: '30px', paddingRight: searchQuery ? '28px' : '10px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: 'white', fontSize: '0.78rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 0 }}>
                                <X size={11} />
                            </button>
                        )}
                    </div>
                    <div style={{ flex: 1 }} />
                    {lastUpdated && <span style={{ color: '#475569', fontSize: '0.68rem', whiteSpace: 'nowrap' }}>Updated {lastUpdated.toLocaleTimeString()}</span>}
                    <button onClick={handleManualRefresh} disabled={isRefreshing}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 12px', background: 'transparent', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px', cursor: isRefreshing ? 'not-allowed' : 'pointer', fontSize: '0.75rem', fontWeight: 500, fontFamily: 'inherit', opacity: isRefreshing ? 0.5 : 1, flexShrink: 0 }}>
                        <RefreshCw size={12} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
                        {isRefreshing ? 'Refreshing...' : 'Refresh'}
                    </button>
                    <button onClick={() => setFormsDrawerOpen(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 12px', background: 'transparent', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 500, fontFamily: 'inherit', flexShrink: 0 }}>
                        ⚙ Forms
                    </button>
                    <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', background: adminRole === 'ug' ? '#1d4ed8' : adminRole === 'pg' ? '#7c3aed' : adminRole === 'phd' ? '#065f46' : '#1e293b', color: 'white', flexShrink: 0 }}>
                        {adminRole === 'ug' ? 'UG Team' : adminRole === 'pg' ? 'PG Team' : adminRole === 'phd' ? 'PhD Team' : 'Admin'}
                    </span>
                    <button onClick={handleLogout}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 12px', background: 'transparent', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 500, fontFamily: 'inherit', flexShrink: 0 }}>
                        <LogOut size={12} /> Logout
                    </button>
                </header>

                {/* MAIN AREA */}
                <div style={{ paddingTop: '52px', minHeight: '100vh' }}>
                    {selectedApp && appDetails ? (
                        /* DETAIL VIEW */
                        <div style={{ padding: '28px 24px' }}>
                            <button className="btn-back-det" onClick={() => { setSelectedApp(null); setAppDetails(null); }}
                                style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '0.875rem', fontWeight: 600, marginBottom: '24px', padding: 0, fontFamily: 'inherit' }}>
                                <ArrowLeft size={15} /> Back to Applications
                            </button>

                            {/* Breadcrumb + Title */}
                        <div style={{ marginBottom: '28px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                                <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>Applications</span>
                                <span style={{ color: '#cbd5e1' }}>›</span>
                                <span style={{ color: '#64748b', fontSize: '0.82rem', fontWeight: 600 }}>Request Details</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                                <div>
                                    <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0F172A', margin: '0 0 10px 0', letterSpacing: '-0.02em' }}>{app.form_type}</h1>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                        <span style={{ ...getStatusStyle(app.status), display: 'inline-flex', alignItems: 'center', gap: '4px' }}>{statusIcon} {app.status}</span>
                                        <span style={{ color: '#cbd5e1' }}>•</span>
                                        <span style={{ color: '#64748b', fontSize: '0.82rem', fontFamily: 'monospace' }}>ID: {app.id}</span>
                                        <span style={{ color: '#cbd5e1' }}>•</span>
                                        <span style={{ color: '#64748b', fontSize: '0.82rem' }}>Submitted: {new Date(app.created_at + 'Z').toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}</span>
                                    </div>
                                </div>
                                <button className="detail-pdf-btn" onClick={() => generatePDF(app, appDetails)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#0F172A', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', fontFamily: 'inherit' }}>
                                    <Download size={15} /> Download PDF
                                </button>
                            </div>
                        </div>

                        {/* 2-column grid */}
                        <div className="det-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px', alignItems: 'start' }}>

                            {/* Left column */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                                {/* Applicant Information */}
                                <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                    {app.form_type === 'Application for Re-Totalling of Marks' ? (() => {
                                        const fd = appDetails.formData || {};
                                        const address = [fd.address_line1, fd.address_line2].filter(Boolean).join(', ');
                                        let courses = [];
                                        try { courses = JSON.parse(fd.paper_codes_titles_for_retotaling || '[]'); if (!Array.isArray(courses)) courses = []; } catch { courses = []; }
                                        return (<>
                                            {/* Section 1: Applicant Information */}
                                            <div style={{ padding: '14px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Users size={16} color="#4F46E5" />
                                                <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Applicant Information</h2>
                                            </div>
                                            <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                                                <div><p style={detailLabelStyle}>Full Name</p><p style={detailValueStyle}>{app.applicant_name || 'N/A'}</p></div>
                                                {address && <div style={{ gridColumn: '1 / -1' }}><p style={detailLabelStyle}>Full Postal Address</p><p style={detailValueStyle}>{address}</p></div>}
                                                <div><p style={detailLabelStyle}>City</p><p style={detailValueStyle}>{fd.city || 'N/A'}</p></div>
                                                <div><p style={detailLabelStyle}>State / Province</p><p style={detailValueStyle}>{fd.state_province || 'N/A'}</p></div>
                                                <div><p style={detailLabelStyle}>Country</p><p style={detailValueStyle}>{fd.country || 'N/A'}</p></div>
                                                <div><p style={detailLabelStyle}>Postal Code</p><p style={detailValueStyle}>{fd.postal_code || 'N/A'}</p></div>
                                                <div><p style={detailLabelStyle}>Mobile Number</p><p style={detailValueStyle}>{fd.Mobile_Number || 'N/A'}</p></div>
                                                <div><p style={detailLabelStyle}>Email</p><p style={{ ...detailValueStyle, wordBreak: 'break-all' }}>{app.student_email || 'N/A'}</p></div>
                                                <div><p style={detailLabelStyle}>ABC / APAAR ID</p><p style={detailValueStyle}>{app.abc_apaar_id || 'N/A'}</p></div>
                                                <div><p style={detailLabelStyle}>Date of Submission</p><p style={detailValueStyle}>{app.created_at ? new Date(app.created_at + (app.created_at.includes('Z') ? '' : 'Z')).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'N/A'}</p></div>
                                            </div>
                                            {/* Section 2: Official Information */}
                                            <div style={{ padding: '14px 20px', borderTop: '2px solid #f1f5f9', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc' }}>
                                                <FileText size={16} color="#0891b2" />
                                                <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Official Information</h2>
                                            </div>
                                            <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                                                <div><p style={detailLabelStyle}>Campus</p><p style={detailValueStyle}>{app.campus || 'N/A'}</p></div>
                                                <div><p style={detailLabelStyle}>Registered Number</p><p style={{ ...detailValueStyle, fontFamily: 'monospace' }}>{app.reg_no || fd.reg_no || 'N/A'}</p></div>
                                                <div><p style={detailLabelStyle}>Academic Programme</p><p style={detailValueStyle}>{fd.Programme || app.programme || 'N/A'}</p></div>
                                                <div><p style={detailLabelStyle}>Examination Type</p><p style={detailValueStyle}>{fd.exam_type || 'N/A'}</p></div>
                                                <div><p style={detailLabelStyle}>Examination Period</p><p style={detailValueStyle}>{fd.period_of_examination || 'N/A'}</p></div>
                                                <div><p style={detailLabelStyle}>SBI Receipt Uploaded</p><p style={detailValueStyle}>{appDetails.files?.some(f => f.field_name === 'sbiReceipt') ? 'Yes' : 'No'}</p></div>
                                            </div>
                                            {courses.length > 0 && (
                                                <div style={{ padding: '0 20px 20px' }}>
                                                    <p style={{ ...detailLabelStyle, marginBottom: '8px' }}>Courses for Re-Totalling</p>
                                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                                        <thead><tr style={{ background: '#f8fafc' }}>
                                                            <th style={{ border: '1px solid #e2e8f0', padding: '6px 10px', textAlign: 'left', fontWeight: 600, color: '#64748b' }}>Code</th>
                                                            <th style={{ border: '1px solid #e2e8f0', padding: '6px 10px', textAlign: 'left', fontWeight: 600, color: '#64748b' }}>Title</th>
                                                            <th style={{ border: '1px solid #e2e8f0', padding: '6px 10px', textAlign: 'left', fontWeight: 600, color: '#64748b' }}>Semester</th>
                                                        </tr></thead>
                                                        <tbody>{courses.map((c, i) => (
                                                            <tr key={i}><td style={{ border: '1px solid #e2e8f0', padding: '6px 10px', fontFamily: 'monospace' }}>{c.code || c.Code || ''}</td><td style={{ border: '1px solid #e2e8f0', padding: '6px 10px' }}>{c.title || c.Title || ''}</td><td style={{ border: '1px solid #e2e8f0', padding: '6px 10px' }}>{c.semester || c.Semester || ''}</td></tr>
                                                        ))}</tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </>);
                                    })() : app.form_type === 'Application for CGPA to Percentage Conversion' ? (() => {
                                        const fd = appDetails.formData || {};
                                        const address = [fd.address_line1, fd.address_line2].filter(Boolean).join(', ');
                                        return (<>
                                            {/* Section 1: Applicant Information */}
                                            <div style={{ padding: '14px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Users size={16} color="#4F46E5" />
                                                <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Applicant Information</h2>
                                            </div>
                                            <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                                                <div><p style={detailLabelStyle}>Full Name</p><p style={detailValueStyle}>{app.applicant_name || 'N/A'}</p></div>
                                                {address && <div style={{ gridColumn: '1 / -1' }}><p style={detailLabelStyle}>Address</p><p style={detailValueStyle}>{address}</p></div>}
                                                <div><p style={detailLabelStyle}>City</p><p style={detailValueStyle}>{fd.city || 'N/A'}</p></div>
                                                <div><p style={detailLabelStyle}>State</p><p style={detailValueStyle}>{fd.state_province || 'N/A'}</p></div>
                                                <div><p style={detailLabelStyle}>Country</p><p style={detailValueStyle}>{fd.country || 'N/A'}</p></div>
                                                <div><p style={detailLabelStyle}>Postal Code</p><p style={detailValueStyle}>{fd.postal_code || 'N/A'}</p></div>
                                                <div><p style={detailLabelStyle}>Mobile Number</p><p style={detailValueStyle}>{fd.Mobile_Number || 'N/A'}</p></div>
                                                <div><p style={detailLabelStyle}>Email</p><p style={{ ...detailValueStyle, wordBreak: 'break-all' }}>{app.student_email || 'N/A'}</p></div>
                                            </div>
                                            {/* Section 2: Official Information */}
                                            <div style={{ padding: '14px 20px', borderTop: '2px solid #f1f5f9', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc' }}>
                                                <FileText size={16} color="#0891b2" />
                                                <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Official Information</h2>
                                            </div>
                                            <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                                                <div><p style={detailLabelStyle}>Campus</p><p style={detailValueStyle}>{app.campus || 'N/A'}</p></div>
                                                <div><p style={detailLabelStyle}>Registered Number</p><p style={{ ...detailValueStyle, fontFamily: 'monospace' }}>{fd.Registration_Number || app.reg_no || 'N/A'}</p></div>
                                                <div><p style={detailLabelStyle}>Programme</p><p style={detailValueStyle}>{fd.Programme || app.programme || 'N/A'}</p></div>
                                                <div><p style={detailLabelStyle}>Period of Study</p><p style={detailValueStyle}>{fd.Period_of_Study || 'N/A'}</p></div>
                                                <div><p style={detailLabelStyle}>Graduation Year</p><p style={detailValueStyle}>{fd.graduation_year || 'N/A'}</p></div>
                                                <div><p style={detailLabelStyle}>CGPA</p><p style={detailValueStyle}>{fd.CGPA || 'N/A'}</p></div>
                                            </div>
                                        </>);
                                    })() : app.form_type === 'Application for Supplementary Examinations Registration' || app.form_type === 'Application for Repeating Examinations Registration (CIE and ESE)' ? (() => {
                                        const fd = appDetails.formData || {};
                                        const st = appDetails.stageTimestamps || {};
                                        const fmtDate = (d) => d ? new Date(d + (d.includes('T') ? '' : 'Z')).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }) : 'N/A';
                                        const address = [fd.address_line1, fd.address_line2].filter(Boolean).join(', ');
                                        return (<>
                                            {/* Section 1: Personal Information */}
                                            <div style={{ padding: '14px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Users size={16} color="#4F46E5" />
                                                <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Personal Information</h2>
                                            </div>
                                            <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                                                <div><p style={detailLabelStyle}>Full Name</p><p style={detailValueStyle}>{app.applicant_name}</p></div>
                                                {address && <div style={{ gridColumn: '1 / -1' }}><p style={detailLabelStyle}>Address</p><p style={detailValueStyle}>{address}</p></div>}
                                                <div><p style={detailLabelStyle}>City</p><p style={detailValueStyle}>{fd.city || 'N/A'}</p></div>
                                                <div><p style={detailLabelStyle}>State / Province</p><p style={detailValueStyle}>{fd.state_province || 'N/A'}</p></div>
                                                <div><p style={detailLabelStyle}>Country</p><p style={detailValueStyle}>{fd.country || 'N/A'}</p></div>
                                                <div><p style={detailLabelStyle}>Postal Code</p><p style={detailValueStyle}>{fd.postal_code || 'N/A'}</p></div>
                                                <div><p style={detailLabelStyle}>Mobile Number</p><p style={detailValueStyle}>{fd.Mobile_Number || 'N/A'}</p></div>
                                                <div><p style={detailLabelStyle}>Email Address</p><p style={{ ...detailValueStyle, wordBreak: 'break-all' }}>{app.student_email}</p></div>
                                                <div><p style={detailLabelStyle}>Declaration</p><p style={detailValueStyle}>{fd.declaration || 'N/A'}</p></div>
                                                <div><p style={detailLabelStyle}>Submitted On</p><p style={detailValueStyle}>{fmtDate(app.created_at)}</p></div>
                                            </div>
                                            {/* Section 2: Official Information */}
                                            <div style={{ padding: '14px 20px', borderTop: '2px solid #f1f5f9', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc' }}>
                                                <FileText size={16} color="#0891b2" />
                                                <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Official Information</h2>
                                            </div>
                                            <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                                                <div><p style={detailLabelStyle}>Campus</p><p style={detailValueStyle}>{app.campus}</p></div>
                                                <div><p style={detailLabelStyle}>Registration Number</p><p style={{ ...detailValueStyle, fontFamily: 'monospace' }}>{app.reg_no || 'N/A'}</p></div>
                                                <div><p style={detailLabelStyle}>Programme</p><p style={detailValueStyle}>{fd.Programme || app.programme || 'N/A'}</p></div>
                                                <div><p style={detailLabelStyle}>Course Code(s)</p><p style={detailValueStyle}>{fd.paper_codes || 'N/A'}</p></div>
                                                <div style={{ gridColumn: fd.paper_titles?.length > 40 ? '1 / -1' : undefined }}><p style={detailLabelStyle}>Course Title(s)</p><p style={detailValueStyle}>{fd.paper_titles || 'N/A'}</p></div>
                                                <div><p style={detailLabelStyle}>Semester</p><p style={detailValueStyle}>{fd.Semester || 'N/A'}</p></div>
                                                <div><p style={detailLabelStyle}>Period of Study</p><p style={detailValueStyle}>{fd.Period_of_Study || 'N/A'}</p></div>
                                                <div><p style={detailLabelStyle}>Campus Forwarded to Director</p><p style={detailValueStyle}>{fmtDate(st.campusForwardedAt)}</p></div>
                                                <div><p style={detailLabelStyle}>Director Approved On</p><p style={detailValueStyle}>{fmtDate(st.directorApprovedAt)}</p></div>
                                                <div><p style={detailLabelStyle}>Submitted to COE On</p><p style={detailValueStyle}>{fmtDate(st.coeSubmittedAt)}</p></div>
                                            </div>
                                        </>);
                                    })() : (<>
                                    <div style={{ padding: '14px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Users size={16} color="#4F46E5" />
                                        <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Applicant Information</h2>
                                    </div>
                                    <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px' }}>
                                        <div><p style={detailLabelStyle}>Full Name</p><p style={detailValueStyle}>{app.applicant_name}</p></div>
                                        <div><p style={detailLabelStyle}>Email Address</p><p style={{ ...detailValueStyle, wordBreak: 'break-all' }}>{app.student_email}</p></div>
                                        <div><p style={detailLabelStyle}>Registration No</p><p style={{ ...detailValueStyle, fontFamily: 'monospace' }}>{app.reg_no || 'N/A'}</p></div>
                                        <div><p style={detailLabelStyle}>Campus</p><p style={detailValueStyle}>{app.campus}</p></div>
                                        <div><p style={detailLabelStyle}>Submitted On</p><p style={detailValueStyle}>{new Date(app.created_at + 'Z').toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p></div>
                                    </div></>)}
                                    {appDetails.formData?.delivery_preference && (
                                        <div style={{ margin: '0 20px 16px 20px' }}>
                                            <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px 0' }}>Delivery Preference</p>
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
                                                📦 {appDetails.formData.delivery_preference}
                                            </span>
                                        </div>
                                    )}
                                    {appDetails.formData && Object.keys(appDetails.formData).length > 0 && app.form_type !== 'Application for Supplementary Examinations Registration' && app.form_type !== 'Application for Repeating Examinations Registration (CIE and ESE)' && app.form_type !== 'Application for CGPA to Percentage Conversion' && app.form_type !== 'Application for Re-Totalling of Marks' && (() => {
                                        const SKIP = new Set([
                                            'id', 'application_id', 'created_at',
                                            // Already shown in the basic info grid above
                                            'student_name', 'applicant_name', 'student_email', 'email',
                                            'reg_no', 'registration_number', 'Registration_Number', 'campus', 'Campus',
                                            // Internal status fields (not student-entered data)
                                            'director_approval_status', 'controller_approval_status',
                                            'director_status', 'controller_status', 'status',
                                            // Shown separately as a highlighted badge above
                                            'delivery_preference',
                                        ]);
                                        const PERSONAL_FIRST = new Set(['Mobile_Number', 'mobile_number', 'mobile', 'address_line1', 'address_line2', 'country', 'state_province', 'city', 'postal_code']);
                                        const ACADEMIC_LAST = new Set(['Period_of_Study', 'period_of_study', 'Registration_Number', 'registration_number', 'Programme', 'programme', 'Semester', 'semester', 'paper_codes', 'paper_titles', 'graduation_year', 'year_of_passing', 'abc_apaar_id', 'abcApaarId']);
                                        const entries = Object.entries(appDetails.formData)
                                            .filter(([k, v]) => !SKIP.has(k) && v !== null && v !== '')
                                            .sort(([a], [b]) => {
                                                const rank = k => PERSONAL_FIRST.has(k) ? 0 : ACADEMIC_LAST.has(k) ? 2 : 1;
                                                return rank(a) - rank(b);
                                            });
                                        if (entries.length === 0) return null;
                                        return (
                                            <>
                                                <div style={{ margin: '0 20px', borderTop: '1px solid #f1f5f9', paddingTop: '16px', marginBottom: '4px' }}>
                                                    <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 12px 0' }}>Form Details</p>
                                                </div>
                                                <div style={{ padding: '0 20px 20px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                                                    {entries.map(([key, value]) => {
                                                        const formatted = formatFieldValue(value);
                                                        const isMultiLine = formatted.includes('\n');
                                                        return (
                                                            <div key={key} style={isMultiLine ? { gridColumn: '1 / -1' } : {}}>
                                                                <p style={detailLabelStyle}>{formatFieldKey(key)}</p>
                                                                {isMultiLine
                                                                    ? <pre style={{ ...detailValueStyle, fontFamily: 'inherit', whiteSpace: 'pre-wrap', margin: 0 }}>{formatted}</pre>
                                                                    : <p style={detailValueStyle}>{formatted}</p>
                                                                }
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </>
                                        );
                                    })()}
                                    {app.director_comment && (
                                        <div style={{ margin: '0 20px 20px 20px', background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: '10px', padding: '16px' }}>
                                            <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#7c3aed', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Director's Comments</p>
                                            <p style={{ fontSize: '0.9rem', color: '#4c1d95', margin: 0, lineHeight: 1.7 }}>{DOMPurify.sanitize(app.director_comment)}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Documents */}
                                <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                    <div style={{ padding: '14px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <FileText size={16} color="#f59e0b" />
                                            <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Documents</h2>
                                        </div>
                                        {appDetails.files && <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>{(appDetails.files.length + (appDetails.responseDocuments?.length || 0))} FILES</span>}
                                    </div>
                                    <div style={{ padding: '20px' }}>
                                        {appDetails.responseDocuments?.filter(f => f.uploaded_by !== 'director').length > 0 && (
                                            <div style={{ marginBottom: '20px' }}>
                                                <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#10b981', margin: '0 0 10px 0' }}>Response Documents — Admin Uploaded</p>
                                                {appDetails.responseDocuments.filter(f => f.uploaded_by !== 'director').map((file) => (
                                                    <div key={file.id} style={{ ...fileRowStyle, borderLeft: '3px solid #10b981' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                                                            <div style={{ background: 'rgba(16,185,129,0.08)', padding: '8px', borderRadius: '6px', flexShrink: 0 }}><FileText size={16} color="#10b981" /></div>
                                                            <div style={{ minWidth: 0 }}>
                                                                <p style={{ color: '#0F172A', margin: 0, fontWeight: 600, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.file_name}</p>
                                                                <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.75rem' }}>{file.file_type} · {(file.file_size / 1024).toFixed(1)} KB · {file.uploaded_by || 'Admin'}</p>
                                                            </div>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                                                            <button
                                                                onClick={() => viewFile(file.id, file.file_name)}
                                                                style={{
                                                                    display: 'flex', alignItems: 'center', gap: '5px',
                                                                    padding: '6px 14px', fontSize: '0.8rem', fontWeight: 600,
                                                                    background: 'white', border: '1px solid #e0e7ff',
                                                                    color: '#4F46E5', borderRadius: '8px', cursor: 'pointer',
                                                                    fontFamily: 'inherit'
                                                                }}
                                                            >
                                                                <Eye size={13} /> View
                                                            </button>
                                                            <button className="det-dl-btn" onClick={() => downloadFile(file.id, file.file_name)} style={downloadBtnStyle}><Download size={14} /> Download</button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {appDetails.responseDocuments?.filter(f => f.uploaded_by === 'director').length > 0 && (
                                            <div style={{ marginBottom: '20px' }}>
                                                <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#f59e0b', margin: '0 0 10px 0' }}>Director Documents</p>
                                                {appDetails.responseDocuments.filter(f => f.uploaded_by === 'director').map((file) => (
                                                    <div key={file.id} style={{ ...fileRowStyle, borderLeft: '3px solid #f59e0b' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                                                            <div style={{ background: 'rgba(245,158,11,0.08)', padding: '8px', borderRadius: '6px', flexShrink: 0 }}><FileText size={16} color="#f59e0b" /></div>
                                                            <div style={{ minWidth: 0 }}>
                                                                <p style={{ color: '#0F172A', margin: 0, fontWeight: 600, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.file_name}</p>
                                                                <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.75rem' }}>{file.file_type} · {(file.file_size / 1024).toFixed(1)} KB · Director</p>
                                                            </div>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                                                            <button
                                                                onClick={() => viewFile(file.id, file.file_name)}
                                                                style={{
                                                                    display: 'flex', alignItems: 'center', gap: '5px',
                                                                    padding: '6px 14px', fontSize: '0.8rem', fontWeight: 600,
                                                                    background: 'white', border: '1px solid #e0e7ff',
                                                                    color: '#4F46E5', borderRadius: '8px', cursor: 'pointer',
                                                                    fontFamily: 'inherit'
                                                                }}
                                                            >
                                                                <Eye size={13} /> View
                                                            </button>
                                                            <button className="det-dl-btn" onClick={() => downloadFile(file.id, file.file_name)} style={downloadBtnStyle}><Download size={14} /> Download</button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#8b5cf6', margin: '0 0 10px 0' }}>Student Submitted Files</p>
                                        {appDetails.files && appDetails.files.length > 0 ? appDetails.files.map((file) => (
                                            <div key={file.id} style={{ ...fileRowStyle, borderLeft: '3px solid #a78bfa' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                                                    <div style={{ background: 'rgba(139,92,246,0.08)', padding: '8px', borderRadius: '6px', flexShrink: 0 }}><FileText size={16} color="#8b5cf6" /></div>
                                                    <div style={{ minWidth: 0 }}>
                                                        <p style={{ color: '#0F172A', margin: 0, fontWeight: 600, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.file_name}</p>
                                                        <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.75rem' }}>{file.file_type} · {(file.file_size / 1024).toFixed(1)} KB</p>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                                                    <button
                                                        onClick={() => viewFile(file.id, file.file_name)}
                                                        style={{
                                                            display: 'flex', alignItems: 'center', gap: '5px',
                                                            padding: '6px 14px', fontSize: '0.8rem', fontWeight: 600,
                                                            background: 'white', border: '1px solid #e0e7ff',
                                                            color: '#4F46E5', borderRadius: '8px', cursor: 'pointer',
                                                            fontFamily: 'inherit'
                                                        }}
                                                    >
                                                        <Eye size={13} /> View
                                                    </button>
                                                    <button className="det-dl-btn" onClick={() => downloadFile(file.id, file.file_name)} style={downloadBtnStyle}><Download size={14} /> Download</button>
                                                </div>
                                            </div>
                                        )) : <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: 0 }}>No files attached</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Right sidebar: Administrative Control */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: '80px' }}>
                                <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                    <div style={{ padding: '14px 20px', borderBottom: '1px solid #e2e8f0' }}>
                                        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Administrative Control</h3>
                                    </div>
                                    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>

                                        {/* Resolve & Proceed — only when On Hold */}
                                        {app.status === 'DIRECTOR_COMMENTED' && (
                                            <button onClick={() => resolveHold(app.id)} style={{ ...sidebarBtnBase, background: '#7c3aed', color: 'white' }}>
                                                &#10003; Resolve &amp; Proceed
                                            </button>
                                        )}

                                        {/* Notify Dispatched / Uploaded */}
                                        {(app.status === 'APPROVED' || app.status === 'DISPATCHED') && (
                                            <button onClick={() => notifyDispatched(app.id, app.form_type)} style={{ ...sidebarBtnBase, background: '#0ea5e9', color: 'white' }}>
                                                &#9993; {['Application for Supplementary Examinations Registration', 'Application for Repeating Examinations Registration (CIE and ESE)'].includes(app.form_type) ? 'Notify Student' : app.status === 'DISPATCHED' ? 'Notify: Hard Copy Dispatched' : `Notify: Document ${app.form_type === 'Application for Migration Certificate' ? 'Uploaded' : 'Dispatched'}`}
                                            </button>
                                        )}

                                        {/* Mark as Completed */}
                                        {(app.status === 'DISPATCHED' || app.status === 'COMPLETED') && (
                                            <button className="btn-complete" onClick={() => markAsCompleted(app.id)} style={{ ...sidebarBtnBase, background: '#10b981', color: 'white' }}>
                                                <CheckCircle size={16} /> Mark as Completed
                                            </button>
                                        )}

                                        {/* Upload Response */}
                                        {!(appDetails.responseDocuments && appDetails.responseDocuments.length > 0) && (
                                            <>
                                                <label className="btn-upload" style={{ ...sidebarBtnBase, background: '#4F46E5', color: 'white', cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.6 : 1 }}>
                                                    <Upload size={16} /> {uploading ? 'Uploading...' : 'Upload Response Document'}
                                                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleFileSelect(e, app.id)} style={{ display: 'none' }} disabled={uploading} />
                                                </label>
                                                {uploadError && <p style={{ color: '#ef4444', fontSize: '0.8rem', margin: 0 }}>{uploadError}</p>}
                                                {uploadSuccess && <p style={{ color: '#10b981', fontSize: '0.8rem', margin: 0 }}>Uploaded successfully!</p>}
                                            </>
                                        )}

                                        {/* Edit */}
                                        <button onClick={openEditModal} style={{ ...sidebarBtnBase, background: '#0f172a', color: 'white' }}>
                                            ✏ Edit Application
                                        </button>

                                        <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '4px 0' }} />

                                        {/* Archive */}
                                        <button className="btn-archive" onClick={() => archiveApplication(app.id)} style={{ ...sidebarBtnBase, background: 'white', color: '#d97706', border: '1px solid #fcd34d' }}>
                                            <Archive size={16} /> Archive Application
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        </div>
                    ) : (
                        /* DASHBOARD VIEW */
                        <div style={{ padding: '28px 24px' }}>
                        {/* PRIORITY HEADER */}
                        {stats && (
                            <div style={{ marginBottom: '20px' }}>
                                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                    <div style={{ flex: '1 1 140px', background: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                                            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total</span>
                                            <Sparkline data={sparklineAll} color="#6366f1" />
                                        </div>
                                        <p style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>{stats.total}</p>
                                    </div>
                                    <div style={{ flex: '1 1 140px', background: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                                            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pending</span>
                                            <Sparkline data={sparklinePending} color="#f59e0b" />
                                        </div>
                                        <p style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>{stats.pending}</p>
                                    </div>
                                    <div style={{ flex: '1 1 110px', background: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                                        <p style={{ fontSize: '0.7rem', fontWeight: 600, color: '#10b981', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Approved</p>
                                        <p style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>{stats.approved}</p>
                                    </div>
                                    <div style={{ flex: '1 1 110px', background: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                                        <p style={{ fontSize: '0.7rem', fontWeight: 600, color: '#10b981', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Completed</p>
                                        <p style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>{stats.completed ?? 0}</p>
                                    </div>
                                    <div style={{ flex: '2 1 240px', background: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                                        <p style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>By Campus</p>
                                        <DonutChart data={campusBreakdown} colors={['#6366f1', '#10b981', '#f59e0b', '#ec4899']} />
                                    </div>
                                </div>
                            </div>
                        )}

                    {/* Status filter tabs */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
                        {[
                            { label: 'All',                  value: 'ALL',                  count: stats?.total,              color: '#4F46E5' },
                            { label: 'Application Received', value: 'PENDING',              count: stats?.pending,            color: '#f59e0b' },
                            { label: 'Awaiting Campus Exam', value: 'AWAITING_CAMPUS_EXAM', count: stats?.awaitingCampusExam, color: '#f97316' },
                            { label: 'Awaiting Director',    value: 'AWAITING_DIRECTOR',    count: null,                      color: '#8b5cf6' },
                            { label: 'Dir. Comments',        value: 'DIRECTOR_COMMENTED',   count: null,                      color: '#7c3aed' },
                            { label: 'Approved',             value: 'APPROVED',             count: stats?.approved,           color: '#10b981' },
                            { label: 'Rejected',             value: 'REJECTED',             count: stats?.rejected,           color: '#ef4444' },
                            { label: 'Completed',            value: 'COMPLETED',            count: stats?.completed,          color: '#10b981' },
                            { label: 'Dispatched',           value: 'DISPATCHED',           count: stats?.dispatched,         color: '#0ea5e9' },
                        ].map(tab => (
                            <button key={tab.value} onClick={() => setStatusFilter(tab.value)}
                                style={{
                                    padding: '6px 14px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600,
                                    border: statusFilter === tab.value ? `1.5px solid ${tab.color}` : '1.5px solid #e2e8f0',
                                    background: statusFilter === tab.value ? tab.color : 'white',
                                    color: statusFilter === tab.value ? 'white' : '#64748b',
                                    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                                    display: 'flex', alignItems: 'center', gap: '6px'
                                }}>
                                {tab.label}
                                {tab.count != null && (
                                    <span style={{ background: statusFilter === tab.value ? 'rgba(255,255,255,0.25)' : '#f1f5f9', borderRadius: '999px', padding: '1px 7px', fontSize: '0.72rem' }}>
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* TABLE + ACTIVITY PANEL */}
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Applications Table */}
                    <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                        <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Recent Applications</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                {(() => {
                                    const campuses = [...new Set(applications.map(a => a.campus).filter(Boolean))].sort();
                                    return (
                                        <select value={campusFilter} onChange={e => { setCampusFilter(e.target.value); setCurrentPage(1); }}
                                            style={{ fontSize: '0.8rem', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '5px 10px', color: '#334155', background: 'white', fontFamily: 'inherit', cursor: 'pointer' }}>
                                            <option value="ALL">All Campuses</option>
                                            {campuses.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    );
                                })()}
                                {applications.length > 0 && (
                                    <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500 }}>{applications.length} total</span>
                                )}
                            </div>
                        </div>

                        {(() => {
                            const PAGE_SIZE = 10;
                            const totalPages = Math.max(1, Math.ceil(filteredApplications.length / PAGE_SIZE));
                            const safePage = Math.min(currentPage, totalPages);
                            const pagedApplications = filteredApplications.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

                            const thStyle = { padding: '12px 20px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', whiteSpace: 'nowrap' };
                            const tdStyle = { padding: '14px 20px', fontSize: '0.875rem', color: '#334155', borderBottom: '1px solid #f1f5f9' };

                            return (
                                <>
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr>
                                                    <th style={thStyle}>ID</th>
                                                    <th style={thStyle}>Form Type</th>
                                                    <th style={thStyle}>Applicant</th>
                                                    <th style={thStyle}>Campus</th>
                                                    <th style={thStyle}>Status</th>
                                                    <th style={thStyle}>Date</th>
                                                    <th style={thStyle}>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {pagedApplications.map((app) => (
                                                    <tr key={app.id} className="dash-row" style={{ borderLeft: `4px solid ${getCampusColor(app.campus)}` }}>
                                                        <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '0.78rem', color: '#64748b' }}>{app.id}</td>
                                                        <td style={{ ...tdStyle, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>{app.form_type}</td>
                                                        <td style={{ ...tdStyle, fontWeight: 600, color: '#0F172A' }}>{app.applicant_name}</td>
                                                        <td style={tdStyle}><div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: getCampusColor(app.campus), flexShrink: 0 }} /><span>{app.campus || '—'}</span></div></td>
                                                        <td style={tdStyle}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                                                <span style={getStatusStyle(app.status)}>{app.status}</span>
                                                                {(() => {
                                                                    const badge = getAgeBadge(app);
                                                                    if (!badge) return null;
                                                                    return (
                                                                        <span style={{
                                                                            fontSize: '0.68rem', fontWeight: 700, padding: '2px 7px',
                                                                            borderRadius: '999px', background: badge.bg,
                                                                            color: badge.color, border: `1px solid ${badge.border}`,
                                                                            whiteSpace: 'nowrap'
                                                                        }}>{badge.label}</span>
                                                                    );
                                                                })()}
                                                            </div>
                                                        </td>
                                                        <td style={{ ...tdStyle, color: '#64748b' }}>{new Date(app.created_at + 'Z').toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}</td>
                                                        <td style={tdStyle}>
                                                            <button
                                                                onClick={() => fetchAppDetails(app.id)}
                                                                style={{ padding: '6px 14px', background: 'white', color: '#334155', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, fontFamily: 'inherit', transition: 'all 0.15s ease' }}
                                                                onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#94a3b8'; }}
                                                                onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                                                            >
                                                                View
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>

                                        {applications.length === 0 && (
                                            <p style={{ textAlign: 'center', padding: '48px', color: '#94a3b8', fontSize: '0.9rem' }}>No applications found</p>
                                        )}
                                        {applications.length > 0 && filteredApplications.length === 0 && (
                                            <p style={{ textAlign: 'center', padding: '48px', color: '#94a3b8', fontSize: '0.9rem' }}>No applications match "{searchQuery}"</p>
                                        )}
                                    </div>
                                    {applications.length > 0 && (
                                        <div style={{ padding: '12px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0, fontWeight: 500 }}>
                                                Showing {filteredApplications.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filteredApplications.length)} of {filteredApplications.length} applications
                                            </p>
                                            {totalPages > 1 && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <button
                                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                        disabled={safePage === 1}
                                                        style={{ padding: '5px 12px', fontSize: '0.78rem', fontWeight: 600, background: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: safePage === 1 ? 'not-allowed' : 'pointer', color: safePage === 1 ? '#cbd5e1' : '#334155', fontFamily: 'inherit' }}
                                                    >← Prev</button>
                                                    <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 500, minWidth: '80px', textAlign: 'center' }}>
                                                        Page {safePage} of {totalPages}
                                                    </span>
                                                    <button
                                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                        disabled={safePage === totalPages}
                                                        style={{ padding: '5px 12px', fontSize: '0.78rem', fontWeight: 600, background: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: safePage === totalPages ? 'not-allowed' : 'pointer', color: safePage === totalPages ? '#cbd5e1' : '#334155', fontFamily: 'inherit' }}
                                                    >Next →</button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </>
                            );
                        })()}
                    </div>
                    </div>

                    {/* ACTIVITY PANEL */}
                    <aside style={{ width: '260px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
                            <div style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0' }}>
                                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Recent Activity</h3>
                            </div>
                            <div style={{ padding: '8px 0' }}>
                                {recentActivity.length === 0
                                    ? <p style={{ color: '#94a3b8', fontSize: '0.8rem', padding: '16px', margin: 0 }}>No activity yet</p>
                                    : recentActivity.map(a => (
                                        <div key={a.id} onClick={() => fetchAppDetails(a.id)}
                                            style={{ padding: '10px 16px', cursor: 'pointer', borderBottom: '1px solid #f8fafc' }}
                                            onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                            <p style={{ margin: '0 0 2px', fontSize: '0.78rem', fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {a.applicant_name || 'Unknown'}
                                            </p>
                                            <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {getShortLabel(a.form_type)} · {getTimeAgo(a.created_at)}
                                            </p>
                                        </div>
                                    ))
                                }
                            </div>
                        </div>
                        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', padding: '16px' }}>
                            <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', margin: '0 0 12px' }}>Quick Actions</h3>
                            <button onClick={() => { setShowExportModal(true); setExportSearch(''); }}
                                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, color: '#334155', fontFamily: 'inherit' }}>
                                <Download size={14} /> Export XLSX
                            </button>
                            <button
                                onClick={() => setShowStudentLookup(true)}
                                style={{ width: '100%', padding: '8px 16px', fontSize: '0.8rem', fontWeight: 600, background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '8px' }}
                            >
                                <Search size={13} /> Student Lookup
                            </button>
                            <button
                                onClick={() => setShowAuditLog(true)}
                                style={{ width: '100%', padding: '8px 16px', fontSize: '0.8rem', fontWeight: 600, background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '8px' }}
                            >
                                📋 Audit Log
                            </button>
                            <button
                                onClick={() => { setShowArchivedPanel(true); fetchArchivedApplications(); }}
                                style={{ width: '100%', padding: '8px 16px', fontSize: '0.8rem', fontWeight: 600, background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '8px' }}
                            >
                                🗄️ Archived Applications
                            </button>
                            <button
                                onClick={() => { setShowTestEmailModal(true); setTestEmailStatus(null); }}
                                style={{ width: '100%', padding: '8px 16px', fontSize: '0.8rem', fontWeight: 600, background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '8px' }}
                            >
                                📧 Test Director Email
                            </button>
                            <button
                                onClick={() => { setShowCampusExamTestModal(true); setCampusExamTestStatus(null); }}
                                style={{ width: '100%', padding: '8px 16px', fontSize: '0.8rem', fontWeight: 600, background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '8px' }}
                            >
                                📋 Test Campus Exam Emails
                            </button>
                        </div>
                    </aside>
                </div>

                    </div>
                )}
                </div>
            </div>

            {/* Export XLSX Modal */}
            {showExportModal && (() => {
                const q = exportSearch.toLowerCase();
                const exportFiltered = applications.filter(a =>
                    !q || a.id.toLowerCase().includes(q) ||
                    (a.applicant_name || '').toLowerCase().includes(q) ||
                    (a.student_email || '').toLowerCase().includes(q) ||
                    (a.form_type || '').toLowerCase().includes(q)
                );
                return (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                        <div style={{ background: 'white', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '520px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', maxHeight: '82vh' }}>
                            {/* Header */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexShrink: 0 }}>
                                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Export as XLSX</h3>
                                <button onClick={() => { setShowExportModal(false); setExportSearch(''); setExportTab('app'); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}>
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Tabs */}
                            <div style={{ display: 'flex', gap: '4px', background: '#f8fafc', borderRadius: '10px', padding: '4px', marginBottom: '16px', flexShrink: 0 }}>
                                {[{ key: 'app', label: 'By Application' }, { key: 'formtype', label: 'By Form Type' }].map(t => (
                                    <button key={t.key} onClick={() => { setExportTab(t.key); setExportSearch(''); }}
                                        style={{ flex: 1, padding: '7px 0', fontSize: '0.8rem', fontWeight: 600, border: 'none', borderRadius: '7px', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', background: exportTab === t.key ? 'white' : 'transparent', color: exportTab === t.key ? '#0f172a' : '#64748b', boxShadow: exportTab === t.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}>
                                        {t.label}
                                    </button>
                                ))}
                            </div>

                            {exportTab === 'app' ? (<>
                                {/* Search */}
                                <div style={{ position: 'relative', marginBottom: '12px', flexShrink: 0 }}>
                                    <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                    <input autoFocus type="text" placeholder="Search by ID, name, email or form type..."
                                        value={exportSearch} onChange={e => setExportSearch(e.target.value)}
                                        style={{ width: '100%', paddingLeft: '36px', paddingRight: '12px', paddingTop: '9px', paddingBottom: '9px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.82rem', fontFamily: 'inherit', outline: 'none', color: '#0f172a', boxSizing: 'border-box' }} />
                                </div>
                                <div style={{ overflowY: 'auto', flex: 1, borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                                    {exportFiltered.length === 0
                                        ? <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>No applications found</div>
                                        : exportFiltered.map(a => (
                                            <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: '1px solid #f8fafc', gap: '12px' }}>
                                                <div style={{ minWidth: 0 }}>
                                                    <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.applicant_name || '—'}</p>
                                                    <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.id} · {getShortLabel(a.form_type)}</p>
                                                </div>
                                                <button onClick={() => doExportCSV(a.id)} disabled={exportingId === a.id}
                                                    style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 14px', background: exportingId === a.id ? '#f1f5f9' : '#0f172a', color: exportingId === a.id ? '#94a3b8' : 'white', border: 'none', borderRadius: '7px', fontSize: '0.76rem', fontWeight: 600, cursor: exportingId === a.id ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                                                    <Download size={13} /> {exportingId === a.id ? 'Exporting...' : 'Export'}
                                                </button>
                                            </div>
                                        ))
                                    }
                                </div>
                                <p style={{ margin: '10px 0 0', fontSize: '0.72rem', color: '#94a3b8', textAlign: 'center', flexShrink: 0 }}>
                                    {exportFiltered.length} application{exportFiltered.length !== 1 ? 's' : ''} shown
                                </p>
                            </>) : (<>
                                {/* Form type list */}
                                <div style={{ overflowY: 'auto', flex: 1, borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                                    {Object.entries(FORM_SHORT).map(([fullName, shortLabel]) => {
                                        const count = applications.filter(a => a.form_type === fullName).length;
                                        const isExporting = exportingFormType === fullName;
                                        return (
                                            <div key={fullName} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid #f8fafc', gap: '12px' }}>
                                                <div style={{ minWidth: 0 }}>
                                                    <p style={{ margin: 0, fontSize: '0.84rem', fontWeight: 700, color: '#0f172a' }}>{shortLabel}</p>
                                                    <p style={{ margin: '3px 0 0', fontSize: '0.72rem', color: '#94a3b8' }}>{count} application{count !== 1 ? 's' : ''} in current view</p>
                                                </div>
                                                <button onClick={() => doExportByFormType(fullName)} disabled={!!exportingFormType}
                                                    style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 14px', background: isExporting ? '#f1f5f9' : '#0f172a', color: isExporting ? '#94a3b8' : 'white', border: 'none', borderRadius: '7px', fontSize: '0.76rem', fontWeight: 600, cursor: exportingFormType ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                                                    <Download size={13} /> {isExporting ? 'Exporting...' : 'Export All'}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                                <p style={{ margin: '10px 0 0', fontSize: '0.72rem', color: '#94a3b8', textAlign: 'center', flexShrink: 0 }}>
                                    Exports all applications from the database for the selected form type
                                </p>
                            </>)}
                        </div>
                    </div>
                );
            })()}

            {/* Test Director Email Modal */}
            {showTestEmailModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: 'white', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '460px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>📧 Test Director Email</h3>
                                <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>Sends a sample director notification to any email address — real directors are not contacted.</p>
                            </div>
                            <button onClick={() => setShowTestEmailModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.1rem', cursor: 'pointer', color: '#64748b', padding: '4px' }}>✕</button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div>
                                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>Send Test Email To</label>
                                <input
                                    type="email"
                                    value={testEmailForm.testEmail}
                                    onChange={e => setTestEmailForm(p => ({ ...p, testEmail: e.target.value }))}
                                    placeholder="your@email.com"
                                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.875rem', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>Campus</label>
                                <select
                                    value={testEmailForm.campus}
                                    onChange={e => setTestEmailForm(p => ({ ...p, campus: e.target.value }))}
                                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.875rem', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: 'white' }}
                                >
                                    <option>Prasanthi Nilayam Campus</option>
                                    <option>Anantapur Campus</option>
                                    <option>Brindavan Campus</option>
                                    <option>Nandigiri Campus</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>Form Type</label>
                                <select
                                    value={testEmailForm.formType}
                                    onChange={e => setTestEmailForm(p => ({ ...p, formType: e.target.value }))}
                                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.875rem', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: 'white' }}
                                >
                                    <option>Application for Duplicate Grade Card</option>
                                    <option>Application for Supplementary Examinations Registration</option>
                                    <option>Application for Registration of Student Name change in the Institute Records</option>
                                    <option>Application for Repeating Examinations Registration (CIE and ESE)</option>
                                </select>
                            </div>
                            {testEmailStatus && (
                                <div style={{ padding: '10px 14px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 500, background: testEmailStatus.type === 'success' ? '#f0fdf4' : testEmailStatus.type === 'error' ? '#fef2f2' : '#eff6ff', color: testEmailStatus.type === 'success' ? '#16a34a' : testEmailStatus.type === 'error' ? '#dc2626' : '#1d4ed8', border: `1px solid ${testEmailStatus.type === 'success' ? '#86efac' : testEmailStatus.type === 'error' ? '#fca5a5' : '#bfdbfe'}` }}>
                                    {testEmailStatus.message}
                                </div>
                            )}
                            <button
                                disabled={testEmailStatus?.type === 'sending' || !testEmailForm.testEmail}
                                onClick={async () => {
                                    setTestEmailStatus({ type: 'sending', message: 'Sending test email...' });
                                    try {
                                        const res = await fetch(`${API_URL}/admin/test-director-email`, {
                                            method: 'POST',
                                            headers: { 'Authorization': `Bearer ${localStorage.getItem(TOKEN_KEY)}`, 'Content-Type': 'application/json' },
                                            body: JSON.stringify(testEmailForm)
                                        });
                                        const data = await res.json();
                                        if (res.ok) {
                                            setTestEmailStatus({ type: 'success', message: `✓ Test email sent to ${testEmailForm.testEmail}` });
                                        } else {
                                            setTestEmailStatus({ type: 'error', message: `Error: ${data.error}` });
                                        }
                                    } catch (e) {
                                        setTestEmailStatus({ type: 'error', message: 'Failed to send. Check console for details.' });
                                    }
                                }}
                                style={{ padding: '10px 20px', background: testEmailStatus?.type === 'sending' || !testEmailForm.testEmail ? '#94a3b8' : '#0f172a', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600, cursor: testEmailStatus?.type === 'sending' || !testEmailForm.testEmail ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
                            >
                                {testEmailStatus?.type === 'sending' ? 'Sending...' : 'Send Test Email'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Test Campus Exam Emails Modal */}
            {showCampusExamTestModal && (() => {
                const isRepeatPaper = campusExamTestForm.formType === 'Application for Repeating Examinations Registration (CIE and ESE)';
                const variantOptions = [
                    { value: 'campus_exam', label: 'Campus Exam Section Notification' },
                    { value: 'director_regular', label: isRepeatPaper ? 'Director Email — Regular Case' : 'Director Email — Regular Supplementary' },
                    ...(isRepeatPaper ? [
                        { value: 'director_repeat_yes', label: 'Director Email — Repeat Case (CIE Satisfied)' },
                        { value: 'director_repeat_no', label: 'Director Email — Repeat Case (CIE Not Satisfied)' },
                    ] : []),
                    { value: 'director_condonation', label: 'Director Email — Condonation Case' },
                ];
                const variantMap = {
                    campus_exam: { emailTarget: 'campus_exam', caseType: null, cieSatisfied: null },
                    director_regular: { emailTarget: 'director_from_campus_exam', caseType: isRepeatPaper ? 'regular' : 'regular_supplementary', cieSatisfied: null },
                    director_repeat_yes: { emailTarget: 'director_from_campus_exam', caseType: 'repeat_case', cieSatisfied: 'yes' },
                    director_repeat_no: { emailTarget: 'director_from_campus_exam', caseType: 'repeat_case', cieSatisfied: 'no' },
                    director_condonation: { emailTarget: 'director_from_campus_exam', caseType: 'condonation', cieSatisfied: null },
                };
                return (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
                        <div style={{ background: 'white', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '440px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>📋 Test Campus Exam Emails</h3>
                                    <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>Sends a sample email to your address — real campus exam section and directors are never contacted.</p>
                                </div>
                                <button onClick={() => setShowCampusExamTestModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.1rem', cursor: 'pointer', color: '#64748b', padding: '4px' }}>✕</button>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                <div>
                                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>Send Test Email To</label>
                                    <input
                                        type="email"
                                        value={campusExamTestForm.testEmail}
                                        onChange={e => setCampusExamTestForm(p => ({ ...p, testEmail: e.target.value }))}
                                        placeholder="your@email.com"
                                        style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.875rem', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>Campus</label>
                                    <select value={campusExamTestForm.campus} onChange={e => setCampusExamTestForm(p => ({ ...p, campus: e.target.value }))} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.875rem', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: 'white' }}>
                                        <option>Prasanthi Nilayam Campus</option>
                                        <option>Anantapur Campus</option>
                                        <option>Brindavan Campus</option>
                                        <option>Nandigiri Campus</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>Form Type</label>
                                    <select value={campusExamTestForm.formType} onChange={e => setCampusExamTestForm(p => ({ ...p, formType: e.target.value, emailVariant: 'campus_exam' }))} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.875rem', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: 'white' }}>
                                        <option value="Application for Supplementary Examinations Registration">Supplementary Examinations Registration</option>
                                        <option value="Application for Repeating Examinations Registration (CIE and ESE)">Repeating Examinations Registration (CIE and ESE)</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>Email to Test</label>
                                    <select value={campusExamTestForm.emailVariant} onChange={e => setCampusExamTestForm(p => ({ ...p, emailVariant: e.target.value }))} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.875rem', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: 'white' }}>
                                        {variantOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                    </select>
                                </div>
                            </div>
                            {campusExamTestStatus && (
                                <p style={{ margin: '14px 0 0', fontSize: '0.82rem', color: campusExamTestStatus.type === 'success' ? '#059669' : campusExamTestStatus.type === 'error' ? '#dc2626' : '#64748b', fontWeight: 500 }}>
                                    {campusExamTestStatus.message}
                                </p>
                            )}
                            <button
                                disabled={campusExamTestStatus?.type === 'sending' || !campusExamTestForm.testEmail}
                                onClick={async () => {
                                    setCampusExamTestStatus({ type: 'sending', message: 'Sending test email...' });
                                    try {
                                        const { emailTarget, caseType, cieSatisfied } = variantMap[campusExamTestForm.emailVariant] || variantMap['campus_exam'];
                                        const res = await fetch(`${API_URL}/admin/test-campus-exam-email`, {
                                            method: 'POST',
                                            headers: { 'Authorization': `Bearer ${localStorage.getItem(TOKEN_KEY)}`, 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ testEmail: campusExamTestForm.testEmail, campus: campusExamTestForm.campus, formType: campusExamTestForm.formType, emailTarget, caseType, cieSatisfied })
                                        });
                                        const data = await res.json();
                                        if (res.ok) {
                                            setCampusExamTestStatus({ type: 'success', message: `✓ Test email sent to ${campusExamTestForm.testEmail}` });
                                        } else {
                                            setCampusExamTestStatus({ type: 'error', message: `Error: ${data.error}` });
                                        }
                                    } catch (err) {
                                        setCampusExamTestStatus({ type: 'error', message: 'Network error. Please try again.' });
                                    }
                                }}
                                style={{ marginTop: '16px', width: '100%', padding: '10px 20px', background: campusExamTestStatus?.type === 'sending' || !campusExamTestForm.testEmail ? '#94a3b8' : '#0f172a', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600, cursor: campusExamTestStatus?.type === 'sending' || !campusExamTestForm.testEmail ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
                            >
                                {campusExamTestStatus?.type === 'sending' ? 'Sending...' : 'Send Test Email'}
                            </button>
                        </div>
                    </div>
                );
            })()}

            {/* Form Availability Drawer */}
            {formsDrawerOpen && (
                <>
                    <div onClick={() => setFormsDrawerOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)', zIndex: 999 }} />
                    <div style={{ position: 'fixed', top: 0, right: 0, height: '100%', width: '360px', background: 'white', zIndex: 1000, boxShadow: '-4px 0 24px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Form Availability</h3>
                                <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>Disable a form to grey it out in the student portal.</p>
                            </div>
                            <button onClick={() => setFormsDrawerOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.1rem', cursor: 'pointer', color: '#64748b', padding: '4px', lineHeight: 1 }}>✕</button>
                        </div>
                        <div style={{ overflowY: 'auto', flex: 1 }}>
                            {[
                                { id: 'convocation-2026',      label: 'Convocation Registration 2026' },
                                { id: 'duplicate-grade-card',  label: 'Duplicate Grade Card' },
                                { id: 'cgpa-conversion',       label: 'CGPA to Percentage Conversion' },
                                { id: 'supplementary-exam',    label: 'Supplementary Examinations Registration' },
                                { id: 'duplicate-degree',      label: 'Duplicate Degree Certificate' },
                                { id: 'name-change',           label: 'Student Name Change' },
                                { id: 'repeat-paper',          label: 'Repeating Examinations Registration' },
                                { id: 'retotaling',            label: 'Re-Totalling of Marks' },
                                { id: 'on-request-degree',     label: 'On-Request Degree Certificate' },
                                { id: 'migration',             label: 'Migration Certificate' },
                            ].map(({ id, label }, idx, arr) => {
                                const isActive = formSettings?.[id] !== false;
                                return (
                                    <div key={id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px', borderBottom: idx < arr.length - 1 ? '1px solid #f8fafc' : 'none', gap: '16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: isActive ? '#22c55e' : '#cbd5e1', flexShrink: 0, display: 'inline-block' }} />
                                            <span style={{ fontSize: '0.9rem', fontWeight: 500, color: isActive ? '#0f172a' : '#94a3b8' }}>{label}</span>
                                        </div>
                                        <button
                                            onClick={() => toggleForm(id, label)}
                                            style={{
                                                padding: '6px 16px', fontSize: '0.8rem', fontWeight: 600, borderRadius: '6px',
                                                cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
                                                border: isActive ? '1px solid #fca5a5' : '1px solid #86efac',
                                                background: isActive ? '#fef2f2' : '#f0fdf4',
                                                color: isActive ? '#dc2626' : '#16a34a',
                                            }}
                                        >
                                            {isActive ? 'Disable' : 'Enable'}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
