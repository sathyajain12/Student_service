import { getGoogleAuth, uploadToDrive, sendEmail } from './google-api';

export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        // CORS Headers
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        };

        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        try {
            if (url.pathname === '/submit' && request.method === 'POST') {
                return await handleSubmission(request, env, corsHeaders);
            }

            if (url.pathname === '/approve' && request.method === 'GET') {
                return await handleApproval(url, env, corsHeaders);
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

async function handleSubmission(request, env, corsHeaders) {
    const formData = await request.formData();
    const formId = formData.get('formId');
    const formType = formData.get('formType');
    const email = formData.get('email');
    const applicantName = formData.get('applicantName');
    const regNo = formData.get('regNo');
    const campus = formData.get('campus');

    const appId = `APP-${Date.now()}`;

    // 1. Save to main applications table
    await env.DB.prepare(
        `INSERT INTO applications (id, student_email, form_type, applicant_name, reg_no, campus) 
     VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(appId, email, formType, applicantName, regNo, campus).run();

    // 2. Save to specific form table
    const tableMap = {
        'duplicate-grade-card': {
            table: 'form_duplicate_grade_card',
            fields: {
                email: 'student_email',
                applicantName: 'student_name',
                applicantAddress: 'student_address', // Note: Check if frontend sends this
                mobile: 'Mobile_Number',
                regNo: 'Registration_Number',
                campus: 'Campus',
                program: 'Programme',
                periodOfStudy: 'Period_of_Study',
                semester: 'Semester',
                reason: 'Reason'
            }
        },
        // ... other forms will need similar detail if user updates them
    };

    const config = tableMap[formId];
    if (config) {
        const fields = Object.keys(config.fields);
        const columns = ['application_id', ...Object.values(config.fields)];
        const placeholders = columns.map(() => '?').join(', ');
        const values = [appId, ...fields.map(f => formData.get(f) || '')];

        await env.DB.prepare(
            `INSERT INTO ${config.table} (${columns.join(', ')}) VALUES (${placeholders})`
        ).bind(...values).run();
    }

    // 3. Handle File Uploads
    const auth = await getGoogleAuth(env);
    const filePromises = [];

    for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
            filePromises.push((async () => {
                const fileData = await uploadToDrive(auth, value, value.name, env.GOOGLE_DRIVE_FOLDER_ID);
                await env.DB.prepare(
                    `INSERT INTO file_attachments (application_id, file_name, drive_file_id, file_type) 
           VALUES (?, ?, ?, ?)`
                ).bind(appId, value.name, fileData.id, value.type).run();
            })());
        }
    }
    await Promise.all(filePromises);

    // 4. Notifications
    const directorEmail = getDirectorEmail(campus, env);
    const url = new URL(request.url);
    await sendEmail(auth, {
        to: directorEmail,
        subject: `New Application: ${formType} - ${appId}`,
        htmlBody: `<h3>New Application Received</h3>
               <p><strong>App ID:</strong> ${appId}</p>
               <p><strong>Form:</strong> ${formType}</p>
               <p><strong>Student:</strong> ${applicantName} (${email})</p>
               <p><a href="${url.origin}/approve?id=${appId}&role=Director&action=Approve">Approve</a> | 
                  <a href="${url.origin}/approve?id=${appId}&role=Director&action=Reject">Reject</a></p>`
    });

    return new Response(JSON.stringify({ success: true, appId }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function handleApproval(url, env, corsHeaders) {
    const id = url.searchParams.get('id');
    const role = url.searchParams.get('role');
    const action = url.searchParams.get('action');

    if (role === 'Director') {
        await env.DB.prepare(
            `UPDATE applications SET director_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
        ).bind(action === 'Approve' ? 'APPROVED' : 'REJECTED', id).run();

        // Logic for next step (Controller) would go here
    }

    return new Response(`Application ${id} ${action}d by ${role}`, { headers: corsHeaders });
}

function getDirectorEmail(campus, env) {
    // Map campus to emails (could be in D1 or KV too)
    const map = {
        'Prashanti Nilayam Campus': 'saisathyajain@sssihl.edu.in',
        'Anantapur Campus': 'results@sssihl.edu.in',
        'Brindavan Campus': 'sathyajain9@gmail.com',
        'Nandigiri Campus': 'sathyajain99@outlook.com'
    };
    return map[campus] || map['Prashanti Nilayam Campus'];
}
