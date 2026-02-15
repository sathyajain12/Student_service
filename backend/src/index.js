import { getGoogleAuth, sendEmail } from './google-api';

const ADMIN_EMAIL = 'saisathyajain@sssihl.edu.in';

// Custom error class for file validation failures (returns 400 instead of 500)
class FileValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'FileValidationError';
    }
}

// Application ID generation with form-specific prefixes
function generateAppId(prefix) {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
    return `${prefix}${yy}${mm}${dd}${random}`;
}

export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        // CORS Headers
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        };

        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        try {
            // Public routes
            if (url.pathname === '/submit' && request.method === 'POST') {
                return await handleSubmission(request, env, corsHeaders);
            }

            if (url.pathname === '/approve' && request.method === 'GET') {
                return await handleApproval(url, env, corsHeaders);
            }

            if (url.pathname === '/submit-to-coe' && request.method === 'POST') {
                return await handleSubmitToCOE(request, env, corsHeaders);
            }

            if (url.pathname === '/status' && request.method === 'GET') {
                return await handleStatusRequest(url, env, corsHeaders);
            }

            // Public download for students (response documents only)
            if (url.pathname.startsWith('/download/') && request.method === 'GET') {
                const fileId = url.pathname.split('/').pop();
                return await handlePublicDownload(fileId, url, env, corsHeaders);
            }

            // Admin routes
            if (url.pathname === '/admin/login' && request.method === 'POST') {
                return await handleAdminLogin(request, env, corsHeaders);
            }

            if (url.pathname === '/admin/applications' && request.method === 'GET') {
                return await handleGetApplications(request, env, corsHeaders);
            }

            if (url.pathname.startsWith('/admin/application/') && request.method === 'GET') {
                const id = url.pathname.split('/').pop();
                return await handleGetApplication(id, request, env, corsHeaders);
            }

            if (url.pathname.startsWith('/admin/file/') && request.method === 'GET') {
                const fileId = url.pathname.split('/').pop();
                return await handleGetFile(fileId, request, env, corsHeaders);
            }

            if (url.pathname === '/admin/stats' && request.method === 'GET') {
                return await handleGetStats(request, env, corsHeaders);
            }

            if (url.pathname === '/admin/complete' && request.method === 'POST') {
                return await handleMarkCompleted(request, env, corsHeaders);
            }

            if (url.pathname === '/admin/upload-response' && request.method === 'POST') {
                return await handleUploadResponse(request, env, corsHeaders);
            }

            if (url.pathname.startsWith('/admin/application/') && request.method === 'DELETE') {
                const id = url.pathname.split('/').pop();
                return await handleDeleteApplication(id, request, env, corsHeaders);
            }

            return new Response('Not Found', { status: 404, headers: corsHeaders });
        } catch (error) {
            console.error(error);
            const status = error instanceof FileValidationError ? 400 : 500;
            return new Response(JSON.stringify({ error: error.message }), {
                status: status,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
    }
};

// ==================== ADMIN FUNCTIONS ====================

async function verifyAdminToken(request, env) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    const token = authHeader.substring(7);

    // Simple token verification (token is username:timestamp hashed)
    try {
        const [username, timestamp] = atob(token).split(':');
        const admin = await env.DB.prepare(
            'SELECT * FROM admin_users WHERE username = ?'
        ).bind(username).first();

        // Token valid for 24 hours
        if (admin && (Date.now() - parseInt(timestamp)) < 86400000) {
            return admin;
        }
    } catch (e) {
        return null;
    }
    return null;
}

async function handleAdminLogin(request, env, corsHeaders) {
    const { username, password } = await request.json();

    // Simple password hash (in production, use bcrypt or similar)
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    const admin = await env.DB.prepare(
        'SELECT * FROM admin_users WHERE username = ? AND password_hash = ?'
    ).bind(username, passwordHash).first();

    if (!admin) {
        return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    // Create simple token
    const token = btoa(`${username}:${Date.now()}`);

    return new Response(JSON.stringify({ success: true, token, username: admin.username }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function handleGetApplications(request, env, corsHeaders) {
    const admin = await verifyAdminToken(request, env);
    if (!admin) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    const applications = await env.DB.prepare(
        `SELECT id, student_email, form_type, applicant_name, reg_no, campus, status, 
                director_status, controller_status, created_at, updated_at 
         FROM applications ORDER BY created_at DESC`
    ).all();

    return new Response(JSON.stringify(applications.results), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function handleGetApplication(id, request, env, corsHeaders) {
    const admin = await verifyAdminToken(request, env);
    if (!admin) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    const application = await env.DB.prepare(
        'SELECT * FROM applications WHERE id = ?'
    ).bind(id).first();

    if (!application) {
        return new Response(JSON.stringify({ error: 'Application not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    // Get student-uploaded files
    const studentFiles = await env.DB.prepare(
        `SELECT id, field_name, file_name, file_type, file_size, created_at
         FROM file_blobs
         WHERE application_id = ? AND (is_response = FALSE OR is_response IS NULL)`
    ).bind(id).all();

    // Get admin-uploaded response documents
    const responseFiles = await env.DB.prepare(
        `SELECT id, field_name, file_name, file_type, file_size, created_at, uploaded_by
         FROM file_blobs
         WHERE application_id = ? AND is_response = TRUE`
    ).bind(id).all();

    // Map form_type to the corresponding form table
    const formTableMap = {
        'Application for Duplicate Grade Card': 'form_duplicate_grade_card',
        'Application for CGPA to Percentage Conversion': 'form_cgpa_conversion',
        'Application for End-Semester Supplementary Examinations Registration': 'form_supplementary_exam',
        'Application for Duplicate Degree Certificate': 'form_duplicate_degree',
        'Application for Registration of Student Name change in the Institute Records': 'form_name_change',
        'Application for repeating a paper for supplementary examinations (CIE and ESE)': 'form_repeat_paper',
        'Application for Re-Totalling of Marks': 'form_retotaling',
        'Application for On-Request Degree Certificate': 'form_on_request_degree',
        'Application for Migration Certificate': 'form_migration_certificate',
    };

    let formData = null;
    const formTable = formTableMap[application.form_type];
    if (formTable) {
        try {
            formData = await env.DB.prepare(
                `SELECT * FROM ${formTable} WHERE application_id = ?`
            ).bind(id).first();
        } catch (e) {
            formData = null;
        }
    }

    return new Response(JSON.stringify({
        application,
        formData,
        files: studentFiles.results,
        responseDocuments: responseFiles.results
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function handleGetFile(fileId, request, env, corsHeaders) {
    const admin = await verifyAdminToken(request, env);
    if (!admin) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    const file = await env.DB.prepare(
        'SELECT * FROM file_blobs WHERE id = ?'
    ).bind(fileId).first();

    if (!file) {
        return new Response(JSON.stringify({ error: 'File not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    // Decode base64 and return as file
    const binaryString = atob(file.file_data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }

    return new Response(bytes, {
        headers: {
            ...corsHeaders,
            'Content-Type': file.file_type,
            'Content-Disposition': `attachment; filename="${file.file_name}"`
        }
    });
}

async function handleGetStats(request, env, corsHeaders) {
    const admin = await verifyAdminToken(request, env);
    if (!admin) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    const total = await env.DB.prepare('SELECT COUNT(*) as count FROM applications').first();
    const pending = await env.DB.prepare("SELECT COUNT(*) as count FROM applications WHERE status = 'PENDING'").first();
    const approved = await env.DB.prepare("SELECT COUNT(*) as count FROM applications WHERE status IN ('APPROVED', 'COMPLETED')").first();
    const rejected = await env.DB.prepare("SELECT COUNT(*) as count FROM applications WHERE status = 'REJECTED'").first();

    const byFormType = await env.DB.prepare(
        'SELECT form_type, COUNT(*) as count FROM applications GROUP BY form_type'
    ).all();

    return new Response(JSON.stringify({
        total: total.count,
        pending: pending.count,
        approved: approved.count,
        rejected: rejected.count,
        byFormType: byFormType.results
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function handleMarkCompleted(request, env, corsHeaders) {
    const admin = await verifyAdminToken(request, env);
    if (!admin) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    try {
        const { applicationId } = await request.json();

        if (!applicationId) {
            return new Response(JSON.stringify({ error: 'Application ID is required' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Update the application status to COMPLETED
        await env.DB.prepare(
            `UPDATE applications SET controller_status = 'APPROVED', status = 'COMPLETED', updated_at = CURRENT_TIMESTAMP WHERE id = ?`
        ).bind(applicationId).run();

        console.log(`Application ${applicationId} marked as completed by admin`);

        return new Response(JSON.stringify({ success: true, message: 'Application marked as completed' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error marking application as completed:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

// Handler for admin uploading response document
async function handleUploadResponse(request, env, corsHeaders) {
    const admin = await verifyAdminToken(request, env);
    if (!admin) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    try {
        const formData = await request.formData();
        const applicationId = formData.get('applicationId');
        const file = formData.get('responseDocument');

        if (!applicationId || !file) {
            return new Response(JSON.stringify({ error: 'Application ID and file are required' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Verify application exists
        const app = await env.DB.prepare(
            'SELECT id FROM applications WHERE id = ?'
        ).bind(applicationId).first();

        if (!app) {
            return new Response(JSON.stringify({ error: 'Application not found' }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Validate file through all 4 security layers (returns ArrayBuffer)
        const arrayBuffer = await validateFile(file);
        const uint8Array = new Uint8Array(arrayBuffer);
        let binary = '';
        for (let i = 0; i < uint8Array.length; i++) {
            binary += String.fromCharCode(uint8Array[i]);
        }
        const base64 = btoa(binary);

        await env.DB.prepare(
            `INSERT INTO file_blobs (application_id, field_name, file_name, file_type, file_size, file_data, is_response, uploaded_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
            applicationId,
            'response_document',
            file.name,
            file.type,
            file.size,
            base64,
            true,
            admin.username
        ).run();

        console.log(`Response document uploaded: ${file.name} for app ${applicationId} by admin ${admin.username}`);

        return new Response(JSON.stringify({ success: true, message: 'Response document uploaded successfully' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (error) {
        if (error instanceof FileValidationError) {
            return new Response(JSON.stringify({ error: error.message }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
        console.error('Error uploading response document:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

// Handler for deleting an application and all related data
async function handleDeleteApplication(id, request, env, corsHeaders) {
    const admin = await verifyAdminToken(request, env);
    if (!admin) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    try {
        // Get the application to find its form_type
        const application = await env.DB.prepare(
            'SELECT id, form_type FROM applications WHERE id = ?'
        ).bind(id).first();

        if (!application) {
            return new Response(JSON.stringify({ error: 'Application not found' }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Map form_type to table name
        const formTableMap = {
            'Application for Duplicate Grade Card': 'form_duplicate_grade_card',
            'Application for CGPA to Marks Conversion': 'form_cgpa_conversion',
            'Application for End-Semester Supplementary Examinations Registration': 'form_supplementary_exam',
            'Application for Duplicate Degree Certificate': 'form_duplicate_degree',
            'Application for Registration of Student Name change in the Institute Records': 'form_name_change',
            'Application for repeating a paper for supplementary examinations (CIE and ESE)': 'form_repeat_paper',
            'Application for Re-Totalling of Marks': 'form_retotaling',
            'Application for On-Request Degree Certificate': 'form_on_request_degree',
            'Application for Migration Certificate': 'form_migration_certificate',
        };

        // Delete from form-specific table first (FK constraint)
        const formTable = formTableMap[application.form_type];
        if (formTable) {
            await env.DB.prepare(`DELETE FROM ${formTable} WHERE Application_id = ?`).bind(id).run();
        }

        // Delete all file blobs for this application
        await env.DB.prepare('DELETE FROM file_blobs WHERE application_id = ?').bind(id).run();

        // Delete the application record
        await env.DB.prepare('DELETE FROM applications WHERE id = ?').bind(id).run();

        console.log(`Application ${id} deleted by admin ${admin.username}`);

        return new Response(JSON.stringify({ success: true, message: `Application ${id} deleted successfully` }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error deleting application:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

// Handler for public download (students downloading response documents)
async function handlePublicDownload(fileId, url, env, corsHeaders) {
    const appId = url.searchParams.get('appId');

    if (!appId) {
        return new Response(JSON.stringify({ error: 'Application ID is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    // Only allow downloading response documents (is_response = true) with matching appId
    const file = await env.DB.prepare(
        'SELECT * FROM file_blobs WHERE id = ? AND application_id = ? AND is_response = TRUE'
    ).bind(fileId, appId).first();

    if (!file) {
        return new Response(JSON.stringify({ error: 'File not found or access denied' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    // Decode base64 and return as file
    const binaryString = atob(file.file_data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }

    return new Response(bytes, {
        headers: {
            ...corsHeaders,
            'Content-Type': file.file_type,
            'Content-Disposition': `attachment; filename="${file.file_name}"`
        }
    });
}

// ==================== HELPER FUNCTIONS ====================

// Validates uploaded files through 4 security layers. Returns ArrayBuffer on success.
async function validateFile(file) {
    // Layer 1: MIME Type Validation
    if (file.type !== 'application/pdf') {
        throw new FileValidationError(
            `Invalid file type "${file.type}" for file "${file.name}". Only PDF files are allowed.`
        );
    }

    // Layer 2: File Size Limit (10MB max, reject empty files)
    if (!file.size || file.size === 0) {
        throw new FileValidationError(
            `File "${file.name}" is empty. Please upload a valid PDF document.`
        );
    }
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
    if (file.size > MAX_FILE_SIZE) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
        throw new FileValidationError(
            `File "${file.name}" is ${sizeMB} MB, which exceeds the 10 MB limit. Please compress or reduce the file size.`
        );
    }

    // Layer 3: Magic Bytes Check (PDF signature: %PDF-)
    const arrayBuffer = await file.arrayBuffer();
    const header = new Uint8Array(arrayBuffer, 0, Math.min(5, arrayBuffer.byteLength));
    const pdfSignature = [0x25, 0x50, 0x44, 0x46, 0x2D]; // %PDF-
    const isPdfSignature = pdfSignature.every((byte, index) => header[index] === byte);
    if (!isPdfSignature) {
        throw new FileValidationError(
            `File "${file.name}" does not appear to be a valid PDF document. The file header does not match the PDF format.`
        );
    }

    // Layer 4: PDF Content Security Scan
    const uint8Array = new Uint8Array(arrayBuffer);
    let contentStr = '';
    for (let i = 0; i < uint8Array.length; i++) {
        contentStr += String.fromCharCode(uint8Array[i]);
    }

    const dangerousPatterns = [
        { pattern: /\/JS\s/i, description: 'embedded JavaScript (JS)' },
        { pattern: /\/JavaScript\s/i, description: 'embedded JavaScript' },
        { pattern: /\/Launch\s/i, description: 'launch action (can execute programs)' },
        { pattern: /\/EmbeddedFile\s/i, description: 'embedded executable file' },
        { pattern: /\/OpenAction\s*<<[^>]*\/JS/i, description: 'auto-execute JavaScript on open' },
        { pattern: /\/AA\s*<</i, description: 'additional actions (auto-execute triggers)' },
        { pattern: /\/RichMedia\s/i, description: 'embedded rich media (Flash/multimedia)' },
        { pattern: /\/XFA\s/i, description: 'XFA form (potential script execution)' },
    ];

    for (const { pattern, description } of dangerousPatterns) {
        if (pattern.test(contentStr)) {
            throw new FileValidationError(
                `File "${file.name}" was rejected because it contains potentially dangerous content: ${description}. Please upload a clean PDF document.`
            );
        }
    }

    return arrayBuffer;
}

async function storeFileBlob(env, appId, fieldName, file) {
    try {
        // Validate file through all 4 security layers (returns ArrayBuffer)
        const arrayBuffer = await validateFile(file);
        const uint8Array = new Uint8Array(arrayBuffer);

        // Convert to base64 properly - use a single encoding for the entire file
        // For smaller files (< 1MB), encode directly
        let base64;
        if (uint8Array.length < 1024 * 1024) {
            // For small files, encode directly
            let binary = '';
            for (let i = 0; i < uint8Array.length; i++) {
                binary += String.fromCharCode(uint8Array[i]);
            }
            base64 = btoa(binary);
        } else {
            // For larger files, use chunks but ensure chunk size is multiple of 3
            const chunkSize = 30000; // Multiple of 3 to avoid padding issues
            let binary = '';
            for (let i = 0; i < uint8Array.length; i++) {
                binary += String.fromCharCode(uint8Array[i]);
            }
            base64 = btoa(binary);
        }

        await env.DB.prepare(
            `INSERT INTO file_blobs (application_id, field_name, file_name, file_type, file_size, file_data)
             VALUES (?, ?, ?, ?, ?, ?)`
        ).bind(appId, fieldName, file.name, file.type, file.size, base64).run();

        console.log(`Stored file blob: ${file.name} for app ${appId}`);
    } catch (error) {
        console.error(`Failed to store file blob: ${error.message}`);
        throw error;
    }
}

async function getApplicationFiles(env, appId) {
    try {
        const result = await env.DB.prepare(
            `SELECT id, field_name, file_name, file_type, file_size, file_data
             FROM file_blobs
             WHERE application_id = ?
             ORDER BY created_at ASC`
        ).bind(appId).all();

        return result.results || [];
    } catch (error) {
        console.error(`Failed to fetch files for app ${appId}:`, error);
        return [];
    }
}

// Email Template Utility
function renderEmailTemplate({ title, greeting, content, details = [], actionButtons = [], importantNote = null, highlight = null }) {
    const detailRows = details.map(detail => `
        <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                <span style="display: block; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; margin-bottom: 4px;">${detail.label}</span>
                <span style="display: block; font-size: 14px; font-weight: 500; color: #1e293b;">${detail.value}</span>
            </td>
        </tr>
    `).join('');

    const buttons = actionButtons.map(btn => `
        <td style="padding: 0 10px 0 0;">
            <a href="${btn.link}" style="display: inline-block; background-color: ${btn.color || '#3b82f6'}; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 9999px; font-weight: 600; font-size: 14px; box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.2); transition: all 0.2s ease;">${btn.label}</a>
        </td>
    `).join('');

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', sans-serif; background-color: #f8fafc; color: #475569;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 20px; box-shadow: 0 10px 40px -10px rgba(148, 163, 184, 0.2); overflow: hidden;">
                    <!-- Header Banner -->
                    <tr>
                        <td align="center" style="padding: 0;">
                            <img src="https://student-service.pages.dev/Examinations_Service.png" alt="SSSIHL Examinations Service" width="650" style="width: 100%; height: auto; display: block; border-bottom: 1px solid #f1f5f9;">
                        </td>
                    </tr>

                    <!-- Main Message -->
                    <tr>
                        <td style="padding: 40px 30px 30px 30px;">
                            ${greeting ? `<p style="margin: 0 0 16px 0; color: #0f172a; font-size: 18px; font-weight: 700;">${greeting}</p>` : ''}
                            <h1 style="margin: 0 0 12px 0; color: #0f172a; font-size: 24px; font-weight: 700;">${title}</h1>
                            <div style="margin: 0; color: #475569; font-size: 15px; line-height: 1.6;">
                                ${content}
                            </div>
                        </td>
                    </tr>

                    ${highlight ? `
                    <!-- Highlight Section -->
                    <tr>
                        <td style="padding: 0 30px 30px 30px;">
                            <div style="background-color: #f0f9ff; border-radius: 12px; padding: 20px; border: 1px solid #e0f2fe;">
                                <p style="margin: 0 0 8px 0; color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">${highlight.label}</p>
                                <p style="margin: 0; color: #2563eb; font-size: 28px; font-weight: 700; font-family: 'Monaco', 'Courier New', monospace;">${highlight.value}</p>
                                ${highlight.subtext ? `<p style="margin: 12px 0 0 0; color: #64748b; font-size: 13px;">${highlight.subtext}</p>` : ''}
                            </div>
                        </td>
                    </tr>
                    ` : ''}

                    ${details.length > 0 ? `
                    <!-- Details Table -->
                    <tr>
                        <td style="padding: 0 30px 30px 30px;">
                            <h2 style="margin: 0 0 16px 0; color: #0f172a; font-size: 18px; font-weight: 600;">Details</h2>
                            <table width="100%" cellpadding="12" cellspacing="0" style="background-color: #f8fafc; border-radius: 12px;">
                                ${detailRows}
                            </table>
                        </td>
                    </tr>
                    ` : ''}

                    ${importantNote ? `
                    <!-- Important Note -->
                    <tr>
                        <td style="padding: 0 30px 30px 30px;">
                            <div style="background-color: #fffbeb; border-radius: 12px; padding: 20px; border: 1px solid #fef3c7;">
                                <p style="margin: 0 0 8px 0; color: #92400e; font-size: 15px; font-weight: 700;">⚠️ Important Information</p>
                                <div style="margin: 0; color: #78350f; font-size: 14px; line-height: 1.8;">
                                    ${importantNote}
                                </div>
                            </div>
                        </td>
                    </tr>
                    ` : ''}

                    ${actionButtons.length > 0 ? `
                    <!-- Action Buttons -->
                    <tr>
                        <td style="padding: 0 30px 40px 30px;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center">
                                        <table cellpadding="0" cellspacing="0">
                                            <tr>
                                                ${buttons}
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    ` : ''}

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                            <p style="margin: 0 0 8px 0; color: #0f172a; font-size: 15px; font-weight: 600;">Office of the Controller of Examinations</p>
                            <p style="margin: 0 0 4px 0; color: #64748b; font-size: 14px;">Sri Sathya Sai Institute of Higher Learning</p>
                            <p style="margin: 0 0 12px 0; color: #64748b; font-size: 13px;">Prasanthi Nilayam, Sri Sathya Sai District, Andhra Pradesh, India</p>
                            <p style="margin: 0; color: #64748b; font-size: 12px;">This is an automated notification. Please do not reply to this email.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;
}

async function sendAdminNotification(env, appId, formType, applicantName, email) {
    if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_REFRESH_TOKEN) {
        try {
            const accessToken = await getGoogleAuth(env);
            const htmlBody = renderEmailTemplate({
                title: 'New Application Received',
                greeting: 'Sai Ram!',
                content: 'A new application has been submitted through the portal and is ready for review.',
                details: [
                    { label: 'Application ID', value: appId },
                    { label: 'Form Type', value: formType },
                    { label: 'Applicant', value: applicantName },
                    { label: 'Email', value: email },
                    { label: 'Submitted On', value: new Date().toLocaleString() }
                ],
                actionButtons: [
                    { label: 'Login to Admin Portal', link: 'https://student-service.pages.dev/admin/login' }
                ]
            });

            await sendEmail(accessToken, {
                to: ADMIN_EMAIL,
                subject: `New Application Received: ${formType} - ${appId}`,
                htmlBody: htmlBody
            });
        } catch (e) {
            console.error('Failed to send admin notification:', e);
        }
    }
}

// Director email functions
function getDirectorEmail(campus) {
    const map = {
        'Prashanti Nilayam Campus': 'saisathyajain@sssihl.edu.in',
        'Anantapur Campus': 'results@sssihl.edu.in',
        'Brindavan Campus': 'sathyajain9@gmail.com',
        'Nandigiri Campus': 'sathyajain99@outlook.com'
    };
    return map[campus] || map['Prashanti Nilayam Campus'];
}

function shouldNotifyDirector(formType) {
    const forms = [
        'Application for Duplicate Grade Card',
        'Application for End-Semester Supplementary Examinations Registration',
        'Application for Registration of Student Name change in the Institute Records',
        'Application for repeating a paper for supplementary examinations (CIE and ESE)',
    ];
    return forms.includes(formType);
}

async function sendDirectorNotification(env, request, appId, formType, applicantName, email, campus, semester = null, regNo = null) {
    if (!shouldNotifyDirector(formType)) {
        return;
    }

    try {
        const accessToken = await getGoogleAuth(env);
        const directorEmail = getDirectorEmail(campus);
        const url = new URL(request.url);

        // Fetch student's uploaded documents count (not attaching files)
        const files = await getApplicationFiles(env, appId);
        console.log(`Found ${files.length} files for application ${appId}`);

        const submissionDate = new Date().toLocaleString('en-IN', {
            dateStyle: 'long',
            timeStyle: 'short',
            timeZone: 'Asia/Kolkata'
        });

        await sendEmail(accessToken, {
            to: directorEmail,
            subject: `Clearance Required: ${formType} - ${appId}`,
            htmlBody: renderEmailTemplate({
                title: 'Clearance Required',
                greeting: 'Sai Ram!',
                content: `A new application for <strong>${formType}</strong> has been submitted and requires your clearance for further processing.`,
                details: [
                    { label: 'Application ID', value: appId },
                    { label: 'Form Type', value: formType },
                    { label: 'Applicant Name', value: applicantName },
                    { label: 'Registered Number', value: regNo || 'N/A' },
                    { label: 'Applicant Email', value: email },
                    { label: 'Campus', value: campus },
                    { label: 'Semester', value: semester || 'N/A' },
                    { label: 'Submission Date', value: submissionDate },
                    { label: 'Documents Found', value: `${files.length} file(s)` }
                ],
                importantNote: `
                        <p style="margin: 0; font-weight: 700;">⚠️ Important Note</p>
                        <p style="margin: 8px 0 0 0;">Request you to please verify with the campus office regarding the availability of the original grade card before processing this application.</p>
                        <p style="margin: 8px 0 0 0;"><strong>If the grade card is available at the campus office and the student has not collected it yet, please reject this application.</strong> The student will be notified to contact the campus office to collect their original grade card.</p>
                    `,
                actionButtons: [
                    { label: '✓ Clear Application', link: `${url.origin}/approve?id=${appId}&role=Director&action=Approve`, color: '#10b981' },
                    { label: '✗ Reject', link: `${url.origin}/approve?id=${appId}&role=Director&action=Reject`, color: '#ef4444' }
                ]
            }),
            attachments: []
        });
        console.log(`Director email sent to ${directorEmail} for app ${appId}`);
    } catch (e) {
        console.error('Failed to send director notification:', e);
    }
}

// Student email notification functions
function getStudentEmailSubject(formType, appId, isApproved) {
    if (isApproved) {
        return `Application Approved - ${formType} - ${appId}`;
    } else {
        return `Application Status Update - ${formType} - ${appId}`;
    }
}

function generateStudentEmailHTML(verification, isApproved, portalUrl) {
    const needsTwoStep = shouldNotifyDirector(verification.form_type);
    const statusText = isApproved ? 'APPROVED' : 'REJECTED';
    const statusColor = isApproved ? '#059669' : '#dc2626';
    const heading = isApproved ? 'Application Approved' : 'Application Status Update';
    const isDuplicateGradeCard = verification.form_type === 'Application for Duplicate Grade Card';

    let content = isApproved
        ? (needsTwoStep
            ? 'Your application has been approved by the Director. Please return to the portal to complete your submission to the Controller of Examinations (COE).'
            : 'We are pleased to inform you that your application has been approved.')
        : (isDuplicateGradeCard
            ? 'Your application for Duplicate Grade Card has been reviewed. Please see the details below.'
            : 'Your application status has been updated. Please see the details below.');

    const submissionDate = verification.created_at
        ? new Date(verification.created_at).toLocaleString('en-IN', {
            dateStyle: 'long',
            timeStyle: 'short',
            timeZone: 'Asia/Kolkata'
        })
        : 'N/A';

    let nextSteps = `
        <ul style="margin: 0; padding-left: 20px; color: #1e40af; font-size: 14px; line-height: 1.8;">
            ${isApproved
            ? (needsTwoStep
                ? `<li>Your Director has approved your application</li>
                       <li>Click the button below to submit your application to COE</li>`
                : `<li>Your request is being processed by the Examination Department</li>
                       <li>You will receive further updates via email</li>`)
            : (isDuplicateGradeCard
                ? `<li><strong>Your original grade card is available at the ${verification.campus || 'campus'} office</strong></li>
                       <li>Please contact the campus office to collect your grade card</li>`
                : `<li>For queries or clarifications, please contact: <a href="mailto:examination@sssihl.edu.in" style="color: #2563eb; text-decoration: none;">examination@sssihl.edu.in</a></li>`)
        }
        </ul>
    `;

    return renderEmailTemplate({
        title: heading,
        greeting: 'Sai Ram!',
        content: content,
        details: [
            { label: 'Application ID', value: verification.id },
            { label: 'Applicant', value: verification.applicant_name },
            { label: 'Form Type', value: verification.form_type },
            { label: 'Campus', value: verification.campus },
            { label: 'Submitted On', value: submissionDate },
            { label: 'Status', value: `<span style="color: ${statusColor}; font-weight: 700;">${statusText}</span>` }
        ],
        importantNote: nextSteps,
        actionButtons: [
            {
                label: (needsTwoStep && isApproved) ? 'Submit to COE Now' : 'Track Application Status',
                link: (needsTwoStep && isApproved) ? `${portalUrl}#track=${verification.id}` : portalUrl
            }
        ]
    });
}

async function sendStudentDecisionEmail(env, verification, isApproved, portalUrl) {
    // Validate student email exists
    if (!verification.student_email) {
        console.log('No student email found, skipping notification');
        return;
    }

    try {
        // Get OAuth access token
        const accessToken = await getGoogleAuth(env);

        // Generate email subject and body
        const subject = getStudentEmailSubject(verification.form_type, verification.id, isApproved);
        const htmlBody = generateStudentEmailHTML(verification, isApproved, portalUrl);

        // Send email
        await sendEmail(accessToken, {
            to: verification.student_email,
            subject: subject,
            htmlBody: htmlBody
        });

        console.log(`Student decision email sent successfully to ${verification.student_email}`);
    } catch (error) {
        console.error('Error sending student decision email:', error);
        throw error; // Re-throw to be caught in handleApproval
    }
}

// Student confirmation email (sent when application is first submitted)
function generateStudentConfirmationHTML(appId, formType, applicantName, email, campus) {
    const submissionDate = new Date().toLocaleString('en-IN', {
        dateStyle: 'long',
        timeStyle: 'short',
        timeZone: 'Asia/Kolkata'
    });

    return renderEmailTemplate({
        title: 'Application Submitted Successfully!',
        greeting: 'Sai Ram!',
        content: 'Thank you for submitting your application. We have received your request and it is now being processed.',
        highlight: {
            label: 'Your Application ID',
            value: appId,
            subtext: 'Please save this ID for tracking your application'
        },
        details: [
            { label: 'Applicant Name', value: applicantName },
            { label: 'Email', value: email },
            { label: 'Form Type', value: formType },
            { label: 'Campus', value: campus },
            { label: 'Submitted On', value: submissionDate }
        ],
        importantNote: `
            <h3 style="margin: 0 0 12px 0; color: #1e40af; font-size: 16px; font-weight: 600;">What Happens Next?</h3>
            <ul style="margin: 0; padding-left: 20px; color: #1e40af; font-size: 14px; line-height: 1.8;">
                <li>Your application will be reviewed by the relevant authorities</li>
                <li>You will receive email notifications at each stage of the approval process</li>
                <li>You can track your application status anytime using your Application ID</li>
                <li>For queries, contact: <a href="mailto:examination@sssihl.edu.in" style="color: #2563eb; text-decoration: none;">examination@sssihl.edu.in</a></li>
            </ul>
        `,
        actionButtons: [
            { label: 'Track Application Status', link: 'https://student-service.pages.dev/#track' }
        ]
    });
}

async function sendStudentConfirmationEmail(env, appId, formType, applicantName, email, campus) {
    console.log(`[STUDENT CONFIRMATION] Starting for appId: ${appId}, email: ${email}`);

    // Validate student email exists
    if (!email) {
        console.log('[STUDENT CONFIRMATION] No student email provided, skipping confirmation');
        return;
    }

    try {
        console.log('[STUDENT CONFIRMATION] Getting OAuth access token...');
        // Get OAuth access token
        const accessToken = await getGoogleAuth(env);
        console.log('[STUDENT CONFIRMATION] OAuth token obtained successfully');

        // Generate email subject and body
        const subject = `Application Received - ${formType} - ${appId}`;
        const htmlBody = generateStudentConfirmationHTML(appId, formType, applicantName, email, campus);
        console.log('[STUDENT CONFIRMATION] Email content generated');

        // Send email
        console.log(`[STUDENT CONFIRMATION] Sending email to ${email}...`);
        await sendEmail(accessToken, {
            to: email,
            subject: subject,
            htmlBody: htmlBody
        });

        console.log(`[STUDENT CONFIRMATION] Email sent successfully to ${email} for app ${appId}`);
    } catch (error) {
        console.error('[STUDENT CONFIRMATION] Error:', error);
        console.error('[STUDENT CONFIRMATION] Error message:', error.message);
        console.error('[STUDENT CONFIRMATION] Error stack:', error.stack);
        // Don't throw - we don't want to fail the submission if email fails
    }
}

async function sendDirectorSoughtConfirmationEmail(env, appId, formType, applicantName, email, campus) {
    try {
        const accessToken = await getGoogleAuth(env);
        const submissionDate = new Date().toLocaleString('en-IN', {
            dateStyle: 'long',
            timeStyle: 'short',
            timeZone: 'Asia/Kolkata'
        });

        const htmlBody = renderEmailTemplate({
            title: 'Application Sent for Clearance',
            greeting: 'Sai Ram!',
            content: `Your application requires clearance from the Director of your campus. It has been automatically forwarded for review.`,
            highlight: {
                label: 'Your Application ID',
                value: appId,
                subtext: 'Use this ID to track status updates'
            },
            details: [
                { label: 'Applicant Name', value: applicantName },
                { label: 'Form Type', value: formType },
                { label: 'Campus', value: campus },
                { label: 'Submitted On', value: submissionDate }
            ],
            importantNote: `
                <p style="margin: 0;">Once your Director provides clearance, your application will be forwarded to the Controller of Examinations. You will receive an email notification when this happens.</p>
            `,
            actionButtons: [
                { label: 'Track Application Status', link: 'https://student-service.pages.dev/#track' }
            ]
        });

        await sendEmail(accessToken, {
            to: email,
            subject: `Action Required: Application Sent for Clearance - ${appId}`,
            htmlBody: htmlBody
        });
        console.log(`Director-sought confirmation email sent to ${email} for app ${appId}`);
    } catch (error) {
        console.error('Failed to send director-sought confirmation:', error);
    }
}


// ==================== FORM HANDLERS ====================

async function handleSubmission(request, env, corsHeaders) {
    const formData = await request.formData();
    const formType = formData.get('formType');

    // Route to appropriate handler based on form type
    switch (formType) {
        case 'Application for Duplicate Grade Card':
            return await handleDuplicateGradeCard(formData, request, env, corsHeaders);
        case 'Application for CGPA to Marks Conversion':
            return await handleCGPAConversion(formData, request, env, corsHeaders);
        case 'Application for End-Semester Supplementary Examinations Registration':
            return await handleSupplementaryExam(formData, request, env, corsHeaders);
        case 'Application for Duplicate Degree Certificate':
            return await handleDuplicateDegree(formData, request, env, corsHeaders);
        case 'Application for Registration of Student Name change in the Institute Records':
            return await handleNameChange(formData, request, env, corsHeaders);
        case 'Application for repeating a paper for supplementary examinations (CIE and ESE)':
            return await handleRepeatPaper(formData, request, env, corsHeaders);
        case 'Application for Re-Totalling of Marks':
            return await handleRetotaling(formData, request, env, corsHeaders);
        case 'Application for On-Request Degree Certificate':
            return await handleOnRequestDegree(formData, request, env, corsHeaders);
        case 'Application for Migration Certificate':
            return await handleMigration(formData, request, env, corsHeaders);
        default:
            return new Response(JSON.stringify({ success: false, error: 'Unknown form type' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
    }
}

// Handler for Duplicate Grade Card
async function handleDuplicateGradeCard(formData, request, env, corsHeaders) {
    const email = formData.get('email');
    const applicantName = formData.get('applicantName');
    const regNo = formData.get('regNo');
    const campus = formData.get('campus');
    const formType = formData.get('formType');
    const semester = formData.get('semester');
    const submissionType = formData.get('submissionType');
    const isSeekingDirectorApproval = submissionType === 'seek-director-approval';

    const appId = generateAppId('DGC');

    // 1. Save to main applications table
    await env.DB.prepare(
        `INSERT INTO applications (id, student_email, form_type, applicant_name, reg_no, campus, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(appId, email, formType, applicantName, regNo, campus, isSeekingDirectorApproval ? 'AWAITING_DIRECTOR' : 'PENDING').run();

    // 2. Save to form-specific table
    await env.DB.prepare(
        `INSERT INTO form_duplicate_grade_card
         (Application_id, student_email, student_name, address_line1, address_line2, country, state_province, city, postal_code, Mobile_Number,
          Registration_Number, Campus, Programme, Period_of_Study, Semester, Reason)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
        appId,
        formData.get('email') || '',
        formData.get('applicantName') || '',
        formData.get('addressLine1') || '',
        formData.get('addressLine2') || '',
        formData.get('country') || '',
        formData.get('stateProvince') || '',
        formData.get('city') || '',
        formData.get('postalCode') || '',
        formData.get('mobile') || '',
        formData.get('regNo') || '',
        formData.get('campus') || '',
        formData.get('program') || '',
        formData.get('periodOfStudy') || '',
        semester || '',
        formData.get('reason') || ''
    ).run();

    // 3. Store file blobs
    for (const [key, value] of formData.entries()) {
        if (value instanceof File && value.size > 0) {
            await storeFileBlob(env, appId, key, value);
        }
    }

    // 4. Send notifications based on submission type
    if (isSeekingDirectorApproval) {
        await sendDirectorNotification(env, request, appId, formType, applicantName, email, campus, semester, regNo);
        await sendDirectorSoughtConfirmationEmail(env, appId, formType, applicantName, email, campus);
    } else {
        await sendAdminNotification(env, appId, formType, applicantName, email);
        await sendDirectorNotification(env, request, appId, formType, applicantName, email, campus, semester, regNo);
        await sendStudentConfirmationEmail(env, appId, formType, applicantName, email, campus);
    }

    return new Response(JSON.stringify({ success: true, appId }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

// Handler for CGPA Conversion
async function handleCGPAConversion(formData, request, env, corsHeaders) {
    const email = formData.get('email');
    const applicantName = formData.get('applicantName');
    const regNo = formData.get('regNo');
    const campus = formData.get('campus');
    const formType = formData.get('formType');

    const appId = generateAppId('CGPA');

    await env.DB.prepare(
        `INSERT INTO applications (id, student_email, form_type, applicant_name, reg_no, campus)
         VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(appId, email, formType, applicantName, regNo, campus).run();

    await env.DB.prepare(
        `INSERT INTO form_cgpa_conversion
         (application_id, student_name, address_line1, address_line2, country, state_province, city, postal_code, Mobile_Number, Registration_Number,
          Programme, Period_of_Study, graduation_year, CGPA)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
        appId,
        formData.get('applicantName') || '',
        formData.get('addressLine1') || '',
        formData.get('addressLine2') || '',
        formData.get('country') || '',
        formData.get('stateProvince') || '',
        formData.get('city') || '',
        formData.get('postalCode') || '',
        formData.get('mobile') || '',
        formData.get('regNo') || '',
        formData.get('program') || '',
        formData.get('periodOfStudy') || '',
        formData.get('monthOfPassing') || '',
        parseFloat(formData.get('cgpa')) || 0.0
    ).run();

    for (const [key, value] of formData.entries()) {
        if (value instanceof File && value.size > 0) {
            await storeFileBlob(env, appId, key, value);
        }
    }

    await sendAdminNotification(env, appId, formType, applicantName, email);
    await sendDirectorNotification(env, request, appId, formType, applicantName, email, campus, null, regNo);
    await sendStudentConfirmationEmail(env, appId, formType, applicantName, email, campus);

    return new Response(JSON.stringify({ success: true, appId }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

// Handler for Supplementary Exam
async function handleSupplementaryExam(formData, request, env, corsHeaders) {
    const email = formData.get('email');
    const applicantName = formData.get('applicantName');
    const regNo = formData.get('regNo');
    const campus = formData.get('campus');
    const formType = formData.get('formType');
    const submissionType = formData.get('submissionType');
    const isSeekingDirectorApproval = submissionType === 'seek-director-approval';

    const appId = generateAppId('SE');

    await env.DB.prepare(
        `INSERT INTO applications (id, student_email, form_type, applicant_name, reg_no, campus, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(appId, email, formType, applicantName, regNo, campus, isSeekingDirectorApproval ? 'AWAITING_DIRECTOR' : 'PENDING').run();

    // Parse paper details JSON and format for storage
    const paperDetailsJson = formData.get('paperDetails') || '[]';
    let paperCodes = '', paperTitles = '', semester = '';
    try {
        const papers = JSON.parse(paperDetailsJson);
        paperCodes = papers.map(p => p.paperCode).join(', ');
        paperTitles = papers.map(p => p.paperTitle).join(', ');
        semester = papers.map(p => p.semester).join(', ');
    } catch (e) {
        console.error('Failed to parse paper details:', e);
    }

    await env.DB.prepare(
        `INSERT INTO form_supplementary_exam
         (application_id, student_email, Period_of_Study, student_name, Registration_Number,
          Campus, Programme, Mobile_Number, address_line1, address_line2, country, state_province, city, postal_code, paper_codes, paper_titles, Semester)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
        appId,
        formData.get('email') || '',
        formData.get('periodOfStudy') || '',
        formData.get('applicantName') || '',
        formData.get('regNo') || '',
        formData.get('campus') || '',
        formData.get('program') || '',
        formData.get('mobile') || '',
        formData.get('addressLine1') || '',
        formData.get('addressLine2') || '',
        formData.get('country') || '',
        formData.get('stateProvince') || '',
        formData.get('city') || '',
        formData.get('postalCode') || '',
        paperCodes,
        paperTitles,
        semester
    ).run();

    for (const [key, value] of formData.entries()) {
        if (value instanceof File && value.size > 0) {
            await storeFileBlob(env, appId, key, value);
        }
    }

    if (isSeekingDirectorApproval) {
        await sendDirectorNotification(env, request, appId, formType, applicantName, email, campus, semester, regNo);
        await sendDirectorSoughtConfirmationEmail(env, appId, formType, applicantName, email, campus);
    } else {
        await sendAdminNotification(env, appId, formType, applicantName, email);
        await sendDirectorNotification(env, request, appId, formType, applicantName, email, campus, semester, regNo);
        await sendStudentConfirmationEmail(env, appId, formType, applicantName, email, campus);
    }

    return new Response(JSON.stringify({ success: true, appId }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

// Handler for Repeat Paper
async function handleRepeatPaper(formData, request, env, corsHeaders) {
    const email = formData.get('email');
    const applicantName = formData.get('applicantName');
    const regNo = formData.get('regNo');
    const campus = formData.get('campus');
    const formType = formData.get('formType');
    const submissionType = formData.get('submissionType');
    const isSeekingDirectorApproval = submissionType === 'seek-director-approval';

    const appId = generateAppId('RP');

    await env.DB.prepare(
        `INSERT INTO applications (id, student_email, form_type, applicant_name, reg_no, campus, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(appId, email, formType, applicantName, regNo, campus, isSeekingDirectorApproval ? 'AWAITING_DIRECTOR' : 'PENDING').run();

    // Parse paper details JSON and format for storage
    const paperDetailsJson = formData.get('paperDetails') || '[]';
    let paperCodes = '', paperTitles = '', semester = '';
    try {
        const papers = JSON.parse(paperDetailsJson);
        paperCodes = papers.map(p => p.paperCode).join(', ');
        paperTitles = papers.map(p => p.paperTitle).join(', ');
        semester = papers.map(p => p.semester).join(', ');
    } catch (e) {
        console.error('Failed to parse paper details:', e);
    }

    await env.DB.prepare(
        `INSERT INTO form_repeat_paper
         (application_id, Period_of_Study, student_name, reg_no, Campus, Programme,
          Mobile_Number, address_line1, address_line2, country, state_province, city, postal_code, paper_codes, paper_titles, Semester)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
        appId,
        formData.get('periodOfStudy') || '',
        formData.get('applicantName') || '',
        formData.get('regNo') || '',
        formData.get('campus') || '',
        formData.get('program') || '',
        formData.get('mobile') || '',
        formData.get('addressLine1') || '',
        formData.get('addressLine2') || '',
        formData.get('country') || '',
        formData.get('stateProvince') || '',
        formData.get('city') || '',
        formData.get('postalCode') || '',
        paperCodes,
        paperTitles,
        semester
    ).run();

    for (const [key, value] of formData.entries()) {
        if (value instanceof File && value.size > 0) {
            await storeFileBlob(env, appId, key, value);
        }
    }

    if (isSeekingDirectorApproval) {
        await sendDirectorNotification(env, request, appId, formType, applicantName, email, campus, semester, regNo);
        await sendDirectorSoughtConfirmationEmail(env, appId, formType, applicantName, email, campus);
    } else {
        await sendAdminNotification(env, appId, formType, applicantName, email);
        await sendDirectorNotification(env, request, appId, formType, applicantName, email, campus, semester, regNo);
        await sendStudentConfirmationEmail(env, appId, formType, applicantName, email, campus);
    }

    return new Response(JSON.stringify({ success: true, appId }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

// Handler for Duplicate Degree
async function handleDuplicateDegree(formData, request, env, corsHeaders) {
    const email = formData.get('email');
    const applicantName = formData.get('applicantName');
    const regNo = formData.get('regNo');
    const campus = formData.get('campus');
    const formType = formData.get('formType');

    const appId = generateAppId('DD');

    await env.DB.prepare(
        `INSERT INTO applications (id, student_email, form_type, applicant_name, reg_no, campus)
         VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(appId, email, formType, applicantName, regNo, campus).run();

    await env.DB.prepare(
        `INSERT INTO form_duplicate_degree
         (application_id, student_name, student_email, address_line1, address_line2, country, state_province, city, postal_code, reg_no, Campus,
          Programme, Period_of_Study, year_of_passing, Reason, declaration)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
        appId,
        formData.get('applicantName') || '',
        formData.get('email') || '',
        formData.get('addressLine1') || '',
        formData.get('addressLine2') || '',
        formData.get('country') || '',
        formData.get('stateProvince') || '',
        formData.get('city') || '',
        formData.get('postalCode') || '',
        formData.get('regNo') || '',
        formData.get('campus') || '',
        formData.get('program') || '',
        formData.get('periodOfStudy') || '',
        formData.get('yearOforiginalDegree') || '',
        formData.get('reason') || '',
        formData.get('declaration') === 'true' ? 1 : 0
    ).run();

    for (const [key, value] of formData.entries()) {
        if (value instanceof File && value.size > 0) {
            await storeFileBlob(env, appId, key, value);
        }
    }

    await sendAdminNotification(env, appId, formType, applicantName, email);
    await sendDirectorNotification(env, request, appId, formType, applicantName, email, campus, null, regNo);
    await sendStudentConfirmationEmail(env, appId, formType, applicantName, email, campus);

    return new Response(JSON.stringify({ success: true, appId }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

// Handler for Name Change
async function handleNameChange(formData, request, env, corsHeaders) {
    const email = formData.get('email');
    const applicantName = formData.get('applicantName');
    const regNo = formData.get('regNo');
    const campus = formData.get('campus');
    const formType = formData.get('formType');
    const submissionType = formData.get('submissionType');
    const isSeekingDirectorApproval = submissionType === 'seek-director-approval';

    const appId = generateAppId('NC');

    await env.DB.prepare(
        `INSERT INTO applications (id, student_email, form_type, applicant_name, reg_no, campus, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(appId, email, formType, applicantName, regNo, campus, isSeekingDirectorApproval ? 'AWAITING_DIRECTOR' : 'PENDING').run();

    await env.DB.prepare(
        `INSERT INTO form_name_change
         (application_id, existing_name, Father_name, reg_no, Campus, Mobile_Number,
          Period_of_Study, address_line1, address_line2, country, state_province, city, postal_code, changed_name)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
        appId,
        formData.get('applicantName') || '',
        formData.get('fatherName') || '',
        formData.get('regNo') || '',
        formData.get('campus') || '',
        formData.get('mobile') || '',
        formData.get('periodOfStudy') || '',
        formData.get('addressLine1') || '',
        formData.get('addressLine2') || '',
        formData.get('country') || '',
        formData.get('stateProvince') || '',
        formData.get('city') || '',
        formData.get('postalCode') || '',
        formData.get('newName') || ''
    ).run();

    for (const [key, value] of formData.entries()) {
        if (value instanceof File && value.size > 0) {
            await storeFileBlob(env, appId, key, value);
        }
    }

    if (isSeekingDirectorApproval) {
        await sendDirectorNotification(env, request, appId, formType, applicantName, email, campus, null, regNo);
        await sendDirectorSoughtConfirmationEmail(env, appId, formType, applicantName, email, campus);
    } else {
        await sendAdminNotification(env, appId, formType, applicantName, email);
        await sendDirectorNotification(env, request, appId, formType, applicantName, email, campus, null, regNo);
        await sendStudentConfirmationEmail(env, appId, formType, applicantName, email, campus);
    }

    return new Response(JSON.stringify({ success: true, appId }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

// Handler for Retotaling
async function handleRetotaling(formData, request, env, corsHeaders) {
    const email = formData.get('email');
    const applicantName = formData.get('applicantName');
    const regNo = formData.get('regNo');
    const campus = formData.get('campus');
    const formType = formData.get('formType');

    const appId = generateAppId('RT');

    // Get combined examMonthYear
    const periodOfExam = formData.get('examMonthYear') || '';

    await env.DB.prepare(
        `INSERT INTO applications (id, student_email, form_type, applicant_name, reg_no, campus)
         VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(appId, email, formType, applicantName, regNo, campus).run();

    await env.DB.prepare(
        `INSERT INTO form_retotaling
         (application_id, exam_type, period_of_examination, student_name, reg_no, Campus, Programme,
          paper_codes_titles_for_retotaling, Mobile_Number, address_line1, address_line2, country, state_province, city, postal_code, student_email)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
        appId,
        formData.get('examType') || '',
        periodOfExam,
        formData.get('applicantName') || '',
        formData.get('regNo') || '',
        formData.get('campus') || '',
        formData.get('program') || '',
        formData.get('subjectCode') || '',
        formData.get('mobile') || '',
        formData.get('addressLine1') || '',
        formData.get('addressLine2') || '',
        formData.get('country') || '',
        formData.get('stateProvince') || '',
        formData.get('city') || '',
        formData.get('postalCode') || '',
        formData.get('email') || ''
    ).run();

    for (const [key, value] of formData.entries()) {
        if (value instanceof File && value.size > 0) {
            await storeFileBlob(env, appId, key, value);
        }
    }

    await sendAdminNotification(env, appId, formType, applicantName, email);
    await sendStudentConfirmationEmail(env, appId, formType, applicantName, email, campus);

    return new Response(JSON.stringify({ success: true, appId }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

// Handler for On-Request Degree
async function handleOnRequestDegree(formData, request, env, corsHeaders) {
    const email = formData.get('email');
    const applicantName = formData.get('applicantName');
    const regNo = formData.get('regNo');
    const campus = formData.get('campus');
    const formType = formData.get('formType');

    const appId = generateAppId('ORD');

    await env.DB.prepare(
        `INSERT INTO applications (id, student_email, form_type, applicant_name, reg_no, campus)
         VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(appId, email, formType, applicantName, regNo, campus).run();

    await env.DB.prepare(
        `INSERT INTO form_on_request_degree
         (application_id, student_name, reg_no, Campus, address_line1, address_line2, country, state_province, city, postal_code, Mobile_Number, Degree_applied_for)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
        appId,
        formData.get('applicantName') || '',
        formData.get('regNo') || '',
        formData.get('campus') || '',
        formData.get('addressLine1') || '',
        formData.get('addressLine2') || '',
        formData.get('country') || '',
        formData.get('stateProvince') || '',
        formData.get('city') || '',
        formData.get('postalCode') || '',
        formData.get('mobile') || '',
        formData.get('degreeAppliedFor') || ''
    ).run();

    for (const [key, value] of formData.entries()) {
        if (value instanceof File && value.size > 0) {
            await storeFileBlob(env, appId, key, value);
        }
    }

    await sendAdminNotification(env, appId, formType, applicantName, email);
    await sendStudentConfirmationEmail(env, appId, formType, applicantName, email, campus);

    return new Response(JSON.stringify({ success: true, appId }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

// Handler for Migration
async function handleMigration(formData, request, env, corsHeaders) {
    const email = formData.get('email') || '';
    const applicantName = formData.get('applicantName');
    const campus = formData.get('campus');
    const formType = formData.get('formType');
    const mobile = formData.get('mobile');

    const appId = generateAppId('MC');

    await env.DB.prepare(
        `INSERT INTO applications (id, student_email, form_type, applicant_name, reg_no, campus)
         VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(appId, email, formType, applicantName, '', campus).run();

    await env.DB.prepare(
        `INSERT INTO form_migration_certificate
         (application_id, student_name, Mobile_Number, admission_year, Campus_of_admission,
          last_examination_passed, degree_recieved, university_to_migrate, address_line1, address_line2, country, state_province, city, postal_code)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
        appId,
        formData.get('applicantName') || '',
        formData.get('mobile') || '',
        formData.get('yearofAdmission') || '',
        formData.get('campus') || '',
        formData.get('lastExam') || '',
        formData.get('degreeRecieved') || '',
        formData.get('universityInstitute') || '',
        formData.get('addressLine1') || '',
        formData.get('addressLine2') || '',
        formData.get('country') || '',
        formData.get('stateProvince') || '',
        formData.get('city') || '',
        formData.get('postalCode') || ''
    ).run();

    for (const [key, value] of formData.entries()) {
        if (value instanceof File && value.size > 0) {
            await storeFileBlob(env, appId, key, value);
        }
    }

    await sendAdminNotification(env, appId, formType, applicantName, email);
    await sendStudentConfirmationEmail(env, appId, formType, applicantName, email, campus);

    return new Response(JSON.stringify({ success: true, appId }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function handleApproval(url, env, corsHeaders) {
    const id = url.searchParams.get('id');
    const role = url.searchParams.get('role');
    const action = url.searchParams.get('action');

    console.log(`Approval request received - ID: ${id}, Role: ${role}, Action: ${action}`);

    if (!id || !role || !action) {
        console.error('Missing required parameters for approval');
        return new Response('Missing required parameters', {
            status: 400,
            headers: corsHeaders
        });
    }

    const statusValue = action === 'Approve' ? 'APPROVED' : 'REJECTED';

    try {
        if (role === 'Director') {
            // Determine overall status based on whether this is a two-step form
            const app = await env.DB.prepare('SELECT form_type FROM applications WHERE id = ?').bind(id).first();
            let overallStatus;
            if (statusValue === 'APPROVED') {
                overallStatus = shouldNotifyDirector(app.form_type) ? 'DIRECTOR_APPROVED' : 'APPROVED';
            } else {
                overallStatus = 'REJECTED';
            }
            console.log(`Updating director_status to ${statusValue} and status to ${overallStatus} for application ${id}`);
            const result = await env.DB.prepare(
                `UPDATE applications SET director_status = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
            ).bind(statusValue, overallStatus, id).run();

            console.log(`Update result:`, result);
        } else if (role === 'Controller') {
            console.log(`Updating controller_status to ${statusValue} for application ${id}`);
            const result = await env.DB.prepare(
                `UPDATE applications SET controller_status = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
            ).bind(statusValue, statusValue === 'APPROVED' ? 'COMPLETED' : 'REJECTED', id).run();

            console.log(`Update result:`, result);
        }

        // Verify the update
        const verification = await env.DB.prepare(
            `SELECT id, director_status, controller_status, status, applicant_name, form_type, student_email, reg_no, campus, created_at, updated_at FROM applications WHERE id = ?`
        ).bind(id).first();

        console.log(`Verification query result:`, verification);

        // Send student notification email
        try {
            const frontendUrl = 'https://student-service.pages.dev';
            await sendStudentDecisionEmail(env, verification, action === 'Approve', frontendUrl);
            console.log(`Student notification sent to ${verification.student_email}`);
        } catch (emailError) {
            console.error('Failed to send student email:', emailError);
            // Continue - email failure is non-critical
        }

        // Return a nice HTML page
        const isApproved = action === 'Approve';

        // Format dates nicely
        const submissionDate = verification?.created_at
            ? new Date(verification.created_at).toLocaleString('en-IN', {
                dateStyle: 'long',
                timeStyle: 'short',
                timeZone: 'Asia/Kolkata'
            })
            : 'N/A';

        const decisionDate = new Date().toLocaleString('en-IN', {
            dateStyle: 'long',
            timeStyle: 'short',
            timeZone: 'Asia/Kolkata'
        });

        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Director Approval Decision - SSSIHL Examination Services">
    <title>${isApproved ? 'Application Approved' : 'Application Rejected'} - SSSIHL</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@300;400;600;700;800&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #1e293b;
            --accent: #2563eb;
            --accent-gradient: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
            --glass: rgba(255, 255, 255, 0.8);
            --glass-border: rgba(15, 23, 42, 0.08);
            --text-main: #0f172a;
            --text-muted: #64748b;
            --success: #059669;
            --success-bg: #d1fae5;
            --error: #dc2626;
            --error-bg: #fee2e2;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background:
                radial-gradient(at 0% 0%, rgba(37, 99, 235, 0.08) 0, transparent 50%),
                radial-gradient(at 50% 0%, rgba(124, 58, 237, 0.05) 0, transparent 50%),
                radial-gradient(at 100% 0%, rgba(37, 99, 235, 0.08) 0, transparent 50%),
                #f1f5f9;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 40px 20px;
        }

        .header {
            text-align: center;
            margin-bottom: 40px;
            animation: fadeIn 0.6s ease;
        }

        .logo {
            width: 100px;
            height: 100px;
            margin: 0 auto 20px;
            background: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.15);
        }

        .logo img {
            width: 80px;
            height: 80px;
            border-radius: 50%;
        }

        .university-name {
            font-family: 'Outfit', sans-serif;
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--primary);
            margin-bottom: 6px;
        }

        .university-subtitle {
            font-size: 0.95rem;
            color: var(--text-muted);
            font-weight: 500;
        }

        .glass-card {
            background: var(--glass);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid var(--glass-border);
            border-radius: 24px;
            padding: 50px;
            max-width: 600px;
            width: 100%;
            text-align: center;
            box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.05);
            animation: slideUp 0.8s ease-out;
        }

        .status-icon {
            width: 100px;
            height: 100px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 30px;
            font-size: 50px;
            font-weight: bold;
            background: ${isApproved ? 'var(--success-bg)' : 'var(--error-bg)'};
            color: ${isApproved ? 'var(--success)' : 'var(--error)'};
        }

        h1 {
            font-family: 'Outfit', sans-serif;
            color: var(--text-main);
            font-size: 2.2rem;
            font-weight: 700;
            margin-bottom: 12px;
            letter-spacing: -0.02em;
        }

        .subtitle {
            color: var(--text-muted);
            font-size: 1.05rem;
            margin-bottom: 40px;
            font-weight: 500;
        }

        .details {
            background: #f8fafc;
            border-radius: 16px;
            padding: 24px;
            text-align: left;
            margin-bottom: 30px;
        }

        .detail-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 14px 0;
            border-bottom: 1px solid #e2e8f0;
        }

        .detail-row:last-child {
            border-bottom: none;
        }

        .detail-label {
            color: var(--text-muted);
            font-size: 0.9rem;
            font-weight: 500;
        }

        .detail-value {
            color: var(--text-main);
            font-weight: 600;
            font-size: 0.95rem;
            text-align: right;
            max-width: 60%;
            word-wrap: break-word;
        }

        .status-badge {
            padding: 6px 16px;
            border-radius: 20px;
            font-size: 0.85rem;
            font-weight: 700;
            display: inline-block;
            background: ${isApproved ? 'var(--success-bg)' : 'var(--error-bg)'};
            color: ${isApproved ? 'var(--success)' : 'var(--error)'};
        }

        .footer {
            margin-top: 30px;
            padding-top: 25px;
            border-top: 1px solid rgba(15, 23, 42, 0.08);
            color: var(--primary);
            font-size: 0.95rem;
            font-weight: 600;
        }

        .footer-subtitle {
            color: var(--text-muted);
            font-size: 0.85rem;
            margin-top: 6px;
            font-weight: 500;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
        }

        @keyframes slideUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 640px) {
            body {
                padding: 30px 15px;
            }

            .glass-card {
                padding: 35px 25px;
            }

            .logo {
                width: 80px;
                height: 80px;
            }

            .logo img {
                width: 60px;
                height: 60px;
            }

            .university-name {
                font-size: 1.25rem;
            }

            h1 {
                font-size: 1.75rem;
            }

            .status-icon {
                width: 80px;
                height: 80px;
                font-size: 40px;
            }

            .detail-row {
                flex-direction: column;
                align-items: flex-start;
                gap: 6px;
            }

            .detail-value {
                max-width: 100%;
                text-align: left;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">
            <img src="data:image/png;base64,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" alt="SSSIHL Logo" style="width: 80px; height: 80px; border-radius: 50%;" />
        </div>
        <h2 class="university-name">SSSIHL</h2>
        <p class="university-subtitle">Examination Services Portal</p>
    </div>

    <div class="glass-card">
        <div class="status-icon">
            ${isApproved ? '✓' : '✗'}
        </div>
        <h1>Application ${isApproved ? 'Approved' : 'Rejected'}</h1>
        <p class="subtitle">Your decision has been recorded successfully</p>

        <div class="details">
            <div class="detail-row">
                <span class="detail-label">Application ID</span>
                <span class="detail-value">${id}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Applicant Name</span>
                <span class="detail-value">${verification?.applicant_name || 'N/A'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Registered Number</span>
                <span class="detail-value">${verification?.reg_no || 'N/A'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Campus</span>
                <span class="detail-value">${verification?.campus || 'N/A'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Form Type</span>
                <span class="detail-value">${verification?.form_type || 'N/A'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Submitted On</span>
                <span class="detail-value">${submissionDate}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Decision Date</span>
                <span class="detail-value">${decisionDate}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Status</span>
                <span class="status-badge">${isApproved ? 'APPROVED' : 'REJECTED'}</span>
            </div>
        </div>

        <div class="footer">
            Sri Sathya Sai Institute of Higher Learning
            <div class="footer-subtitle">Examination Services Portal</div>
        </div>
    </div>
</body>
</html>`;

        return new Response(html, {
            headers: { ...corsHeaders, 'Content-Type': 'text/html' }
        });
    } catch (error) {
        console.error('Error in handleApproval:', error);
        const errorHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Error - SSSIHL</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #fee2e2;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .card {
            background: white;
            border-radius: 20px;
            padding: 50px;
            max-width: 400px;
            text-align: center;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1);
        }
        h1 { color: #dc2626; margin-bottom: 10px; }
        p { color: #6b7280; }
    </style>
</head>
<body>
    <div class="card">
        <h1>Something went wrong</h1>
        <p>Please try again or contact support.</p>
    </div>
</body>
</html>`;
        return new Response(errorHtml, {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'text/html' }
        });
    }
}

async function handleSubmitToCOE(request, env, corsHeaders) {
    try {
        const body = await request.json();
        const { appId } = body;

        if (!appId) {
            return new Response(JSON.stringify({ success: false, error: 'Application ID is required' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const app = await env.DB.prepare(
            'SELECT * FROM applications WHERE id = ?'
        ).bind(appId).first();

        if (!app) {
            return new Response(JSON.stringify({ success: false, error: 'Application not found' }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        if (app.status !== 'DIRECTOR_APPROVED') {
            return new Response(JSON.stringify({
                success: false,
                error: app.status === 'PENDING' || app.status === 'COMPLETED' || app.status === 'APPROVED'
                    ? 'This application has already been submitted to COE.'
                    : 'This application cannot be submitted to COE in its current state.'
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        await env.DB.prepare(
            `UPDATE applications SET status = 'PENDING', updated_at = CURRENT_TIMESTAMP WHERE id = ?`
        ).bind(appId).run();

        await sendAdminNotification(env, appId, app.form_type, app.applicant_name, app.student_email);
        await sendStudentConfirmationEmail(env, appId, app.form_type, app.applicant_name, app.student_email, app.campus);

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error in submit-to-coe:', error);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

async function handleStatusRequest(url, env, corsHeaders) {
    const id = url.searchParams.get('id');
    if (!id) {
        return new Response(JSON.stringify({ error: 'Application ID is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    try {
        const app = await env.DB.prepare(
            `SELECT id, student_email, form_type, applicant_name, reg_no, campus, status, director_status, controller_status, created_at, updated_at
             FROM applications WHERE id = ?`
        ).bind(id).first();

        if (!app) {
            return new Response(JSON.stringify({ error: 'Application not found' }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Fetch student-uploaded files
        const studentFiles = await env.DB.prepare(
            `SELECT id, field_name, file_name, file_type, file_size, created_at
             FROM file_blobs
             WHERE application_id = ? AND (is_response = FALSE OR is_response IS NULL)`
        ).bind(id).all();

        // Fetch response documents (admin-uploaded files)
        const responseFiles = await env.DB.prepare(
            `SELECT id, file_name, file_type, file_size, created_at
             FROM file_blobs
             WHERE application_id = ? AND is_response = TRUE`
        ).bind(id).all();

        // Map form_type to the corresponding form table
        const formTableMap = {
            'Application for Duplicate Grade Card': 'form_duplicate_grade_card',
            'Application for CGPA to Percentage Conversion': 'form_cgpa_conversion',
            'Application for End-Semester Supplementary Examinations Registration': 'form_supplementary_exam',
            'Application for Duplicate Degree Certificate': 'form_duplicate_degree',
            'Application for Registration of Student Name change in the Institute Records': 'form_name_change',
            'Application for repeating a paper for supplementary examinations (CIE and ESE)': 'form_repeat_paper',
            'Application for Re-Totalling of Marks': 'form_retotaling',
            'Application for On-Request Degree Certificate': 'form_on_request_degree',
            'Application for Migration Certificate': 'form_migration_certificate',
        };

        let formData = null;
        const formTable = formTableMap[app.form_type];
        if (formTable) {
            try {
                formData = await env.DB.prepare(
                    `SELECT * FROM ${formTable} WHERE application_id = ?`
                ).bind(id).first();
            } catch (e) {
                formData = null;
            }
        }

        return new Response(JSON.stringify({
            ...app,
            needs_director_approval: shouldNotifyDirector(app.form_type),
            formData,
            files: studentFiles.results || [],
            responseDocuments: responseFiles.results || []
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}
