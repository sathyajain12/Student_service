import React, { useState, useEffect } from 'react';
import { LogOut, FileText, Download, Users, Clock, CheckCircle, XCircle, ArrowLeft, RefreshCw, Upload, Trash2, X, AlertTriangle, Info, Search } from 'lucide-react';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8787';

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
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState(null);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [toast, setToast] = useState(null);
    const [confirmModal, setConfirmModal] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

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
            .map(([key, label]) => `<tr><td style="font-weight:600;width:40%">${label}</td><td>${fd[key]}</td></tr>`)
            .join('');

        const fileListRows = files.map(f =>
            `<tr><td>${f.file_name}</td><td>${f.file_type}</td><td>${(f.file_size / 1024).toFixed(1)} KB</td></tr>`
        ).join('');

        const responseListRows = responseDocuments.map(f =>
            `<tr><td>${f.file_name}</td><td>${f.file_type}</td><td>${(f.file_size / 1024).toFixed(1)} KB</td><td>${f.uploaded_by || 'Admin'}</td></tr>`
        ).join('');

        const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Application – ${app.id}</title>
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
      <div class="form-title">${app.form_type}</div>
      <div class="app-id">App ID: ${app.id}</div>
      <span class="status-badge">${app.status}</span>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Applicant Information</div>
    <div class="info-grid">
      <div class="info-item"><label>Full Name</label><span>${app.applicant_name || 'N/A'}</span></div>
      <div class="info-item"><label>Registration Number</label><span>${app.reg_no || 'N/A'}</span></div>
      <div class="info-item"><label>Campus</label><span>${app.campus || 'N/A'}</span></div>
      <div class="info-item"><label>Email Address</label><span>${app.student_email || 'N/A'}</span></div>
      <div class="info-item"><label>Date of Submission</label><span>${new Date(app.created_at).toLocaleString()}</span></div>
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

    const notifyDispatched = (applicationId) => {
        setConfirmModal({
            title: 'Notify Document Dispatched',
            message: 'This will send an email to the student informing them that their document has been dispatched. Proceed?',
            confirmText: 'Yes, Notify Student',
            confirmColor: '#0ea5e9',
            confirmGradient: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
            onConfirm: () => {
                setConfirmModal(null);
                doNotifyDispatched(applicationId);
            }
        });
    };

    const doNotifyDispatched = async (applicationId) => {
        try {
            const response = await fetch(`${API_URL}/admin/notify-dispatched`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ applicationId })
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
        const app = appDetails.application;
        const statusIcon = app.status === 'COMPLETED' || app.status === 'APPROVED'
            ? <CheckCircle size={16} />
            : app.status === 'REJECTED' ? <XCircle size={16} /> : <Clock size={16} />;

        return (
            <>
                <style>{`
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

                    .btn-complete:hover {
                        filter: brightness(1.1);
                        transform: translateY(-2px);
                        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.35);
                    }

                    .btn-upload:hover {
                        filter: brightness(1.1);
                        transform: translateY(-2px);
                        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.35);
                    }

                    .btn-delete:hover {
                        background: rgba(239, 68, 68, 0.1) !important;
                        border-color: #ef4444 !important;
                        transform: translateY(-2px);
                        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
                    }

                    .btn-download:hover {
                        background: #eff6ff !important;
                        border-color: #2563eb !important;
                        transform: translateY(-1px);
                        box-shadow: 0 2px 8px rgba(37, 99, 235, 0.15);
                    }

                    .btn-back:hover {
                        color: #2563eb !important;
                    }

                    .btn-complete, .btn-upload, .btn-delete, .btn-download, .btn-back {
                        transition: all 0.2s ease;
                    }

                    .btn-complete:active, .btn-upload:active, .btn-delete:active, .btn-download:active {
                        transform: translateY(0);
                    }
                `}</style>
                <ToastNotification />
                <ConfirmationModal />
                <div style={styles.page}>
                    <div style={styles.container}>
                        <button className="btn-back" onClick={() => { setSelectedApp(null); setAppDetails(null); }} style={styles.backButton}>
                            <ArrowLeft size={18} /> Back to Applications
                        </button>

                        {/* Header Card: Title + Status + ID */}
                        <div style={{
                            ...styles.card,
                            marginBottom: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '16px'
                        }}>
                            <div>
                                <h2 style={{ ...styles.title, marginBottom: '6px', fontSize: '22px' }}>
                                    {app.form_type}
                                </h2>
                                <p style={{ color: '#64748b', margin: 0, fontSize: '13px', fontFamily: 'monospace' }}>
                                    ID: {app.id}
                                </p>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <button
                                    onClick={() => generatePDF(app, appDetails)}
                                    style={{
                                        padding: '8px 16px',
                                        background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
                                        color: '#ffffff',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontWeight: '600',
                                        fontSize: '13px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    <Download size={15} /> Download PDF
                                </button>
                                <span style={{
                                    ...getStatusStyle(app.status),
                                    padding: '8px 16px',
                                    fontSize: '13px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}>
                                    {statusIcon} {app.status}
                                </span>
                            </div>
                        </div>

                        {/* Applicant Information */}
                        <div style={{ ...styles.card, marginBottom: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid rgba(15, 23, 42, 0.08)' }}>
                                <Users size={20} color="#3b82f6" />
                                <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a', fontWeight: '700' }}>Applicant Information</h3>
                            </div>
                            <div style={styles.detailGrid}>
                                <div style={styles.detailCard}>
                                    <p style={styles.detailLabel}>Full Name</p>
                                    <p style={styles.detailValue}>{app.applicant_name}</p>
                                </div>
                                <div style={styles.detailCard}>
                                    <p style={styles.detailLabel}>Email</p>
                                    <p style={styles.detailValue}>{app.student_email}</p>
                                </div>
                                <div style={styles.detailCard}>
                                    <p style={styles.detailLabel}>Registration No</p>
                                    <p style={styles.detailValue}>{app.reg_no || 'N/A'}</p>
                                </div>
                                <div style={styles.detailCard}>
                                    <p style={styles.detailLabel}>Campus</p>
                                    <p style={styles.detailValue}>{app.campus}</p>
                                </div>
                                <div style={styles.detailCard}>
                                    <p style={styles.detailLabel}>Submitted</p>
                                    <p style={styles.detailValue}>{new Date(app.created_at).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        {/* Actions Card */}
                        <div style={{ ...styles.card, marginBottom: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid rgba(15, 23, 42, 0.08)' }}>
                                <Info size={20} color="#8b5cf6" />
                                <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a', fontWeight: '700' }}>Actions</h3>
                            </div>

                            {/* Mark as Completed - only show for APPROVED or PENDING status */}
                            {(app.status === 'APPROVED' || app.status === 'PENDING') && (
                                <div style={{ marginBottom: '16px', padding: '20px', background: 'rgba(16, 185, 129, 0.06)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                                        <div>
                                            <h4 style={{ color: '#10b981', margin: 0, marginBottom: '4px', fontSize: '14px', fontWeight: '700' }}>Ready to Complete?</h4>
                                            <p style={{ color: '#64748b', margin: 0, fontSize: '13px' }}>Mark this application as completed and dispatched</p>
                                        </div>
                                        <button
                                            className="btn-complete"
                                            onClick={() => markAsCompleted(app.id)}
                                            style={{
                                                padding: '10px 20px',
                                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                                color: '#ffffff',
                                                border: 'none',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                fontWeight: '600',
                                                fontSize: '13px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}
                                        >
                                            <CheckCircle size={16} /> Mark as Completed
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Notify Document Dispatched - only show for COMPLETED status */}
                            {app.status === 'COMPLETED' && (
                                <div style={{ marginBottom: '16px', padding: '20px', background: 'rgba(14, 165, 233, 0.06)', borderRadius: '12px', border: '1px solid rgba(14, 165, 233, 0.2)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                                        <div>
                                            <h4 style={{ color: '#0ea5e9', margin: 0, marginBottom: '4px', fontSize: '14px', fontWeight: '700' }}>Document Ready?</h4>
                                            <p style={{ color: '#64748b', margin: 0, fontSize: '13px' }}>Notify the student that their document has been dispatched</p>
                                        </div>
                                        <button
                                            onClick={() => notifyDispatched(app.id)}
                                            style={{
                                                padding: '10px 20px',
                                                background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                                                color: '#ffffff',
                                                border: 'none',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                fontWeight: '600',
                                                fontSize: '13px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}
                                        >
                                            &#9993; Notify: Document Dispatched
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Upload Response Document */}
                            <div style={{ marginBottom: '16px', padding: '20px', background: 'rgba(59, 130, 246, 0.06)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                                    <div>
                                        <h4 style={{ color: '#3b82f6', margin: 0, marginBottom: '4px', fontSize: '14px', fontWeight: '700' }}>Upload Response Document</h4>
                                        <p style={{ color: '#64748b', margin: 0, fontSize: '13px' }}>Upload the completed certificate or document</p>
                                    </div>
                                    <label className="btn-upload" style={{
                                        padding: '10px 20px',
                                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                        color: '#ffffff',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: uploading ? 'not-allowed' : 'pointer',
                                        fontWeight: '600',
                                        fontSize: '13px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        opacity: uploading ? 0.6 : 1
                                    }}>
                                        <Upload size={16} />
                                        {uploading ? 'Uploading...' : 'Choose File'}
                                        <input
                                            type="file"
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            onChange={(e) => handleFileSelect(e, app.id)}
                                            style={{ display: 'none' }}
                                            disabled={uploading}
                                        />
                                    </label>
                                </div>
                                {uploadError && (
                                    <p style={{ color: '#ef4444', fontSize: '13px', marginTop: '10px', marginBottom: 0 }}>{uploadError}</p>
                                )}
                                {uploadSuccess && (
                                    <p style={{ color: '#10b981', fontSize: '13px', marginTop: '10px', marginBottom: 0 }}>Document uploaded successfully!</p>
                                )}
                            </div>

                            {/* Delete Application */}
                            <div style={{ padding: '20px', background: 'rgba(239, 68, 68, 0.04)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.15)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                                    <div>
                                        <h4 style={{ color: '#dc2626', margin: 0, marginBottom: '4px', fontSize: '14px', fontWeight: '700' }}>Danger Zone</h4>
                                        <p style={{ color: '#64748b', margin: 0, fontSize: '13px' }}>Permanently delete this application and all files</p>
                                    </div>
                                    <button
                                        className="btn-delete"
                                        onClick={() => deleteApplication(app.id)}
                                        style={{
                                            padding: '10px 20px',
                                            background: 'transparent',
                                            color: '#dc2626',
                                            border: '1.5px solid #fca5a5',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontWeight: '600',
                                            fontSize: '13px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}
                                    >
                                        <Trash2 size={16} /> Delete Application
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Documents Card */}
                        <div style={styles.card}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid rgba(15, 23, 42, 0.08)' }}>
                                <FileText size={20} color="#f59e0b" />
                                <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a', fontWeight: '700' }}>Documents</h3>
                            </div>

                            {/* Response Documents - Admin Uploaded */}
                            {appDetails.responseDocuments && appDetails.responseDocuments.length > 0 && (
                                <div style={{ marginBottom: '24px' }}>
                                    <p style={{ color: '#10b981', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
                                        Response Documents (Uploaded by Admin)
                                    </p>
                                    {appDetails.responseDocuments.map((file) => (
                                        <div key={file.id} style={{ ...styles.fileRow, borderLeft: '4px solid #10b981' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <FileText style={{ color: '#10b981' }} size={20} />
                                                <div>
                                                    <p style={{ color: '#0f172a', margin: 0, fontWeight: '500', fontSize: '14px' }}>{file.file_name}</p>
                                                    <p style={{ color: '#64748b', margin: 0, fontSize: '12px' }}>
                                                        {file.file_type} • {(file.file_size / 1024).toFixed(1)} KB • Uploaded by: {file.uploaded_by || 'Admin'}
                                                    </p>
                                                </div>
                                            </div>
                                            <button className="btn-download" onClick={() => downloadFile(file.id, file.file_name)} style={styles.button}>
                                                <Download size={16} style={{ marginRight: '6px' }} /> Download
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Student Uploaded Files */}
                            <p style={{ color: '#8b5cf6', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
                                Student Submitted Files
                            </p>
                            {appDetails.files && appDetails.files.length > 0 ? (
                                <div>
                                    {appDetails.files.map((file) => (
                                        <div key={file.id} style={{ ...styles.fileRow, borderLeft: '4px solid #a78bfa' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <FileText style={{ color: '#a78bfa' }} size={20} />
                                                <div>
                                                    <p style={{ color: '#0f172a', margin: 0, fontWeight: '500', fontSize: '14px' }}>{file.file_name}</p>
                                                    <p style={{ color: '#64748b', margin: 0, fontSize: '12px' }}>
                                                        {file.file_type} • {(file.file_size / 1024).toFixed(1)} KB
                                                    </p>
                                                </div>
                                            </div>
                                            <button className="btn-download" onClick={() => downloadFile(file.id, file.file_name)} style={styles.button}>
                                                <Download size={16} style={{ marginRight: '6px' }} /> Download
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p style={{ color: '#64748b', fontSize: '14px' }}>No files attached</p>
                            )}
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
                    background: rgba(59, 130, 246, 0.3) !important;
                    transform: translateY(-1px);
                }

                .btn-refresh:active:not(:disabled) {
                    transform: translateY(0);
                }

                .btn-logout {
                    transition: all 0.2s ease;
                }

                .btn-logout:hover {
                    background: rgba(239, 68, 68, 0.3) !important;
                    transform: translateY(-1px);
                }

                .btn-logout:active {
                    transform: translateY(0);
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
            <div style={styles.page}>
                <div style={styles.container}>
                {/* Header */}
                <div style={styles.header}>
                    <h1 style={styles.title}>Admin Dashboard</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <button
                            className="btn-refresh"
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
                            <span style={{ color: '#64748b', fontSize: '12px' }}>
                                Last updated: {lastUpdated.toLocaleTimeString()}
                            </span>
                        )}
                        <button className="btn-logout" onClick={handleLogout} style={styles.logoutButton}>
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
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                        <h2 style={{ color: '#0f172a', margin: 0 }}>Recent Applications</h2>
                        <div style={{ position: 'relative', minWidth: '280px', flex: '0 1 360px' }}>
                            <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by name, ID, form type, campus..."
                                style={{
                                    ...styles.input,
                                    paddingLeft: '40px',
                                    paddingRight: searchQuery ? '36px' : '16px',
                                    fontSize: '13px',
                                    padding: '10px 16px 10px 40px',
                                    borderRadius: '10px'
                                }}
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    style={{
                                        position: 'absolute',
                                        right: '10px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: '2px',
                                        color: '#94a3b8',
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    </div>

                    {(() => {
                        const filteredApplications = applications.filter(app => {
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
                        });

                        return (
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
                                        {filteredApplications.map((app) => (
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
                                    <p style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                                        No applications found
                                    </p>
                                )}

                                {applications.length > 0 && filteredApplications.length === 0 && (
                                    <p style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                                        No applications match "{searchQuery}"
                                    </p>
                                )}
                            </div>
                        );
                    })()}
                </div>
            </div>
        </div>
        </>
    );
}
