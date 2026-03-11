import { getGoogleAuth, sendEmail } from './google-api';
import { SignJWT, jwtVerify } from 'jose';

const CAMPUS_CONTACTS = {
    'Prashanti Nilayam Campus': { phone: '08555-287235', email: 'officeofdirector.psn@sssihl.edu.in' },
    'Anantapur Campus': { phone: '08554-272567 / 272996', email: 'officeofdirector.atp@sssihl.edu.in' },
    'Brindavan Campus': { phone: '080-28452329', email: 'officeofdirector.brn@sssihl.edu.in' },
    'Nandigiri Campus': { phone: '08156-250188 / 250186', email: 'officeofdirector.ndg@sssihl.edu.in' },
};

function escapeHtml(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
}

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

// CORS headers — respects ALLOWED_ORIGIN env var
function getCorsHeaders(env) {
    return {
        'Access-Control-Allow-Origin': env?.ALLOWED_ORIGIN || '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
}

// Security headers added to every response
const SECURITY_HEADERS = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
};

function addSecurityHeaders(response) {
    const newHeaders = new Headers(response.headers);
    for (const [k, v] of Object.entries(SECURITY_HEADERS)) newHeaders.set(k, v);
    return new Response(response.body, { status: response.status, headers: newHeaders });
}

// In-memory rate limiter (per-worker-instance)
// For global rate limiting across all edge nodes, use Cloudflare WAF Rate Limiting rules.
const rateLimitMap = new Map();
function checkRateLimit(ip, limit = 10, windowMs = 60000) {
    const now = Date.now();
    const times = (rateLimitMap.get(ip) || []).filter(t => now - t < windowMs);
    times.push(now);
    rateLimitMap.set(ip, times);
    return times.length <= limit;
}

// PBKDF2-SHA256 password hashing (100,000 iterations + random salt)
async function hashPassword(password) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const keyMaterial = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 100000 }, keyMaterial, 256);
    const hash = Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, '0')).join('');
    const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
    return { salt: saltHex, hash };
}

async function verifyPassword(password, saltHex, hashHex) {
    const salt = new Uint8Array(saltHex.match(/.{2}/g).map(b => parseInt(b, 16)));
    const keyMaterial = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 100000 }, keyMaterial, 256);
    const hash = Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, '0')).join('');
    return hash === hashHex;
}

// HMAC-SHA256 helper (for CSRF tokens)
async function hmacSign(secret, message) {
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
    return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function hmacVerify(secret, message, sigHex) {
    const expected = await hmacSign(secret, message);
    return expected === sigHex;
}

export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const corsHeaders = getCorsHeaders(env);

        if (request.method === 'OPTIONS') {
            return addSecurityHeaders(new Response(null, { headers: corsHeaders }));
        }

        // Rate limiting — 10 req/min per IP for public routes; 120 req/min for admin routes
        const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
        const isAdminRoute = url.pathname.startsWith('/admin/');
        const rateLimit = isAdminRoute ? 120 : 10;
        const rateLimitKey = isAdminRoute ? `admin:${ip}` : ip;
        if (!checkRateLimit(rateLimitKey, rateLimit)) {
            return addSecurityHeaders(new Response(JSON.stringify({ error: 'Too many requests' }), {
                status: 429,
                headers: { ...corsHeaders, 'Retry-After': '60', 'Content-Type': 'application/json' }
            }));
        }

        const response = await (async () => {
            try {
                // Public routes
                if (url.pathname === '/submit' && request.method === 'POST') {
                    return await handleSubmission(request, env, corsHeaders);
                }

                if (url.pathname === '/approve' && request.method === 'GET') {
                    return await handleApproval(url, env, corsHeaders);
                }

                if (url.pathname === '/director-comment' && request.method === 'GET') {
                    return await handleDirectorCommentPage(url, env, corsHeaders);
                }

                if (url.pathname === '/director-comment' && request.method === 'POST') {
                    return await handleDirectorCommentSubmit(request, env, corsHeaders);
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

                // Public: re-totalling form active status
                if (url.pathname === '/form-settings' && request.method === 'GET') {
                    return await handleGetFormSettings(env, corsHeaders);
                }

                // Admin: toggle re-totalling active/inactive
                if (url.pathname === '/admin/form-settings' && request.method === 'POST') {
                    return await handleToggleFormSetting(request, env, corsHeaders);
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

                if (url.pathname === '/admin/resolve-hold' && request.method === 'POST') {
                    return await handleResolveHold(request, env, corsHeaders);
                }

                if (url.pathname === '/admin/notify-dispatched' && request.method === 'POST') {
                    return await handleNotifyDispatched(request, env, corsHeaders);
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
        })();

        return addSecurityHeaders(response);
    }
};

// ==================== ADMIN FUNCTIONS ====================

async function verifyAdminToken(request, env) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    const token = authHeader.substring(7);
    try {
        const secret = new TextEncoder().encode(env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        const admin = await env.DB.prepare(
            'SELECT * FROM admin_users WHERE username = ?'
        ).bind(payload.username).first();
        return admin || null;
    } catch (e) {
        return null;
    }
}

async function handleAdminLogin(request, env, corsHeaders) {
    const { username, password } = await request.json();

    // Fetch admin by username (need salt + hash)
    const admin = await env.DB.prepare(
        'SELECT * FROM admin_users WHERE username = ?'
    ).bind(username).first();

    if (!admin) {
        return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    // All accounts must have a salt (PBKDF2). Accounts without one were
    // invalidated by add_admin_salt_migration.sql and cannot log in.
    if (!admin.salt) {
        return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    const passwordValid = await verifyPassword(password, admin.salt, admin.password_hash);

    if (!passwordValid) {
        return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    // Issue signed JWT (24h expiry)
    const secret = new TextEncoder().encode(env.JWT_SECRET);
    const token = await new SignJWT({ username })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(secret);

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
        'Application for Supplementary Examinations Registration': 'form_supplementary_exam',
        'Application for Duplicate Degree Certificate': 'form_duplicate_degree',
        'Application for Registration of Student Name change in the Institute Records': 'form_name_change',
        'Application for Repeating Examinations Registration (CIE and ESE)': 'form_repeat_paper',
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

    const safeFilename = (file.file_name || 'download.pdf').replace(/[^\w\s\-_.()]/g, '_').replace(/\s+/g, ' ').trim();
    return new Response(bytes, {
        headers: {
            ...corsHeaders,
            'Content-Type': file.file_type,
            'Content-Disposition': `attachment; filename="${safeFilename}"`
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
    const approved = await env.DB.prepare("SELECT COUNT(*) as count FROM applications WHERE status = 'APPROVED'").first();
    const dispatched = await env.DB.prepare("SELECT COUNT(*) as count FROM applications WHERE status = 'DISPATCHED'").first();
    const completed = await env.DB.prepare("SELECT COUNT(*) as count FROM applications WHERE status = 'COMPLETED'").first();
    const rejected = await env.DB.prepare("SELECT COUNT(*) as count FROM applications WHERE status = 'REJECTED'").first();

    const byFormType = await env.DB.prepare(
        'SELECT form_type, COUNT(*) as count FROM applications GROUP BY form_type'
    ).all();

    return new Response(JSON.stringify({
        total: total.count,
        pending: pending.count,
        approved: approved.count,
        dispatched: dispatched.count,
        completed: completed.count,
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

async function handleResolveHold(request, env, corsHeaders) {
    const admin = await verifyAdminToken(request, env);
    if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    try {
        const { applicationId } = await request.json();
        if (!applicationId) return new Response(JSON.stringify({ error: 'Application ID is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

        const application = await env.DB.prepare(
            `SELECT id, form_type, applicant_name, student_email, campus, status FROM applications WHERE id = ?`
        ).bind(applicationId).first();

        if (!application) return new Response(JSON.stringify({ error: 'Application not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

        if (application.status !== 'DIRECTOR_COMMENTED') return new Response(JSON.stringify({ error: 'Application is not currently on hold' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

        await env.DB.prepare(
            `UPDATE applications SET status = 'APPROVED', director_status = 'RESOLVED', updated_at = CURRENT_TIMESTAMP WHERE id = ?`
        ).bind(applicationId).run();

        console.log(`Application ${applicationId} hold resolved by admin ${admin.username}`);
        await sendStudentResolvedEmail(env, application.id, application.form_type, application.applicant_name, application.student_email, application.campus);
        await sendDirectorResolvedEmail(env, application.id, application.form_type, application.applicant_name, application.campus);

        return new Response(JSON.stringify({ success: true, message: 'Hold resolved — application moved to APPROVED' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error resolving hold:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
}

async function sendDocumentDispatchedEmail(env, application, programme = null, trackingNumber = null, digilockerUrl = null, deliveryPreference = null, downloadLinks = []) {
    if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_REFRESH_TOKEN) {
        try {
            const accessToken = await getGoogleAuth(env);
            const isMigration = application.form_type === 'Application for Migration Certificate';
            const actionWord = isMigration ? 'Uploaded' : 'Dispatched';
            const processedOn = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
            const appliedOn = application.created_at
                ? new Date(application.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
                : null;
            let importantNote = '';
            if (digilockerUrl) {
                importantNote += `You can download your Migration Certificate from DigiLocker by <a href="${digilockerUrl}" style="color:#2563eb;font-weight:600;">clicking here</a>.<br><br>`;
            }
            if (trackingNumber) {
                importantNote += `You can track your parcel at <a href="https://www.indiapost.gov.in" style="color:#2563eb;">indiapost.gov.in</a> using the tracking number provided above.<br><br>`;
            }
            importantNote += 'If you have any queries, please contact the Examinations Section at <a href="mailto:coeoffice@sssihl.edu.in" style="color:#2563eb;">coeoffice@sssihl.edu.in</a>';
            let content;
            if (deliveryPreference === 'DigiLocker' || deliveryPreference === 'Soft Copy') {
                content = 'Your application has been processed and your Migration Certificate is now available for download from your DigiLocker account.';
            } else if (deliveryPreference === 'Both Scanned Copy and DigiLocker' || deliveryPreference === 'Both Hard Copy and Soft Copy') {
                content = 'Your application has been processed. Your scanned Migration Certificate is available to download from the Track Application page and is also available from your DigiLocker account.';
            } else if (deliveryPreference === 'Scanned Copy') {
                content = 'Your application has been processed. Your scanned Migration Certificate is ready to download from the Track Application page on the portal.';
            } else if (isMigration) {
                content = 'Your application has been processed and your document has been uploaded by the Office of the Controller of Examinations, SSSIHL. You may download it from the Track Application page on the portal.';
            } else {
                content = 'Your application has been processed and your document has been dispatched from the Office of the Controller of Examinations, SSSIHL. Please collect or expect to receive your document shortly.';
            }
            const htmlBody = renderEmailTemplate({
                title: `Document ${actionWord}`,
                greeting: `Sai Ram!<br><br>Dear ${escapeHtml(application.applicant_name)},`,
                content,
                details: [
                    { label: 'Form Type', value: escapeHtml(application.form_type) },
                    { label: 'Application ID', value: escapeHtml(application.id) },
                    { label: 'Registered Number', value: escapeHtml(application.reg_no || 'N/A') },
                    { label: 'Campus', value: escapeHtml(application.campus) },
                    ...(programme ? [{ label: 'Programme', value: escapeHtml(programme) }] : []),
                    ...(appliedOn ? [{ label: 'Applied On', value: appliedOn }] : []),
                    { label: `${actionWord} On`, value: processedOn },
                    ...(trackingNumber ? [{ label: 'Postal Tracking Number', value: escapeHtml(trackingNumber) }] : [])
                ],
                importantNote,
                ...(downloadLinks.length > 0 ? { actionButtons: downloadLinks.map(dl => ({ label: dl.label, link: dl.url })) } : {})
            });

            await sendEmail(accessToken, {
                to: application.student_email,
                subject: `Document ${actionWord} : ${application.form_type} (${application.id})`,
                htmlBody
            });
            console.log(`Document dispatched email sent for app ${application.id}`);
        } catch (e) {
            console.error('Failed to send document dispatched email:', e);
            throw e;
        }
    }
}

async function handleNotifyDispatched(request, env, corsHeaders) {
    const admin = await verifyAdminToken(request, env);
    if (!admin) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    try {
        const { applicationId, trackingNumber } = await request.json();

        if (!applicationId) {
            return new Response(JSON.stringify({ error: 'Application ID is required' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const application = await env.DB.prepare(
            `SELECT id, form_type, applicant_name, student_email, campus, status, reg_no, created_at, access_token FROM applications WHERE id = ?`
        ).bind(applicationId).first();

        if (!application) {
            return new Response(JSON.stringify({ error: 'Application not found' }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        if (application.status !== 'COMPLETED') {
            return new Response(JSON.stringify({ error: 'Application must be in COMPLETED status to dispatch' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Fetch programme from form-specific table if available
        const dispatchFormTableMap = {
            'Application for Duplicate Grade Card': 'form_duplicate_grade_card',
            'Application for Supplementary Examinations Registration': 'form_supplementary_exam',
            'Application for Repeating Examinations Registration (CIE and ESE)': 'form_repeat_paper',
            'Application for Duplicate Degree Certificate': 'form_duplicate_degree',
            'Application for CGPA to Percentage Conversion Certificate': 'form_cgpa_conversion',
            'Application for Re-totaling of Marks': 'form_retotaling',
            'Application for On-Request Degree Certificate': 'form_on_request_degree',
            'Application for Registration of Student Name change': 'form_name_change',
            'Application for Migration Certificate': 'form_migration_certificate',
        };
        let programme = null;
        const formTable = dispatchFormTableMap[application.form_type];
        if (formTable) {
            try {
                const formDetails = await env.DB.prepare(
                    `SELECT Programme FROM ${formTable} WHERE application_id = ?`
                ).bind(applicationId).first();
                programme = formDetails?.Programme || null;
            } catch (e) {
                // Table may not have Programme column — ignore
            }
        }

        let digilockerUrl = null;
        let deliveryPreference = null;
        if (application.form_type === 'Application for Migration Certificate') {
            try {
                const migrationDetails = await env.DB.prepare(
                    `SELECT delivery_preference FROM form_migration_certificate WHERE application_id = ?`
                ).bind(applicationId).first();
                deliveryPreference = migrationDetails?.delivery_preference || null;
                if (['Soft Copy', 'DigiLocker', 'Both Hard Copy and Soft Copy', 'Both Scanned Copy and DigiLocker'].includes(deliveryPreference)) {
                    digilockerUrl = 'https://accounts.digilocker.gov.in/v3/7b9f84c86732efd21cd8076ff06f3fd60b1fbe146732fa57444b03b35f3740a4--en';
                }
            } catch (e) { /* ignore */ }
        }

        const backendUrl = new URL(request.url).origin;
        const responseDocsResult = await env.DB.prepare(
            `SELECT id, file_name FROM file_blobs WHERE application_id = ? AND is_response = TRUE`
        ).bind(applicationId).all();
        const isScannedCopyDelivery = deliveryPreference === 'Scanned Copy' || deliveryPreference === 'Both Scanned Copy and DigiLocker';
        let downloadLinks = [];
        if (isScannedCopyDelivery && (responseDocsResult.results || []).length > 0) {
            downloadLinks = [{ label: 'Track Application', url: `https://student-service.pages.dev/#track=${applicationId}` }];
        } else {
            downloadLinks = (responseDocsResult.results || []).map(doc => ({
                label: `Download ${doc.file_name}`,
                url: `${backendUrl}/download/${doc.id}?appId=${applicationId}${application.access_token ? `&token=${application.access_token}` : ''}`
            }));
        }

        await sendDocumentDispatchedEmail(env, application, programme, trackingNumber || null, digilockerUrl, deliveryPreference, downloadLinks);

        await env.DB.prepare(
            `UPDATE applications SET status = 'DISPATCHED', updated_at = CURRENT_TIMESTAMP WHERE id = ?`
        ).bind(applicationId).run();

        console.log(`Application ${applicationId} marked as DISPATCHED by admin`);

        return new Response(JSON.stringify({ success: true, message: 'Student notified and application marked as dispatched' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error notifying dispatch:', error);
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
            'Application for Supplementary Examinations Registration': 'form_supplementary_exam',
            'Application for Duplicate Degree Certificate': 'form_duplicate_degree',
            'Application for Registration of Student Name change in the Institute Records': 'form_name_change',
            'Application for Repeating Examinations Registration (CIE and ESE)': 'form_repeat_paper',
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

// ==================== FORM SETTINGS ====================

async function handleGetFormSettings(env, corsHeaders) {
    const result = await env.DB.prepare(
        'SELECT form_id, is_active FROM form_settings'
    ).all();
    const settings = {};
    for (const row of result.results) {
        settings[row.form_id] = row.is_active === 1;
    }
    return new Response(JSON.stringify(settings), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function handleToggleFormSetting(request, env, corsHeaders) {
    const admin = await verifyAdminToken(request, env);
    if (!admin) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
    const { formId, isActive } = await request.json();
    if (!formId || typeof isActive !== 'boolean') {
        return new Response(JSON.stringify({ error: 'formId and isActive (boolean) required' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
    await env.DB.prepare(
        'UPDATE form_settings SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE form_id = ?'
    ).bind(isActive ? 1 : 0, formId).run();
    return new Response(JSON.stringify({ success: true, formId, isActive }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

// Handler for public download (students downloading response documents)
async function handlePublicDownload(fileId, url, env, corsHeaders) {
    const appId = url.searchParams.get('appId');
    const token = url.searchParams.get('token');

    if (!appId) {
        return new Response(JSON.stringify({ error: 'Application ID is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    // Ownership check: if the application has an access_token, require it
    const appRecord = await env.DB.prepare(
        'SELECT access_token FROM applications WHERE id = ?'
    ).bind(appId).first();
    if (appRecord && appRecord.access_token && appRecord.access_token !== token) {
        return new Response(JSON.stringify({ error: 'Invalid access token' }), {
            status: 403,
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

    const safeFilename = (file.file_name || 'download.pdf').replace(/[^\w\s\-_.()]/g, '_').replace(/\s+/g, ' ').trim();
    return new Response(bytes, {
        headers: {
            ...corsHeaders,
            'Content-Type': file.file_type,
            'Content-Disposition': `attachment; filename="${safeFilename}"`
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
    const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3 MB
    if (file.size > MAX_FILE_SIZE) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
        throw new FileValidationError(
            `File "${file.name}" is ${sizeMB} MB, which exceeds the 3 MB limit. Please compress or reduce the file size.`
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
                <span style="display: block; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; margin-bottom: 4px;">${escapeHtml(detail.label)}</span>
                <span style="display: block; font-size: 14px; font-weight: 500; color: #1e293b;">${detail.value}</span>
            </td>
        </tr>
    `).join('');

    const buttons = actionButtons.map(btn => `
        <tr>
            <td style="padding: 0 0 10px 0; text-align: center;">
                <a href="${btn.link}" style="display: inline-block; background-color: ${btn.color || '#3b82f6'}; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 9999px; font-weight: 600; font-size: 14px; box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.2);">${btn.label}</a>
            </td>
        </tr>
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
                                                ${buttons}
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

async function sendAdminNotification(env, appId, formType, applicantName, email, recipientEmail = null) {
    if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_REFRESH_TOKEN) {
        try {
            const accessToken = await getGoogleAuth(env);
            const htmlBody = renderEmailTemplate({
                title: 'New Application Received',
                greeting: 'Sai Ram!',
                content: 'A new application has been submitted through the portal and is ready for review.',
                details: [
                    { label: 'Application ID', value: escapeHtml(appId) },
                    { label: 'Form Type', value: escapeHtml(formType) },
                    { label: 'Applicant', value: escapeHtml(applicantName) },
                    { label: 'Email', value: escapeHtml(email) },
                    { label: 'Submitted On', value: new Date().toLocaleString() }
                ],
                actionButtons: [
                    { label: 'Login to Admin Portal', link: 'https://student-service.pages.dev/admin' }
                ]
            });

            await sendEmail(accessToken, {
                to: recipientEmail || env.ADMIN_EMAIL,
                subject: `New Application Received: ${formType} - ${appId}`,
                htmlBody: htmlBody
            });
            console.log(`Admin notification sent successfully for app ${appId}`);
        } catch (e) {
            console.error('Failed to send admin notification:', e);
        }
    }
}

// Director email functions
function getDirectorEmail(campus) {
    const map = {
        'Prashanti Nilayam Campus': 'controller@sssihl.edu.in',
        'Anantapur Campus': 'results@sssihl.edu.in',
        'Brindavan Campus': 'sathyajain9@gmail.com',
        'Nandigiri Campus': 'sathyajain99@outlook.com'
    };
    return map[campus] || map['Prashanti Nilayam Campus'];
}

function shouldNotifyDirector(formType) {
    const forms = [
        'Application for Duplicate Grade Card',
        'Application for Supplementary Examinations Registration',
        'Application for Registration of Student Name change in the Institute Records',
        'Application for Repeating Examinations Registration (CIE and ESE)',
    ];
    return forms.includes(formType);
}

async function sendDirectorNotification(env, request, appId, formType, applicantName, email, campus, semester = null, regNo = null, programme = null) {
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

        const isNameChange = formType === 'Application for Registration of Student Name change in the Institute Records';
        const isSupplementary = formType === 'Application for Supplementary Examinations Registration';
        const isRepeatPaper = formType === 'Application for Repeating Examinations Registration (CIE and ESE)';
        const useNewFlow = isNameChange || isSupplementary || isRepeatPaper;

        let nameChangeDetails = null;
        if (isNameChange) {
            try {
                nameChangeDetails = await env.DB.prepare(
                    `SELECT changed_name, Father_name, Period_of_Study, Mobile_Number,
                            address_line1, address_line2, city, state_province, country, postal_code
                     FROM form_name_change WHERE application_id = ?`
                ).bind(appId).first();
            } catch (e) {
                console.error('Failed to fetch name change details for director email:', e);
            }
        }

        let examDetails = null;
        if (isSupplementary || isRepeatPaper) {
            try {
                const table = isSupplementary ? 'form_supplementary_exam' : 'form_repeat_paper';
                examDetails = await env.DB.prepare(
                    `SELECT Period_of_Study, Semester, paper_codes, paper_titles FROM ${table} WHERE application_id = ?`
                ).bind(appId).first();
            } catch (e) {
                console.error('Failed to fetch exam details for director email:', e);
            }
        }

        const emailSubject = useNewFlow
            ? `For Your Kind Attention: ${formType} - ${appId}`
            : `Clearance Required: ${formType} - ${appId}`;

        const emailBody = isNameChange
            ? renderEmailTemplate({
                title: 'For Your Information',
                greeting: 'Dear Madam / Sir,<br><br>Sairam!<br><br>Greetings from the Examinations Section, SSSIHL.',
                content: `This is to bring to your notice that<strong>${escapeHtml(applicantName)}</strong> has submitted an application for registration of name change in the Institute records. This is for your kind information.<br><br>If you are in agreement with the above, kindly click the <strong>Proceed</strong> button below so that the Examination Section may process the application. Alternatively, if you have any concerns, you may record your comments by clicking the <strong>Submit Comments</strong> button.`,
                details: [
                    { label: 'Form Type', value: escapeHtml(formType) },
                    { label: 'Application ID', value: escapeHtml(appId) },
                    { label: 'Former Name', value: escapeHtml(applicantName) },
                    { label: 'Changed Name as per the Gazette notification', value: escapeHtml(nameChangeDetails?.changed_name || 'N/A') },
                    { label: "Father's Name", value: escapeHtml(nameChangeDetails?.Father_name || 'N/A') },
                    { label: 'Registered Number', value: escapeHtml(regNo || 'N/A') },
                    { label: 'Campus', value: escapeHtml(campus) },
                    ...(programme ? [{ label: 'Programme', value: escapeHtml(programme) }] : []),
                    { label: 'Period of Study', value: escapeHtml(nameChangeDetails?.Period_of_Study || 'N/A') },
                    { label: 'Mobile Number', value: escapeHtml(nameChangeDetails?.Mobile_Number || 'N/A') },
                    { label: 'Applicant Email', value: escapeHtml(email) },
                    { label: 'Submission Date', value: submissionDate },
                ],
                importantNote: `
                        <p style="margin: 0; font-weight: 700;">⚠️ Important Note</p>
                        <p style="margin: 8px 0 0 0;">Request you to please verify the availability of the original grade card in the campus office before processing this application.</p>
                        <p style="margin: 8px 0 0 0;"><strong>If the grade card is available at the campus office and the student has not collected it yet, please reject this application. The student will be notified to contact the campus office to collect her / his original grade card.</strong></p>
                    `,
                actionButtons: [
                    { label: '✓ Proceed', link: `${url.origin}/approve?id=${appId}&role=Director&action=Approve`, color: '#10b981' },
                    { label: '✗ Grade Card Available', link: `${url.origin}/approve?id=${appId}&role=Director&action=Reject`, color: '#ef4444' },
                    { label: '✎ Submit Comments', link: `${url.origin}/director-comment?id=${appId}`, color: '#f59e0b' }
                ]
            })
            : (isSupplementary || isRepeatPaper)
                ? renderEmailTemplate({
                    title: 'For Your Kind Attention',
                    greeting: 'Dear Madam / Sir,<br><br>Sairam!<br><br>Greetings from the Examinations Section, SSSIHL.',
                    content: `This is to bring to your kind notice that <strong>${escapeHtml(applicantName)}</strong> has submitted an <strong>${escapeHtml(formType)}</strong>. Kindly verify whether the applicant fulfils the attendance requirement before proceeding.`,
                    details: [
                        { label: 'Form Type', value: escapeHtml(formType) },
                        { label: 'Application ID', value: escapeHtml(appId) },
                        { label: 'Applicant Name', value: escapeHtml(applicantName) },
                        { label: 'Registered Number', value: escapeHtml(regNo || 'N/A') },
                        { label: 'Campus', value: escapeHtml(campus) },
                        ...(programme ? [{ label: 'Programme', value: escapeHtml(programme) }] : []),
                        { label: 'Period of Study', value: escapeHtml(examDetails?.Period_of_Study || 'N/A') },
                        { label: 'Semester', value: escapeHtml(examDetails?.Semester || semester || 'N/A') },
                        { label: 'Paper Codes', value: escapeHtml(examDetails?.paper_codes || 'N/A') },
                        { label: 'Paper Titles', value: escapeHtml(examDetails?.paper_titles || 'N/A') },
                        { label: 'Applicant Email', value: escapeHtml(email) },
                        { label: 'Submission Date', value: submissionDate },
                    ],
                    importantNote: `
                        <p style="margin: 0; font-weight: 700;">📋 Attendance Verification Required</p>
                        <p style="margin: 8px 0 0 0;">Kindly verify whether <strong>${escapeHtml(applicantName)}</strong> fulfils the required attendance criteria, and take action accordingly:</p>
                        <ul style="margin: 8px 0 0 0; padding-left: 20px; line-height: 1.8;">
                            <li><strong>If attendance is fulfilled</strong> — click <strong>"Attendance Met — Proceed"</strong> to forward the application to the Examination Section.</li>
                            <li><strong>If attendance is not fulfilled</strong> — click <strong>"Attendance Not Met"</strong>. The student will be notified of their ineligibility.</li>
                        </ul>
                    `,
                    actionButtons: [
                        { label: '✓ Attendance Met — Proceed', link: `${url.origin}/approve?id=${appId}&role=Director&action=Approve`, color: '#10b981' },
                        { label: '✗ Attendance Not Met', link: `${url.origin}/approve?id=${appId}&role=Director&action=Reject`, color: '#ef4444' },
                        { label: '✎ Submit Comments', link: `${url.origin}/director-comment?id=${appId}`, color: '#f59e0b' }
                    ]
                })
                : renderEmailTemplate({
                    title: 'Clearance Required',
                    greeting: 'Dear Madam / Sir,<br><br>Sairam!<br><br>Greetings from the Examinations Section, SSSIHL.',
                    content: `An <strong>${escapeHtml(formType)}</strong> has been submitted and requires your clearance for further processing.`,
                    details: [
                        { label: 'Form Type', value: escapeHtml(formType) },
                        { label: 'Application ID', value: escapeHtml(appId) },
                        { label: 'Applicant Name', value: escapeHtml(applicantName) },
                        { label: 'Registered Number', value: escapeHtml(regNo || 'N/A') },
                        { label: 'Applicant Email', value: escapeHtml(email) },
                        { label: 'Campus', value: escapeHtml(campus) },
                        ...(programme ? [{ label: 'Programme', value: escapeHtml(programme) }] : []),
                        { label: 'Semester', value: escapeHtml(semester || 'N/A') },
                        { label: 'Submission Date', value: submissionDate },
                    ],
                    importantNote: `
                        <p style="margin: 0; font-weight: 700;">⚠️ Important Note</p>
                        <p style="margin: 8px 0 0 0;">Request you to please verify the availability of the original grade card in the campus office before processing this application.</p>
                        <p style="margin: 8px 0 0 0;"><strong>If the grade card is available at the campus office and the student has not collected it yet, please reject this application. The student will be notified to contact the campus office to collect her / his original grade card.</strong></p>
                    `,
                    actionButtons: [
                        { label: '✓ Clear Application', link: `${url.origin}/approve?id=${appId}&role=Director&action=Approve`, color: '#10b981' },
                        { label: '✗ Reject', link: `${url.origin}/approve?id=${appId}&role=Director&action=Reject`, color: '#ef4444' }
                    ]
                });

        await sendEmail(accessToken, {
            to: directorEmail,
            subject: emailSubject,
            htmlBody: emailBody,
            attachments: []
        });
        console.log(`Director email sent for app ${appId}`);
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
    const isNameChange = verification.form_type === 'Application for Registration of Student Name change in the Institute Records';
    const needsGradeCardCheck = isDuplicateGradeCard || isNameChange;
    const isExamRepeat = verification.form_type === 'Application for Supplementary Examinations Registration'
        || verification.form_type === 'Application for Repeating Examinations Registration (CIE and ESE)';

    let content = isApproved
        ? (needsTwoStep
            ? 'Your application has been approved by the Campus Director. Please return to the portal to complete your submission to the Controller of Examinations (COE).'
            : 'We are pleased to inform you that your application has been approved.')
        : (isDuplicateGradeCard
            ? 'Your application for Duplicate Grade Card has been reviewed. Please see the details below.'
            : isExamRepeat
                ? 'Your application has been reviewed by the Campus Director. Unfortunately, your application has been sent back as you do not fulfil the required attendance criteria.'
                : 'Your application status has been updated. Please see the details below.');

    const submissionDate = verification.created_at
        ? new Date(verification.created_at).toLocaleString('en-IN', {
            dateStyle: 'long',
            timeStyle: 'short',
            timeZone: 'Asia/Kolkata'
        })
        : 'N/A';

    const campusContact = CAMPUS_CONTACTS[verification.campus];
    const campusContactHtml = (!isApproved && needsGradeCardCheck && campusContact)
        ? `<li style="list-style:none; margin-top:8px; padding:10px 12px; background:#eff6ff; border-radius:6px; color:#1e40af;">
               <strong>${escapeHtml(verification.campus)} Office</strong><br>
               <span style="font-size:13px;">Phone: ${campusContact.phone}</span><br>
               <span style="font-size:13px;">Email: <a href="mailto:${campusContact.email}" style="color:#2563eb;">${campusContact.email}</a></span>
           </li>`
        : '';

    let nextSteps = `
        <ul style="margin: 0; padding-left: 20px; color: #1e40af; font-size: 14px; line-height: 1.8;">
            ${isApproved
            ? (needsTwoStep
                ? `<li>The Campus Director has approved your application</li>
                       <li>Click the button below to submit your application to COE</li>`
                : `<li>Your request is being processed by the Examination Department</li>
                       <li>You will receive further updates via email</li>`)
            : (needsGradeCardCheck
                ? `<li><strong>Your original grade card is available at the ${escapeHtml(verification.campus || 'campus')} office</strong></li>
                       <li>Please contact the campus office to collect your grade card</li>
                       ${campusContactHtml}`
                : isExamRepeat
                    ? `<li>You are currently not eligible as you do not meet the required attendance criteria.</li>
                       <li>For queries or clarifications, please contact: <a href="mailto:coeoffice@sssihl.edu.in" style="color: #2563eb; text-decoration: none;">coeoffice@sssihl.edu.in</a></li>`
                    : `<li>For queries or clarifications, please contact: <a href="mailto:coeoffice@sssihl.edu.in" style="color: #2563eb; text-decoration: none;">coeoffice@sssihl.edu.in</a></li>`)
        }
        </ul>
    `;

    return renderEmailTemplate({
        title: heading,
        greeting: `Dear ${escapeHtml(verification.applicant_name)},<br><br>Sairam!<br><br>Greetings from the Examinations Section, SSSIHL.`,
        content: content,
        details: [
            { label: 'Form Type', value: escapeHtml(verification.form_type) },
            { label: 'Application ID', value: escapeHtml(verification.id) },
            { label: 'Applicant Name', value: escapeHtml(verification.applicant_name) },
            { label: 'Registered Number', value: escapeHtml(verification.reg_no || 'N/A') },
            { label: 'Campus', value: escapeHtml(verification.campus) },
            ...(verification.programme ? [{ label: 'Programme', value: escapeHtml(verification.programme) }] : []),
            ...(verification.semester ? [{ label: 'Semester', value: escapeHtml(verification.semester) }] : []),
            { label: 'Submitted On', value: submissionDate },
            { label: 'Status', value: `<span style="color: ${statusColor}; font-weight: 700;">${statusText}</span>` }
        ],
        importantNote: nextSteps,
        actionButtons: [
            {
                label: (needsTwoStep && isApproved) ? 'Submit to COE Now' : 'Track Application Status',
                link: `${portalUrl}#track=${verification.id}`
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

        console.log(`Student decision email sent successfully for app ${verification.id}`);
    } catch (error) {
        console.error('Error sending student decision email:', error);
        throw error; // Re-throw to be caught in handleApproval
    }
}

// Student confirmation email (sent when application is first submitted)
function generateStudentConfirmationHTML(appId, formType, applicantName, email, campus, programme = null, semester = null) {
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
            { label: 'Applicant Name', value: escapeHtml(applicantName) },
            { label: 'Email', value: escapeHtml(email) },
            { label: 'Form Type', value: escapeHtml(formType) },
            { label: 'Campus', value: escapeHtml(campus) },
            ...(programme ? [{ label: 'Programme', value: escapeHtml(programme) }] : []),
            ...(semester ? [{ label: 'Semester', value: escapeHtml(semester) }] : []),
            { label: 'Submitted On', value: submissionDate }
        ],
        importantNote: `
            <h3 style="margin: 0 0 12px 0; color: #1e40af; font-size: 16px; font-weight: 600;">What Happens Next?</h3>
            <ul style="margin: 0; padding-left: 20px; color: #1e40af; font-size: 14px; line-height: 1.8;">
                <li>Your application will be reviewed by the relevant authorities</li>
                <li>You will receive email notifications at each stage of the approval process</li>
                <li>You can track your application status anytime using your Application ID</li>
                <li>For queries, contact: <a href="mailto:coeoffice@sssihl.edu.in" style="color: #2563eb; text-decoration: none;">coeoffice@sssihl.edu.in</a></li>
            </ul>
        `,
        actionButtons: [
            { label: 'Track Application Status', link: 'https://student-service.pages.dev/#track' }
        ]
    });
}

async function sendStudentConfirmationEmail(env, appId, formType, applicantName, email, campus, programme = null, semester = null) {
    console.log(`[STUDENT CONFIRMATION] Starting for appId: ${appId}`);

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
        const htmlBody = generateStudentConfirmationHTML(appId, formType, applicantName, email, campus, programme, semester);
        console.log('[STUDENT CONFIRMATION] Email content generated');

        // Send email
        console.log('[STUDENT CONFIRMATION] Sending email...');
        await sendEmail(accessToken, {
            to: email,
            subject: subject,
            htmlBody: htmlBody
        });

        console.log(`[STUDENT CONFIRMATION] Email sent successfully for app ${appId}`);
    } catch (error) {
        console.error('[STUDENT CONFIRMATION] Error:', error);
        console.error('[STUDENT CONFIRMATION] Error message:', error.message);
        console.error('[STUDENT CONFIRMATION] Error stack:', error.stack);
        // Don't throw - we don't want to fail the submission if email fails
    }
}

async function sendDirectorSoughtConfirmationEmail(env, appId, formType, applicantName, email, campus, programme = null, semester = null, regNo = null) {
    try {
        const accessToken = await getGoogleAuth(env);
        const submissionDate = new Date().toLocaleString('en-IN', {
            dateStyle: 'long',
            timeStyle: 'short',
            timeZone: 'Asia/Kolkata'
        });

        const htmlBody = renderEmailTemplate({
            title: 'Application Sent for Clearance',
            greeting: `Dear ${escapeHtml(applicantName)},<br><br>Sairam!<br><br>Greetings from the Examinations Section, SSSIHL.`,
            content: `Your application requires clearance from the Director of the campus where you studied. It has been automatically forwarded for review.`,
            highlight: {
                label: 'Your Application ID',
                value: escapeHtml(appId),
                subtext: 'Use this ID to track status updates'
            },
            details: [
                { label: 'Form Type', value: escapeHtml(formType) },
                { label: 'Applicant Name', value: escapeHtml(applicantName) },
                ...(regNo ? [{ label: 'Registered Number', value: escapeHtml(regNo) }] : []),
                { label: 'Campus', value: escapeHtml(campus) },
                ...(programme ? [{ label: 'Programme', value: escapeHtml(programme) }] : []),
                ...(semester ? [{ label: 'Semester', value: escapeHtml(semester) }] : []),
                { label: 'Submitted On', value: submissionDate }
            ],
            importantNote: `
                <p style="margin: 0;">Once the Director of the Campus provides clearance, your application will be forwarded to the Controller of Examinations. You will receive an email notification when this happens.</p>
            `,
            actionButtons: [
                { label: 'Track Application Status', link: 'https://student-service.pages.dev/#track' }
            ]
        });

        await sendEmail(accessToken, {
            to: email,
            subject: `Application Sent for Clearance - ${appId}`,
            htmlBody: htmlBody
        });
        console.log(`Director-sought confirmation email sent for app ${appId}`);
    } catch (error) {
        console.error('Failed to send director-sought confirmation:', error);
    }
}

async function sendStudentOnHoldEmail(env, appId, formType, applicantName, studentEmail, campus) {
    try {
        const accessToken = await getGoogleAuth(env);
        const submissionDate = new Date().toLocaleString('en-IN', {
            dateStyle: 'long', timeStyle: 'short', timeZone: 'Asia/Kolkata'
        });
        const htmlBody = renderEmailTemplate({
            title: 'Application On Hold',
            greeting: `Dear ${escapeHtml(applicantName)},<br><br>Sairam!<br><br>Greetings from the Examinations Section, SSSIHL.`,
            content: `Your <strong>${escapeHtml(formType)}</strong> has been placed <strong>on hold</strong> following a review by the Campus Director.<br><br>You are requested to kindly contact the Examination Section at the earliest for further information and guidance regarding your application.`,
            details: [
                { label: 'Application ID', value: escapeHtml(appId) },
                { label: 'Form Type', value: escapeHtml(formType) },
                { label: 'Applicant Name', value: escapeHtml(applicantName) },
                { label: 'Campus', value: escapeHtml(campus) },
                { label: 'Status', value: '<span style="color:#7c3aed;font-weight:700;">ON HOLD</span>' },
                { label: 'Date', value: submissionDate },
            ],
            importantNote: `<p style="margin:0;">For queries or clarifications, please contact: <a href="mailto:coeoffice@sssihl.edu.in" style="color:#2563eb;text-decoration:none;">coeoffice@sssihl.edu.in</a></p>`,
            actionButtons: [
                { label: 'Track Application Status', link: `https://student-service.pages.dev/#track=${escapeHtml(appId)}` }
            ]
        });
        await sendEmail(accessToken, {
            to: studentEmail,
            subject: `Application on Hold - ${formType} - ${appId}`,
            htmlBody
        });
        console.log(`Student on-hold email sent for app ${appId}`);
    } catch (e) {
        console.error('Failed to send student on-hold email:', e);
    }
}

async function sendStudentResolvedEmail(env, appId, formType, applicantName, studentEmail, campus) {
    try {
        const accessToken = await getGoogleAuth(env);
        const resolvedOn = new Date().toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Asia/Kolkata' });
        const htmlBody = renderEmailTemplate({
            title: 'Application Back on Track',
            greeting: `Dear ${escapeHtml(applicantName)},<br><br>Sairam!<br><br>Greetings from the Examinations Section, SSSIHL.`,
            content: `We are pleased to inform you that the hold placed on your <strong>${escapeHtml(formType)}</strong> has been resolved by the Examinations Section.<br><br>Your application is now <strong>under process</strong> and will be handled in due course.`,
            details: [
                { label: 'Application ID', value: escapeHtml(appId) },
                { label: 'Form Type', value: escapeHtml(formType) },
                { label: 'Applicant Name', value: escapeHtml(applicantName) },
                { label: 'Campus', value: escapeHtml(campus) },
                { label: 'Status', value: '<span style="color:#059669;font-weight:700;">UNDER PROCESS</span>' },
                { label: 'Resolved On', value: resolvedOn },
            ],
            importantNote: `<p style="margin:0;">If you have any queries, please contact: <a href="mailto:coeoffice@sssihl.edu.in" style="color:#2563eb;text-decoration:none;">coeoffice@sssihl.edu.in</a></p>`,
            actionButtons: [{ label: 'Track Application Status', link: `https://student-service.pages.dev/#track=${escapeHtml(appId)}` }]
        });
        await sendEmail(accessToken, { to: studentEmail, subject: `Application Resolved & Under Process - ${formType} - ${appId}`, htmlBody });
        console.log(`Student resolved email sent for app ${appId}`);
    } catch (e) {
        console.error('Failed to send student resolved email:', e);
    }
}

async function sendDirectorResolvedEmail(env, appId, formType, applicantName, campus) {
    try {
        const accessToken = await getGoogleAuth(env);
        const directorEmail = getDirectorEmail(campus);
        const resolvedOn = new Date().toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Asia/Kolkata' });
        const htmlBody = renderEmailTemplate({
            title: 'Application Hold Resolved',
            greeting: 'Dear Madam / Sir,<br><br>Sairam!<br><br>Greetings from the Examinations Section, SSSIHL.',
            content: `This is to inform you that the hold you placed on the application of <strong>${escapeHtml(applicantName)}</strong> has been reviewed and resolved by the Examinations Section. The application is now under process.`,
            details: [
                { label: 'Application ID', value: escapeHtml(appId) },
                { label: 'Form Type', value: escapeHtml(formType) },
                { label: 'Applicant Name', value: escapeHtml(applicantName) },
                { label: 'Campus', value: escapeHtml(campus) },
                { label: 'Resolved On', value: resolvedOn },
            ],
            importantNote: '',
            actionButtons: []
        });
        await sendEmail(accessToken, { to: directorEmail, subject: `Application Hold Resolved - ${formType} - ${appId}`, htmlBody });
        console.log(`Director resolved email sent for app ${appId}`);
    } catch (e) {
        console.error('Failed to send director resolved email:', e);
    }
}


// ==================== FORM HANDLERS ====================

async function handleSubmission(request, env, corsHeaders) {
    const formData = await request.formData();
    const formType = formData.get('formType');

    let subResult;
    switch (formType) {
        case 'Application for Duplicate Grade Card':
            subResult = await handleDuplicateGradeCard(formData, request, env, corsHeaders); break;
        case 'Application for CGPA to Marks Conversion':
            subResult = await handleCGPAConversion(formData, request, env, corsHeaders); break;
        case 'Application for Supplementary Examinations Registration':
            subResult = await handleSupplementaryExam(formData, request, env, corsHeaders); break;
        case 'Application for Duplicate Degree Certificate':
            subResult = await handleDuplicateDegree(formData, request, env, corsHeaders); break;
        case 'Application for Registration of Student Name change in the Institute Records':
            subResult = await handleNameChange(formData, request, env, corsHeaders); break;
        case 'Application for Repeating Examinations Registration (CIE and ESE)':
            subResult = await handleRepeatPaper(formData, request, env, corsHeaders); break;
        case 'Application for Re-Totalling of Marks':
            subResult = await handleRetotaling(formData, request, env, corsHeaders); break;
        case 'Application for On-Request Degree Certificate':
            subResult = await handleOnRequestDegree(formData, request, env, corsHeaders); break;
        case 'Application for Migration Certificate':
            subResult = await handleMigration(formData, request, env, corsHeaders); break;
        default:
            return new Response(JSON.stringify({ success: false, error: 'Unknown form type' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
    }

    // Generate and attach a secure access token for status/download ownership checks
    if (subResult.ok) {
        try {
            const body = await subResult.json();
            if (body.success && body.appId) {
                const tokenBytes = crypto.getRandomValues(new Uint8Array(32));
                const accessToken = Array.from(tokenBytes).map(b => b.toString(16).padStart(2, '0')).join('');
                await env.DB.prepare('UPDATE applications SET access_token = ? WHERE id = ?')
                    .bind(accessToken, body.appId).run();
                return new Response(JSON.stringify({ ...body, accessToken }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
        } catch (e) {
            console.error('Access token generation failed:', e);
        }
    }
    return subResult;
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
        `INSERT INTO applications (id, student_email, form_type, applicant_name, reg_no, abc_apaar_id, campus, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(appId, email, formType, applicantName, regNo, formData.get('abcApaarId') || '', campus, isSeekingDirectorApproval ? 'AWAITING_DIRECTOR' : 'PENDING').run();

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
        await sendDirectorNotification(env, request, appId, formType, applicantName, email, campus, semester, regNo, formData.get('program') || null);
        await sendDirectorSoughtConfirmationEmail(env, appId, formType, applicantName, email, campus, formData.get('program') || null, semester || null, formData.get('regNo') || null);
    } else {
        await sendAdminNotification(env, appId, formType, applicantName, email);
        await sendDirectorNotification(env, request, appId, formType, applicantName, email, campus, semester, regNo, formData.get('program') || null);
        await sendStudentConfirmationEmail(env, appId, formType, applicantName, email, campus, formData.get('program') || null, formData.get('semester') || null);
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
        `INSERT INTO applications (id, student_email, form_type, applicant_name, reg_no, abc_apaar_id, campus)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(appId, email, formType, applicantName, regNo, formData.get('abcApaarId') || '', campus).run();

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
    await sendDirectorNotification(env, request, appId, formType, applicantName, email, campus, null, regNo, formData.get('program') || null);
    await sendStudentConfirmationEmail(env, appId, formType, applicantName, email, campus, formData.get('program') || null, formData.get('semester') || null);

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
        `INSERT INTO applications (id, student_email, form_type, applicant_name, reg_no, abc_apaar_id, campus, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(appId, email, formType, applicantName, regNo, formData.get('abcApaarId') || '', campus, isSeekingDirectorApproval ? 'AWAITING_DIRECTOR' : 'PENDING').run();

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
        await sendDirectorNotification(env, request, appId, formType, applicantName, email, campus, semester, regNo, formData.get('program') || null);
        await sendDirectorSoughtConfirmationEmail(env, appId, formType, applicantName, email, campus, formData.get('program') || null, semester || null, formData.get('regNo') || null);
    } else {
        await sendAdminNotification(env, appId, formType, applicantName, email);
        await sendDirectorNotification(env, request, appId, formType, applicantName, email, campus, semester, regNo, formData.get('program') || null);
        await sendStudentConfirmationEmail(env, appId, formType, applicantName, email, campus, formData.get('program') || null, semester || null);
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
        `INSERT INTO applications (id, student_email, form_type, applicant_name, reg_no, abc_apaar_id, campus, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(appId, email, formType, applicantName, regNo, formData.get('abcApaarId') || '', campus, isSeekingDirectorApproval ? 'AWAITING_DIRECTOR' : 'PENDING').run();

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
        await sendDirectorNotification(env, request, appId, formType, applicantName, email, campus, semester, regNo, formData.get('program') || null);
        await sendDirectorSoughtConfirmationEmail(env, appId, formType, applicantName, email, campus, formData.get('program') || null, semester || null, formData.get('regNo') || null);
    } else {
        await sendAdminNotification(env, appId, formType, applicantName, email);
        await sendDirectorNotification(env, request, appId, formType, applicantName, email, campus, semester, regNo, formData.get('program') || null);
        await sendStudentConfirmationEmail(env, appId, formType, applicantName, email, campus, formData.get('program') || null, semester || null);
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
        `INSERT INTO applications (id, student_email, form_type, applicant_name, reg_no, abc_apaar_id, campus)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(appId, email, formType, applicantName, regNo, formData.get('abcApaarId') || '', campus).run();

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
    await sendDirectorNotification(env, request, appId, formType, applicantName, email, campus, null, regNo, formData.get('program') || null);
    await sendStudentConfirmationEmail(env, appId, formType, applicantName, email, campus, formData.get('program') || null, formData.get('semester') || null);

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
        `INSERT INTO applications (id, student_email, form_type, applicant_name, reg_no, abc_apaar_id, campus, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(appId, email, formType, applicantName, regNo, formData.get('abcApaarId') || '', campus, isSeekingDirectorApproval ? 'AWAITING_DIRECTOR' : 'PENDING').run();

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
        await sendDirectorNotification(env, request, appId, formType, applicantName, email, campus, null, regNo, formData.get('program') || null);
        await sendDirectorSoughtConfirmationEmail(env, appId, formType, applicantName, email, campus, formData.get('program') || null, formData.get('semester') || null);
    } else {
        await sendAdminNotification(env, appId, formType, applicantName, email);
        await sendDirectorNotification(env, request, appId, formType, applicantName, email, campus, null, regNo, formData.get('program') || null);
        await sendStudentConfirmationEmail(env, appId, formType, applicantName, email, campus, formData.get('program') || null, formData.get('semester') || null);
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
        `INSERT INTO applications (id, student_email, form_type, applicant_name, reg_no, abc_apaar_id, campus)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(appId, email, formType, applicantName, regNo, formData.get('abcApaarId') || '', campus).run();

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
    await sendStudentConfirmationEmail(env, appId, formType, applicantName, email, campus, formData.get('program') || null, formData.get('semester') || null);

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
        `INSERT INTO applications (id, student_email, form_type, applicant_name, reg_no, abc_apaar_id, campus)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(appId, email, formType, applicantName, regNo, formData.get('abcApaarId') || '', campus).run();

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

    await sendAdminNotification(env, appId, formType, applicantName, email, 'convocation@sssihl.edu.in');
    await sendStudentConfirmationEmail(env, appId, formType, applicantName, email, campus, formData.get('program') || null, formData.get('semester') || null);

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

    const regNo = formData.get('lastExamRegNo') || '';

    await env.DB.prepare(
        `INSERT INTO applications (id, student_email, form_type, applicant_name, reg_no, abc_apaar_id, campus)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(appId, email, formType, applicantName, regNo, formData.get('abcApaarId') || '', campus).run();

    await env.DB.prepare(
        `INSERT INTO form_migration_certificate
         (application_id, student_name, date_of_birth, Mobile_Number, email, Registration_Number, admission_year, Campus_of_admission,
          last_examination_passed, programme, degree_recieved, university_to_migrate, address_line1, address_line2, country, state_province, city, postal_code, delivery_preference)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
        appId,
        formData.get('applicantName') || '',
        formData.get('dateOfBirth') || '',
        formData.get('mobile') || '',
        formData.get('email') || '',
        formData.get('lastExamRegNo') || '',
        formData.get('yearofAdmission') || '',
        formData.get('campus') || '',
        [formData.get('lastExamRegNo') || '', formData.get('lastExamDate') || ''].filter(Boolean).join(' – ') || '',
        formData.get('program') || '',
        formData.get('degreeRecieved') || '',
        formData.get('universityInstitute') || '',
        formData.get('addressLine1') || '',
        formData.get('addressLine2') || '',
        formData.get('country') || '',
        formData.get('stateProvince') || '',
        formData.get('city') || '',
        formData.get('postalCode') || '',
        formData.get('deliveryPreference') || ''
    ).run();

    for (const [key, value] of formData.entries()) {
        if (value instanceof File && value.size > 0) {
            await storeFileBlob(env, appId, key, value);
        }
    }

    await sendAdminNotification(env, appId, formType, applicantName, email);
    await sendStudentConfirmationEmail(env, appId, formType, applicantName, email, campus, formData.get('program') || null, formData.get('semester') || null);

    return new Response(JSON.stringify({ success: true, appId }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function handleDirectorCommentPage(url, env, corsHeaders) {
    const id = url.searchParams.get('id');
    if (!id) return new Response('Missing application ID', { status: 400, headers: corsHeaders });

    const app = await env.DB.prepare(
        'SELECT id, applicant_name, form_type, campus, status FROM applications WHERE id = ?'
    ).bind(id).first();

    if (!app) return new Response('Application not found', { status: 404, headers: corsHeaders });

    const alreadyActed = app.status !== 'AWAITING_DIRECTOR';

    // Generate CSRF token (random nonce + expiry, signed with HMAC-SHA256)
    const nonce = Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b => b.toString(16).padStart(2, '0')).join('');
    const exp = Date.now() + 3600000; // 1 hour
    const csrfPayload = `${nonce}:${exp}`;
    const csrfSig = await hmacSign(env.CSRF_SECRET || 'fallback-dev-secret', csrfPayload);
    const pageHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Submit Comments - SSSIHL Examination Services</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; }
        textarea:focus { outline: none; }
    </style>
</head>
<body class="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex flex-col items-center justify-center py-10 px-4">

    <!-- Header -->
    <div class="text-center mb-8">
        <img src="https://student-service.pages.dev/Examinations_Service.png" alt="SSSIHL" class="w-auto h-24 mx-auto">
    </div>

    <!-- Card -->
    <div class="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-slate-100 p-8 w-full max-w-lg">
        ${alreadyActed
            ? `<div class="text-center py-4">
                   <div class="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-5 text-3xl">ℹ️</div>
                   <h2 class="text-xl font-bold text-slate-800 mb-3">Already Submitted</h2>
                   <p class="text-slate-500 text-sm leading-relaxed">This application has already been acted upon. No further action is required from your end.</p>
               </div>`
            : `<div class="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-5 text-3xl">✍️</div>
               <h2 class="text-xl font-bold text-slate-800 text-center mb-2">Submit Comments</h2>
               <p class="text-slate-500 text-sm text-center leading-relaxed mb-6">Please record your concerns below. The Examination Section will review your comments and take appropriate action.</p>

               <!-- Application Details -->
               <div class="bg-slate-50 rounded-xl p-5 mb-6">
                   <div class="flex justify-between items-center py-2.5 border-b border-slate-200">
                       <span class="text-xs font-medium text-slate-500">Application ID</span>
                       <span class="text-sm font-semibold text-slate-800">${escapeHtml(app.id)}</span>
                   </div>
                   <div class="flex justify-between items-center py-2.5 border-b border-slate-200">
                       <span class="text-xs font-medium text-slate-500">Applicant Name</span>
                       <span class="text-sm font-semibold text-slate-800">${escapeHtml(app.applicant_name)}</span>
                   </div>
                   <div class="flex justify-between items-center py-2.5 border-b border-slate-200">
                       <span class="text-xs font-medium text-slate-500">Form Type</span>
                       <span class="text-sm font-semibold text-slate-800">${escapeHtml(app.form_type)}</span>
                   </div>
                   <div class="flex justify-between items-center py-2.5">
                       <span class="text-xs font-medium text-slate-500">Campus</span>
                       <span class="text-sm font-semibold text-slate-800">${escapeHtml(app.campus)}</span>
                   </div>
               </div>

               <!-- Comment Form -->
               <form method="POST" action="/director-comment">
                   <input type="hidden" name="id" value="${escapeHtml(app.id)}">
                   <input type="hidden" name="csrf_payload" value="${csrfPayload}">
                   <input type="hidden" name="csrf_sig" value="${csrfSig}">
                   <label class="block text-sm font-semibold text-slate-800 mb-2" for="comment">Your Comments</label>
                   <textarea
                       id="comment"
                       name="comment"
                       required
                       rows="5"
                       placeholder="Please describe your concerns or observations regarding this application..."
                       class="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 resize-y focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all"
                       oninput="document.getElementById('charCount').textContent = this.value.length + ' characters'"
                   ></textarea>
                   <p class="text-xs text-slate-400 mt-1 mb-4" id="charCount">0 characters</p>
                   <button
                       type="submit"
                       class="w-full py-3.5 bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 text-white font-bold rounded-xl transition-all text-sm"
                   >
                       Submit Comments to Examination Section
                   </button>
               </form>`
        }
    </div>

</body>
</html>`;

    return new Response(pageHtml, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

async function handleDirectorCommentSubmit(request, env, corsHeaders) {
    const formData = await request.formData();
    const id = (formData.get('id') || '').trim();
    const rawComment = (formData.get('comment') || '').trim();
    const csrfPayload = (formData.get('csrf_payload') || '').trim();
    const csrfSig = (formData.get('csrf_sig') || '').trim();

    // Verify CSRF token
    if (!csrfPayload || !csrfSig) {
        return new Response('Forbidden — missing CSRF token', { status: 403, headers: corsHeaders });
    }
    const [, expStr] = csrfPayload.split(':');
    if (!expStr || Date.now() > parseInt(expStr)) {
        return new Response('Forbidden — CSRF token expired', { status: 403, headers: corsHeaders });
    }
    const sigValid = await hmacVerify(env.CSRF_SECRET || 'fallback-dev-secret', csrfPayload, csrfSig);
    if (!sigValid) {
        return new Response('Forbidden — invalid CSRF token', { status: 403, headers: corsHeaders });
    }

    // Strip any HTML tags from the comment before storing
    const comment = rawComment.replace(/<[^>]*>/g, '').trim();

    if (!id || !comment) return new Response('Missing required fields', { status: 400, headers: corsHeaders });

    const app = await env.DB.prepare('SELECT * FROM applications WHERE id = ?').bind(id).first();

    if (!app || app.status !== 'AWAITING_DIRECTOR') {
        const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Already Submitted</title></head><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f1f5f9;"><div style="text-align:center;background:white;border-radius:16px;padding:40px;max-width:480px;"><h2 style="color:#0f172a;">Already Acted Upon</h2><p style="color:#64748b;margin-top:12px;">This application has already been processed. No further action is needed.</p></div></body></html>`;
        return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }

    await env.DB.prepare(
        `UPDATE applications SET status = 'DIRECTOR_COMMENTED', director_status = 'COMMENTED', director_comment = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    ).bind(comment, id).run();

    try {
        await sendAdminNotification(env, id, app.form_type, app.applicant_name, app.student_email);
    } catch (e) {
        console.error('Failed to send admin notification after director comment:', e);
    }

    await sendStudentOnHoldEmail(env, id, app.form_type, app.applicant_name, app.student_email, app.campus);

    const successHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Comments Submitted - SSSIHL</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@700;800&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; background: #f1f5f9; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 20px; }
        .card { background: white; border-radius: 20px; padding: 48px 40px; max-width: 500px; width: 100%; text-align: center; box-shadow: 0 10px 25px -5px rgba(15,23,42,0.08); }
        .icon { width: 80px; height: 80px; border-radius: 50%; background: #fef3c7; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; font-size: 40px; }
        h1 { font-family: 'Outfit', sans-serif; color: #0f172a; font-size: 1.8rem; margin-bottom: 12px; }
        p { color: #64748b; font-size: 0.95rem; line-height: 1.7; }
        .app-id { display: inline-block; margin-top: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 16px; font-size: 0.85rem; color: #64748b; font-family: monospace; }
    </style>
</head>
<body>
    <div class="card">
        <div class="icon">✅</div>
        <h1>Comments Submitted</h1>
        <p>Thank you. Your comments have been successfully submitted to the Examination Section for review. They will take appropriate action and get back to you if needed.</p>
        <div class="app-id">Application ID: ${escapeHtml(id)}</div>
    </div>
</body>
</html>`;

    return new Response(successHtml, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
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

        // Fetch programme and semester from the form-specific table
        const approvalFormTableMap = {
            'Application for Duplicate Grade Card': 'form_duplicate_grade_card',
            'Application for Supplementary Examinations Registration': 'form_supplementary_exam',
            'Application for Repeating Examinations Registration (CIE and ESE)': 'form_repeat_paper',
        };
        const approvalFormTable = approvalFormTableMap[verification?.form_type];
        if (approvalFormTable) {
            try {
                const formDetails = await env.DB.prepare(
                    `SELECT Programme, Semester FROM ${approvalFormTable} WHERE application_id = ?`
                ).bind(id).first();
                if (formDetails) {
                    verification.programme = formDetails.Programme || null;
                    verification.semester = formDetails.Semester || null;
                }
            } catch (e) {
                console.error('Failed to fetch form details for approval page:', e);
            }
        }

        console.log(`Verification query result:`, verification);

        // Send student notification email
        try {
            const frontendUrl = 'https://student-service.pages.dev';
            await sendStudentDecisionEmail(env, verification, action === 'Approve', frontendUrl);
            console.log(`Student notification sent for app ${id}`);

            // If Director approved, notify Admin (COE)
            if (role === 'Director' && action === 'Approve') {
                await sendAdminNotification(env, id, verification.form_type, verification.applicant_name, verification.student_email);
                console.log(`Admin notification sent for Director-approved app ${id}`);
            }
        } catch (emailError) {
            console.error('Failed to send email notifications:', emailError);
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
        <img src="https://student-service.pages.dev/Examinations_Service.png" alt="SSSIHL Examination Services" style="height: 90px; width: auto;">
    </div>

    <div class="glass-card">
        <div class="status-icon">
            ${isApproved ? '✓' : '✗'}
        </div>
        <h1>Application ${isApproved ? 'Approved' : 'Rejected'}</h1>
        <p class="subtitle">Your decision is recorded successfully</p>

        <div class="detail-row">
            <span class="detail-label">Form Type</span>
            <span class="detail-value">${escapeHtml(verification?.form_type || 'N/A')}</span>
        </div>
        <div class="details">
            <div class="detail-row">
                <span class="detail-label">Application ID</span>
                <span class="detail-value">${escapeHtml(id)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Applicant Name</span>
                <span class="detail-value">${escapeHtml(verification?.applicant_name || 'N/A')}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Registered Number</span>
                <span class="detail-value">${escapeHtml(verification?.reg_no || 'N/A')}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Campus</span>
                <span class="detail-value">${escapeHtml(verification?.campus || 'N/A')}</span>
            </div>

            <div class="detail-row">
                <span class="detail-label">Programme</span>
                <span class="detail-value">${escapeHtml(verification?.programme || 'N/A')}</span>
            </div>

            <div class="detail-row">
                <span class="detail-label">Semester</span>
                <span class="detail-value">${escapeHtml(verification?.semester || 'N/A')}</span>
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
            <div class="footer-subtitle">Examination Services</div>
        </div>
    </div>
</body>
</html>`;

        return new Response(html, {
            headers: {
                ...corsHeaders,
                'Content-Type': 'text/html',
                'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src https:;"
            }
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
            `UPDATE applications SET status = 'APPROVED', updated_at = CURRENT_TIMESTAMP WHERE id = ?`
        ).bind(appId).run();

        await sendAdminNotification(env, appId, app.form_type, app.applicant_name, app.student_email);
        await sendStudentConfirmationEmail(env, appId, app.form_type, app.applicant_name, app.student_email, app.campus, null, null);

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
            `SELECT id, student_email, form_type, applicant_name, reg_no, campus, status, director_status, director_comment, controller_status, access_token, created_at, updated_at
             FROM applications WHERE id = ?`
        ).bind(id).first();

        if (!app) {
            return new Response(JSON.stringify({ error: 'Application not found' }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // No token gate on status — applicants may track from any device.
        // Document downloads (/download/:fileId) are still token-protected.

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
            'Application for Supplementary Examinations Registration': 'form_supplementary_exam',
            'Application for Duplicate Degree Certificate': 'form_duplicate_degree',
            'Application for Registration of Student Name change in the Institute Records': 'form_name_change',
            'Application for Repeating Examinations Registration (CIE and ESE)': 'form_repeat_paper',
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
