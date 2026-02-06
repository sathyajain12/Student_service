import { getGoogleAuth, sendEmail } from './google-api';

const ADMIN_EMAIL = 'saisathyajain@sssihl.edu.in';

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
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

            return new Response('Not Found', { status: 404, headers: corsHeaders });
        } catch (error) {
            console.error(error);
            return new Response(JSON.stringify({ error: error.message }), {
                status: 500,
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

    return new Response(JSON.stringify({
        application,
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

        // Store the response document
        const arrayBuffer = await file.arrayBuffer();
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
        console.error('Error uploading response document:', error);
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

async function storeFileBlob(env, appId, fieldName, file) {
    try {
        const arrayBuffer = await file.arrayBuffer();
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

async function sendAdminNotification(env, appId, formType, applicantName, email) {
    if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_REFRESH_TOKEN) {
        try {
            const accessToken = await getGoogleAuth(env);
            await sendEmail(accessToken, {
                to: ADMIN_EMAIL,
                subject: `New Application Received: ${formType} - ${appId}`,
                htmlBody: `
                    <h2>New Application Submitted</h2>
                    <p><strong>Application ID:</strong> ${appId}</p>
                    <p><strong>Form Type:</strong> ${formType}</p>
                    <p><strong>Applicant:</strong> ${applicantName}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
                    <hr>
                    <p>Login to the admin portal to view details and download files.</p>
                `
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
        'Application for End-Semester Supplementary Examinations',
        'Application for Registration of Student Name change in the Institute Records',
        'Application for repeating a paper for supplementary examinations(CIE and ESE)',
    ];
    return forms.includes(formType);
}

async function sendDirectorNotification(env, request, appId, formType, applicantName, email, campus) {
    if (!shouldNotifyDirector(formType)) {
        return;
    }

    if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_REFRESH_TOKEN) {
        try {
            const accessToken = await getGoogleAuth(env);
            const directorEmail = getDirectorEmail(campus);
            const url = new URL(request.url);

            await sendEmail(accessToken, {
                to: directorEmail,
                subject: `Approval Required: ${formType} - ${appId}`,
                htmlBody: `
                    <h2>Application Requires Your Approval</h2>
                    <p><strong>Application ID:</strong> ${appId}</p>
                    <p><strong>Form Type:</strong> ${formType}</p>
                    <p><strong>Applicant:</strong> ${applicantName}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Campus:</strong> ${campus}</p>
                    <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
                    <hr>
                    <p>
                        <a href="${url.origin}/approve?id=${appId}&role=Director&action=Approve" style="background:#10b981;color:#fff;padding:10px 20px;text-decoration:none;border-radius:5px;margin-right:10px;">✓ Approve</a>
                        <a href="${url.origin}/approve?id=${appId}&role=Director&action=Reject" style="background:#ef4444;color:#fff;padding:10px 20px;text-decoration:none;border-radius:5px;">✗ Reject</a>
                    </p>
                `
            });
            console.log(`Director email sent to ${directorEmail} for app ${appId}`);
        } catch (e) {
            console.error('Failed to send director notification:', e);
        }
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
        case 'Application for End-Semester Supplementary Examinations':
            return await handleSupplementaryExam(formData, request, env, corsHeaders);
        case 'Application for Duplicate Degree Certificate':
            return await handleDuplicateDegree(formData, request, env, corsHeaders);
        case 'Application for Registration of Student Name change in the Institute Records':
            return await handleNameChange(formData, request, env, corsHeaders);
        case 'Application for repeating a paper for supplementary examinations(CIE and ESE)':
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

    const appId = generateAppId('DGC');

    // 1. Save to main applications table
    await env.DB.prepare(
        `INSERT INTO applications (id, student_email, form_type, applicant_name, reg_no, campus)
         VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(appId, email, formType, applicantName, regNo, campus).run();

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
        formData.get('semester') || '',
        formData.get('reason') || ''
    ).run();

    // 3. Store file blobs
    for (const [key, value] of formData.entries()) {
        if (value instanceof File && value.size > 0) {
            await storeFileBlob(env, appId, key, value);
        }
    }

    // 4. Send admin notification
    await sendAdminNotification(env, appId, formType, applicantName, email);

    // 5. Send director notification if required
    await sendDirectorNotification(env, request, appId, formType, applicantName, email, campus);

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
    await sendDirectorNotification(env, request, appId, formType, applicantName, email, campus);

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

    const appId = generateAppId('SE');

    await env.DB.prepare(
        `INSERT INTO applications (id, student_email, form_type, applicant_name, reg_no, campus)
         VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(appId, email, formType, applicantName, regNo, campus).run();

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

    await sendAdminNotification(env, appId, formType, applicantName, email);
    await sendDirectorNotification(env, request, appId, formType, applicantName, email, campus);

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

    const appId = generateAppId('RP');

    await env.DB.prepare(
        `INSERT INTO applications (id, student_email, form_type, applicant_name, reg_no, campus)
         VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(appId, email, formType, applicantName, regNo, campus).run();

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

    await sendAdminNotification(env, appId, formType, applicantName, email);
    await sendDirectorNotification(env, request, appId, formType, applicantName, email, campus);

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
          Programme, Period_of_Study, year_of_passing, Reason)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
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
        formData.get('reason') || ''
    ).run();

    for (const [key, value] of formData.entries()) {
        if (value instanceof File && value.size > 0) {
            await storeFileBlob(env, appId, key, value);
        }
    }

    await sendAdminNotification(env, appId, formType, applicantName, email);
    await sendDirectorNotification(env, request, appId, formType, applicantName, email, campus);

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

    const appId = generateAppId('NC');

    await env.DB.prepare(
        `INSERT INTO applications (id, student_email, form_type, applicant_name, reg_no, campus)
         VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(appId, email, formType, applicantName, regNo, campus).run();

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

    await sendAdminNotification(env, appId, formType, applicantName, email);
    await sendDirectorNotification(env, request, appId, formType, applicantName, email, campus);

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

    // Combine examMonth and examYear
    const periodOfExam = `${formData.get('examMonth') || ''} ${formData.get('examYear') || ''}`.trim();

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

    return new Response(JSON.stringify({ success: true, appId }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

// Handler for Migration
async function handleMigration(formData, request, env, corsHeaders) {
    const applicantName = formData.get('applicantName');
    const campus = formData.get('campus');
    const formType = formData.get('formType');
    const mobile = formData.get('mobile');

    const appId = generateAppId('MC');

    await env.DB.prepare(
        `INSERT INTO applications (id, student_email, form_type, applicant_name, reg_no, campus)
         VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(appId, '', formType, applicantName, '', campus).run();

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

    await sendAdminNotification(env, appId, formType, applicantName, '');

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
            // Set overall status to APPROVED when director approves, REJECTED when director rejects
            const overallStatus = statusValue === 'APPROVED' ? 'APPROVED' : 'REJECTED';
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
            `SELECT id, director_status, controller_status, status, applicant_name, form_type FROM applications WHERE id = ?`
        ).bind(id).first();

        console.log(`Verification query result:`, verification);

        // Return a nice HTML page
        const isApproved = action === 'Approve';
        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${isApproved ? 'Application Approved' : 'Application Rejected'} - SSSIHL</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
            max-width: 500px;
            width: 100%;
            text-align: center;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }
        .icon {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 25px;
            font-size: 40px;
        }
        .icon.success { background: #d1fae5; }
        .icon.error { background: #fee2e2; }
        h1 {
            color: #1f2937;
            font-size: 1.8rem;
            margin-bottom: 10px;
        }
        .subtitle {
            color: #6b7280;
            font-size: 1rem;
            margin-bottom: 30px;
        }
        .details {
            background: #f9fafb;
            border-radius: 12px;
            padding: 20px;
            text-align: left;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #e5e7eb;
        }
        .detail-row:last-child { border-bottom: none; }
        .detail-label { color: #6b7280; font-size: 0.9rem; }
        .detail-value { color: #1f2937; font-weight: 600; font-size: 0.9rem; }
        .status-badge {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 600;
        }
        .status-approved { background: #d1fae5; color: #059669; }
        .status-rejected { background: #fee2e2; color: #dc2626; }
        .footer {
            margin-top: 30px;
            color: #9ca3af;
            font-size: 0.85rem;
        }
    </style>
</head>
<body>
    <div class="card">
        <div class="icon ${isApproved ? 'success' : 'error'}">
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
                <span class="detail-label">Applicant</span>
                <span class="detail-value">${verification?.applicant_name || 'N/A'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Form Type</span>
                <span class="detail-value">${verification?.form_type || 'N/A'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Decision By</span>
                <span class="detail-value">${role}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Status</span>
                <span class="status-badge ${isApproved ? 'status-approved' : 'status-rejected'}">${isApproved ? 'APPROVED' : 'REJECTED'}</span>
            </div>
        </div>

        <p class="footer">Sri Sathya Sai Institute of Higher Learning<br>Examination Services Portal</p>
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

        // Fetch response documents (admin-uploaded files)
        const responseFiles = await env.DB.prepare(
            `SELECT id, file_name, file_type, file_size, created_at
             FROM file_blobs
             WHERE application_id = ? AND is_response = TRUE`
        ).bind(id).all();

        return new Response(JSON.stringify({
            ...app,
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
