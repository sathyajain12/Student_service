import React, { useState, useEffect, useRef } from 'react';
import DOMPurify from 'dompurify';
import { LogOut, FileText, Download, Users, Clock, CheckCircle, XCircle, ArrowLeft, RefreshCw, Upload, Trash2, X, AlertTriangle, Search } from 'lucide-react';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8787';

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

export default function AdminPortal() {
    const [token, setToken] = useState(localStorage.getItem('adminToken') || '');
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('adminToken'));
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
    const [showDispatchModal, setShowDispatchModal] = useState(false);
    const [dispatchAppId, setDispatchAppId] = useState(null);
    const dispatchTrackingRef = useRef(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [campusFilter, setCampusFilter] = useState('ALL');

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

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

    useEffect(() => { setCurrentPage(1); }, [searchQuery]);
    useEffect(() => { setCurrentPage(1); }, [statusFilter]);
    useEffect(() => { setCurrentPage(1); }, [campusFilter]);

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

    const generatePDF = (appData, details) => {
        const app = appData;
        const fd = details.formData || {};
        const files = details.files || [];
        const responseDocuments = details.responseDocuments || [];

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
            'Application for End-Semester Supplementary Examinations Registration': [
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
                ['paper_codes', 'Paper Code(s)'],
                ['paper_titles', 'Paper Title(s)'],
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
            'Application for repeating a paper for supplementary examinations (CIE and ESE)': [
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
                ['paper_codes', 'Paper Code(s)'],
                ['paper_titles', 'Paper Title(s)'],
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
            'Application for Migration Certificate': [
                ['Registration_Number', 'Registration Number'],
                ['admission_year', 'Year of Admission'],
                ['Campus_of_admission', 'Campus of Admission'],
                ['last_examination_passed', 'Last Examination Details'],
                ['degree_recieved', 'Degree Certificate Received'],
                ['university_to_migrate', 'University/Institute to Join'],
                ['Mobile_Number', 'Mobile Number'],
                ['address_line1', 'Address Line 1'],
                ['address_line2', 'Address Line 2'],
                ['country', 'Country'],
                ['state_province', 'State/Province/Region'],
                ['city', 'City'],
                ['postal_code', 'Postal Code'],
            ],
        };

        const statusColors = { APPROVED: '#10b981', COMPLETED: '#059669', DISPATCHED: '#0ea5e9', REJECTED: '#ef4444', PENDING: '#f59e0b' };
        const statusColor = statusColors[app.status] || '#64748b';

        const fieldDefs = FORM_FIELD_LABELS[app.form_type] || [];
        const formFieldRows = fieldDefs
            .filter(([key]) => fd[key] !== null && fd[key] !== undefined && fd[key] !== '')
            .map(([key, label]) => `<tr><td style="font-weight:600;width:40%">${escapeHtml(label)}</td><td>${escapeHtml(fd[key])}</td></tr>`)
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
    <div>
      <div class="institute">Sri Sathya Sai Institute of Higher Learning</div>
      <div class="sub-institute">Office of the Controller of Examinations</div>
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

    const notifyDispatched = (applicationId) => {
        setDispatchAppId(applicationId);
        if (dispatchTrackingRef.current) dispatchTrackingRef.current.value = '';
        setShowDispatchModal(true);
    };

    const doNotifyDispatched = async (applicationId, trackingNumber) => {
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
                showToast('Student notified — document marked as dispatched!', 'success');
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

    const deleteApplication = (applicationId) => {
        setConfirmModal({
            title: 'Delete Application',
            message: `Are you sure you want to delete application ${applicationId}? This action cannot be undone.`,
            confirmText: 'Yes, Delete',
            confirmColor: '#ef4444',
            confirmGradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            onConfirm: () => {
                setConfirmModal(null);
                doDeleteApplication(applicationId);
            }
        });
    };

    const doDeleteApplication = async (applicationId) => {
        try {
            const response = await fetch(`${API_URL}/admin/application/${applicationId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                showToast('Application deleted successfully!', 'success');
                setSelectedApp(null);
                setAppDetails(null);
                fetchStats();
                fetchApplications();
            } else {
                showToast('Error: ' + (data.error || 'Failed to delete application'), 'error');
            }
        } catch (err) {
            console.error('Failed to delete application:', err);
            showToast('Failed to delete application. Please try again.', 'error');
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
                        <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a', fontWeight: '700' }}>Notify: Document Dispatched</h3>
                    </div>
                    <p style={{ color: '#475569', fontSize: '14px', lineHeight: '1.6', margin: '0 0 20px 0' }}>
                        This will send an email to the student informing them that their document has been dispatched.
                    </p>
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
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        <button
                            onClick={() => setShowDispatchModal(false)}
                            style={{ padding: '10px 24px', background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => { setShowDispatchModal(false); doNotifyDispatched(dispatchAppId, dispatchTrackingRef.current?.value || null); }}
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
                    @keyframes orb-breathe {
                        0%, 100% { transform: scale(1);    opacity: 0.4; }
                        50%       { transform: scale(1.18); opacity: 0.58; }
                    }
                    .login-orb-1 { animation: orb-breathe 6s ease-in-out infinite; }
                    .login-orb-2 { animation: orb-breathe 8s ease-in-out infinite 2s; }
                `}</style>
                <main style={{ display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: '"Public Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>

                    {/* Left brand panel */}
                    <section className="login-brand-panel" style={{ width: '60%', background: '#0F172A', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '48px', overflow: 'hidden' }}>
                        {/* Grid dot overlay */}
                        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />
                        {/* Top-left orange orb */}
                        <div className="login-orb-1" style={{ position: 'absolute', top: '-10%', left: '-10%', width: '400px', height: '400px', background: '#ec5b13', borderRadius: '50%', filter: 'blur(80px)', opacity: 0.4, pointerEvents: 'none' }} />
                        {/* Bottom-right orange orb */}
                        <div className="login-orb-2" style={{ position: 'absolute', bottom: '-5%', right: '5%', width: '300px', height: '300px', background: '#b84209', borderRadius: '50%', filter: 'blur(80px)', opacity: 0.4, pointerEvents: 'none' }} />

                        {/* Spacer (keeps headline vertically centred) */}
                        <div style={{ height: '52px', position: 'relative', zIndex: 1 }} />

                        {/* Middle: headline */}
                        <div style={{ position: 'relative', zIndex: 1, maxWidth: '480px' }}>
                            <h1 style={{ color: 'white', fontSize: '3.75rem', fontWeight: 900, lineHeight: 1.1, margin: 0, letterSpacing: '-0.03em' }}>
                                Student Service <br />
                                <span style={{ color: '#ec5b13' }}>Admin</span>
                            </h1>
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

    // Application Details View
    if (selectedApp && appDetails) {
        const app = appDetails.application;
        const statusIcon = app.status === 'COMPLETED' || app.status === 'APPROVED'
            ? <CheckCircle size={16} />
            : app.status === 'REJECTED' ? <XCircle size={16} /> : <Clock size={16} />;

        const detailLabelStyle = { fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8', margin: '0 0 4px 0' };
        const detailValueStyle = { fontSize: '0.9rem', fontWeight: 600, color: '#0F172A', margin: 0, lineHeight: 1.4 };

        const FIELD_LABEL_OVERRIDES = { paper_codes: 'Course Code(s)', paper_titles: 'Course Title(s)' };
        const formatFieldKey = (key) =>
            FIELD_LABEL_OVERRIDES[key] ||
            key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim()
               .replace(/\b\w/g, c => c.toUpperCase());

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
            } catch {
                return String(value);
            }
        };

        const sidebarBtnBase = { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '11px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', fontFamily: 'inherit', border: 'none', transition: 'all 0.15s ease' };
        const fileRowStyle = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: '8px', border: '1px solid #f1f5f9', marginBottom: '8px', gap: '12px' };
        const downloadBtnStyle = { display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', background: 'white', color: '#334155', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, fontFamily: 'inherit', flexShrink: 0 };

        return (
            <>
                <style>{`
                    .btn-complete, .btn-upload, .btn-delete, .btn-download, .btn-back, .det-dl-btn { transition: all 0.2s ease; }
                    .btn-complete:hover:not(:disabled) { filter: brightness(1.08); transform: translateY(-1px); }
                    .btn-upload:hover:not(:disabled) { filter: brightness(1.08); transform: translateY(-1px); }
                    .btn-delete:hover { background: rgba(239,68,68,0.08) !important; border-color: #ef4444 !important; }
                    .det-dl-btn:hover { background: #f8fafc !important; border-color: #94a3b8 !important; }
                    .btn-back-det:hover { color: #0F172A !important; }
                    .btn-back-det { transition: color 0.15s ease; }
                    .detail-pdf-btn:hover { background: #1e293b !important; }
                    .detail-pdf-btn { transition: background 0.15s ease; }
                    @media (max-width: 900px) { .det-grid { grid-template-columns: 1fr !important; } }
                `}</style>
                <ToastNotification />
                <ConfirmationModal />
                <DispatchModal />

                <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>

                    {/* Minimal sticky top bar */}
                    <div style={{ position: 'sticky', top: 0, zIndex: 40, background: 'white', borderBottom: '1px solid #e2e8f0', padding: '0 32px', height: '64px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <img src="/logo.png" alt="Logo" style={{ height: '36px', width: '36px', objectFit: 'contain' }} />
                        <div style={{ width: '1px', height: '22px', background: '#e2e8f0' }} />
                        <button className="btn-back-det" onClick={() => { setSelectedApp(null); setAppDetails(null); }} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '0.875rem', fontWeight: 600, padding: 0, fontFamily: 'inherit' }}>
                            <ArrowLeft size={15} /> Back to Applications
                        </button>
                    </div>

                    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>

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
                                    </div>
                                    {appDetails.formData && Object.keys(appDetails.formData).length > 0 && (() => {
                                        const SKIP = new Set([
                                            'id', 'application_id', 'created_at',
                                            // Already shown in the basic info grid above
                                            'student_name', 'applicant_name', 'student_email', 'email',
                                            'reg_no', 'registration_number', 'campus',
                                            // Internal status fields (not student-entered data)
                                            'director_approval_status', 'controller_approval_status',
                                            'director_status', 'controller_status', 'status',
                                        ]);
                                        const entries = Object.entries(appDetails.formData).filter(([k, v]) => !SKIP.has(k) && v !== null && v !== '');
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
                                        {appDetails.responseDocuments && appDetails.responseDocuments.length > 0 && (
                                            <div style={{ marginBottom: '20px' }}>
                                                <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#10b981', margin: '0 0 10px 0' }}>Response Documents — Admin Uploaded</p>
                                                {appDetails.responseDocuments.map((file) => (
                                                    <div key={file.id} style={{ ...fileRowStyle, borderLeft: '3px solid #10b981' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                                                            <div style={{ background: 'rgba(16,185,129,0.08)', padding: '8px', borderRadius: '6px', flexShrink: 0 }}><FileText size={16} color="#10b981" /></div>
                                                            <div style={{ minWidth: 0 }}>
                                                                <p style={{ color: '#0F172A', margin: 0, fontWeight: 600, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.file_name}</p>
                                                                <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.75rem' }}>{file.file_type} · {(file.file_size / 1024).toFixed(1)} KB · {file.uploaded_by || 'Admin'}</p>
                                                            </div>
                                                        </div>
                                                        <button className="det-dl-btn" onClick={() => downloadFile(file.id, file.file_name)} style={downloadBtnStyle}><Download size={14} /> Download</button>
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
                                                <button className="det-dl-btn" onClick={() => downloadFile(file.id, file.file_name)} style={downloadBtnStyle}><Download size={14} /> Download</button>
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

                                        {/* Mark as Completed */}
                                        {(app.status === 'APPROVED' || app.status === 'PENDING') && (
                                            <button className="btn-complete" onClick={() => markAsCompleted(app.id)} style={{ ...sidebarBtnBase, background: '#10b981', color: 'white' }}>
                                                <CheckCircle size={16} /> Mark as Completed
                                            </button>
                                        )}

                                        {/* Notify Dispatched */}
                                        {app.status === 'COMPLETED' && (
                                            <button onClick={() => notifyDispatched(app.id)} style={{ ...sidebarBtnBase, background: '#0ea5e9', color: 'white' }}>
                                                &#9993; Notify: Document Dispatched
                                            </button>
                                        )}

                                        {/* Upload Response */}
                                        <label className="btn-upload" style={{ ...sidebarBtnBase, background: '#4F46E5', color: 'white', cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.6 : 1 }}>
                                            <Upload size={16} /> {uploading ? 'Uploading...' : 'Upload Response Document'}
                                            <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleFileSelect(e, app.id)} style={{ display: 'none' }} disabled={uploading} />
                                        </label>
                                        {uploadError && <p style={{ color: '#ef4444', fontSize: '0.8rem', margin: 0 }}>{uploadError}</p>}
                                        {uploadSuccess && <p style={{ color: '#10b981', fontSize: '0.8rem', margin: 0 }}>Uploaded successfully!</p>}

                                        <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '4px 0' }} />

                                        {/* Delete */}
                                        <button className="btn-delete" onClick={() => deleteApplication(app.id)} style={{ ...sidebarBtnBase, background: 'white', color: '#dc2626', border: '1px solid #fca5a5' }}>
                                            <Trash2 size={16} /> Delete Application
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    // Dashboard View
    return (
        <>
            <ToastNotification />
            <ConfirmationModal />
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes scaleIn {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }

                td button {
                    transition: all 0.2s ease;
                }

                td button:hover:not(:disabled) {
                    background: #eff6ff !important;
                    border-color: #2563eb !important;
                    transform: translateY(-1px);
                    box-shadow: 0 2px 8px rgba(37, 99, 235, 0.15);
                }

                td button:active:not(:disabled) {
                    transform: translateY(0);
                }

                .btn-refresh {
                    transition: all 0.2s ease;
                }

                .btn-refresh:hover:not(:disabled) {
                    background: rgba(255,255,255,0.08) !important;
                    color: #e2e8f0 !important;
                    border-color: rgba(255,255,255,0.22) !important;
                }

                .btn-refresh:active:not(:disabled) {
                    transform: translateY(0);
                }

                .btn-logout {
                    transition: all 0.2s ease;
                }

                .btn-logout:hover {
                    background: rgba(255,255,255,0.08) !important;
                    color: #e2e8f0 !important;
                    border-color: rgba(255,255,255,0.22) !important;
                    transform: translateY(-1px);
                }

                .btn-logout:active {
                    transform: translateY(0);
                }

                .nav-search:focus {
                    background: rgba(255,255,255,0.1) !important;
                    border-color: rgba(255,255,255,0.25) !important;
                }
                .nav-search::placeholder { color: #475569; }

                .dash-row:hover td {
                    background: #f8fafc;
                }

                .btn-modal-cancel {
                    transition: all 0.15s ease;
                }

                .btn-modal-cancel:hover {
                    background: #e2e8f0 !important;
                }

                .btn-modal-confirm {
                    transition: all 0.15s ease;
                }

                .btn-modal-confirm:hover {
                    filter: brightness(1.1);
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                }

                .btn-modal-confirm:active {
                    transform: translateY(0);
                }
            `}</style>
            {/* Fixed Navbar */}
            <header style={{
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
                height: '72px', background: '#0F172A',
                borderBottom: '1px solid #1e293b',
                display: 'flex', alignItems: 'center', padding: '0 32px', gap: '24px',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}>
                {/* Logo + name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                    <img src="/logo.png" alt="Logo" style={{ height: '38px', width: '38px', objectFit: 'contain' }} />
                    <span style={{ color: 'white', fontWeight: 700, fontSize: '0.95rem', whiteSpace: 'nowrap' }}>Examination Services Admin</span>
                </div>

                {/* Search box */}
                <div style={{ flex: 1, maxWidth: '460px', margin: '0 auto', position: 'relative' }}>
                    <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }} />
                    <input
                        className="nav-search"
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search applications by name, ID, campus..."
                        style={{
                            width: '100%', height: '40px',
                            paddingLeft: '38px', paddingRight: searchQuery ? '36px' : '14px',
                            background: 'rgba(255,255,255,0.07)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            color: 'white', fontSize: '0.85rem',
                            outline: 'none', boxSizing: 'border-box',
                            fontFamily: 'inherit'
                        }}
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', padding: 0 }}>
                            <X size={13} />
                        </button>
                    )}
                </div>

                {/* Right controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 'auto', flexShrink: 0 }}>
                    {lastUpdated && (
                        <span style={{ color: '#475569', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                            Updated {lastUpdated.toLocaleTimeString()}
                        </span>
                    )}
                    <button
                        className="btn-refresh"
                        onClick={handleManualRefresh}
                        disabled={isRefreshing}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '7px 14px',
                            background: 'transparent',
                            color: '#94a3b8',
                            border: '1px solid rgba(255,255,255,0.12)',
                            borderRadius: '8px',
                            cursor: isRefreshing ? 'not-allowed' : 'pointer',
                            fontSize: '0.8rem', fontWeight: 500,
                            opacity: isRefreshing ? 0.5 : 1,
                            fontFamily: 'inherit', transition: 'all 0.15s ease'
                        }}
                    >
                        <RefreshCw size={14} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
                        {isRefreshing ? 'Refreshing...' : 'Refresh'}
                    </button>
                    <button
                        className="btn-logout"
                        onClick={handleLogout}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '7px 14px',
                            background: 'transparent',
                            color: '#94a3b8',
                            border: '1px solid rgba(255,255,255,0.12)',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.8rem', fontWeight: 500,
                            fontFamily: 'inherit', transition: 'all 0.15s ease'
                        }}
                    >
                        <LogOut size={14} /> Logout
                    </button>
                </div>
            </header>

            {/* Main content */}
            <div style={{ paddingTop: '72px', minHeight: '100vh', background: '#F8FAFC', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>

                    {/* Welcome */}
                    <div style={{ marginBottom: '28px' }}>
                        <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0F172A', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>Dashboard Overview</h2>
                        <p style={{ color: '#64748b', margin: 0, fontSize: '0.9rem' }}>Welcome back. Here's what needs your attention today.</p>
                    </div>

                    {/* Stat cards */}
                    {stats && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
                            <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                <div style={{ background: 'rgba(79,70,229,0.08)', padding: '10px', borderRadius: '10px', display: 'inline-flex', marginBottom: '16px' }}>
                                    <Users size={20} color="#4F46E5" />
                                </div>
                                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Applications</p>
                                <p style={{ fontSize: '2rem', fontWeight: 800, color: '#0F172A', margin: 0, lineHeight: 1 }}>{stats.total}</p>
                            </div>
                            <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                <div style={{ background: 'rgba(245,158,11,0.08)', padding: '10px', borderRadius: '10px', display: 'inline-flex', marginBottom: '16px' }}>
                                    <Clock size={20} color="#f59e0b" />
                                </div>
                                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pending Review</p>
                                <p style={{ fontSize: '2rem', fontWeight: 800, color: '#0F172A', margin: 0, lineHeight: 1 }}>{stats.pending}</p>
                            </div>
                            <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                <div style={{ background: 'rgba(16,185,129,0.08)', padding: '10px', borderRadius: '10px', display: 'inline-flex', marginBottom: '16px' }}>
                                    <CheckCircle size={20} color="#10b981" />
                                </div>
                                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Approved</p>
                                <p style={{ fontSize: '2rem', fontWeight: 800, color: '#0F172A', margin: 0, lineHeight: 1 }}>{stats.approved}</p>
                            </div>
                            <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                <div style={{ background: 'rgba(239,68,68,0.08)', padding: '10px', borderRadius: '10px', display: 'inline-flex', marginBottom: '16px' }}>
                                    <XCircle size={20} color="#ef4444" />
                                </div>
                                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rejected</p>
                                <p style={{ fontSize: '2rem', fontWeight: 800, color: '#0F172A', margin: 0, lineHeight: 1 }}>{stats.rejected}</p>
                            </div>
                            <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                <div style={{ background: 'rgba(14,165,233,0.08)', padding: '10px', borderRadius: '10px', display: 'inline-flex', marginBottom: '16px' }}>
                                    <svg width="20" height="20" fill="none" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                                </div>
                                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dispatched</p>
                                <p style={{ fontSize: '2rem', fontWeight: 800, color: '#0F172A', margin: 0, lineHeight: 1 }}>{stats.dispatched ?? 0}</p>
                            </div>
                            <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                <div style={{ background: 'rgba(16,185,129,0.08)', padding: '10px', borderRadius: '10px', display: 'inline-flex', marginBottom: '16px' }}>
                                    <svg width="20" height="20" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                                </div>
                                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Completed</p>
                                <p style={{ fontSize: '2rem', fontWeight: 800, color: '#0F172A', margin: 0, lineHeight: 1 }}>{stats.completed ?? 0}</p>
                            </div>
                        </div>
                    )}

                    {/* Status filter tabs */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
                        {[
                            { label: 'All',        value: 'ALL',        count: stats?.total,      color: '#4F46E5' },
                            { label: 'Pending',    value: 'PENDING',    count: stats?.pending,    color: '#f59e0b' },
                            { label: 'Approved',   value: 'APPROVED',   count: stats?.approved,   color: '#10b981' },
                            { label: 'Dispatched', value: 'DISPATCHED', count: stats?.dispatched, color: '#0ea5e9' },
                            { label: 'Completed',  value: 'COMPLETED',  count: stats?.completed,  color: '#10b981' },
                            { label: 'Rejected',          value: 'REJECTED',          count: stats?.rejected,   color: '#ef4444' },
                            { label: 'Dir. Comments',     value: 'DIRECTOR_COMMENTED', count: null,              color: '#7c3aed' },
                            { label: 'Awaiting Director', value: 'AWAITING_DIRECTOR',  count: null,              color: '#8b5cf6' },
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
                            const filteredApplications = applications
                                .filter(app => {
                                    if (!searchQuery.trim()) return true;
                                    const query = searchQuery.toLowerCase();
                                    return (
                                        app.id?.toLowerCase().includes(query) ||
                                        app.applicant_name?.toLowerCase().includes(query) ||
                                        app.form_type?.toLowerCase().includes(query) ||
                                        app.campus?.toLowerCase().includes(query) ||
                                        app.student_email?.toLowerCase().includes(query) ||
                                        app.status?.toLowerCase().includes(query)
                                    );
                                })
                                .filter(app => statusFilter === 'ALL' || app.status === statusFilter)
                                .filter(app => campusFilter === 'ALL' || app.campus === campusFilter);

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
                                                    <tr key={app.id} className="dash-row">
                                                        <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '0.78rem', color: '#64748b' }}>{app.id}</td>
                                                        <td style={{ ...tdStyle, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>{app.form_type}</td>
                                                        <td style={{ ...tdStyle, fontWeight: 600, color: '#0F172A' }}>{app.applicant_name}</td>
                                                        <td style={tdStyle}>{app.campus}</td>
                                                        <td style={tdStyle}><span style={getStatusStyle(app.status)}>{app.status}</span></td>
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
            </div>
        </>
    );
}
