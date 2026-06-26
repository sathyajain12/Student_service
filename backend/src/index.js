import { getGoogleAuth, sendEmail, createMonthlyBackupSheet } from './google-api';
import { SignJWT, jwtVerify } from 'jose';

const CAMPUS_CONTACTS = {
    'Prasanthi Nilayam Campus': { phone: '08555-287235', email: 'officeofdirector.psn@sssihl.edu.in' },
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
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, PATCH, OPTIONS',
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

async function performMonthlyBackup(env) {
    const tables = [
        'applications', 'form_duplicate_grade_card', 'form_cgpa_conversion',
        'form_supplementary_exam', 'form_duplicate_degree', 'form_name_change',
        'form_repeat_paper', 'form_retotaling', 'form_on_request_degree',
        'form_migration_certificate', 'form_convocation_2026', 'admin_users', 'audit_log', 'form_settings'
    ];
    const data = {};
    for (const table of tables) {
        const result = await env.DB.prepare(`SELECT * FROM ${table}`).all();
        data[table] = result.results || [];
    }
    await createMonthlyBackupSheet(env, data);
    console.log('Monthly backup completed successfully');
}

export default {
    async scheduled(_event, env, ctx) {
        ctx.waitUntil(performMonthlyBackup(env));
    },
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
                if (url.pathname === '/convocation/student-lookup' && request.method === 'GET') {
                    const regNo = url.searchParams.get('regNo')?.trim();
                    if (!regNo) return new Response(JSON.stringify({ found: false }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
                    const student = await env.DB.prepare(
                        'SELECT reg_no, name, email, programme, category, campus FROM convocation_students WHERE reg_no = ?'
                    ).bind(regNo).first();
                    return new Response(JSON.stringify({ found: !!student, ...(student || {}) }), {
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                }

                if (url.pathname === '/submit' && request.method === 'POST') {
                    return await handleSubmission(request, env, corsHeaders);
                }

                if (url.pathname === '/approve' && request.method === 'GET') {
                    return await handleApproval(url, env, corsHeaders);
                }

                if (url.pathname === '/director-comment' && request.method === 'GET') {
                    return await handleDirectorCommentPage(url, env, corsHeaders);
                }

                if (url.pathname === '/campus-exam-review' && request.method === 'GET') {
                    return await handleCampusExamReviewPage(url, env, corsHeaders);
                }

                if (url.pathname === '/campus-exam-action' && request.method === 'POST') {
                    return await handleCampusExamAction(request, env, corsHeaders);
                }

                if (url.pathname === '/campus-exam-upload-letter' && request.method === 'POST') {
                    return await handleCampusExamUploadLetter(request, env, corsHeaders);
                }

                if (url.pathname === '/director-comment' && request.method === 'POST') {
                    return await handleDirectorCommentSubmit(request, env, corsHeaders);
                }

                if (url.pathname === '/director-upload-letter' && request.method === 'POST') {
                    return await handleDirectorUploadLetter(request, env, corsHeaders);
                }

                if (url.pathname === '/director-action' && request.method === 'POST') {
                    return await handleDirectorAction(request, env, corsHeaders);
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

                if (url.pathname === '/admin/test-director-email' && request.method === 'POST') {
                    return await handleTestDirectorEmail(request, env, corsHeaders);
                }

                if (url.pathname === '/admin/test-campus-exam-email' && request.method === 'POST') {
                    return await handleTestCampusExamEmail(request, env, corsHeaders);
                }

                if (url.pathname.startsWith('/admin/application/') && request.method === 'DELETE') {
                    const id = url.pathname.split('/').pop();
                    return await handleArchiveApplication(id, request, env, corsHeaders);
                }

                if (url.pathname === '/admin/archived' && request.method === 'GET') {
                    return await handleGetArchivedApplications(request, env, corsHeaders);
                }

                if (url.pathname.startsWith('/admin/unarchive/') && request.method === 'POST') {
                    const id = url.pathname.split('/').pop();
                    return await handleUnarchiveApplication(id, request, env, corsHeaders);
                }

                if (url.pathname.startsWith('/admin/export-application/') && request.method === 'GET') {
                    const id = url.pathname.split('/').pop();
                    return await handleExportApplication(id, request, env, corsHeaders);
                }

                if (url.pathname === '/admin/export-form-type' && request.method === 'GET') {
                    return await handleExportFormType(url, request, env, corsHeaders);
                }

                if (url.pathname === '/admin/audit-log' && request.method === 'GET') {
                    return await handleGetAuditLog(request, env, corsHeaders);
                }

                if (url.pathname === '/admin/create-user' && request.method === 'POST') {
                    return await handleCreateAdminUser(request, env, corsHeaders);
                }

                if (url.pathname === '/admin/users' && request.method === 'GET') {
                    return await handleListAdminUsers(request, env, corsHeaders);
                }

                if (url.pathname.startsWith('/admin/users/') && request.method === 'DELETE') {
                    const userId = url.pathname.split('/').pop();
                    return await handleDeleteAdminUser(userId, request, env, corsHeaders);
                }

                if (url.pathname.startsWith('/admin/application/') && request.method === 'PATCH') {
                    const id = url.pathname.split('/').pop();
                    return await handleUpdateApplication(id, request, env, corsHeaders);
                }

                // Convocation Admin routes
                if (url.pathname === '/convocation-admin/login' && request.method === 'POST') {
                    return await handleConvocationAdminLogin(request, env, corsHeaders);
                }
                if (url.pathname === '/convocation-admin/applications' && request.method === 'GET') {
                    return await handleConvocationGetApplications(request, env, corsHeaders);
                }
                if (url.pathname.startsWith('/convocation-admin/application/') && request.method === 'GET') {
                    const id = url.pathname.split('/').pop();
                    return await handleConvocationGetApplication(id, request, env, corsHeaders);
                }
                if (url.pathname.startsWith('/convocation-admin/application/') && request.method === 'PATCH') {
                    const id = url.pathname.split('/').pop();
                    return await handleConvocationUpdateStatus(id, request, env, corsHeaders);
                }
                if (url.pathname === '/convocation-admin/upload-response' && request.method === 'POST') {
                    return await handleConvocationUploadResponse(request, env, corsHeaders);
                }
                if (url.pathname === '/convocation-admin/notify' && request.method === 'POST') {
                    return await handleConvocationNotify(request, env, corsHeaders);
                }
                if (url.pathname === '/convocation-admin/export' && request.method === 'GET') {
                    return await handleConvocationExport(request, env, corsHeaders);
                }
                if (url.pathname.startsWith('/convocation-admin/file/') && request.method === 'GET') {
                    const fileId = url.pathname.split('/').pop();
                    return await handleConvocationGetFile(fileId, request, env, corsHeaders);
                }
                if (url.pathname === '/convocation-admin/create-user' && request.method === 'POST') {
                    return await handleCreateConvocationAdminUser(request, env, corsHeaders);
                }
                if (url.pathname === '/convocation-admin/stats' && request.method === 'GET') {
                    return await handleConvocationStats(request, env, corsHeaders);
                }
                if (url.pathname === '/convocation-admin/toggle-form' && request.method === 'POST') {
                    return await handleConvocationToggleForm(request, env, corsHeaders);
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

async function logAuditEvent(env, adminUsername, action, applicationId = null, details = null) {
    try {
        await env.DB.prepare(
            `INSERT INTO audit_log (admin_username, action, application_id, details) VALUES (?, ?, ?, ?)`
        ).bind(adminUsername, action, applicationId ?? null, details ? JSON.stringify(details) : null).run();
    } catch (e) {
        console.error('Audit log write failed:', e);
    }
}

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
    const role = admin.role || 'admin';
    const secret = new TextEncoder().encode(env.JWT_SECRET);
    const token = await new SignJWT({ username, role })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(secret);

    await logAuditEvent(env, username, 'LOGIN', null, { username });

    return new Response(JSON.stringify({ success: true, token, username: admin.username, role }), {
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

    const role = admin.role || 'admin';
    const phd_forms = `('Application for On-Request Degree Certificate', 'Application for Migration Certificate')`;

    let roleFilter = '';
    if (role === 'ug') {
        roleFilter = `WHERE programme LIKE 'Bachelor%' AND programme != 'Bachelor of Education'
                      AND form_type NOT IN ${phd_forms}`;
    } else if (role === 'pg') {
        roleFilter = `WHERE (programme LIKE 'Master%' OR programme = 'Bachelor of Education')
                      AND form_type NOT IN ${phd_forms}`;
    } else if (role === 'phd') {
        roleFilter = `WHERE form_type IN ${phd_forms}`;
    }

    const applications = await env.DB.prepare(
        `SELECT id, student_email, form_type, applicant_name, reg_no, campus, programme, status,
                director_status, controller_status, created_at, updated_at
         FROM applications ${roleFilter} ORDER BY created_at DESC`
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
        'SSSIHL - XLV Annual Convocation November 2026 - Registration Form': 'form_convocation_2026',
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

    // Fetch stage timestamps from audit log for supplementary/repeat exam applications
    let stageTimestamps = null;
    const isExamRegistration = application.form_type === 'Application for Supplementary Examinations Registration'
        || application.form_type === 'Application for Repeating Examinations Registration (CIE and ESE)';
    if (isExamRegistration) {
        const auditRows = await env.DB.prepare(
            `SELECT action, created_at FROM audit_log WHERE application_id = ? ORDER BY created_at ASC`
        ).bind(id).all();
        const entries = auditRows.results || [];
        const find = (action) => entries.find(e => e.action === action)?.created_at || null;
        stageTimestamps = {
            campusForwardedAt: find('FORWARDED_TO_DIRECTOR'),
            directorApprovedAt: find('APPROVED'),
            coeSubmittedAt: entries.filter(e => e.action === 'APPROVED').slice(-1)[0]?.created_at || null,
        };
        // If director approved and student submitted to COE separately, the last APPROVED is COE submission
        // and the first APPROVED is director approval
        const approvedEntries = entries.filter(e => e.action === 'APPROVED');
        if (approvedEntries.length >= 2) {
            stageTimestamps.directorApprovedAt = approvedEntries[0].created_at;
            stageTimestamps.coeSubmittedAt = approvedEntries[approvedEntries.length - 1].created_at;
        } else if (approvedEntries.length === 1) {
            stageTimestamps.directorApprovedAt = approvedEntries[0].created_at;
            stageTimestamps.coeSubmittedAt = null;
        }
    }

    return new Response(JSON.stringify({
        application,
        formData,
        files: studentFiles.results,
        responseDocuments: responseFiles.results,
        stageTimestamps
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
            'Content-Disposition': `inline; filename="${safeFilename}"`
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

    const role = admin.role || 'admin';
    const phd_forms = `('Application for On-Request Degree Certificate', 'Application for Migration Certificate')`;
    let roleWhere = '';
    if (role === 'ug') {
        roleWhere = `programme LIKE 'Bachelor%' AND programme != 'Bachelor of Education' AND form_type NOT IN ${phd_forms}`;
    } else if (role === 'pg') {
        roleWhere = `(programme LIKE 'Master%' OR programme = 'Bachelor of Education') AND form_type NOT IN ${phd_forms}`;
    } else if (role === 'phd') {
        roleWhere = `form_type IN ${phd_forms}`;
    }

    const w = roleWhere ? `WHERE ${roleWhere}` : '';
    const ws = roleWhere ? `WHERE ${roleWhere} AND` : 'WHERE';

    const total            = await env.DB.prepare(`SELECT COUNT(*) as count FROM applications ${w}`).first();
    const pending          = await env.DB.prepare(`SELECT COUNT(*) as count FROM applications ${ws} status = 'PENDING'`).first();
    const approved         = await env.DB.prepare(`SELECT COUNT(*) as count FROM applications ${ws} status IN ('APPROVED', 'DIRECTOR_APPROVED')`).first();
    const dispatched       = await env.DB.prepare(`SELECT COUNT(*) as count FROM applications ${ws} status = 'DISPATCHED'`).first();
    const completed        = await env.DB.prepare(`SELECT COUNT(*) as count FROM applications ${ws} status = 'COMPLETED'`).first();
    const rejected         = await env.DB.prepare(`SELECT COUNT(*) as count FROM applications ${ws} status = 'REJECTED'`).first();
    const awaitingCampusExam = await env.DB.prepare(`SELECT COUNT(*) as count FROM applications ${ws} status = 'AWAITING_CAMPUS_EXAM'`).first();

    const byFormType = await env.DB.prepare(
        `SELECT form_type, COUNT(*) as count FROM applications ${w} GROUP BY form_type`
    ).all();

    return new Response(JSON.stringify({
        total: total.count,
        pending: pending.count,
        approved: approved.count,
        dispatched: dispatched.count,
        completed: completed.count,
        rejected: rejected.count,
        awaitingCampusExam: awaitingCampusExam.count,
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

        await logAuditEvent(env, admin.username, 'COMPLETED', applicationId);

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

        await logAuditEvent(env, admin.username, 'HOLD_RESOLVED', applicationId);

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

async function sendDocumentDispatchedEmail(env, application, programme = null, trackingNumber = null, digilockerUrl = null, deliveryPreference = null, downloadLinks = [], isFollowUp = false) {
    if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_REFRESH_TOKEN) {
        try {
            const accessToken = await getGoogleAuth(env);
            const isMigration = application.form_type === 'Application for Migration Certificate';
            const isExamRegistration = application.form_type === 'Application for Supplementary Examinations Registration'
                || application.form_type === 'Application for Repeating Examinations Registration (CIE and ESE)';
            const hasSoftCopy = !isMigration && !isExamRegistration && downloadLinks.length > 0 && !trackingNumber;
            const actionWord = isMigration ? 'Uploaded' : hasSoftCopy ? 'Ready' : 'Dispatched';
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
            } else if (isExamRegistration) {
                content = 'Your application has been processed and your exam registration has been confirmed by the Office of the Controller of Examinations, SSSIHL.';
            } else if (hasSoftCopy) {
                const softCopyMessages = {
                    'Application for CGPA to Percentage Conversion': 'Your CGPA to Percentage Conversion certificate is now ready for download. Please click the button below to download your document from the portal.',
                    'Application for Duplicate Grade Card': 'Your duplicate grade card is now ready for download. Please click the button below to download your document from the portal.',
                    'Application for Duplicate Degree Certificate': 'Your duplicate degree certificate is now ready for download. Please click the button below to download your document from the portal.',
                    'Application for On-Request Degree Certificate': 'Your on-request degree certificate is now ready for download. Please click the button below to download your document from the portal.',
                    'Application for Re-Totalling of Marks': 'Your re-totalling result document is now ready for download. Please click the button below to download your document from the portal.',
                    'Application for Registration of Student Name change in the Institute Records': 'Your name change confirmation document is now ready for download. Please click the button below to download your document from the portal.',
                };
                content = softCopyMessages[application.form_type] || 'Your document is now ready for download. Please click the button below to download your document from the portal.';
            } else if (isFollowUp) {
                content = 'Your document has been dispatched from the Office of the Controller of Examinations, SSSIHL. Please collect or expect to receive your document shortly.';
            } else {
                content = 'Your application has been processed and your document has been dispatched from the Office of the Controller of Examinations, SSSIHL. Please collect or expect to receive your document shortly.';
            }
            const emailTitle = isExamRegistration ? 'Application Processed' : `Document ${actionWord}`;
            const htmlBody = renderEmailTemplate({
                title: emailTitle,
                greeting: `Sai Ram!<br><br>Dear ${escapeHtml(application.applicant_name)},`,
                content,
                details: [
                    { label: 'Form Type', value: escapeHtml(application.form_type) },
                    { label: 'Application ID', value: escapeHtml(application.id) },
                    { label: 'Registered Number', value: escapeHtml(application.reg_no || 'N/A') },
                    { label: 'Campus', value: escapeHtml(application.campus) },
                    ...(programme ? [{ label: 'Programme', value: escapeHtml(programme) }] : []),
                    ...(appliedOn ? [{ label: 'Applied On', value: appliedOn }] : []),
                    { label: isExamRegistration ? 'Processed On' : `${actionWord} On`, value: processedOn },
                    ...(trackingNumber ? [{ label: 'Postal Tracking Number', value: escapeHtml(trackingNumber) }] : [])
                ],
                importantNote,
                ...(downloadLinks.length > 0 ? { actionButtons: downloadLinks.map(dl => ({ label: dl.label, link: dl.url })) } : {})
            });

            await sendEmail(accessToken, {
                to: application.student_email,
                subject: isExamRegistration ? `Application Processed : ${application.form_type} (${application.id})` : `Document ${actionWord} : ${application.form_type} (${application.id})`,
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

        if (!['COMPLETED', 'DISPATCHED'].includes(application.status)) {
            return new Response(JSON.stringify({ error: 'Application must be in COMPLETED or DISPATCHED status to notify' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
        const isFollowUp = application.status === 'DISPATCHED';

        // Fetch programme from form-specific table if available
        const dispatchFormTableMap = {
            'Application for Duplicate Grade Card': 'form_duplicate_grade_card',
            'Application for Supplementary Examinations Registration': 'form_supplementary_exam',
            'Application for Repeating Examinations Registration (CIE and ESE)': 'form_repeat_paper',
            'Application for Duplicate Degree Certificate': 'form_duplicate_degree',
            'Application for CGPA to Percentage Conversion': 'form_cgpa_conversion',
            'Application for Re-Totalling of Marks': 'form_retotaling',
            'Application for On-Request Degree Certificate': 'form_on_request_degree',
            'Application for Registration of Student Name change in the Institute Records': 'form_name_change',
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
            downloadLinks = [{ label: 'Track Application', url: `https://sssihl-student-service.pages.dev/#track=${applicationId}` }];
        } else {
            downloadLinks = (responseDocsResult.results || []).map(doc => ({
                label: `Download ${doc.file_name}`,
                url: `${backendUrl}/download/${doc.id}?appId=${applicationId}${application.access_token ? `&token=${application.access_token}` : ''}`
            }));
        }

        await sendDocumentDispatchedEmail(env, application, programme, trackingNumber || null, digilockerUrl, deliveryPreference, downloadLinks, isFollowUp);

        await env.DB.prepare(
            `UPDATE applications SET status = 'DISPATCHED', updated_at = CURRENT_TIMESTAMP WHERE id = ?`
        ).bind(applicationId).run();

        await logAuditEvent(env, admin.username, 'DISPATCHED', applicationId, { trackingNumber: trackingNumber || null });

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

        await logAuditEvent(env, admin.username, 'RESPONSE_UPLOADED', applicationId, { fileName: file.name });

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

async function handleExportApplication(id, request, env, corsHeaders) {
    const admin = await verifyAdminToken(request, env);
    if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const application = await env.DB.prepare(
        `SELECT id, student_email, form_type, applicant_name, reg_no, abc_apaar_id, campus, status,
                director_status, controller_status, programme, director_comment, created_at, updated_at
         FROM applications WHERE id = ?`
    ).bind(id).first();

    if (!application) return new Response(JSON.stringify({ error: 'Application not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

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
        'SSSIHL - XLV Annual Convocation November 2026 - Registration Form': 'form_convocation_2026',
    };

    let formData = null;
    const formTable = formTableMap[application.form_type];
    if (formTable) {
        try {
            const raw = await env.DB.prepare(`SELECT * FROM ${formTable} WHERE application_id = ?`).bind(id).first();
            if (raw) {
                // Strip large/binary fields
                formData = Object.fromEntries(Object.entries(raw).filter(([k]) => !k.endsWith('_file') && k !== 'application_id'));
            }
        } catch (e) { /* non-critical */ }
    }

    return new Response(JSON.stringify({ application, formData: formData || {} }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function handleExportFormType(url, request, env, corsHeaders) {
    const admin = await verifyAdminToken(request, env);
    if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const formType = url.searchParams.get('formType');
    if (!formType) return new Response(JSON.stringify({ error: 'formType is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

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
        'SSSIHL - XLV Annual Convocation November 2026 - Registration Form': 'form_convocation_2026',
    };

    const formTable = formTableMap[formType];

    let rows;
    if (formTable) {
        // Single LEFT JOIN query — avoids D1 binding-limit issues with large IN clauses
        const result = await env.DB.prepare(
            `SELECT a.id, a.student_email, a.form_type, a.applicant_name, a.reg_no, a.abc_apaar_id,
                    a.campus, a.status, a.director_status, a.controller_status, a.programme,
                    a.director_comment, a.created_at, a.updated_at,
                    f.student_name, f.Registration_Number, f.paper_codes, f.paper_titles,
                    f.Semester, f.Period_of_Study, f.Programme AS form_programme,
                    f.Mobile_Number, f.address_line1, f.city, f.state_province, f.country, f.postal_code
             FROM applications a
             LEFT JOIN ${formTable} f ON f.application_id = a.id
             WHERE a.form_type = ?`
        ).bind(formType).all();
        rows = (result.results || []).map(r => { delete r.file_data; return r; });
    } else {
        const result = await env.DB.prepare(
            `SELECT id, student_email, form_type, applicant_name, reg_no, abc_apaar_id, campus, status,
                    director_status, controller_status, programme, director_comment, created_at, updated_at
             FROM applications WHERE form_type = ?`
        ).bind(formType).all();
        rows = result.results || [];
    }

    if (rows.length === 0) {
        return new Response(JSON.stringify({ rows: [] }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ rows }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

// Handler to list all archived applications
async function handleGetArchivedApplications(request, env, corsHeaders) {
    const admin = await verifyAdminToken(request, env);
    if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const rows = await env.DB.prepare(
        `SELECT id, student_email, form_type, applicant_name, reg_no, campus, status, programme, archived_by, created_at, updated_at
         FROM archived_applications ORDER BY updated_at DESC`
    ).all();

    return new Response(JSON.stringify({ archived: rows.results }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

// Handler to restore an archived application back to active applications
async function handleUnarchiveApplication(id, request, env, corsHeaders) {
    const admin = await verifyAdminToken(request, env);
    if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    try {
        const archived = await env.DB.prepare(
            `SELECT id, student_email, form_type, applicant_name, reg_no, abc_apaar_id, campus, status,
                    director_status, controller_status, programme, director_comment, access_token,
                    created_at, updated_at, form_data_json
             FROM archived_applications WHERE id = ?`
        ).bind(id).first();

        if (!archived) return new Response(JSON.stringify({ error: 'Archived application not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

        // Restore to applications table
        await env.DB.prepare(
            `INSERT OR REPLACE INTO applications
               (id, student_email, form_type, applicant_name, reg_no, abc_apaar_id, campus, status,
                director_status, controller_status, programme, director_comment, access_token, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
            archived.id, archived.student_email, archived.form_type, archived.applicant_name,
            archived.reg_no, archived.abc_apaar_id, archived.campus, archived.status,
            archived.director_status, archived.controller_status, archived.programme,
            archived.director_comment, archived.access_token, archived.created_at, archived.updated_at
        ).run();

        // Restore form-specific data if available
        if (archived.form_data_json) {
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
            const formTable = formTableMap[archived.form_type];
            if (formTable) {
                try {
                    const fd = JSON.parse(archived.form_data_json);
                    const keys = Object.keys(fd).filter(k => k !== 'id');
                    const cols = ['application_id', ...keys].join(', ');
                    const placeholders = ['?', ...keys.map(() => '?')].join(', ');
                    const vals = [archived.id, ...keys.map(k => fd[k])];
                    await env.DB.prepare(`INSERT OR REPLACE INTO ${formTable} (${cols}) VALUES (${placeholders})`).bind(...vals).run();
                } catch (e) { console.error('Failed to restore form-specific data:', e); }
            }
        }

        // Remove from archived_applications
        await env.DB.prepare('DELETE FROM archived_applications WHERE id = ?').bind(id).run();

        await logAuditEvent(env, admin.username, 'UNARCHIVED', id, { form_type: archived.form_type });

        return new Response(JSON.stringify({ success: true, message: `Application ${id} restored successfully` }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } catch (error) {
        console.error('Unarchive error:', error);
        return new Response(JSON.stringify({ error: 'Failed to restore application' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
}

// Handler for archiving an application — moves data to archived_applications, keeps file_blobs
async function handleArchiveApplication(id, request, env, corsHeaders) {
    const admin = await verifyAdminToken(request, env);
    if (!admin) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    try {
        const application = await env.DB.prepare(
            `SELECT id, student_email, form_type, applicant_name, reg_no, abc_apaar_id, campus, status,
                    director_status, controller_status, programme, director_comment, access_token, created_at, updated_at
             FROM applications WHERE id = ?`
        ).bind(id).first();

        if (!application) {
            return new Response(JSON.stringify({ error: 'Application not found' }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

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
            'SSSIHL - XLV Annual Convocation November 2026 - Registration Form': 'form_convocation_2026',
        };

        // Fetch and preserve form-specific data as JSON
        let formDataJson = null;
        const formTable = formTableMap[application.form_type];
        if (formTable) {
            try {
                const fd = await env.DB.prepare(`SELECT * FROM ${formTable} WHERE application_id = ?`).bind(id).first();
                if (fd) formDataJson = JSON.stringify(fd);
            } catch (e) { /* non-critical */ }
        }

        // Insert into archived_applications (replace if already archived to avoid UNIQUE constraint error)
        await env.DB.prepare(
            `INSERT OR REPLACE INTO archived_applications
               (id, student_email, form_type, applicant_name, reg_no, abc_apaar_id, campus, status,
                director_status, controller_status, programme, director_comment, access_token,
                created_at, updated_at, archived_by, form_data_json)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
            application.id, application.student_email, application.form_type, application.applicant_name,
            application.reg_no, application.abc_apaar_id, application.campus, application.status,
            application.director_status, application.controller_status, application.programme,
            application.director_comment, application.access_token, application.created_at,
            application.updated_at, admin.username, formDataJson
        ).run();

        // Remove from form-specific table
        if (formTable) {
            await env.DB.prepare(`DELETE FROM ${formTable} WHERE application_id = ?`).bind(id).run();
        }

        // Remove all child rows (FK references to applications) before deleting parent
        await env.DB.prepare('DELETE FROM file_blobs WHERE application_id = ?').bind(id).run();
        await env.DB.prepare('DELETE FROM file_attachments WHERE application_id = ?').bind(id).run();
        await env.DB.prepare('DELETE FROM applications WHERE id = ?').bind(id).run();

        await logAuditEvent(env, admin.username, 'ARCHIVED', id, { form_type: application.form_type });

        console.log(`Application ${id} archived by admin ${admin.username}`);

        return new Response(JSON.stringify({ success: true, message: `Application ${id} archived successfully` }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error archiving application:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

async function handleUpdateApplication(id, request, env, corsHeaders) {
    const admin = await verifyAdminToken(request, env);
    if (!admin) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
    try {
        const application = await env.DB.prepare(
            'SELECT id, form_type FROM applications WHERE id = ?'
        ).bind(id).first();
        if (!application) {
            return new Response(JSON.stringify({ error: 'Application not found' }), {
                status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const body = await request.json();
        const { applicationFields = {}, formFields = {} } = body;

        const ALLOWED_APP_COLS = new Set(['applicant_name', 'reg_no', 'campus', 'programme', 'abc_apaar_id']);
        const appEntries = Object.entries(applicationFields).filter(([k]) => ALLOWED_APP_COLS.has(k));
        if (appEntries.length > 0) {
            const setClauses = appEntries.map(([k]) => `${k} = ?`).join(', ');
            await env.DB.prepare(
                `UPDATE applications SET ${setClauses}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
            ).bind(...appEntries.map(([, v]) => v), id).run();
        }

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
        const formTable = formTableMap[application.form_type];
        const formEntries = Object.entries(formFields);
        if (formTable && formEntries.length > 0) {
            const setClauses = formEntries.map(([k]) => `${k} = ?`).join(', ');
            await env.DB.prepare(
                `UPDATE ${formTable} SET ${setClauses} WHERE application_id = ?`
            ).bind(...formEntries.map(([, v]) => v), id).run();
        }

        await logAuditEvent(env, admin.username, 'EDITED', id, {
            applicationFields: Object.keys(applicationFields),
            formFields: Object.keys(formFields)
        });

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error updating application:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
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
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
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
    await logAuditEvent(env, admin.username, 'FORM_TOGGLED', null, { formId, isActive });
    return new Response(JSON.stringify({ success: true, formId, isActive }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function handleGetAuditLog(request, env, corsHeaders) {
    const admin = await verifyAdminToken(request, env);
    if (!admin) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
    const url = new URL(request.url);
    const actionFilter = url.searchParams.get('action') || null;
    let query = `SELECT id, created_at, admin_username, action, application_id, details FROM audit_log`;
    const bindings = [];
    if (actionFilter) {
        query += ` WHERE action = ?`;
        bindings.push(actionFilter);
    }
    query += ` ORDER BY id DESC LIMIT 100`;
    const result = bindings.length > 0
        ? await env.DB.prepare(query).bind(...bindings).all()
        : await env.DB.prepare(query).all();
    return new Response(JSON.stringify(result.results), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function handleCreateAdminUser(request, env, corsHeaders) {
    const admin = await verifyAdminToken(request, env);
    if (!admin || (admin.role || 'admin') !== 'admin') {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
    const { username, password, role } = await request.json();
    if (!username || !password || !role) {
        return new Response(JSON.stringify({ error: 'username, password, and role are required' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
    const validRoles = ['admin', 'ug', 'pg', 'phd'];
    if (!validRoles.includes(role)) {
        return new Response(JSON.stringify({ error: `role must be one of: ${validRoles.join(', ')}` }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
    const existing = await env.DB.prepare('SELECT id FROM admin_users WHERE username = ?').bind(username).first();
    if (existing) {
        return new Response(JSON.stringify({ error: 'Username already exists' }), {
            status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
    const { salt, hash } = await hashPassword(password);
    await env.DB.prepare(
        'INSERT INTO admin_users (username, password_hash, salt, email, role) VALUES (?, ?, ?, ?, ?)'
    ).bind(username, hash, salt, '', role).run();
    await logAuditEvent(env, admin.username, 'CREATE_USER', null, { created_username: username, role });
    return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function handleListAdminUsers(request, env, corsHeaders) {
    const admin = await verifyAdminToken(request, env);
    if (!admin || (admin.role || 'admin') !== 'admin') {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
    const result = await env.DB.prepare(
        'SELECT id, username, email, role, created_at FROM admin_users ORDER BY created_at ASC'
    ).all();
    return new Response(JSON.stringify(result.results), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function handleDeleteAdminUser(userId, request, env, corsHeaders) {
    const admin = await verifyAdminToken(request, env);
    if (!admin || (admin.role || 'admin') !== 'admin') {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
    const target = await env.DB.prepare('SELECT username FROM admin_users WHERE id = ?').bind(userId).first();
    if (!target) {
        return new Response(JSON.stringify({ error: 'User not found' }), {
            status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
    if (target.username === admin.username) {
        return new Response(JSON.stringify({ error: 'Cannot delete your own account' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
    await env.DB.prepare('DELETE FROM admin_users WHERE id = ?').bind(userId).run();
    await logAuditEvent(env, admin.username, 'DELETE_USER', null, { deleted_username: target.username });
    return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

// ─── Convocation Admin Portal handlers ───────────────────────────────────────

const CONV_FORM_TYPE = 'SSSIHL - XLV Annual Convocation November 2026 - Registration Form';

async function verifyConvocationToken(request, env) {
    const authHeader = request.headers.get('Authorization');
    const url = new URL(request.url);
    const token = (authHeader && authHeader.startsWith('Bearer '))
        ? authHeader.substring(7)
        : url.searchParams.get('token');
    if (!token) return null;
    try {
        const secret = new TextEncoder().encode(env.CONV_JWT_SECRET || env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        if (payload.portal !== 'convocation') return null;
        const admin = await env.DB.prepare(
            'SELECT * FROM convocation_admin_users WHERE username = ?'
        ).bind(payload.username).first();
        return admin || null;
    } catch (e) {
        return null;
    }
}

async function handleConvocationAdminLogin(request, env, corsHeaders) {
    const { username, password } = await request.json();
    const admin = await env.DB.prepare(
        'SELECT * FROM convocation_admin_users WHERE username = ?'
    ).bind(username).first();
    if (!admin || !admin.salt) {
        return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
            status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
    const valid = await verifyPassword(password, admin.salt, admin.password_hash);
    if (!valid) {
        return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
            status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
    const secret = new TextEncoder().encode(env.CONV_JWT_SECRET || env.JWT_SECRET);
    const token = await new SignJWT({ username, portal: 'convocation' })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(secret);
    await logAuditEvent(env, username, 'CONV_LOGIN', null, { username });
    return new Response(JSON.stringify({ success: true, token, username: admin.username }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function handleConvocationGetApplications(request, env, corsHeaders) {
    const admin = await verifyConvocationToken(request, env);
    if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const apps = await env.DB.prepare(
        `SELECT a.id, a.student_email, a.applicant_name, a.reg_no, a.campus, a.status, a.created_at, a.updated_at,
                f.category, f.programme, f.attendance_type, f.active_mobile
         FROM applications a
         LEFT JOIN form_convocation_2026 f ON a.id = f.application_id
         WHERE a.form_type = ?
         UNION ALL
         SELECT ar.id, ar.student_email, ar.applicant_name, ar.reg_no, ar.campus, 'ARCHIVED' as status, ar.created_at, ar.archived_at as updated_at,
                f.category, f.programme, f.attendance_type, f.active_mobile
         FROM archived_applications ar
         LEFT JOIN form_convocation_2026 f ON ar.id = f.application_id
         WHERE ar.form_type = ?
         ORDER BY created_at DESC`
    ).bind(CONV_FORM_TYPE, CONV_FORM_TYPE).all();

    return new Response(JSON.stringify(apps.results), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function handleConvocationGetApplication(id, request, env, corsHeaders) {
    const admin = await verifyConvocationToken(request, env);
    if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    let application = await env.DB.prepare('SELECT * FROM applications WHERE id = ? AND form_type = ?').bind(id, CONV_FORM_TYPE).first();
    if (!application) {
        const archived = await env.DB.prepare('SELECT * FROM archived_applications WHERE id = ? AND form_type = ?').bind(id, CONV_FORM_TYPE).first();
        if (archived) application = { ...archived, status: 'ARCHIVED' };
    }
    if (!application) return new Response(JSON.stringify({ error: 'Application not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const formDetails = await env.DB.prepare('SELECT * FROM form_convocation_2026 WHERE application_id = ?').bind(id).first();

    const files = await env.DB.prepare(
        `SELECT id, field_name, file_name, file_type, file_size, is_response, uploaded_by, created_at
         FROM file_blobs WHERE application_id = ? ORDER BY created_at ASC`
    ).bind(id).all();

    return new Response(JSON.stringify({ ...application, formDetails: formDetails || {}, files: files.results }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function handleConvocationUpdateStatus(id, request, env, corsHeaders) {
    const admin = await verifyConvocationToken(request, env);
    if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { status, reason } = await request.json();
    const allowed = ['APPROVED', 'REJECTED', 'PENDING', 'ARCHIVED'];
    if (!allowed.includes(status)) {
        return new Response(JSON.stringify({ error: 'Invalid status' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Check if app is in the live table or the archived table
    const liveApp = await env.DB.prepare(
        `SELECT a.id, a.student_email, a.applicant_name, a.campus, a.reg_no, a.form_type,
                f.category, f.programme, f.attendance_type
         FROM applications a
         LEFT JOIN form_convocation_2026 f ON a.id = f.application_id
         WHERE a.id = ? AND a.form_type = ?`
    ).bind(id, CONV_FORM_TYPE).first();

    const archivedApp = !liveApp
        ? await env.DB.prepare('SELECT * FROM archived_applications WHERE id = ? AND form_type = ?').bind(id, CONV_FORM_TYPE).first()
        : null;

    const app = liveApp || archivedApp;
    if (!app) return new Response(JSON.stringify({ error: 'Application not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    try {
        if (status === 'ARCHIVED' && liveApp) {
            // Fetch full row from applications
            const fullRow = await env.DB.prepare('SELECT * FROM applications WHERE id = ?').bind(id).first();
            // Preserve form-specific data as JSON before deleting
            let formDataJson = null;
            try {
                const fd = await env.DB.prepare('SELECT * FROM form_convocation_2026 WHERE application_id = ?').bind(id).first();
                if (fd) formDataJson = JSON.stringify(fd);
            } catch (e) { /* non-critical */ }
            // Insert into archived_applications
            await env.DB.prepare(
                `INSERT OR REPLACE INTO archived_applications
                 (id, form_type, student_email, applicant_name, campus, reg_no, status, created_at, archived_by, form_data_json)
                 VALUES (?, ?, ?, ?, ?, ?, 'ARCHIVED', ?, ?, ?)`
            ).bind(fullRow.id, fullRow.form_type, fullRow.student_email, fullRow.applicant_name,
                   fullRow.campus, fullRow.reg_no, fullRow.created_at, admin.username, formDataJson).run();
            // Delete child rows before deleting parent (FK constraint order)
            await env.DB.prepare('DELETE FROM form_convocation_2026 WHERE application_id = ?').bind(id).run();
            await env.DB.prepare('DELETE FROM file_blobs WHERE application_id = ?').bind(id).run();
            await env.DB.prepare('DELETE FROM applications WHERE id = ?').bind(id).run();
        } else if (status !== 'ARCHIVED' && archivedApp) {
            // Restore from archived_applications → applications
            await env.DB.prepare(
                `INSERT INTO applications (id, form_type, student_email, applicant_name, campus, reg_no, status, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
            ).bind(archivedApp.id, archivedApp.form_type, archivedApp.student_email, archivedApp.applicant_name,
                   archivedApp.campus, archivedApp.reg_no, status, archivedApp.created_at).run();
            // Restore form-specific data if preserved
            if (archivedApp.form_data_json) {
                try {
                    const fd = JSON.parse(archivedApp.form_data_json);
                    const cols = Object.keys(fd).join(', ');
                    const placeholders = Object.keys(fd).map(() => '?').join(', ');
                    const vals = Object.values(fd);
                    await env.DB.prepare(`INSERT OR IGNORE INTO form_convocation_2026 (${cols}) VALUES (${placeholders})`).bind(...vals).run();
                } catch (e) { console.error('Failed to restore form data:', e); }
            }
            await env.DB.prepare('DELETE FROM archived_applications WHERE id = ?').bind(id).run();
        } else if (liveApp) {
            await env.DB.prepare('UPDATE applications SET status = ?, updated_at = datetime(\'now\') WHERE id = ?').bind(status, id).run();
        }
    } catch (dbErr) {
        console.error('Archive/status update error:', dbErr);
        return new Response(JSON.stringify({ error: dbErr.message || 'Database error' }), {
            status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    await logAuditEvent(env, admin.username, `CONV_${status}`, id, { reason: reason || null });

    if (status === 'APPROVED' || status === 'REJECTED') {
        await sendConvocationStatusEmail(env, app, status, reason || null);
    }

    return new Response(JSON.stringify({ success: true, status }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function sendConvocationStatusEmail(env, app, status, reason) {
    try {
        const accessToken = await getGoogleAuth(env);
        const changedOn = new Date().toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Asia/Kolkata' });
        const appId = escapeHtml(app.id);

        let htmlBody;
        let subject;

        if (status === 'APPROVED') {
            subject = `Annual Convocation 2026 - Your Application has been Accepted`;
            htmlBody = renderEmailTemplate({
                title: 'Annual Convocation 2026 — Registration Confirmed',
                greeting: `Dear ${escapeHtml(app.applicant_name)},<br><br>Sairam!<br><br>Greetings from the Examination Section, SSSIHL.`,
                content: `
                    <p style="margin:0 0 14px 0;">This is to inform you that your Application Form for Admission to the Annual Convocation 2026 is found to be complete in all aspects.</p>
                    <p style="margin:0 0 14px 0;">The list of the registered candidates for the Annual Convocation 2026 (both in-person and in-absentia) and a common circular giving all details of the Convocation for the registrants, will be uploaded on our Institute website <a href="https://www.sssihl.edu.in" style="color:#2563eb;text-decoration:none;">www.sssihl.edu.in</a> in the first week of November 2026.</p>
                    <p style="margin:0 0 14px 0;">You are therefore required to refer to the above list (when it is uploaded), to ascertain about your registration for the Convocation and refer to the circular for other details.</p>
                    <p style="margin:0;"><strong>No individual circular will be sent to the registered candidates.</strong></p>
                `,
                details: [],
                importantNote: `
                    <p style="margin:0 0 4px 0;">Warm regards</p>
                    <p style="margin:0 0 12px 0;"><strong>P. Chandra Sekhar</strong><br>
                    Deputy Manager (Examinations)<br>
                    Office of the Controller of Examinations<br>
                    Sri Sathya Sai Institute of Higher Learning (Deemed to be University)<br>
                    Prasanthi Nilayam - 515 134, Sri Sathya Sai District, Andhra Pradesh, India<br>
                    <a href="https://www.sssihl.edu.in" style="color:#2563eb;text-decoration:none;">www.sssihl.edu.in</a> &nbsp;Ph: 08555 - 287191</p>
                `,
                actionButtons: [],
            });
        } else {
            subject = `Convocation Application - Action Required - ${app.id}`;
            const reasonBlock = reason
                ? `<div style="margin:16px 0 0 0;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:14px;">
                       <p style="margin:0 0 4px 0;font-weight:700;color:#991b1b;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;">Reason for Non-Approval</p>
                       <p style="margin:0;color:#7f1d1d;font-size:15px;">${escapeHtml(reason)}</p>
                   </div>`
                : '';
            htmlBody = renderEmailTemplate({
                title: 'Application Not Approved',
                greeting: `Dear ${escapeHtml(app.applicant_name)},<br><br>Sairam!<br><br>Greetings from the Examinations Section, SSSIHL.`,
                content: `We regret to inform you that your convocation registration could not be approved at this time. Please review the details below and contact us if you have any questions.${reasonBlock}`,
                details: [
                    { label: 'Application ID', value: appId },
                    { label: 'Applicant Name', value: escapeHtml(app.applicant_name) },
                    { label: 'Category', value: escapeHtml(app.category || 'N/A') },
                    { label: 'Campus', value: escapeHtml(app.campus || 'N/A') },
                    { label: 'Status', value: '<span style="color:#dc2626;font-weight:700;">NOT APPROVED</span>' },
                    { label: 'Reviewed On', value: changedOn },
                ],
                importantNote: `<p style="margin:0;">For queries, please contact: <a href="mailto:coeoffice@sssihl.edu.in" style="color:#2563eb;text-decoration:none;">coeoffice@sssihl.edu.in</a></p>`,
                actionButtons: [],
            });
        }

        await sendEmail(accessToken, { to: app.student_email, subject, htmlBody });
        console.log(`Convocation status email sent (${status}) for app ${app.id}`);
    } catch (e) {
        console.error('Failed to send convocation status email:', e);
    }
}

async function handleConvocationUploadResponse(request, env, corsHeaders) {
    const admin = await verifyConvocationToken(request, env);
    if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const formData = await request.formData();
    const applicationId = formData.get('applicationId');
    const file = formData.get('responseDocument');
    if (!applicationId || !file) return new Response(JSON.stringify({ error: 'applicationId and responseDocument required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const app = await env.DB.prepare('SELECT id FROM applications WHERE id = ? AND form_type = ?').bind(applicationId, CONV_FORM_TYPE).first();
    if (!app) return new Response(JSON.stringify({ error: 'Application not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const arrayBuffer = await validateFile(file);
    const uint8Array = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < uint8Array.length; i++) binary += String.fromCharCode(uint8Array[i]);
    const base64 = btoa(binary);

    const result = await env.DB.prepare(
        `INSERT INTO file_blobs (application_id, field_name, file_name, file_type, file_size, file_data, is_response, uploaded_by)
         VALUES (?, 'response_document', ?, ?, ?, ?, TRUE, ?)`
    ).bind(applicationId, file.name, file.type, file.size, base64, admin.username).run();

    await logAuditEvent(env, admin.username, 'CONV_RESPONSE_UPLOADED', applicationId, { file: file.name });

    return new Response(JSON.stringify({ success: true, fileId: result.meta.last_row_id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function handleConvocationNotify(request, env, corsHeaders) {
    const admin = await verifyConvocationToken(request, env);
    if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { applicationId, message } = await request.json();
    const app = await env.DB.prepare('SELECT * FROM applications WHERE id = ? AND form_type = ?').bind(applicationId, CONV_FORM_TYPE).first();
    if (!app) return new Response(JSON.stringify({ error: 'Application not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const responseFiles = await env.DB.prepare(
        `SELECT id, file_name FROM file_blobs WHERE application_id = ? AND is_response = TRUE`
    ).bind(applicationId).all();

    const downloadLinks = responseFiles.results.map(f => ({
        url: `${env.FRONTEND_URL || 'https://sssihl-student-service.pages.dev'}/download/${f.id}?appId=${applicationId}&token=${applicationId}`,
        fileName: f.file_name
    }));

    await sendDocumentDispatchedEmail(env, app, null, null, null, null, downloadLinks);
    await env.DB.prepare('UPDATE applications SET status = \'DISPATCHED\', updated_at = datetime(\'now\') WHERE id = ?').bind(applicationId).run();
    await logAuditEvent(env, admin.username, 'CONV_NOTIFIED', applicationId, { message: message || null });

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function handleConvocationExport(request, env, corsHeaders) {
    const admin = await verifyConvocationToken(request, env);
    if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const apps = await env.DB.prepare(
        `SELECT a.id, a.applicant_name, a.reg_no, a.student_email, a.campus, a.status, a.created_at,
                f.category, f.programme, f.attendance_type, f.date_of_birth, f.postal_address,
                f.active_mobile, f.alternate_mobile, f.prev_board_university,
                f.prev_qualification_programme, f.prev_qualification_certificate_no, f.declaration
         FROM applications a
         LEFT JOIN form_convocation_2026 f ON a.id = f.application_id
         WHERE a.form_type = ?
         ORDER BY a.created_at DESC`
    ).bind(CONV_FORM_TYPE).all();

    const headers = ['App ID','Name','Reg No','Email','Campus','Status','Submitted','Category','Programme','Attendance','DOB','Postal Address','Mobile','Alt Mobile','Prev Board/Univ','Prev Qual Programme','Cert No','Declaration'];
    const rows = apps.results.map(r => [
        r.id, r.applicant_name, r.reg_no, r.student_email, r.campus, r.status, r.created_at,
        r.category, r.programme, r.attendance_type, r.date_of_birth, r.postal_address,
        r.active_mobile, r.alternate_mobile, r.prev_board_university,
        r.prev_qualification_programme, r.prev_qualification_certificate_no, r.declaration
    ].map(v => `"${(v || '').toString().replace(/"/g, '""')}"`).join(','));

    const csv = [headers.join(','), ...rows].join('\n');

    return new Response(csv, {
        headers: {
            ...corsHeaders,
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="convocation-2026-registrations.csv"'
        }
    });
}

async function handleConvocationGetFile(fileId, request, env, corsHeaders) {
    const admin = await verifyConvocationToken(request, env);
    if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const file = await env.DB.prepare('SELECT * FROM file_blobs WHERE id = ?').bind(fileId).first();
    if (!file) return new Response(JSON.stringify({ error: 'File not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const verifyApp = await env.DB.prepare('SELECT id FROM applications WHERE id = ? AND form_type = ?').bind(file.application_id, CONV_FORM_TYPE).first();
    if (!verifyApp) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const binary = atob(file.file_data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    return new Response(bytes, {
        headers: {
            ...corsHeaders,
            'Content-Type': file.file_type || 'application/octet-stream',
            'Content-Disposition': `inline; filename="${file.file_name}"`,
        }
    });
}

async function handleCreateConvocationAdminUser(request, env, corsHeaders) {
    const admin = await verifyConvocationToken(request, env);
    if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { username, password } = await request.json();
    if (!username || !password) return new Response(JSON.stringify({ error: 'username and password are required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const existing = await env.DB.prepare('SELECT id FROM convocation_admin_users WHERE username = ?').bind(username).first();
    if (existing) return new Response(JSON.stringify({ error: 'Username already exists' }), { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { salt, hash } = await hashPassword(password);
    await env.DB.prepare('INSERT INTO convocation_admin_users (username, password_hash, salt) VALUES (?, ?, ?)').bind(username, hash, salt).run();
    await logAuditEvent(env, admin.username, 'CONV_CREATE_USER', null, { created_username: username });

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function handleConvocationStats(request, env, corsHeaders) {
    const admin = await verifyConvocationToken(request, env);
    if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const total = await env.DB.prepare('SELECT COUNT(*) as c FROM applications WHERE form_type = ?').bind(CONV_FORM_TYPE).first();
    const byStatus = await env.DB.prepare('SELECT status, COUNT(*) as c FROM applications WHERE form_type = ? GROUP BY status').bind(CONV_FORM_TYPE).all();
    const byCategory = await env.DB.prepare('SELECT category, COUNT(*) as c FROM form_convocation_2026 GROUP BY category').all();
    const byAttendance = await env.DB.prepare('SELECT attendance_type, COUNT(*) as c FROM form_convocation_2026 GROUP BY attendance_type').all();

    const statusMap = {};
    for (const r of byStatus.results) statusMap[r.status] = r.c;

    return new Response(JSON.stringify({
        total: total?.c || 0,
        byStatus: statusMap,
        byCategory: byCategory.results,
        byAttendance: byAttendance.results,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function handleConvocationToggleForm(request, env, corsHeaders) {
    const admin = await verifyConvocationToken(request, env);
    if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    const { isActive } = await request.json();
    if (typeof isActive !== 'boolean') return new Response(JSON.stringify({ error: 'isActive boolean required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    await env.DB.prepare('UPDATE form_settings SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE form_id = ?').bind(isActive ? 1 : 0, 'convocation-2026').run();
    await logAuditEvent(env, admin.username, isActive ? 'CONV_FORM_ENABLED' : 'CONV_FORM_DISABLED', 'convocation-2026', {});
    return new Response(JSON.stringify({ success: true, is_active: isActive }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

// ─── End Convocation Admin handlers ──────────────────────────────────────────

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
        <td style="padding: 0 8px 10px 8px; text-align: center;">
            <a href="${btn.link}" style="display: inline-block; background-color: ${btn.color || '#3b82f6'}; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 9999px; font-weight: 600; font-size: 14px; box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.2);">${btn.label}</a>
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
                            <img src="https://sssihl-student-service.pages.dev/Examinations_Service.png" alt="SSSIHL Examinations Service" width="650" style="width: 100%; height: auto; display: block; border-bottom: 1px solid #f1f5f9;">
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

async function sendAdminNotification(env, appId, formType, applicantName, email, recipientEmail = null, directorDecision = null, directorComment = null) {
    if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_REFRESH_TOKEN) {
        try {
            const accessToken = await getGoogleAuth(env);

            let reason = null;
            if (formType === 'Application for Duplicate Degree Certificate') {
                try {
                    const row = await env.DB.prepare(
                        `SELECT Reason FROM form_duplicate_degree WHERE application_id = ?`
                    ).bind(appId).first();
                    reason = row?.Reason || null;
                } catch (e) {
                    console.error('Failed to fetch reason for admin notification:', e);
                }
            }

            let title, content, subject;
            if (directorDecision === 'approved') {
                title = 'Director has approved the application';
                content = 'The Director has approved the following application.';
                subject = `Application Approved by Director: ${formType} - ${appId}`;
            } else if (directorDecision === 'rejected') {
                title = 'Application Rejected by Director';
                content = 'The Director has rejected the following application. Please see the rejection reason below.';
                subject = `Application Rejected by Director: ${formType} - ${appId}`;
            } else {
                title = 'New Application Received';
                content = 'A new application has been submitted through the portal and is ready for review.';
                subject = `New Application Received: ${formType} - ${appId}`;
            }

            const htmlBody = renderEmailTemplate({
                title,
                greeting: 'Sai Ram!',
                content,
                details: [
                    { label: 'Application ID', value: escapeHtml(appId) },
                    { label: 'Form Type', value: escapeHtml(formType) },
                    { label: 'Applicant', value: escapeHtml(applicantName) },
                    { label: 'Email', value: escapeHtml(email) },
                    ...(reason ? [{ label: 'Reason', value: escapeHtml(reason) }] : []),
                    ...(directorComment ? [{ label: 'Rejection Reason', value: escapeHtml(directorComment) }] : []),
                    { label: 'Submitted On', value: new Date().toLocaleString() }
                ],
                actionButtons: [
                    { label: 'Login to Admin Portal', link: 'https://sssihl-student-service.pages.dev/admin' }
                ]
            });

            await sendEmail(accessToken, {
                to: recipientEmail || env.ADMIN_EMAIL,
                subject,
                htmlBody
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
        'Prasanthi Nilayam Campus': 'directorpsn@sssihl.edu.in',
        'Anantapur Campus': 'directoratp@sssihl.edu.in',
        'Brindavan Campus': 'directorbrn@sssihl.edu.in',
        'Nandigiri Campus': 'directorndg@sssihl.edu.in'
    };
    return map[campus] || map['Prasanthi Nilayam Campus'];
}

function getCampusExamEmail(campus) {
    const map = {
        'Anantapur Campus': 'examination.atp@sssihl.edu.in',
        'Brindavan Campus': 'examination.brn@sssihl.edu.in',
        'Nandigiri Campus': 'examination.ndg@sssihl.edu.in',
        'Prasanthi Nilayam Campus': 'examination.psn@sssihl.edu.in',
    };
    return map[campus] || map['Prasanthi Nilayam Campus'];
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

async function sendCampusExamNotification(env, request, appId, formType, applicantName, email, campus, semester = null, regNo = null, programme = null) {
    try {
        const accessToken = await getGoogleAuth(env);
        const campusExamEmail = getCampusExamEmail(campus);
        const url = new URL(request.url);

        const isSupplementary = formType === 'Application for Supplementary Examinations Registration';
        const isRepeatPaper = formType === 'Application for Repeating Examinations Registration (CIE and ESE)';

        let examDetails = null;
        try {
            const table = isSupplementary ? 'form_supplementary_exam' : 'form_repeat_paper';
            examDetails = await env.DB.prepare(
                `SELECT Period_of_Study, Semester, paper_codes, paper_titles FROM ${table} WHERE application_id = ?`
            ).bind(appId).first();
        } catch (e) {
            console.error('Failed to fetch exam details for campus exam email:', e);
        }

        const submissionDate = new Date().toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Asia/Kolkata' });

        const htmlBody = renderEmailTemplate({
            title: 'Application Received for Review',
            greeting: `${campus === 'Anantapur Campus' ? 'Dear Madam,' : 'Dear Sir,'}<br><br>Sairam!<br><br>Greetings from the Examinations Section, SSSIHL.`,
            content: `This is to bring to your kind notice that <strong>${escapeHtml(applicantName)}</strong> has submitted an <strong>${escapeHtml(formType)}</strong>. Kindly review the application and forward it to the Director with your remarks.`,
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
                <p style="margin: 0; font-weight: 700;">&#128203; Action Required</p>
                <p style="margin: 8px 0 0 0;">Please click the button below to review the application, select the case type, add your remarks, and forward it to the Director.</p>
            `,
            actionButtons: [
                { label: '&#128203; Review Application', link: `${url.origin}/campus-exam-review?id=${appId}`, color: '#3b82f6' }
            ]
        });

        await sendEmail(accessToken, {
            to: campusExamEmail,
            subject: `Application for Review: ${formType} - ${appId}`,
            htmlBody,
            attachments: []
        });
        console.log(`Campus exam notification sent for app ${appId} to ${campusExamEmail}`);
    } catch (e) {
        console.error('Failed to send campus exam notification:', e);
    }
}

async function sendDirectorNotificationFromCampusExam(env, request, appId, formType, applicantName, email, campus, semester, regNo, programme, caseType, cieSatisfied, campusExamRemarks, overrideEmail = null) {
    try {
        const accessToken = await getGoogleAuth(env);
        const directorEmail = overrideEmail || getDirectorEmail(campus);
        const url = new URL(request.url);

        const isRepeatPaper = formType === 'Application for Repeating Examinations Registration (CIE and ESE)';

        let examDetails = null;
        try {
            const table = isRepeatPaper ? 'form_repeat_paper' : 'form_supplementary_exam';
            examDetails = await env.DB.prepare(
                `SELECT Period_of_Study, Semester, paper_codes, paper_titles FROM ${table} WHERE application_id = ?`
            ).bind(appId).first();
        } catch (e) {
            console.error('Failed to fetch exam details for director email:', e);
        }

        const submissionDate = new Date().toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Asia/Kolkata' });

        const caseTypeLabel = caseType === 'regular_supplementary' ? 'Regular Supplementary Case'
            : caseType === 'regular' ? 'Regular Case'
            : caseType === 'repeat_case' ? 'Repeat Case'
            : caseType === 'condonation' ? 'Condonation Case'
            : caseType;

        const cieRemark = caseType === 'repeat_case'
            ? (cieSatisfied === 'yes'
                ? 'Yes, the candidate has completed CIE tests satisfactorily.'
                : 'No, the candidate has not completed CIE tests satisfactorily.')
            : null;

        const actionButtons = (caseType === 'repeat_case' && cieSatisfied === 'yes')
            ? [{ label: '&#10003; Accept', link: `${url.origin}/director-comment?id=${appId}`, color: '#10b981' }]
            : (caseType === 'repeat_case' && cieSatisfied === 'no')
                ? [{ label: '&#10007; Reject', link: `${url.origin}/director-comment?id=${appId}`, color: '#ef4444' }]
                : [{ label: '&#128203; Review Application', link: `${url.origin}/director-comment?id=${appId}`, color: '#3b82f6' }];

        const htmlBody = renderEmailTemplate({
            title: 'For Your Kind Attention',
            greeting: `${campus === 'Anantapur Campus' ? 'Dear Madam,' : 'Dear Sir,'}<br><br>Sairam!<br><br>Greetings from the Examinations Section, SSSIHL.`,
            content: `This is to bring to your kind notice that <strong>${escapeHtml(applicantName)}</strong> has submitted an <strong>${escapeHtml(formType)}</strong>. The Campus Examination Section has reviewed and forwarded this application. Kindly review and record your decision.`,
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
                { label: 'Case Type', value: escapeHtml(caseTypeLabel) },
                ...(cieRemark ? [{ label: 'CIE Status', value: escapeHtml(cieRemark) }] : []),
                ...(campusExamRemarks ? [{ label: 'Remarks from Examination Section', value: escapeHtml(campusExamRemarks) }] : []),
                { label: 'Applicant Email', value: escapeHtml(email) },
                { label: 'Forwarded On', value: submissionDate },
            ],
            importantNote: cieRemark ? `
                <p style="margin: 0; font-weight: 700;">&#128203; CIE Completion Status</p>
                <p style="margin: 8px 0 0 0;">${escapeHtml(cieRemark)}</p>
            ` : `
                <p style="margin: 0; font-weight: 700;">&#128203; Action Required</p>
                <p style="margin: 8px 0 0 0;">Please click the button below to review and record your decision.</p>
            `,
            actionButtons
        });

        await sendEmail(accessToken, {
            to: directorEmail,
            subject: `For Your Kind Attention: ${formType} - ${appId}`,
            htmlBody,
            attachments: []
        });
        console.log(`Director email (from campus exam) sent for app ${appId}`);
    } catch (e) {
        console.error('Failed to send director notification from campus exam:', e);
    }
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
                    `SELECT existing_name, changed_name, Father_name, Period_of_Study, Mobile_Number,
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

        const isDuplicateGradeCard = formType === 'Application for Duplicate Grade Card';

        let dgcDetails = null;
        if (isDuplicateGradeCard) {
            try {
                dgcDetails = await env.DB.prepare(
                    `SELECT Reason FROM form_duplicate_grade_card WHERE Application_id = ?`
                ).bind(appId).first();
            } catch (e) {
                console.error('Failed to fetch DGC details for director email:', e);
            }
        }

        const emailSubject = useNewFlow
            ? `For Your Kind Attention: ${formType} - ${appId}`
            : `Clearance Required: ${formType} - ${appId}`;

        const emailBody = isNameChange
            ? renderEmailTemplate({
                title: 'For Your Information',
                greeting: `${campus === 'Anantapur Campus' ? 'Dear Madam,' : 'Dear Sir,'}<br><br>Sairam!<br><br>Greetings from the Examinations Section, SSSIHL.`,
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
            : isSupplementary
                ? renderEmailTemplate({
                    title: 'For Your Kind Attention',
                    greeting: `${campus === 'Anantapur Campus' ? 'Dear Madam,' : 'Dear Sir,'}<br><br>Sairam!<br><br>Greetings from the Examinations Section, SSSIHL.`,
                    content: `This is to bring to your kind notice that <strong>${escapeHtml(applicantName)}</strong> has submitted an <strong>${escapeHtml(formType)}</strong>. Kindly review the application and record your decision.`,
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
                        <p style="margin: 0; font-weight: 700;">📋 Action Required</p>
                        <p style="margin: 8px 0 0 0;">Please click the button below to review the application and record your decision. You will be able to classify the case and approve or reject accordingly.</p>
                    `,
                    actionButtons: [
                        { label: '📋 Review Application', link: `${url.origin}/director-comment?id=${appId}`, color: '#3b82f6' }
                    ]
                })
                : isRepeatPaper
                ? renderEmailTemplate({
                    title: 'For Your Kind Attention',
                    greeting: `${campus === 'Anantapur Campus' ? 'Dear Madam,' : 'Dear Sir,'}<br><br>Sairam!<br><br>Greetings from the Examinations Section, SSSIHL.`,
                    content: `This is to bring to your kind notice that <strong>${escapeHtml(applicantName)}</strong> has submitted an <strong>${escapeHtml(formType)}</strong>. Kindly review the application and record your decision.`,
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
                        <p style="margin: 0; font-weight: 700;">&#128203; Action Required</p>
                        <p style="margin: 8px 0 0 0;">Please click the button below to review the application and record your decision. You will be able to classify the case and approve or reject accordingly.</p>
                    `,
                    actionButtons: [
                        { label: '&#128203; Review Application', link: `${url.origin}/director-comment?id=${appId}`, color: '#3b82f6' }
                    ]
                })
                : renderEmailTemplate({
                    title: 'Clearance Required',
                    greeting: `${campus === 'Anantapur Campus' ? 'Dear Madam,' : 'Dear Sir,'}<br><br>Sairam!<br><br>Greetings from the Examinations Section, SSSIHL.`,
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
                        ...(dgcDetails?.Reason ? [{ label: 'Reason for Loss', value: escapeHtml(dgcDetails.Reason) }] : []),
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

async function handleTestDirectorEmail(request, env, corsHeaders) {
    const admin = await verifyAdminToken(request, env);
    if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { campus, formType, testEmail } = await request.json();
    if (!testEmail || !campus || !formType) {
        return new Response(JSON.stringify({ error: 'testEmail, campus, and formType are required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (!shouldNotifyDirector(formType)) {
        return new Response(JSON.stringify({ error: 'This form type does not trigger director notifications' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    try {
        const accessToken = await getGoogleAuth(env);
        const url = new URL(request.url);
        const fakeAppId = 'TEST-' + Date.now();
        const applicantName = 'Test Applicant';
        const regNo = 'TEST-REG-001';
        const programme = 'B.Sc. (Hons.) Mathematics';

        // Insert a real application record so approve/reject/comment links work
        await env.DB.prepare(
            `INSERT INTO applications (id, student_email, form_type, applicant_name, reg_no, campus, status, programme)
             VALUES (?, ?, ?, ?, ?, ?, 'AWAITING_DIRECTOR', ?)`
        ).bind(fakeAppId, testEmail, formType, applicantName, regNo, campus, programme).run();
        const submissionDate = new Date().toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Asia/Kolkata' });

        const isNameChange = formType === 'Application for Registration of Student Name change in the Institute Records';
        const isSupplementary = formType === 'Application for Supplementary Examinations Registration';
        const isRepeatPaper = formType === 'Application for Repeating Examinations Registration (CIE and ESE)';
        const useNewFlow = isNameChange || isSupplementary || isRepeatPaper;

        const emailSubject = `[TEST] ${useNewFlow ? 'For Your Kind Attention' : 'Clearance Required'}: ${formType} - ${fakeAppId}`;

        const emailBody = isNameChange
            ? renderEmailTemplate({
                title: '[TEST] For Your Information',
                greeting: `${campus === 'Anantapur Campus' ? 'Dear Madam,' : 'Dear Sir,'}<br><br>Sairam!<br><br>Greetings from the Examinations Section, SSSIHL.`,
                content: `<strong>[THIS IS A TEST EMAIL]</strong><br><br>This is to bring to your notice that <strong>${escapeHtml(applicantName)}</strong> has submitted an application for registration of name change in the Institute records.`,
                details: [
                    { label: 'Form Type', value: escapeHtml(formType) },
                    { label: 'Application ID', value: escapeHtml(fakeAppId) },
                    { label: 'Former Name', value: escapeHtml(applicantName) },
                    { label: 'Changed Name as per the Gazette notification', value: 'Test New Name' },
                    { label: "Father's Name", value: 'Test Father Name' },
                    { label: 'Registered Number', value: regNo },
                    { label: 'Campus', value: escapeHtml(campus) },
                    { label: 'Programme', value: programme },
                    { label: 'Period of Study', value: '2004 – 2007' },
                    { label: 'Mobile Number', value: '+91 9999999999' },
                    { label: 'Applicant Email', value: 'teststudent@example.com' },
                    { label: 'Submission Date', value: submissionDate },
                ],
                importantNote: `<p style="margin: 0; font-weight: 700;">⚠️ Important Note</p><p style="margin: 8px 0 0 0;">This is a test email. The approve/reject links below are functional but will operate on the TEST application ID.</p>`,
                actionButtons: [
                    { label: '✓ Proceed', link: `${url.origin}/approve?id=${fakeAppId}&role=Director&action=Approve`, color: '#10b981' },
                    { label: '✗ Grade Card Available', link: `${url.origin}/approve?id=${fakeAppId}&role=Director&action=Reject`, color: '#ef4444' },
                    { label: '✎ Submit Comments', link: `${url.origin}/director-comment?id=${fakeAppId}`, color: '#f59e0b' }
                ]
            })
            : isSupplementary
                ? renderEmailTemplate({
                    title: '[TEST] For Your Kind Attention',
                    greeting: `${campus === 'Anantapur Campus' ? 'Dear Madam,' : 'Dear Sir,'}<br><br>Sairam!<br><br>Greetings from the Examinations Section, SSSIHL.`,
                    content: `<strong>[THIS IS A TEST EMAIL]</strong><br><br>This is to bring to your kind notice that <strong>${escapeHtml(applicantName)}</strong> has submitted an <strong>${escapeHtml(formType)}</strong>. Kindly review the application and record your decision.`,
                    details: [
                        { label: 'Form Type', value: escapeHtml(formType) },
                        { label: 'Application ID', value: escapeHtml(fakeAppId) },
                        { label: 'Applicant Name', value: escapeHtml(applicantName) },
                        { label: 'Registered Number', value: regNo },
                        { label: 'Campus', value: escapeHtml(campus) },
                        { label: 'Programme', value: programme },
                        { label: 'Period of Study', value: '2004 – 2007' },
                        { label: 'Semester', value: 'IV' },
                        { label: 'Paper Codes', value: 'MAT401, MAT402' },
                        { label: 'Paper Titles', value: 'Real Analysis, Abstract Algebra' },
                        { label: 'Applicant Email', value: 'teststudent@example.com' },
                        { label: 'Submission Date', value: submissionDate },
                    ],
                    importantNote: `<p style="margin: 0; font-weight: 700;">📋 [TEST] Action Required</p><p style="margin: 8px 0 0 0;">This is a test email. Click the button below to open the review page — it is fully functional and operates on the TEST application ID.</p>`,
                    actionButtons: [
                        { label: '📋 Review Application', link: `${url.origin}/director-comment?id=${fakeAppId}`, color: '#3b82f6' }
                    ]
                })
                : isRepeatPaper
                ? renderEmailTemplate({
                    title: '[TEST] For Your Kind Attention',
                    greeting: `${campus === 'Anantapur Campus' ? 'Dear Madam,' : 'Dear Sir,'}<br><br>Sairam!<br><br>Greetings from the Examinations Section, SSSIHL.`,
                    content: `<strong>[THIS IS A TEST EMAIL]</strong><br><br>This is to bring to your kind notice that <strong>${escapeHtml(applicantName)}</strong> has submitted an <strong>${escapeHtml(formType)}</strong>. Kindly review the application and record your decision.`,
                    details: [
                        { label: 'Form Type', value: escapeHtml(formType) },
                        { label: 'Application ID', value: escapeHtml(fakeAppId) },
                        { label: 'Applicant Name', value: escapeHtml(applicantName) },
                        { label: 'Registered Number', value: regNo },
                        { label: 'Campus', value: escapeHtml(campus) },
                        { label: 'Programme', value: programme },
                        { label: 'Period of Study', value: '2004 – 2007' },
                        { label: 'Semester', value: 'IV' },
                        { label: 'Paper Codes', value: 'MAT401, MAT402' },
                        { label: 'Paper Titles', value: 'Real Analysis, Abstract Algebra' },
                        { label: 'Applicant Email', value: 'teststudent@example.com' },
                        { label: 'Submission Date', value: submissionDate },
                    ],
                    importantNote: `<p style="margin: 0; font-weight: 700;">&#128203; [TEST] Action Required</p><p style="margin: 8px 0 0 0;">This is a test email. Click the button below to open the review page — it is fully functional and operates on the TEST application ID.</p>`,
                    actionButtons: [
                        { label: '&#128203; Review Application', link: `${url.origin}/director-comment?id=${fakeAppId}`, color: '#3b82f6' }
                    ]
                })
                : renderEmailTemplate({
                    title: '[TEST] Clearance Required',
                    greeting: `${campus === 'Anantapur Campus' ? 'Dear Madam,' : 'Dear Sir,'}<br><br>Sairam!<br><br>Greetings from the Examinations Section, SSSIHL.`,
                    content: `<strong>[THIS IS A TEST EMAIL]</strong><br><br>An <strong>${escapeHtml(formType)}</strong> has been submitted and requires your clearance for further processing.`,
                    details: [
                        { label: 'Form Type', value: escapeHtml(formType) },
                        { label: 'Application ID', value: escapeHtml(fakeAppId) },
                        { label: 'Applicant Name', value: escapeHtml(applicantName) },
                        { label: 'Registered Number', value: regNo },
                        { label: 'Applicant Email', value: 'teststudent@example.com' },
                        { label: 'Campus', value: escapeHtml(campus) },
                        { label: 'Programme', value: programme },
                        { label: 'Semester', value: 'IV' },
                        { label: 'Reason for Loss', value: 'Test reason — grade card misplaced during relocation.' },
                        { label: 'Submission Date', value: submissionDate },
                    ],
                    importantNote: `<p style="margin: 0; font-weight: 700;">⚠️ [TEST] Important Note</p><p style="margin: 8px 0 0 0;">This is a test email. The action links below are functional but operate on the TEST application ID.</p>`,
                    actionButtons: [
                        { label: '✓ Clear Application', link: `${url.origin}/approve?id=${fakeAppId}&role=Director&action=Approve`, color: '#10b981' },
                        { label: '✗ Reject', link: `${url.origin}/approve?id=${fakeAppId}&role=Director&action=Reject`, color: '#ef4444' }
                    ]
                });

        await sendEmail(accessToken, { to: testEmail, subject: emailSubject, htmlBody: emailBody, attachments: [] });
        await logAuditEvent(env, admin.username, 'TEST_EMAIL_SENT', null, { testEmail, campus, formType });

        return new Response(JSON.stringify({ success: true, message: `Test email sent to ${testEmail}` }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (e) {
        console.error('Test director email failed:', e);
        return new Response(JSON.stringify({ error: 'Failed to send test email: ' + e.message }), {
            status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

async function handleTestCampusExamEmail(request, env, corsHeaders) {
    const admin = await verifyAdminToken(request, env);
    if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { testEmail, campus, formType, emailTarget, caseType, cieSatisfied } = await request.json();
    if (!testEmail || !campus || !formType || !emailTarget) {
        return new Response(JSON.stringify({ error: 'testEmail, campus, formType, and emailTarget are required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    try {
        const accessToken = await getGoogleAuth(env);
        const url = new URL(request.url);

        const fakeAppId = 'TEST-' + Date.now();
        const applicantName = 'Test Applicant';
        const regNo = 'TEST-REG-001';
        const programme = 'B.Sc. (Hons.) Mathematics';
        const semester = 'IV';
        const periodOfStudy = '2022 – 2025';
        const paperCodes = 'MAT401, MAT402';
        const paperTitles = 'Real Analysis, Abstract Algebra';
        const campusExamRemarks = 'Test remarks from examination section';
        const submissionDate = new Date().toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Asia/Kolkata' });
        const greeting = `${campus === 'Anantapur Campus' ? 'Dear Madam,' : 'Dear Sir,'}<br><br>Sairam!<br><br>Greetings from the Examinations Section, SSSIHL.`;

        // Insert fake application so review/director-comment pages work when clicking email buttons
        await env.DB.prepare(
            `INSERT INTO applications (id, student_email, form_type, applicant_name, reg_no, campus, status, programme) VALUES (?, ?, ?, ?, ?, ?, 'AWAITING_CAMPUS_EXAM', ?)`
        ).bind(fakeAppId, testEmail, formType, applicantName, regNo, campus, programme).run();

        const isRepeatPaper = formType === 'Application for Repeating Examinations Registration (CIE and ESE)';
        if (isRepeatPaper) {
            await env.DB.prepare(
                `INSERT INTO form_repeat_paper (application_id, student_email, student_name, reg_no, Campus, Programme, Mobile_Number, address_line1, country, state_province, city, postal_code, paper_codes, paper_titles, Semester, Period_of_Study) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            ).bind(fakeAppId, testEmail, applicantName, regNo, campus, programme, '9999999999', 'Test Address', 'India', 'Andhra Pradesh', 'Puttaparthi', '515134', paperCodes, paperTitles, semester, periodOfStudy).run();
        } else {
            await env.DB.prepare(
                `INSERT INTO form_supplementary_exam (application_id, student_email, student_name, Registration_Number, Campus, Programme, Mobile_Number, address_line1, country, state_province, city, postal_code, paper_codes, paper_titles, Semester, Period_of_Study) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            ).bind(fakeAppId, testEmail, applicantName, regNo, campus, programme, '9999999999', 'Test Address', 'India', 'Andhra Pradesh', 'Puttaparthi', '515134', paperCodes, paperTitles, semester, periodOfStudy).run();
        }

        let htmlBody, subject;

        if (emailTarget === 'campus_exam') {
            subject = `[TEST] Application for Review: ${formType} - ${fakeAppId}`;
            htmlBody = renderEmailTemplate({
                title: '[TEST] Application Received for Review',
                greeting,
                content: `<strong>[THIS IS A TEST EMAIL]</strong><br><br>This is to bring to your kind notice that <strong>${escapeHtml(applicantName)}</strong> has submitted an <strong>${escapeHtml(formType)}</strong>. Kindly review the application and forward it to the Director with your remarks.`,
                details: [
                    { label: 'Form Type', value: escapeHtml(formType) },
                    { label: 'Application ID', value: escapeHtml(fakeAppId) },
                    { label: 'Applicant Name', value: escapeHtml(applicantName) },
                    { label: 'Registered Number', value: regNo },
                    { label: 'Campus', value: escapeHtml(campus) },
                    { label: 'Programme', value: programme },
                    { label: 'Period of Study', value: periodOfStudy },
                    { label: 'Semester', value: semester },
                    { label: 'Paper Codes', value: paperCodes },
                    { label: 'Paper Titles', value: paperTitles },
                    { label: 'Applicant Email', value: 'teststudent@example.com' },
                    { label: 'Submission Date', value: submissionDate },
                ],
                importantNote: `<p style="margin: 0; font-weight: 700;">&#128203; [TEST] Action Required</p><p style="margin: 8px 0 0 0;">This is a test email. Click the button below to open the campus exam review page.</p>`,
                actionButtons: [{ label: '&#128203; Review Application', link: `${url.origin}/campus-exam-review?id=${fakeAppId}`, color: '#3b82f6' }]
            });
        } else {
            const effectiveCaseType = caseType || 'regular';
            const effectiveCieSatisfied = cieSatisfied || 'yes';

            const caseTypeLabel = effectiveCaseType === 'regular_supplementary' ? 'Regular Supplementary Case'
                : effectiveCaseType === 'regular' ? 'Regular Case'
                : effectiveCaseType === 'repeat_case' ? 'Repeat Case'
                : effectiveCaseType === 'condonation' ? 'Condonation Case'
                : effectiveCaseType;

            const cieRemark = effectiveCaseType === 'repeat_case'
                ? (effectiveCieSatisfied === 'yes'
                    ? 'Yes, the candidate has completed CIE tests satisfactorily.'
                    : 'No, the candidate has not completed CIE tests satisfactorily.')
                : null;

            const actionButtons = (effectiveCaseType === 'repeat_case' && effectiveCieSatisfied === 'yes')
                ? [{ label: '&#10003; Accept', link: `${url.origin}/director-comment?id=${fakeAppId}`, color: '#10b981' }]
                : (effectiveCaseType === 'repeat_case' && effectiveCieSatisfied === 'no')
                    ? [{ label: '&#10007; Reject', link: `${url.origin}/director-comment?id=${fakeAppId}`, color: '#ef4444' }]
                    : [{ label: '&#128203; Review Application', link: `${url.origin}/director-comment?id=${fakeAppId}`, color: '#3b82f6' }];

            subject = `[TEST] For Your Kind Attention: ${formType} - ${fakeAppId}`;
            htmlBody = renderEmailTemplate({
                title: '[TEST] For Your Kind Attention',
                greeting,
                content: `<strong>[THIS IS A TEST EMAIL]</strong><br><br>This is to bring to your kind notice that <strong>${escapeHtml(applicantName)}</strong> has submitted an <strong>${escapeHtml(formType)}</strong>. The Campus Examination Section has reviewed and forwarded this application. Kindly review and record your decision.`,
                details: [
                    { label: 'Form Type', value: escapeHtml(formType) },
                    { label: 'Application ID', value: escapeHtml(fakeAppId) },
                    { label: 'Applicant Name', value: escapeHtml(applicantName) },
                    { label: 'Registered Number', value: regNo },
                    { label: 'Campus', value: escapeHtml(campus) },
                    { label: 'Programme', value: programme },
                    { label: 'Period of Study', value: periodOfStudy },
                    { label: 'Semester', value: semester },
                    { label: 'Paper Codes', value: paperCodes },
                    { label: 'Paper Titles', value: paperTitles },
                    { label: 'Case Type', value: escapeHtml(caseTypeLabel) },
                    ...(cieRemark ? [{ label: 'CIE Status', value: escapeHtml(cieRemark) }] : []),
                    { label: 'Remarks from Examination Section', value: campusExamRemarks },
                    { label: 'Applicant Email', value: 'teststudent@example.com' },
                    { label: 'Forwarded On', value: submissionDate },
                ],
                importantNote: cieRemark ? `
                    <p style="margin: 0; font-weight: 700;">&#128203; [TEST] CIE Completion Status</p>
                    <p style="margin: 8px 0 0 0;">${escapeHtml(cieRemark)}</p>
                ` : `
                    <p style="margin: 0; font-weight: 700;">&#128203; [TEST] Action Required</p>
                    <p style="margin: 8px 0 0 0;">This is a test email. Click the button below to open the director review page.</p>
                `,
                actionButtons
            });
        }

        await sendEmail(accessToken, { to: testEmail, subject, htmlBody, attachments: [] });
        await logAuditEvent(env, admin.username, 'TEST_CAMPUS_EXAM_EMAIL_SENT', null, { testEmail, campus, formType, emailTarget, caseType });

        return new Response(JSON.stringify({ success: true, message: `Test email sent to ${testEmail}` }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (e) {
        console.error('Test campus exam email failed:', e);
        return new Response(JSON.stringify({ error: 'Failed to send test email: ' + e.message }), {
            status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
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
                ? 'Your application has been reviewed by the Campus Director. Unfortunately, your application has not been approved. Please see the details below.'
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
                    ? `<li>Your application has not been approved by the Campus Director.</li>
                       <li>For queries or clarifications, please contact your Campus Office.</li>`
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
            { label: 'Track Application Status', link: 'https://sssihl-student-service.pages.dev/#track' }
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
                { label: 'Track Application Status', link: 'https://sssihl-student-service.pages.dev/#track' }
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
                { label: 'Track Application Status', link: `https://sssihl-student-service.pages.dev/#track=${escapeHtml(appId)}` }
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
            actionButtons: [{ label: 'Track Application Status', link: `https://sssihl-student-service.pages.dev/#track=${escapeHtml(appId)}` }]
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
            greeting: `${campus === 'Anantapur Campus' ? 'Dear Madam,' : 'Dear Sir,'}<br><br>Sairam!<br><br>Greetings from the Examinations Section, SSSIHL.`,
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

const FORM_TYPE_TO_ID = {
    'Application for Duplicate Grade Card': 'duplicate-grade-card',
    'Application for CGPA to Percentage Conversion': 'cgpa-conversion',
    'Application for Supplementary Examinations Registration': 'supplementary-exam',
    'Application for Duplicate Degree Certificate': 'duplicate-degree',
    'Application for Registration of Student Name change in the Institute Records': 'name-change',
    'Application for Repeating Examinations Registration (CIE and ESE)': 'repeat-paper',
    'Application for Re-Totalling of Marks': 'retotaling',
    'Application for On-Request Degree Certificate': 'on-request-degree',
    'Application for Migration Certificate': 'migration',
    'SSSIHL - XLV Annual Convocation November 2026 - Registration Form': 'convocation-2026',
};

async function handleSubmission(request, env, corsHeaders) {
    const formData = await request.formData();
    const formType = formData.get('formType');

    // Enforce form_settings: reject submissions for disabled forms
    const formId = FORM_TYPE_TO_ID[formType];
    if (formId) {
        const setting = await env.DB.prepare(
            'SELECT is_active FROM form_settings WHERE form_id = ?'
        ).bind(formId).first();
        if (setting && setting.is_active === 0) {
            return new Response(JSON.stringify({ success: false, error: 'This form is currently unavailable.' }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
    }

    let subResult;
    switch (formType) {
        case 'Application for Duplicate Grade Card':
            subResult = await handleDuplicateGradeCard(formData, request, env, corsHeaders); break;
        case 'Application for CGPA to Percentage Conversion':
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
        case 'SSSIHL - XLV Annual Convocation November 2026 - Registration Form':
            subResult = await handleConvocation2026(formData, request, env, corsHeaders); break;
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
        `INSERT INTO applications (id, student_email, form_type, applicant_name, reg_no, abc_apaar_id, campus, status, programme)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(appId, email, formType, applicantName, regNo, formData.get('abcApaarId') || '', campus, isSeekingDirectorApproval ? 'AWAITING_DIRECTOR' : 'PENDING', formData.get('program') || null).run();

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
        await sendAdminNotification(env, appId, formType, applicantName, email);
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
        `INSERT INTO applications (id, student_email, form_type, applicant_name, reg_no, abc_apaar_id, campus, programme)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(appId, email, formType, applicantName, regNo, formData.get('abcApaarId') || '', campus, formData.get('program') || null).run();

    await env.DB.prepare(
        `INSERT INTO form_cgpa_conversion
         (application_id, student_name, address_line1, address_line2, country, state_province, city, postal_code, Mobile_Number, Registration_Number,
          Programme, Period_of_Study, graduation_year, CGPA, delivery_preference)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
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
        parseFloat(formData.get('cgpa')) || 0.0,
        formData.get('deliveryPreference') || ''
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
        `INSERT INTO applications (id, student_email, form_type, applicant_name, reg_no, abc_apaar_id, campus, status, programme)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(appId, email, formType, applicantName, regNo, formData.get('abcApaarId') || '', campus, 'AWAITING_CAMPUS_EXAM', formData.get('program') || null).run();

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
          Campus, Programme, Mobile_Number, address_line1, address_line2, country, state_province, city, postal_code, paper_codes, paper_titles, Semester, declaration)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
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
        semester,
        formData.get('declaration') === 'true' ? 'Yes' : 'No'
    ).run();

    for (const [key, value] of formData.entries()) {
        if (value instanceof File && value.size > 0) {
            await storeFileBlob(env, appId, key, value);
        }
    }

    await sendAdminNotification(env, appId, formType, applicantName, email);
    await sendCampusExamNotification(env, request, appId, formType, applicantName, email, campus, semester, regNo, formData.get('program') || null);
    await sendDirectorSoughtConfirmationEmail(env, appId, formType, applicantName, email, campus, formData.get('program') || null, semester || null, formData.get('regNo') || null);

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
        `INSERT INTO applications (id, student_email, form_type, applicant_name, reg_no, abc_apaar_id, campus, status, programme)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(appId, email, formType, applicantName, regNo, formData.get('abcApaarId') || '', campus, 'AWAITING_CAMPUS_EXAM', formData.get('program') || null).run();

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
         (application_id, student_email, Period_of_Study, student_name, reg_no, Campus, Programme,
          Mobile_Number, address_line1, address_line2, country, state_province, city, postal_code, paper_codes, paper_titles, Semester, declaration)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
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
        semester,
        formData.get('declaration') === 'true' ? 'Yes' : 'No'
    ).run();

    for (const [key, value] of formData.entries()) {
        if (value instanceof File && value.size > 0) {
            await storeFileBlob(env, appId, key, value);
        }
    }

    await sendAdminNotification(env, appId, formType, applicantName, email);
    await sendCampusExamNotification(env, request, appId, formType, applicantName, email, campus, semester, regNo, formData.get('program') || null);
    await sendDirectorSoughtConfirmationEmail(env, appId, formType, applicantName, email, campus, formData.get('program') || null, semester || null, formData.get('regNo') || null);

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
        `INSERT INTO applications (id, student_email, form_type, applicant_name, reg_no, abc_apaar_id, campus, programme)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(appId, email, formType, applicantName, regNo, formData.get('abcApaarId') || '', campus, formData.get('program') || null).run();

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
        `INSERT INTO applications (id, student_email, form_type, applicant_name, reg_no, abc_apaar_id, campus, status, programme)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(appId, email, formType, applicantName, regNo, formData.get('abcApaarId') || '', campus, isSeekingDirectorApproval ? 'AWAITING_DIRECTOR' : 'PENDING', formData.get('program') || null).run();

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
        await sendAdminNotification(env, appId, formType, applicantName, email);
        await sendDirectorNotification(env, request, appId, formType, applicantName, email, campus, null, regNo, formData.get('program') || null);
        await sendDirectorSoughtConfirmationEmail(env, appId, formType, applicantName, email, campus, formData.get('program') || null, formData.get('semester') || null, regNo);
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
        `INSERT INTO applications (id, student_email, form_type, applicant_name, reg_no, abc_apaar_id, campus, programme)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(appId, email, formType, applicantName, regNo, formData.get('abcApaarId') || '', campus, formData.get('program') || null).run();

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
        `INSERT INTO applications (id, student_email, form_type, applicant_name, reg_no, abc_apaar_id, campus, programme)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(appId, email, formType, applicantName, regNo, formData.get('abcApaarId') || '', campus, formData.get('program') || null).run();

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
        `INSERT INTO applications (id, student_email, form_type, applicant_name, reg_no, abc_apaar_id, campus, programme)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(appId, email, formType, applicantName, regNo, formData.get('abcApaarId') || '', campus, formData.get('program') || null).run();

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

// Handler for Convocation 2026 Registration
async function handleConvocation2026(formData, request, env, corsHeaders) {
    const email = formData.get('email') || '';
    const applicantName = formData.get('applicantName') || '';
    const regNo = formData.get('regNo') || '';
    const campus = formData.get('campus') || '';
    const programme = formData.get('program') || '';
    const formType = formData.get('formType');

    // Require at least one uploaded document
    const hasFile = [...formData.entries()].some(([, v]) => v instanceof File && v.size > 0);
    if (!hasFile) {
        return new Response(JSON.stringify({ error: 'At least one scanned document is required.' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const regSuffix = (regNo || '').replace(/[^A-Z0-9]/gi, '').toUpperCase();
    const appId = `CONV${yy}${mm}${regSuffix}`;

    await env.DB.prepare(
        `INSERT INTO applications (id, student_email, form_type, applicant_name, reg_no, campus, programme)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(appId, email, formType, applicantName, regNo, campus, programme).run();

    await env.DB.prepare(
        `INSERT INTO form_convocation_2026
         (application_id, student_name, registration_number, category, programme, campus, attendance_type,
          date_of_birth, postal_address, active_mobile, alternate_mobile,
          prev_board_university, prev_qualification_programme, prev_qualification_certificate_no, declaration)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
        appId,
        applicantName,
        regNo,
        formData.get('category') || '',
        programme,
        campus,
        formData.get('attendanceType') || '',
        formData.get('dob') || '',
        formData.get('postalAddress') || '',
        formData.get('activeMobile') || '',
        formData.get('alternateMobile') || '',
        formData.get('prevBoardUniversity') || '',
        formData.get('prevQualProgramme') || '',
        formData.get('prevQualCertNo') || '',
        formData.get('declaration') || 'No'
    ).run();

    for (const [key, value] of formData.entries()) {
        if (value instanceof File && value.size > 0) {
            await storeFileBlob(env, appId, key, value);
        }
    }

    await sendAdminNotification(env, appId, formType, applicantName, email, 'convocation@sssihl.edu.in');
    await sendStudentConfirmationEmail(env, appId, formType, applicantName, email, campus, programme, null);

    return new Response(JSON.stringify({ success: true, appId }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function handleCampusExamReviewPage(url, env, corsHeaders) {
    const id = url.searchParams.get('id');
    if (!id) return new Response('Missing application ID', { status: 400, headers: corsHeaders });

    const app = await env.DB.prepare(
        'SELECT id, applicant_name, form_type, campus, status, campus_exam_status FROM applications WHERE id = ?'
    ).bind(id).first();

    if (!app) return new Response('Application not found', { status: 404, headers: corsHeaders });

    const alreadyActed = app.campus_exam_status === 'FORWARDED' || app.status !== 'AWAITING_CAMPUS_EXAM';

    const nonce = Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b => b.toString(16).padStart(2, '0')).join('');
    const exp = Date.now() + 3600000;
    const csrfPayload = `${nonce}:${exp}`;
    const csrfSig = await hmacSign(env.CSRF_SECRET || 'fallback-dev-secret', csrfPayload);

    const REPEAT_PAPER_FORM = 'Application for Repeating Examinations Registration (CIE and ESE)';
    const isRepeatPaper = app.form_type === REPEAT_PAPER_FORM;

    const caseTypeOptions = isRepeatPaper ? `
               <label class="radio-option">
                   <input type="radio" name="caseType" value="regular" onclick="showSection('regular')">
                   <div class="radio-option-text"><p>Regular</p><p>Standard repeat examination case</p></div>
               </label>
               <label class="radio-option">
                   <input type="radio" name="caseType" value="repeat_case" onclick="showSection('repeat_case')">
                   <div class="radio-option-text"><p>Repeat Case</p><p>Candidate's CIE completion needs to be verified</p></div>
               </label>
               <label class="radio-option" style="margin-bottom:20px;">
                   <input type="radio" name="caseType" value="condonation" onclick="showSection('condonation')">
                   <div class="radio-option-text"><p>Condonation Case</p><p>Requires approval letter from Administration</p></div>
               </label>` : `
               <label class="radio-option">
                   <input type="radio" name="caseType" value="regular_supplementary" onclick="showSection('regular')">
                   <div class="radio-option-text"><p>Regular Supplementary Case</p><p>Standard supplementary examination case</p></div>
               </label>
               <label class="radio-option" style="margin-bottom:20px;">
                   <input type="radio" name="caseType" value="condonation" onclick="showSection('condonation')">
                   <div class="radio-option-text"><p>Condonation Case</p><p>Requires approval letter from Administration</p></div>
               </label>`;

    const pageHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Review Application - SSSIHL Examination Services</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Outfit:wght@700;800&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; background: linear-gradient(135deg, #f1f5f9, #e2e8f0); min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; padding: 40px 20px; }
        .header { text-align: center; margin-bottom: 28px; }
        .header img { height: 90px; width: auto; }
        .card { background: white; border-radius: 20px; padding: 36px 32px; max-width: 560px; width: 100%; box-shadow: 0 10px 30px -5px rgba(15,23,42,0.10); border: 1px solid #e2e8f0; }
        .icon-wrap { width: 64px; height: 64px; border-radius: 50%; background: #eff6ff; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 30px; }
        h1 { font-family: 'Outfit', sans-serif; color: #0f172a; font-size: 1.5rem; text-align: center; margin-bottom: 6px; }
        .subtitle { color: #64748b; font-size: 0.875rem; text-align: center; line-height: 1.6; margin-bottom: 24px; }
        .details-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 24px; }
        .detail-row { display: flex; justify-content: space-between; align-items: flex-start; padding: 8px 0; border-bottom: 1px solid #e2e8f0; gap: 12px; }
        .detail-row:last-child { border-bottom: none; padding-bottom: 0; }
        .detail-label { font-size: 0.72rem; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; flex-shrink: 0; }
        .detail-value { font-size: 0.875rem; color: #0f172a; font-weight: 600; text-align: right; }
        .section-label { font-size: 0.8rem; font-weight: 700; color: #0f172a; margin-bottom: 12px; }
        .radio-option { display: flex; align-items: flex-start; gap: 12px; padding: 14px; border: 1.5px solid #e2e8f0; border-radius: 12px; cursor: pointer; margin-bottom: 10px; }
        .radio-option input { margin-top: 2px; width: 16px; height: 16px; flex-shrink: 0; cursor: pointer; accent-color: #2563eb; }
        .radio-option-text p:first-child { font-size: 0.875rem; font-weight: 600; color: #0f172a; margin-bottom: 2px; }
        .radio-option-text p:last-child { font-size: 0.75rem; color: #64748b; }
        .btn { width: 100%; padding: 13px 16px; font-size: 0.9rem; font-weight: 700; border: none; border-radius: 10px; cursor: pointer; font-family: inherit; }
        .btn:disabled { opacity: 0.45; cursor: not-allowed; }
        .btn-blue { background: #2563eb; color: white; }
        .upload-note { background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 14px; margin-bottom: 16px; }
        .upload-note p:first-child { font-size: 0.82rem; font-weight: 700; color: #92400e; margin-bottom: 4px; }
        .upload-note p:last-child { font-size: 0.75rem; color: #a16207; line-height: 1.5; }
        .file-input { display: none; }
        .file-drop-zone { border: 2px dashed #cbd5e1; border-radius: 12px; padding: 20px 16px; text-align: center; cursor: pointer; transition: border-color 0.2s, background 0.2s; margin-bottom: 6px; background: #f8fafc; }
        .file-drop-zone:hover { border-color: #2563eb; background: #eff6ff; }
        .file-drop-zone.has-file { border-color: #10b981; background: #f0fdf4; }
        .file-drop-zone .drop-icon { font-size: 26px; margin-bottom: 8px; }
        .file-drop-zone .drop-label { font-size: 0.82rem; font-weight: 600; color: #475569; margin-bottom: 4px; }
        .file-drop-zone .drop-sub { font-size: 0.72rem; color: #94a3b8; }
        .file-drop-zone .drop-chosen { font-size: 0.8rem; font-weight: 700; color: #059669; margin-top: 6px; word-break: break-all; }
        .error-text { font-size: 0.75rem; color: #ef4444; font-weight: 600; margin-top: 4px; margin-bottom: 8px; display: none; }
        .status-text { font-size: 0.75rem; text-align: center; margin-bottom: 12px; }
        .status-ok { color: #10b981; font-weight: 600; }
        .status-err { color: #ef4444; font-weight: 600; }
        label.field-label { display: block; font-size: 0.82rem; font-weight: 700; color: #0f172a; margin-bottom: 8px; margin-top: 16px; }
        textarea.remarks-box { width: 100%; border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 12px 14px; font-size: 0.875rem; color: #0f172a; font-family: inherit; resize: vertical; line-height: 1.6; }
        textarea.remarks-box:focus { outline: none; border-color: #2563eb; }
        .char-count { font-size: 0.72rem; color: #94a3b8; margin-top: 4px; margin-bottom: 16px; }
        .action-error { font-size: 0.78rem; color: #ef4444; text-align: center; margin-top: 10px; font-weight: 600; display: none; }
        .hidden-section { display: none; }
        .cie-box { background: #f0f9ff; border: 1.5px solid #bae6fd; border-radius: 12px; padding: 16px; margin-bottom: 16px; }
        .cie-question { font-size: 0.875rem; font-weight: 600; color: #0f172a; margin-bottom: 12px; }
        .cie-options { display: flex; gap: 16px; }
        .cie-radio { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 0.875rem; font-weight: 500; color: #0f172a; }
        .cie-radio input { width: 16px; height: 16px; accent-color: #2563eb; cursor: pointer; }
    </style>
</head>
<body>
    <div class="header">
        <img src="https://sssihl-student-service.pages.dev/Examinations_Service.png" alt="SSSIHL Examination Services">
    </div>
    <div class="card">
        ${alreadyActed
            ? `<div style="text-align:center;padding:16px 0;">
                   <div class="icon-wrap">&#10003;</div>
                   <h1>Already Forwarded</h1>
                   <p class="subtitle">This application has already been forwarded to the Director. No further action is required.</p>
               </div>`
            : `<div class="icon-wrap">&#128203;</div>
               <h1>Review Application</h1>
               <p class="subtitle">Please classify the case, add your remarks, and forward to the Director.</p>

               <div class="details-box">
                   <div class="detail-row"><span class="detail-label">Application ID</span><span class="detail-value">${escapeHtml(app.id)}</span></div>
                   <div class="detail-row"><span class="detail-label">Applicant Name</span><span class="detail-value">${escapeHtml(app.applicant_name)}</span></div>
                   <div class="detail-row"><span class="detail-label">Form Type</span><span class="detail-value" style="font-size:0.8rem;">${escapeHtml(app.form_type)}</span></div>
                   <div class="detail-row"><span class="detail-label">Campus</span><span class="detail-value">${escapeHtml(app.campus)}</span></div>
               </div>

               <p class="section-label">Select Case Type</p>
               ${caseTypeOptions}

               <div id="regularSection" class="hidden-section">
                   <label class="field-label">Remarks <span style="color:#94a3b8;font-weight:400;">(optional)</span></label>
                   <textarea id="regularRemarks" class="remarks-box" rows="3" placeholder="Add any remarks for the Director..."></textarea>
                   <p class="char-count" id="regularCharCount">0 characters</p>
                   <button id="fwdBtn_regular" class="btn btn-blue" onclick="submitForward('regular')">&#10145; Forward to Director</button>
               </div>

               ${isRepeatPaper ? `
               <div id="repeat_caseSection" class="hidden-section">
                   <div class="cie-box">
                       <p class="cie-question">The candidate has completed all the CIE tests:</p>
                       <div class="cie-options">
                           <label class="cie-radio"><input type="radio" name="cieSatisfied" value="yes"> Yes</label>
                           <label class="cie-radio"><input type="radio" name="cieSatisfied" value="no"> No</label>
                       </div>
                   </div>
                   <label class="field-label">Remarks <span style="color:#94a3b8;font-weight:400;">(optional)</span></label>
                   <textarea id="repeatRemarks" class="remarks-box" rows="3" placeholder="Add any remarks for the Director..."></textarea>
                   <p class="char-count" id="repeatCharCount">0 characters</p>
                   <button id="fwdBtn_repeat_case" class="btn btn-blue" onclick="submitForward('repeat_case')">&#10145; Forward to Director</button>
               </div>` : ''}

               <div id="condonationSection" class="hidden-section">
                   <div class="upload-note">
                       <p>Upload Approval Letter from Administration</p>
                       <p>Please upload the approval letter from Administration (PDF/JPG/PNG, max 3 MB) before forwarding.</p>
                   </div>
                   <input type="file" id="letterFile" accept=".pdf,.jpg,.jpeg,.png" class="file-input" onchange="validateFileSize()">
                   <div class="file-drop-zone" id="dropZone" onclick="document.getElementById('letterFile').click()" ondragover="event.preventDefault();this.style.borderColor='#2563eb';" ondragleave="this.style.borderColor='';" ondrop="handleDrop(event)">
                       <div class="drop-icon">&#128196;</div>
                       <div class="drop-label">Click to choose file or drag &amp; drop here</div>
                       <div class="drop-sub">PDF, JPG or PNG &mdash; max 3 MB</div>
                       <div class="drop-chosen" id="chosenFileName"></div>
                   </div>
                   <p id="fileSizeError" class="error-text">File must be under 3 MB.</p>
                   <p id="fileTypeError" class="error-text">Only PDF, JPG, or PNG files are allowed.</p>
                   <button id="uploadBtn" class="btn btn-blue" style="margin-bottom:12px;" onclick="uploadLetter()" disabled>Upload Letter</button>
                   <p id="uploadStatus" class="status-text"></p>
                   <div id="afterUpload" class="hidden-section">
                       <label class="field-label">Remarks <span style="color:#94a3b8;font-weight:400;">(optional)</span></label>
                       <textarea id="condonationRemarks" class="remarks-box" rows="3" placeholder="Add any remarks for the Director..."></textarea>
                       <p class="char-count" id="condonationCharCount">0 characters</p>
                       <button id="fwdBtn_condonation" class="btn btn-blue" onclick="submitForward('condonation')">&#10145; Forward to Director</button>
                   </div>
               </div>
               <p id="actionError" class="action-error"></p>`
        }
    </div>
    <script>
    var APP_ID = ${JSON.stringify(app.id)};
    var CSRF_PAYLOAD = ${JSON.stringify(csrfPayload)};
    var CSRF_SIG = ${JSON.stringify(csrfSig)};
    var letterUploaded = false;

    document.getElementById('regularRemarks') && document.getElementById('regularRemarks').addEventListener('input', function() {
        document.getElementById('regularCharCount').textContent = this.value.length + ' characters';
    });
    document.getElementById('repeatRemarks') && document.getElementById('repeatRemarks').addEventListener('input', function() {
        document.getElementById('repeatCharCount').textContent = this.value.length + ' characters';
    });
    document.getElementById('condonationRemarks') && document.getElementById('condonationRemarks').addEventListener('input', function() {
        document.getElementById('condonationCharCount').textContent = this.value.length + ' characters';
    });

    function showSection(type) {
        ['regular', 'repeat_case', 'condonation'].forEach(function(s) {
            var el = document.getElementById(s + 'Section');
            if (el) el.style.display = (s === type) ? 'block' : 'none';
        });
        document.getElementById('actionError').style.display = 'none';
    }

    function handleDrop(e) {
        e.preventDefault();
        var dt = e.dataTransfer;
        if (dt && dt.files && dt.files.length) {
            try { var t = new DataTransfer(); t.items.add(dt.files[0]); document.getElementById('letterFile').files = t.files; } catch(ex) {}
            validateFileSize();
        }
    }

    function validateFileSize() {
        var input = document.getElementById('letterFile');
        var sizeErr = document.getElementById('fileSizeError');
        var typeErr = document.getElementById('fileTypeError');
        var btn = document.getElementById('uploadBtn');
        var dropZone = document.getElementById('dropZone');
        var nameEl = document.getElementById('chosenFileName');
        sizeErr.style.display = 'none'; typeErr.style.display = 'none'; btn.disabled = true;
        dropZone.classList.remove('has-file'); nameEl.textContent = '';
        if (!input.files || !input.files.length) return;
        var file = input.files[0];
        var allowed = ['application/pdf','image/jpeg','image/png','image/jpg'];
        if (allowed.indexOf(file.type) === -1) { typeErr.style.display = 'block'; return; }
        if (file.size > 3 * 1024 * 1024) { sizeErr.style.display = 'block'; return; }
        dropZone.classList.add('has-file'); nameEl.textContent = '&#10003; ' + file.name; btn.disabled = false;
    }

    function uploadLetter() {
        var input = document.getElementById('letterFile');
        if (!input.files || !input.files.length) return;
        var statusEl = document.getElementById('uploadStatus');
        var btn = document.getElementById('uploadBtn');
        btn.disabled = true; btn.textContent = 'Uploading...'; statusEl.textContent = ''; statusEl.className = 'status-text';
        var fd = new FormData();
        fd.append('id', APP_ID); fd.append('file', input.files[0]);
        fd.append('csrf_payload', CSRF_PAYLOAD); fd.append('csrf_sig', CSRF_SIG);
        fetch('/campus-exam-upload-letter', { method: 'POST', body: fd })
            .then(function(res) { return res.json(); })
            .then(function(data) {
                if (data.success) {
                    letterUploaded = true;
                    statusEl.textContent = 'Letter uploaded successfully.';
                    statusEl.className = 'status-text status-ok';
                    document.getElementById('afterUpload').style.display = 'block';
                    btn.textContent = 'Uploaded';
                } else {
                    statusEl.textContent = data.error || 'Upload failed.';
                    statusEl.className = 'status-text status-err';
                    btn.disabled = false; btn.textContent = 'Upload Letter';
                }
            })
            .catch(function() {
                statusEl.textContent = 'Upload failed. Please check your connection.';
                statusEl.className = 'status-text status-err';
                btn.disabled = false; btn.textContent = 'Upload Letter';
            });
    }

    function submitForward(caseType) {
        var errEl = document.getElementById('actionError');
        errEl.style.display = 'none';

        var remarks = '';
        if (caseType === 'regular' || caseType === 'regular_supplementary') {
            remarks = (document.getElementById('regularRemarks') || {}).value || '';
        } else if (caseType === 'repeat_case') {
            var cieRadio = document.querySelector('input[name="cieSatisfied"]:checked');
            if (!cieRadio) {
                errEl.textContent = 'Please select Yes or No for CIE completion status.';
                errEl.style.display = 'block'; return;
            }
            remarks = (document.getElementById('repeatRemarks') || {}).value || '';
        } else if (caseType === 'condonation') {
            if (!letterUploaded) {
                errEl.textContent = "Please upload the Registrar's letter before forwarding.";
                errEl.style.display = 'block'; return;
            }
            remarks = (document.getElementById('condonationRemarks') || {}).value || '';
        }

        var cieSatisfied = '';
        if (caseType === 'repeat_case') {
            var cieRadioEl = document.querySelector('input[name="cieSatisfied"]:checked');
            cieSatisfied = cieRadioEl ? cieRadioEl.value : '';
        }

        var fd = new FormData();
        fd.append('id', APP_ID);
        fd.append('caseType', caseType);
        fd.append('cieSatisfied', cieSatisfied);
        fd.append('remarks', remarks.trim());
        fd.append('csrf_payload', CSRF_PAYLOAD);
        fd.append('csrf_sig', CSRF_SIG);

        var btn = document.getElementById('fwdBtn_' + caseType);
        if (btn) { btn.disabled = true; btn.textContent = 'Forwarding...'; }

        fetch('/campus-exam-action', { method: 'POST', body: fd })
            .then(function(res) {
                if (res.ok) return res.text().then(function(html) { document.open(); document.write(html); document.close(); });
                errEl.textContent = 'Action failed. Please try again.';
                errEl.style.display = 'block';
                if (btn) { btn.disabled = false; btn.textContent = '&#10145; Forward to Director'; }
            })
            .catch(function() {
                errEl.textContent = 'Request failed. Please check your connection.';
                errEl.style.display = 'block';
                if (btn) { btn.disabled = false; btn.textContent = '&#10145; Forward to Director'; }
            });
    }
    </script>
</body>
</html>`;
    return new Response(pageHtml, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

async function handleCampusExamUploadLetter(request, env, corsHeaders) {
    const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json' };
    let formData;
    try { formData = await request.formData(); } catch (e) {
        return new Response(JSON.stringify({ error: 'Invalid form data' }), { status: 400, headers: jsonHeaders });
    }
    const id = (formData.get('id') || '').trim();
    const csrfPayload = (formData.get('csrf_payload') || '').trim();
    const csrfSig = (formData.get('csrf_sig') || '').trim();
    const file = formData.get('file');

    if (!csrfPayload || !csrfSig)
        return new Response(JSON.stringify({ error: 'Forbidden — missing CSRF token' }), { status: 403, headers: jsonHeaders });
    const [, expStr] = csrfPayload.split(':');
    if (!expStr || Date.now() > parseInt(expStr))
        return new Response(JSON.stringify({ error: 'CSRF token expired' }), { status: 403, headers: jsonHeaders });
    const sigValid = await hmacVerify(env.CSRF_SECRET || 'fallback-dev-secret', csrfPayload, csrfSig);
    if (!sigValid)
        return new Response(JSON.stringify({ error: 'Invalid CSRF token' }), { status: 403, headers: jsonHeaders });

    const app = await env.DB.prepare('SELECT id, status FROM applications WHERE id = ?').bind(id).first();
    if (!app || app.status !== 'AWAITING_CAMPUS_EXAM')
        return new Response(JSON.stringify({ error: 'Application not found or not in review state' }), { status: 404, headers: jsonHeaders });

    if (!file || !file.name)
        return new Response(JSON.stringify({ error: 'No file provided' }), { status: 400, headers: jsonHeaders });
    if (file.size > 3 * 1024 * 1024)
        return new Response(JSON.stringify({ error: 'File exceeds 3 MB limit' }), { status: 400, headers: jsonHeaders });

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type))
        return new Response(JSON.stringify({ error: 'Only PDF, JPG, or PNG files are allowed' }), { status: 400, headers: jsonHeaders });

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < uint8Array.length; i++) binary += String.fromCharCode(uint8Array[i]);
    const base64 = btoa(binary);

    await env.DB.prepare(
        `INSERT INTO file_blobs (application_id, field_name, file_name, file_type, file_size, file_data, is_response, uploaded_by)
         VALUES (?, 'campus_exam_condonation_letter', ?, ?, ?, ?, TRUE, 'campus_exam')`
    ).bind(id, file.name, file.type, file.size, base64).run();

    return new Response(JSON.stringify({ success: true }), { headers: jsonHeaders });
}

async function handleCampusExamAction(request, env, corsHeaders) {
    let formData;
    try { formData = await request.formData(); } catch (e) {
        return new Response('Invalid form data', { status: 400, headers: corsHeaders });
    }

    const id = (formData.get('id') || '').trim();
    const caseType = (formData.get('caseType') || '').trim();
    const cieSatisfied = (formData.get('cieSatisfied') || '').trim();
    const remarks = (formData.get('remarks') || '').trim();
    const csrfPayload = (formData.get('csrf_payload') || '').trim();
    const csrfSig = (formData.get('csrf_sig') || '').trim();

    if (!csrfPayload || !csrfSig)
        return new Response('Forbidden — missing CSRF token', { status: 403, headers: corsHeaders });
    const [, expStr] = csrfPayload.split(':');
    if (!expStr || Date.now() > parseInt(expStr))
        return new Response('CSRF token expired', { status: 403, headers: corsHeaders });
    const sigValid = await hmacVerify(env.CSRF_SECRET || 'fallback-dev-secret', csrfPayload, csrfSig);
    if (!sigValid)
        return new Response('Invalid CSRF token', { status: 403, headers: corsHeaders });

    const app = await env.DB.prepare(
        'SELECT id, applicant_name, form_type, campus, student_email, reg_no, programme, status FROM applications WHERE id = ?'
    ).bind(id).first();

    if (!app || app.status !== 'AWAITING_CAMPUS_EXAM') {
        return new Response('Application not found or not in campus exam review state', { status: 400, headers: corsHeaders });
    }

    if (!['regular_supplementary', 'regular', 'repeat_case', 'condonation'].includes(caseType)) {
        return new Response('Invalid case type', { status: 400, headers: corsHeaders });
    }

    await env.DB.prepare(
        `UPDATE applications SET
            status = 'AWAITING_DIRECTOR',
            campus_exam_status = 'FORWARDED',
            campus_exam_case_type = ?,
            campus_exam_cie_satisfied = ?,
            campus_exam_remarks = ?,
            updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`
    ).bind(caseType, cieSatisfied || null, remarks || null, id).run();

    await logAuditEvent(env, 'CampusExam', 'FORWARDED_TO_DIRECTOR', id, { caseType, cieSatisfied });

    try {
        const overrideEmail = id.startsWith('TEST-') ? app.student_email : null;
        await sendDirectorNotificationFromCampusExam(
            env, request, id, app.form_type, app.applicant_name, app.student_email,
            app.campus, null, app.reg_no, app.programme,
            caseType, cieSatisfied, remarks, overrideEmail
        );
    } catch (e) {
        console.error('Failed to send director notification from campus exam action:', e);
    }

    const successHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Forwarded to Director - SSSIHL</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@700;800&display=swap" rel="stylesheet">
    <style>* { margin:0; padding:0; box-sizing:border-box; } body { font-family:'Inter',sans-serif; background:#f1f5f9; min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:40px 20px; } .card { background:white; border-radius:20px; padding:48px 40px; max-width:500px; width:100%; text-align:center; box-shadow:0 10px 25px -5px rgba(15,23,42,0.08); } .icon { width:80px; height:80px; border-radius:50%; background:#d1fae5; display:flex; align-items:center; justify-content:center; margin:0 auto 24px; font-size:40px; } h1 { font-family:'Outfit',sans-serif; color:#0f172a; font-size:1.8rem; margin-bottom:12px; } p { color:#64748b; font-size:0.95rem; line-height:1.7; } .app-id { display:inline-block; margin-top:20px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:8px 16px; font-size:0.85rem; color:#64748b; font-family:monospace; }</style>
</head>
<body>
    <div class="card">
        <div class="icon">&#10145;</div>
        <h1>Forwarded to Director</h1>
        <p>The application has been forwarded to the Director with your remarks. The Director has been notified by email.</p>
        <div class="app-id">Application ID: ${escapeHtml(id)}</div>
    </div>
</body>
</html>`;
    return new Response(successHtml, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

async function handleDirectorCommentPage(url, env, corsHeaders) {
    const id = url.searchParams.get('id');
    if (!id) return new Response('Missing application ID', { status: 400, headers: corsHeaders });

    const app = await env.DB.prepare(
        'SELECT id, applicant_name, form_type, campus, status, campus_exam_case_type, campus_exam_cie_satisfied, campus_exam_remarks FROM applications WHERE id = ?'
    ).bind(id).first();

    if (!app) return new Response('Application not found', { status: 404, headers: corsHeaders });

    const alreadyActed = app.status !== 'AWAITING_DIRECTOR';

    // Generate CSRF token (random nonce + expiry, signed with HMAC-SHA256)
    const nonce = Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b => b.toString(16).padStart(2, '0')).join('');
    const exp = Date.now() + 3600000; // 1 hour
    const csrfPayload = `${nonce}:${exp}`;
    const csrfSig = await hmacSign(env.CSRF_SECRET || 'fallback-dev-secret', csrfPayload);

    const REPEAT_PAPER_FORM = 'Application for Repeating Examinations Registration (CIE and ESE)';
    if (app.form_type === 'Application for Supplementary Examinations Registration' || app.form_type === REPEAT_PAPER_FORM) {
        const suppHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Review Application - SSSIHL Examination Services</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Outfit:wght@700;800&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; background: linear-gradient(135deg, #f1f5f9, #e2e8f0); min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; padding: 40px 20px; }
        .header { text-align: center; margin-bottom: 28px; }
        .header img { height: 90px; width: auto; }
        .card { background: white; border-radius: 20px; padding: 36px 32px; max-width: 520px; width: 100%; box-shadow: 0 10px 30px -5px rgba(15,23,42,0.10); border: 1px solid #e2e8f0; }
        .icon-wrap { width: 64px; height: 64px; border-radius: 50%; background: #eff6ff; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 30px; }
        h1 { font-family: 'Outfit', sans-serif; color: #0f172a; font-size: 1.5rem; text-align: center; margin-bottom: 6px; }
        .subtitle { color: #64748b; font-size: 0.875rem; text-align: center; line-height: 1.6; margin-bottom: 24px; }
        .details-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 24px; }
        .detail-row { display: flex; justify-content: space-between; align-items: flex-start; padding: 8px 0; border-bottom: 1px solid #e2e8f0; gap: 12px; }
        .detail-row:last-child { border-bottom: none; padding-bottom: 0; }
        .detail-label { font-size: 0.72rem; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; flex-shrink: 0; }
        .detail-value { font-size: 0.875rem; color: #0f172a; font-weight: 600; text-align: right; }
        .section-label { font-size: 0.8rem; font-weight: 700; color: #0f172a; margin-bottom: 12px; }
        .radio-option { display: flex; align-items: flex-start; gap: 12px; padding: 14px; border: 1.5px solid #e2e8f0; border-radius: 12px; cursor: pointer; margin-bottom: 10px; }
        .radio-option input { margin-top: 2px; width: 16px; height: 16px; flex-shrink: 0; cursor: pointer; accent-color: #2563eb; }
        .radio-option-text p:first-child { font-size: 0.875rem; font-weight: 600; color: #0f172a; margin-bottom: 2px; }
        .radio-option-text p:last-child { font-size: 0.75rem; color: #64748b; }
        .btn-row { display: flex; gap: 12px; margin-bottom: 16px; }
        .btn { flex: 1; padding: 12px 16px; font-size: 0.875rem; font-weight: 700; border: none; border-radius: 10px; cursor: pointer; font-family: inherit; }
        .btn:disabled { opacity: 0.45; cursor: not-allowed; }
        .btn-green { background: #10b981; color: white; }
        .btn-red { background: #ef4444; color: white; }
        .btn-blue { background: #2563eb; color: white; }
        .upload-note { background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 14px; margin-bottom: 16px; }
        .upload-note p:first-child { font-size: 0.82rem; font-weight: 700; color: #92400e; margin-bottom: 4px; }
        .upload-note p:last-child { font-size: 0.75rem; color: #a16207; line-height: 1.5; }
        .file-input { display: none; }
        .file-drop-zone { border: 2px dashed #cbd5e1; border-radius: 12px; padding: 20px 16px; text-align: center; cursor: pointer; transition: border-color 0.2s, background 0.2s; margin-bottom: 6px; background: #f8fafc; }
        .file-drop-zone:hover { border-color: #2563eb; background: #eff6ff; }
        .file-drop-zone.has-file { border-color: #10b981; background: #f0fdf4; }
        .file-drop-zone .drop-icon { font-size: 26px; margin-bottom: 8px; }
        .file-drop-zone .drop-label { font-size: 0.82rem; font-weight: 600; color: #475569; margin-bottom: 4px; }
        .file-drop-zone .drop-sub { font-size: 0.72rem; color: #94a3b8; }
        .file-drop-zone .drop-chosen { font-size: 0.8rem; font-weight: 700; color: #059669; margin-top: 6px; word-break: break-all; }
        .error-text { font-size: 0.75rem; color: #ef4444; font-weight: 600; margin-top: 4px; margin-bottom: 8px; display: none; }
        .status-text { font-size: 0.75rem; text-align: center; margin-bottom: 12px; }
        .status-ok { color: #10b981; font-weight: 600; }
        .status-err { color: #ef4444; font-weight: 600; }
        label.field-label { display: block; font-size: 0.82rem; font-weight: 700; color: #0f172a; margin-bottom: 8px; }
        textarea { width: 100%; border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 12px 14px; font-size: 0.875rem; color: #0f172a; font-family: inherit; resize: vertical; line-height: 1.6; }
        textarea:focus { outline: none; border-color: #2563eb; }
        .char-count { font-size: 0.72rem; color: #94a3b8; margin-top: 4px; margin-bottom: 12px; }
        .action-error { font-size: 0.78rem; color: #ef4444; text-align: center; margin-top: 10px; font-weight: 600; display: none; }
        .hidden-section { display: none; }
    </style>
</head>
<body>
    <div class="header">
        <img src="https://sssihl-student-service.pages.dev/Examinations_Service.png" alt="SSSIHL Examination Services">
    </div>
    <div class="card">
        ${(() => {
            if (alreadyActed) {
                return `<div style="text-align:center;padding:16px 0;">
                   <div class="icon-wrap">ℹ️</div>
                   <h1>Already Submitted</h1>
                   <p class="subtitle">This application has already been acted upon. No further action is required from your end.</p>
               </div>`;
            }
            const hasCampusExamInfo = !!app.campus_exam_case_type;
            const caseType = app.campus_exam_case_type || '';
            const cieSatisfied = app.campus_exam_cie_satisfied || '';
            const campusRemarks = app.campus_exam_remarks || '';
            const isRepeatCase = caseType === 'repeat_case';
            const cieYes = isRepeatCase && cieSatisfied === 'yes';
            const cieNo = isRepeatCase && cieSatisfied === 'no';
            const caseTypeLabel = caseType === 'regular_supplementary' ? 'Regular Supplementary Case'
                : caseType === 'regular' ? 'Regular Case'
                : caseType === 'repeat_case' ? 'Repeat Case'
                : caseType === 'condonation' ? 'Condonation Case'
                : '';
            const cieRemark = cieYes
                ? 'Yes, the candidate has completed CIE tests satisfactorily.'
                : cieNo ? 'No, the candidate has not completed CIE tests satisfactorily.' : '';

            const campusExamInfoBox = hasCampusExamInfo ? `
               <div style="background:#f0f9ff;border:1.5px solid #bae6fd;border-radius:12px;padding:16px;margin-bottom:20px;">
                   <p style="font-size:0.75rem;font-weight:700;color:#0369a1;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:10px;">&#128203; Campus Examination Section Remarks</p>
                   ${caseTypeLabel ? `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #bae6fd;"><span style="font-size:0.72rem;color:#64748b;font-weight:600;">Case Type</span><span style="font-size:0.875rem;font-weight:700;color:#0f172a;">${escapeHtml(caseTypeLabel)}</span></div>` : ''}
                   ${cieRemark ? `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #bae6fd;"><span style="font-size:0.72rem;color:#64748b;font-weight:600;">CIE Status</span><span style="font-size:0.875rem;font-weight:700;color:${cieYes ? '#059669' : '#dc2626'};">${escapeHtml(cieRemark)}</span></div>` : ''}
                   ${campusRemarks ? `<div style="padding:6px 0;"><span style="font-size:0.72rem;color:#64748b;font-weight:600;display:block;margin-bottom:4px;">Remarks</span><span style="font-size:0.875rem;color:#0f172a;line-height:1.5;">${escapeHtml(campusRemarks)}</span></div>` : ''}
               </div>` : '';

            const actionButtons = hasCampusExamInfo
                ? (cieYes
                    ? `<div class="btn-row">
                           <button class="btn btn-green" onclick="submitAction('approve', '${caseType}')">&#10003; Accept</button>
                       </div>`
                    : cieNo
                        ? `<div class="btn-row" id="rejectBtnRow">
                               <button class="btn btn-red" onclick="showRejectForm('campus')">&#10007; Reject</button>
                           </div>
                           <div id="campusRejectForm" class="hidden-section">
                               <label class="field-label">Reason for Rejection</label>
                               <textarea id="campusComment" rows="4" placeholder="Please provide the reason for rejection..."></textarea>
                               <p class="char-count" id="campusCharCount">0 characters</p>
                               <button class="btn btn-red" style="width:100%;" onclick="submitReject('campus')">Submit Rejection</button>
                           </div>`
                        : `<div class="btn-row">
                               <button class="btn btn-green" onclick="submitAction('approve', '${caseType}')">&#10003; Accept</button>
                               <button class="btn btn-red" onclick="showRejectForm('campus')">&#10007; Reject</button>
                           </div>
                           <div id="campusRejectForm" class="hidden-section">
                               <label class="field-label">Reason for Rejection</label>
                               <textarea id="campusComment" rows="4" placeholder="Please provide the reason for rejection..."></textarea>
                               <p class="char-count" id="campusCharCount">0 characters</p>
                               <button class="btn btn-red" style="width:100%;" onclick="submitReject('campus')">Submit Rejection</button>
                           </div>`)
                : `<p class="section-label">Select Case Type</p>
               <label class="radio-option">
                   <input type="radio" name="caseType" value="regular" onchange="showSection('regular')">
                   <div class="radio-option-text"><p>Regular Supplementary Case</p><p>Standard supplementary examination case</p></div>
               </label>
               <label class="radio-option" style="margin-bottom:20px;">
                   <input type="radio" name="caseType" value="condonation" onclick="showSection('condonation')">
                   <div class="radio-option-text"><p>Condonation Case</p><p>Requires approval letter from Administration</p></div>
               </label>

               <div id="regularSection" class="hidden-section">
                   <div class="btn-row">
                       <button class="btn btn-green" onclick="submitAction('approve', 'regular')">&#10003; Accept</button>
                       <button class="btn btn-red" onclick="showRejectForm('regular')">&#10007; Reject</button>
                   </div>
                   <div id="regularRejectForm" class="hidden-section">
                       <label class="field-label">Reason for Rejection</label>
                       <textarea id="regularComment" rows="4" placeholder="Please provide the reason for rejection..."></textarea>
                       <p class="char-count" id="regularCharCount">0 characters</p>
                       <button class="btn btn-red" style="width:100%;" onclick="submitReject('regular')">Submit Rejection</button>
                   </div>
               </div>

               <div id="condonationSection" class="hidden-section">
                   <div class="upload-note">
                       <p>Upload Approval Letter from Administration</p>
                       <p>Please upload the approval letter from Administration (PDF/JPG/PNG, max 3 MB). Accept/Reject options will appear after upload.</p>
                   </div>
                   <input type="file" id="letterFile" accept=".pdf,.jpg,.jpeg,.png" class="file-input" onchange="validateFileSize()">
                   <div class="file-drop-zone" id="dropZone" onclick="document.getElementById('letterFile').click()" ondragover="event.preventDefault();this.style.borderColor='#2563eb';" ondragleave="this.style.borderColor='';" ondrop="handleDrop(event)">
                       <div class="drop-icon">&#128196;</div>
                       <div class="drop-label">Click to choose file or drag &amp; drop here</div>
                       <div class="drop-sub">PDF, JPG or PNG &mdash; max 3 MB</div>
                       <div class="drop-chosen" id="chosenFileName"></div>
                   </div>
                   <p id="fileSizeError" class="error-text">File must be under 3 MB.</p>
                   <p id="fileTypeError" class="error-text">Only PDF, JPG, or PNG files are allowed.</p>
                   <button id="uploadBtn" class="btn btn-blue" style="width:100%;margin-bottom:8px;" onclick="uploadLetter()" disabled>Upload Letter</button>
                   <p id="uploadStatus" class="status-text"></p>
                   <div id="afterUpload" class="hidden-section">
                       <div class="btn-row">
                           <button class="btn btn-green" onclick="submitAction('approve', 'condonation')">&#10003; Accept</button>
                           <button class="btn btn-red" onclick="showRejectForm('condonation')">&#10007; Reject</button>
                       </div>
                       <div id="condonationRejectForm" class="hidden-section">
                           <label class="field-label">Reason for Rejection</label>
                           <textarea id="condonationComment" rows="4" placeholder="Please provide the reason for rejection..."></textarea>
                           <p class="char-count" id="condonationCharCount">0 characters</p>
                           <button class="btn btn-red" style="width:100%;" onclick="submitReject('condonation')">Submit Rejection</button>
                       </div>
                   </div>
               </div>`;

            return `<div class="icon-wrap">📋</div>
               <h1>Review Application</h1>
               <p class="subtitle">${hasCampusExamInfo ? 'Application forwarded by the Campus Examination Section. Please review and record your decision.' : 'Please classify the case and record your decision below.'}</p>

               <div class="details-box">
                   <div class="detail-row"><span class="detail-label">Application ID</span><span class="detail-value">${escapeHtml(app.id)}</span></div>
                   <div class="detail-row"><span class="detail-label">Applicant Name</span><span class="detail-value">${escapeHtml(app.applicant_name)}</span></div>
                   <div class="detail-row"><span class="detail-label">Form Type</span><span class="detail-value" style="font-size:0.8rem;">${escapeHtml(app.form_type)}</span></div>
                   <div class="detail-row"><span class="detail-label">Campus</span><span class="detail-value">${escapeHtml(app.campus)}</span></div>
               </div>

               ${campusExamInfoBox}
               ${actionButtons}
               <p id="actionError" class="action-error"></p>`;
        })()}
    </div>
    <script>
    var APP_ID = ${JSON.stringify(app.id)};
    var CSRF_PAYLOAD = ${JSON.stringify(csrfPayload)};
    var CSRF_SIG = ${JSON.stringify(csrfSig)};
    var currentCaseType = 'regular';

    document.getElementById('regularComment') && document.getElementById('regularComment').addEventListener('input', function() {
        document.getElementById('regularCharCount').textContent = this.value.length + ' characters';
    });
    document.getElementById('condonationComment') && document.getElementById('condonationComment').addEventListener('input', function() {
        document.getElementById('condonationCharCount').textContent = this.value.length + ' characters';
    });

    function showSection(type) {
        currentCaseType = type;
        document.getElementById('regularSection').style.display = (type === 'regular') ? 'block' : 'none';
        document.getElementById('condonationSection').style.display = (type === 'condonation') ? 'block' : 'none';
        document.getElementById('regularRejectForm').style.display = 'none';
        document.getElementById('condonationRejectForm').style.display = 'none';
        document.getElementById('afterUpload').style.display = 'none';
        document.getElementById('actionError').style.display = 'none';
    }

    function handleDrop(e) {
        e.preventDefault();
        var input = document.getElementById('letterFile');
        var dt = e.dataTransfer;
        if (dt && dt.files && dt.files.length) {
            var dummyInput = document.getElementById('letterFile');
            // Assign dropped files via DataTransfer
            try {
                var transfer = new DataTransfer();
                transfer.items.add(dt.files[0]);
                dummyInput.files = transfer.files;
            } catch(ex) {}
            validateFileSize();
        }
    }

    function validateFileSize() {
        var input = document.getElementById('letterFile');
        var sizeErr = document.getElementById('fileSizeError');
        var typeErr = document.getElementById('fileTypeError');
        var btn = document.getElementById('uploadBtn');
        var dropZone = document.getElementById('dropZone');
        var nameEl = document.getElementById('chosenFileName');
        sizeErr.style.display = 'none';
        typeErr.style.display = 'none';
        btn.disabled = true;
        dropZone.classList.remove('has-file');
        nameEl.textContent = '';
        if (!input.files || !input.files.length) return;
        var file = input.files[0];
        var allowed = ['application/pdf','image/jpeg','image/png','image/jpg'];
        if (allowed.indexOf(file.type) === -1) { typeErr.style.display = 'block'; return; }
        if (file.size > 3 * 1024 * 1024) { sizeErr.style.display = 'block'; return; }
        dropZone.classList.add('has-file');
        nameEl.textContent = '&#10003; ' + file.name;
        btn.disabled = false;
    }

    function uploadLetter() {
        var input = document.getElementById('letterFile');
        if (!input.files || !input.files.length) return;
        var statusEl = document.getElementById('uploadStatus');
        var btn = document.getElementById('uploadBtn');
        btn.disabled = true;
        btn.textContent = 'Uploading...';
        statusEl.textContent = '';
        statusEl.className = 'status-text';
        var fd = new FormData();
        fd.append('id', APP_ID);
        fd.append('file', input.files[0]);
        fd.append('csrf_payload', CSRF_PAYLOAD);
        fd.append('csrf_sig', CSRF_SIG);
        fetch('/director-upload-letter', { method: 'POST', body: fd })
            .then(function(res) { return res.json(); })
            .then(function(data) {
                if (data.success) {
                    statusEl.textContent = 'Letter uploaded successfully.';
                    statusEl.className = 'status-text status-ok';
                    document.getElementById('afterUpload').style.display = 'block';
                    btn.textContent = 'Uploaded';
                } else {
                    statusEl.textContent = data.error || 'Upload failed. Please try again.';
                    statusEl.className = 'status-text status-err';
                    btn.disabled = false;
                    btn.textContent = 'Upload Letter';
                }
            })
            .catch(function() {
                statusEl.textContent = 'Upload failed. Please check your connection.';
                statusEl.className = 'status-text status-err';
                btn.disabled = false;
                btn.textContent = 'Upload Letter';
            });
    }

    document.getElementById('campusComment') && document.getElementById('campusComment').addEventListener('input', function() {
        document.getElementById('campusCharCount').textContent = this.value.length + ' characters';
    });

    function showRejectForm(section) {
        var el = document.getElementById(section + 'RejectForm');
        if (el) el.style.display = 'block';
    }

    function doAction(fd) {
        var errEl = document.getElementById('actionError');
        errEl.style.display = 'none';
        fetch('/director-action', { method: 'POST', body: fd })
            .then(function(res) {
                if (res.ok) {
                    return res.text().then(function(html) {
                        document.open(); document.write(html); document.close();
                    });
                } else {
                    errEl.textContent = 'Action failed. Please try again.';
                    errEl.style.display = 'block';
                }
            })
            .catch(function() {
                errEl.textContent = 'Request failed. Please check your connection.';
                errEl.style.display = 'block';
            });
    }

    function submitAction(action, caseType) {
        var fd = new FormData();
        fd.append('id', APP_ID);
        fd.append('action', action);
        fd.append('caseType', caseType || currentCaseType);
        fd.append('csrf_payload', CSRF_PAYLOAD);
        fd.append('csrf_sig', CSRF_SIG);
        doAction(fd);
    }

    function submitReject(section) {
        var commentEl = document.getElementById(section + 'Comment');
        var comment = commentEl ? commentEl.value.trim() : '';
        var errEl = document.getElementById('actionError');
        if (!comment) {
            errEl.textContent = 'Please enter a reason for rejection before submitting.';
            errEl.style.display = 'block';
            return;
        }
        var fd = new FormData();
        fd.append('id', APP_ID);
        fd.append('action', 'reject');
        fd.append('caseType', currentCaseType);
        fd.append('comment', comment);
        fd.append('csrf_payload', CSRF_PAYLOAD);
        fd.append('csrf_sig', CSRF_SIG);
        doAction(fd);
    }
    </script>
</body>
</html>`;
        return new Response(suppHtml, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }

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
        <img src="https://sssihl-student-service.pages.dev/Examinations_Service.png" alt="SSSIHL" class="w-auto h-24 mx-auto">
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

async function handleDirectorUploadLetter(request, env, corsHeaders) {
    const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json' };
    let formData;
    try { formData = await request.formData(); } catch (e) {
        return new Response(JSON.stringify({ error: 'Invalid form data' }), { status: 400, headers: jsonHeaders });
    }
    const id = (formData.get('id') || '').trim();
    const csrfPayload = (formData.get('csrf_payload') || '').trim();
    const csrfSig = (formData.get('csrf_sig') || '').trim();
    const file = formData.get('file');

    if (!csrfPayload || !csrfSig)
        return new Response(JSON.stringify({ error: 'Forbidden — missing CSRF token' }), { status: 403, headers: jsonHeaders });
    const [, expStr] = csrfPayload.split(':');
    if (!expStr || Date.now() > parseInt(expStr))
        return new Response(JSON.stringify({ error: 'CSRF token expired' }), { status: 403, headers: jsonHeaders });
    const sigValid = await hmacVerify(env.CSRF_SECRET || 'fallback-dev-secret', csrfPayload, csrfSig);
    if (!sigValid)
        return new Response(JSON.stringify({ error: 'Invalid CSRF token' }), { status: 403, headers: jsonHeaders });

    const app = await env.DB.prepare('SELECT id, status FROM applications WHERE id = ?').bind(id).first();
    if (!app || app.status !== 'AWAITING_DIRECTOR')
        return new Response(JSON.stringify({ error: 'Application not found or already processed' }), { status: 404, headers: jsonHeaders });

    if (!file || !file.name)
        return new Response(JSON.stringify({ error: 'No file provided' }), { status: 400, headers: jsonHeaders });
    if (file.size > 3 * 1024 * 1024)
        return new Response(JSON.stringify({ error: 'File exceeds 3 MB limit' }), { status: 400, headers: jsonHeaders });

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type))
        return new Response(JSON.stringify({ error: 'Only PDF, JPG, or PNG files are allowed' }), { status: 400, headers: jsonHeaders });

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < uint8Array.length; i++) binary += String.fromCharCode(uint8Array[i]);
    const base64 = btoa(binary);

    await env.DB.prepare(
        `INSERT INTO file_blobs (application_id, field_name, file_name, file_type, file_size, file_data, is_response, uploaded_by)
         VALUES (?, 'director_condonation_letter', ?, ?, ?, ?, TRUE, 'director')`
    ).bind(id, file.name, file.type, file.size, base64).run();

    return new Response(JSON.stringify({ success: true }), { headers: jsonHeaders });
}

async function handleDirectorAction(request, env, corsHeaders) {
    let formData;
    try { formData = await request.formData(); } catch (e) {
        return new Response('Bad request', { status: 400, headers: corsHeaders });
    }
    const id = (formData.get('id') || '').trim();
    const action = (formData.get('action') || '').trim();
    const rawComment = (formData.get('comment') || '').trim();
    const caseType = (formData.get('caseType') || 'regular').trim();
    const csrfPayload = (formData.get('csrf_payload') || '').trim();
    const csrfSig = (formData.get('csrf_sig') || '').trim();

    if (!csrfPayload || !csrfSig)
        return new Response('Forbidden — missing CSRF token', { status: 403, headers: corsHeaders });
    const [, expStr] = csrfPayload.split(':');
    if (!expStr || Date.now() > parseInt(expStr))
        return new Response('Forbidden — CSRF token expired', { status: 403, headers: corsHeaders });
    const sigValid = await hmacVerify(env.CSRF_SECRET || 'fallback-dev-secret', csrfPayload, csrfSig);
    if (!sigValid)
        return new Response('Forbidden — invalid CSRF token', { status: 403, headers: corsHeaders });

    if (!id || !action)
        return new Response('Missing required fields', { status: 400, headers: corsHeaders });

    const app = await env.DB.prepare('SELECT * FROM applications WHERE id = ?').bind(id).first();

    const alreadyActedHtml = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Already Submitted</title></head><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f1f5f9;"><div style="text-align:center;background:white;border-radius:16px;padding:40px;max-width:480px;box-shadow:0 4px 20px rgba(0,0,0,0.08);"><h2 style="color:#0f172a;">Already Processed</h2><p style="color:#64748b;margin-top:12px;">This application has already been acted upon. No further action is required.</p></div></body></html>`;

    if (!app || app.status !== 'AWAITING_DIRECTOR') {
        return new Response(alreadyActedHtml, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }

    // Fetch programme + semester for student email
    let programme = null, semester = null;
    try {
        if (app.form_type === 'Application for Repeating Examinations Registration (CIE and ESE)') {
            const fd = await env.DB.prepare('SELECT Programme, Semester FROM form_repeat_paper WHERE application_id = ?').bind(id).first();
            if (fd) { programme = fd.Programme || null; semester = fd.Semester || null; }
        } else {
            const fd = await env.DB.prepare('SELECT Programme, Semester FROM form_supplementary_exam WHERE application_id = ?').bind(id).first();
            if (fd) { programme = fd.Programme || null; semester = fd.Semester || null; }
        }
    } catch (e) { /* non-critical */ }

    const verification = { ...app, programme, semester };

    if (action === 'approve') {
        // Director approval goes straight to APPROVED — no intermediate student action needed
        await env.DB.prepare(
            `UPDATE applications SET director_status = 'APPROVED', status = 'APPROVED', updated_at = CURRENT_TIMESTAMP WHERE id = ?`
        ).bind(id).run();
        verification.status = 'APPROVED';
        verification.director_status = 'APPROVED';

        try {
            await sendStudentDecisionEmail(env, verification, true, 'https://sssihl-student-service.pages.dev');
            await sendAdminNotification(env, id, app.form_type, app.applicant_name, app.student_email, null, 'approved');
        } catch (e) { console.error('Email error in director approve:', e); }

        await logAuditEvent(env, 'Director', 'APPROVED', id, { caseType });

        const successHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Application Approved - SSSIHL</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@700;800&display=swap" rel="stylesheet">
    <style>* { margin:0; padding:0; box-sizing:border-box; } body { font-family:'Inter',sans-serif; background:#f1f5f9; min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:40px 20px; } .card { background:white; border-radius:20px; padding:48px 40px; max-width:500px; width:100%; text-align:center; box-shadow:0 10px 25px -5px rgba(15,23,42,0.08); } .icon { width:80px; height:80px; border-radius:50%; background:#d1fae5; display:flex; align-items:center; justify-content:center; margin:0 auto 24px; font-size:40px; } h1 { font-family:'Outfit',sans-serif; color:#0f172a; font-size:1.8rem; margin-bottom:12px; } p { color:#64748b; font-size:0.95rem; line-height:1.7; } .app-id { display:inline-block; margin-top:20px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:8px 16px; font-size:0.85rem; color:#64748b; font-family:monospace; }</style>
</head>
<body>
    <div class="card">
        <div class="icon">✅</div>
        <h1>Application Approved</h1>
        <p>Thank you. The application has been approved and forwarded to the Examination Section. The student has been notified by email.</p>
        <div class="app-id">Application ID: ${escapeHtml(id)}</div>
    </div>
</body>
</html>`;
        return new Response(successHtml, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });

    } else if (action === 'reject') {
        const comment = rawComment.replace(/<[^>]*>/g, '').trim();
        if (!comment) {
            return new Response('Comment is required for rejection', { status: 400, headers: corsHeaders });
        }

        await env.DB.prepare(
            `UPDATE applications SET director_status = 'REJECTED', status = 'REJECTED', director_comment = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
        ).bind(comment, id).run();
        verification.status = 'REJECTED';
        verification.director_status = 'REJECTED';

        try {
            await sendStudentDecisionEmail(env, verification, false, 'https://sssihl-student-service.pages.dev');
            await sendAdminNotification(env, id, app.form_type, app.applicant_name, app.student_email, null, 'rejected', comment);
        } catch (e) { console.error('Email error in director reject:', e); }

        await logAuditEvent(env, 'Director', 'REJECTED', id, { caseType, hasComment: true });

        const rejectHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Application Rejected - SSSIHL</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@700;800&display=swap" rel="stylesheet">
    <style>* { margin:0; padding:0; box-sizing:border-box; } body { font-family:'Inter',sans-serif; background:#f1f5f9; min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:40px 20px; } .card { background:white; border-radius:20px; padding:48px 40px; max-width:500px; width:100%; text-align:center; box-shadow:0 10px 25px -5px rgba(15,23,42,0.08); } .icon { width:80px; height:80px; border-radius:50%; background:#fee2e2; display:flex; align-items:center; justify-content:center; margin:0 auto 24px; font-size:40px; } h1 { font-family:'Outfit',sans-serif; color:#0f172a; font-size:1.8rem; margin-bottom:12px; } p { color:#64748b; font-size:0.95rem; line-height:1.7; } .app-id { display:inline-block; margin-top:20px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:8px 16px; font-size:0.85rem; color:#64748b; font-family:monospace; }</style>
</head>
<body>
    <div class="card">
        <div class="icon">✗</div>
        <h1>Application Rejected</h1>
        <p>Thank you. The application has been rejected and the Examination Section has been notified. The student has been informed by email.</p>
        <div class="app-id">Application ID: ${escapeHtml(id)}</div>
    </div>
</body>
</html>`;
        return new Response(rejectHtml, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });

    } else {
        return new Response('Invalid action', { status: 400, headers: corsHeaders });
    }
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
            const app = await env.DB.prepare('SELECT form_type, status FROM applications WHERE id = ?').bind(id).first();
            if (!app) {
                return new Response('Application not found', { status: 404, headers: corsHeaders });
            }
            // Idempotency guard — block only if already acted upon, not on first click
            if (!['AWAITING_DIRECTOR', 'PENDING'].includes(app.status)) {
                return new Response(`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Already Submitted</title></head><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f1f5f9;"><div style="text-align:center;background:white;border-radius:16px;padding:40px;max-width:480px;box-shadow:0 4px 20px rgba(0,0,0,0.08);"><h2 style="color:#0f172a;">Already Processed</h2><p style="color:#64748b;margin-top:12px;">This application has already been acted upon. No further action is required.</p></div></body></html>`, {
                    headers: { 'Content-Type': 'text/html; charset=utf-8' }
                });
            }
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

        await logAuditEvent(env, role, statusValue === 'APPROVED' ? 'APPROVED' : 'REJECTED', id, { role });

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
            const frontendUrl = 'https://sssihl-student-service.pages.dev';
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
        <img src="https://sssihl-student-service.pages.dev/Examinations_Service.png" alt="SSSIHL Examination Services" style="height: 90px; width: auto;">
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
        // Note: no student email here — student already received the director-approval decision email

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
            `SELECT id, student_email, form_type, applicant_name, reg_no, campus, status, director_status, director_comment, controller_status, access_token, campus_exam_status, created_at, updated_at
             FROM applications WHERE id = ?`
        ).bind(id).first();

        if (!app) {
            // Check if the application was archived
            const archived = await env.DB.prepare(
                'SELECT id, form_type, applicant_name FROM archived_applications WHERE id = ?'
            ).bind(id).first();
            if (archived) {
                return new Response(JSON.stringify({
                    archived: true,
                    id: archived.id,
                    form_type: archived.form_type,
                    applicant_name: archived.applicant_name,
                    message: 'This application has been archived and is no longer available for tracking. Please contact the Examinations Section at coeoffice@sssihl.edu.in if you have any queries.'
                }), {
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
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

        const needsCampusExamReview = [
            'Application for Supplementary Examinations Registration',
            'Application for Repeating Examinations Registration (CIE and ESE)',
        ].includes(app.form_type);

        return new Response(JSON.stringify({
            ...app,
            needs_director_approval: shouldNotifyDirector(app.form_type),
            needs_campus_exam_review: needsCampusExamReview,
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
