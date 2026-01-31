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
    const formType = formData.get('formType');

    // Route to appropriate handler based on form type
    switch(formType) {
        case 'Duplicate Grade Card':
            return await handleDuplicateGradeCard(formData, request, env, corsHeaders);
        case 'CGPA to Marks Conversion':
            return await handleCGPAConversion(formData, request, env, corsHeaders);
        case 'Supplementary Examination':
            return await handleSupplementaryExam(formData, request, env, corsHeaders);
        case 'Duplicate Degree Certificate':
            return await handleDuplicateDegree(formData, request, env, corsHeaders);
        case 'Application for Registration of Student Name change in the Institute Records':
            return await handleNameChange(formData, request, env, corsHeaders);
        case 'Application for repeating a paper for supplementary examinations(CIE and ESE)':
            return await handleRepeatPaper(formData, request, env, corsHeaders);
        case 'Application for Re-Totalling of Marks':
            return await handleRetotaling(formData, request, env, corsHeaders);
        case 'On-Request Degree Certificate':
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

    const appId = `APP-${Date.now()}`;

    // 1. Save to main applications table
    await env.DB.prepare(
        `INSERT INTO applications (id, student_email, form_type, applicant_name, reg_no, campus)
         VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(appId, email, formType, applicantName, regNo, campus).run();

    // 2. Save to form-specific table
    await env.DB.prepare(
        `INSERT INTO form_duplicate_grade_card
         (Application_id, student_email, student_name, student_address, Mobile_Number,
          Registration_Number, Campus, Programme, Period_of_Study, Semester, Reason)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
        appId,
        formData.get('email') || '',
        formData.get('applicantName') || '',
        formData.get('correspondenceAddress') || '',
        formData.get('mobile') || '',
        formData.get('regNo') || '',
        formData.get('campus') || '',
        formData.get('program') || '',
        formData.get('periodOfStudy') || '',
        formData.get('semester') || '',
        formData.get('reason') || ''
    ).run();

    // 3. Handle File Uploads (if Google credentials configured)
    if (env.GOOGLE_SERVICE_ACCOUNT_EMAIL && env.GOOGLE_PRIVATE_KEY && env.GOOGLE_DRIVE_FOLDER_ID) {
        const auth = await getGoogleAuth(env);
        const fileLinks = {};

        for (const [key, value] of formData.entries()) {
            if (value instanceof File) {
                const fileData = await uploadToDrive(auth, value, value.name, env.GOOGLE_DRIVE_FOLDER_ID);
                fileLinks[key] = fileData.id;

                await env.DB.prepare(
                    `INSERT INTO file_attachments (application_id, file_name, drive_file_id, file_type)
                     VALUES (?, ?, ?, ?)`
                ).bind(appId, value.name, fileData.id, value.type).run();
            }
        }

        // 4. Update form-specific table with file links
        await env.DB.prepare(
            `UPDATE form_duplicate_grade_card SET
             Police_complaint_file = ?, Affidavit_file = ?, Grade_copy_file = ?, SBI_receipt_file = ?
             WHERE Application_id = ?`
        ).bind(
            fileLinks['policeComplaint'] || '',
            fileLinks['affidavit'] || '',
            fileLinks['gradeCard'] || '',
            fileLinks['sbiReceipt'] || '',
            appId
        ).run();

        // 5. Send notification email
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

    const appId = `APP-${Date.now()}`;

    // 1. Save to main applications table
    await env.DB.prepare(
        `INSERT INTO applications (id, student_email, form_type, applicant_name, reg_no, campus)
         VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(appId, email, formType, applicantName, regNo, campus).run();

    // 2. Save to form-specific table
    await env.DB.prepare(
        `INSERT INTO form_cgpa_conversion
         (application_id, student_name, student_address, Mobile_Number, Registration_Number,
          Programme, Period_of_Study, graduation_year, CGPA)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
        appId,
        formData.get('applicantName') || '',
        formData.get('correspondenceAddress') || '',
        formData.get('mobile') || '',
        formData.get('regNo') || '',
        formData.get('program') || '',
        formData.get('periodOfStudy') || '',
        formData.get('monthOfPassing') || '',
        parseFloat(formData.get('cgpa')) || 0.0
    ).run();

    // 3. Send notification email (if Google credentials configured)
    if (env.GOOGLE_SERVICE_ACCOUNT_EMAIL && env.GOOGLE_PRIVATE_KEY) {
        const auth = await getGoogleAuth(env);
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
    }

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

    const appId = `APP-${Date.now()}`;

    // 1. Save to main applications table
    await env.DB.prepare(
        `INSERT INTO applications (id, student_email, form_type, applicant_name, reg_no, campus)
         VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(appId, email, formType, applicantName, regNo, campus).run();

    // 2. Save to form-specific table
    await env.DB.prepare(
        `INSERT INTO form_supplementary_exam
         (application_id, student_email, Period_of_Study, student_name, Registration_Number,
          Campus, Programme, Mobile_Number, student_address, paper_codes, paper_titles, Semester)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
        appId,
        formData.get('email') || '',
        formData.get('periodOfStudy') || '',
        formData.get('applicantName') || '',
        formData.get('regNo') || '',
        formData.get('campus') || '',
        formData.get('program') || '',
        formData.get('mobile') || '',
        formData.get('correspondenceAddress') || '',
        formData.get('paperCodes') || '',
        formData.get('paperTitles') || '',
        formData.get('semester') || ''
    ).run();

    // 3. Send notification email (if Google credentials configured)
    if (env.GOOGLE_SERVICE_ACCOUNT_EMAIL && env.GOOGLE_PRIVATE_KEY) {
        const auth = await getGoogleAuth(env);
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

    const appId = `APP-${Date.now()}`;

    // 1. Save to main applications table
    await env.DB.prepare(
        `INSERT INTO applications (id, student_email, form_type, applicant_name, reg_no, campus)
         VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(appId, email, formType, applicantName, regNo, campus).run();

    // 2. Save to form-specific table
    await env.DB.prepare(
        `INSERT INTO form_repeat_paper
         (application_id, Period_of_Study, student_name, reg_no, Campus, Programme,
          Mobile_Number, student_address, paper_codes, paper_titles, Semester)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
        appId,
        formData.get('periodOfStudy') || '',
        formData.get('applicantName') || '',
        formData.get('regNo') || '',
        formData.get('campus') || '',
        formData.get('program') || '',
        formData.get('mobile') || '',
        formData.get('correspondenceAddress') || '',
        formData.get('paperCodes') || '',
        formData.get('paperTitles') || '',
        formData.get('semester') || ''
    ).run();

    // 3. Send notification email (if Google credentials configured)
    if (env.GOOGLE_SERVICE_ACCOUNT_EMAIL && env.GOOGLE_PRIVATE_KEY) {
        const auth = await getGoogleAuth(env);
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

    const appId = `APP-${Date.now()}`;

    // 1. Save to main applications table
    await env.DB.prepare(
        `INSERT INTO applications (id, student_email, form_type, applicant_name, reg_no, campus)
         VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(appId, email, formType, applicantName, regNo, campus).run();

    // 2. Save to form-specific table (without file links first)
    await env.DB.prepare(
        `INSERT INTO form_duplicate_degree
         (application_id, student_name, student_email, student_address, reg_no, Campus,
          Programme, Period_of_Study, year_of_passing, Reason)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
        appId,
        formData.get('applicantName') || '',
        formData.get('email') || '',
        formData.get('correspondenceAddress') || '',
        formData.get('regNo') || '',
        formData.get('campus') || '',
        formData.get('program') || '',
        formData.get('periodOfStudy') || '',
        formData.get('yearOforiginalDegree') || '',
        formData.get('reason') || ''
    ).run();

    // 3. Handle File Uploads (if Google credentials configured)
    const fileLinks = {};
    if (env.GOOGLE_SERVICE_ACCOUNT_EMAIL && env.GOOGLE_PRIVATE_KEY && env.GOOGLE_DRIVE_FOLDER_ID) {
        const auth = await getGoogleAuth(env);

        for (const [key, value] of formData.entries()) {
            if (value instanceof File) {
                const fileData = await uploadToDrive(auth, value, value.name, env.GOOGLE_DRIVE_FOLDER_ID);
                fileLinks[key] = fileData.id;

                await env.DB.prepare(
                    `INSERT INTO file_attachments (application_id, file_name, drive_file_id, file_type)
                     VALUES (?, ?, ?, ?)`
                ).bind(appId, value.name, fileData.id, value.type).run();
            }
        }
    }

    // 4. Update form-specific table with file links
    await env.DB.prepare(
        `UPDATE form_duplicate_degree SET
         Police_complaint_file = ?, Press_notification_file = ?, Affidavit_file = ?
         WHERE application_id = ?`
    ).bind(
        fileLinks['policeComplaint'] || '',
        fileLinks['pressNotification'] || '',
        fileLinks['affidavit'] || '',
        appId
    ).run();

    // 5. Send notification email
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

// Handler for Name Change
async function handleNameChange(formData, request, env, corsHeaders) {
    const email = formData.get('email');
    const applicantName = formData.get('applicantName');
    const regNo = formData.get('regNo');
    const campus = formData.get('campus');
    const formType = formData.get('formType');

    const appId = `APP-${Date.now()}`;

    // 1. Save to main applications table
    await env.DB.prepare(
        `INSERT INTO applications (id, student_email, form_type, applicant_name, reg_no, campus)
         VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(appId, email, formType, applicantName, regNo, campus).run();

    // 2. Save to form-specific table (without file links first)
    await env.DB.prepare(
        `INSERT INTO form_name_change
         (application_id, existing_name, Father_name, reg_no, Campus, Mobile_Number,
          Period_of_Study, student_address, changed_name)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
        appId,
        formData.get('applicantName') || '',
        formData.get('fatherName') || '',
        formData.get('regNo') || '',
        formData.get('campus') || '',
        formData.get('mobile') || '',
        formData.get('periodOfStudy') || '',
        formData.get('correspondenceAddress') || '',
        formData.get('newName') || ''
    ).run();

    // 3. Handle File Uploads (if Google credentials configured)
    const fileLinks = {};
    if (env.GOOGLE_SERVICE_ACCOUNT_EMAIL && env.GOOGLE_PRIVATE_KEY && env.GOOGLE_DRIVE_FOLDER_ID) {
        const auth = await getGoogleAuth(env);

        for (const [key, value] of formData.entries()) {
            if (value instanceof File) {
                const fileData = await uploadToDrive(auth, value, value.name, env.GOOGLE_DRIVE_FOLDER_ID);
                fileLinks[key] = fileData.id;

                await env.DB.prepare(
                    `INSERT INTO file_attachments (application_id, file_name, drive_file_id, file_type)
                     VALUES (?, ?, ?, ?)`
                ).bind(appId, value.name, fileData.id, value.type).run();
            }
        }
    }

    // 4. Update form-specific table with file links
    await env.DB.prepare(
        `UPDATE form_name_change SET
         gazzete_notification_file = ?, SBI_receipt_file = ?
         WHERE application_id = ?`
    ).bind(
        fileLinks['gazetteNotification'] || '',
        fileLinks['sbiReceipt'] || '',
        appId
    ).run();

    // 5. Send notification email
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

// Handler for Retotaling
async function handleRetotaling(formData, request, env, corsHeaders) {
    const email = formData.get('email');
    const applicantName = formData.get('applicantName');
    const regNo = formData.get('regNo');
    const campus = formData.get('campus');
    const formType = formData.get('formType');

    const appId = `APP-${Date.now()}`;

    // 1. Save to main applications table
    await env.DB.prepare(
        `INSERT INTO applications (id, student_email, form_type, applicant_name, reg_no, campus)
         VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(appId, email, formType, applicantName, regNo, campus).run();

    // 2. Save to form-specific table (without file links first)
    await env.DB.prepare(
        `INSERT INTO form_retotaling
         (application_id, exam_type, student_name, reg_no, Campus, Programme,
          paper_codes_titles_for_retotaling, Mobile_Number, student_address, student_email)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
        appId,
        formData.get('examType') || '',
        formData.get('applicantName') || '',
        formData.get('regNo') || '',
        formData.get('campus') || '',
        formData.get('program') || '',
        formData.get('subjectCode') || '',
        formData.get('mobile') || '',
        formData.get('correspondenceAddress') || '',
        formData.get('email') || ''
    ).run();

    // 3. Handle File Uploads (if Google credentials configured)
    const fileLinks = {};
    if (env.GOOGLE_SERVICE_ACCOUNT_EMAIL && env.GOOGLE_PRIVATE_KEY && env.GOOGLE_DRIVE_FOLDER_ID) {
        const auth = await getGoogleAuth(env);

        for (const [key, value] of formData.entries()) {
            if (value instanceof File) {
                const fileData = await uploadToDrive(auth, value, value.name, env.GOOGLE_DRIVE_FOLDER_ID);
                fileLinks[key] = fileData.id;

                await env.DB.prepare(
                    `INSERT INTO file_attachments (application_id, file_name, drive_file_id, file_type)
                     VALUES (?, ?, ?, ?)`
                ).bind(appId, value.name, fileData.id, value.type).run();
            }
        }
    }

    // 4. Update form-specific table with file links
    await env.DB.prepare(
        `UPDATE form_retotaling SET
         scanned_copy_of_grade_card_file = ?, SBI_receipt_file = ?
         WHERE application_id = ?`
    ).bind(
        fileLinks['gradeCard'] || '',
        fileLinks['sbiReceipt'] || '',
        appId
    ).run();

    // 5. Send notification email
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

// Handler for On-Request Degree
async function handleOnRequestDegree(formData, request, env, corsHeaders) {
    const email = formData.get('email');
    const applicantName = formData.get('applicantName');
    const regNo = formData.get('regNo');
    const campus = formData.get('campus');
    const formType = formData.get('formType');

    const appId = `APP-${Date.now()}`;

    // 1. Save to main applications table
    await env.DB.prepare(
        `INSERT INTO applications (id, student_email, form_type, applicant_name, reg_no, campus)
         VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(appId, email, formType, applicantName, regNo, campus).run();

    // 2. Save to form-specific table (without file links first)
    await env.DB.prepare(
        `INSERT INTO form_on_request_degree
         (application_id, student_name, reg_no, Campus, Student_address, Mobile_Number, Degree_applied_for)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(
        appId,
        formData.get('applicantName') || '',
        formData.get('regNo') || '',
        formData.get('campus') || '',
        formData.get('correspondenceAddress') || '',
        formData.get('mobile') || '',
        formData.get('degreeAppliedFor') || ''
    ).run();

    // 3. Handle File Uploads (if Google credentials configured)
    const fileLinks = {};
    if (env.GOOGLE_SERVICE_ACCOUNT_EMAIL && env.GOOGLE_PRIVATE_KEY && env.GOOGLE_DRIVE_FOLDER_ID) {
        const auth = await getGoogleAuth(env);

        for (const [key, value] of formData.entries()) {
            if (value instanceof File) {
                const fileData = await uploadToDrive(auth, value, value.name, env.GOOGLE_DRIVE_FOLDER_ID);
                fileLinks[key] = fileData.id;

                await env.DB.prepare(
                    `INSERT INTO file_attachments (application_id, file_name, drive_file_id, file_type)
                     VALUES (?, ?, ?, ?)`
                ).bind(appId, value.name, fileData.id, value.type).run();
            }
        }
    }

    // 4. Update form-specific table with file links
    await env.DB.prepare(
        `UPDATE form_on_request_degree SET
         qualifying_degree_file = ?, SBI_receipt_file = ?
         WHERE application_id = ?`
    ).bind(
        fileLinks['qualifyingCert'] || '',
        fileLinks['sbiReceipt'] || '',
        appId
    ).run();

    // 5. Send notification email
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

// Handler for Migration
async function handleMigration(formData, request, env, corsHeaders) {
    const applicantName = formData.get('applicantName');
    const campus = formData.get('campus');
    const formType = formData.get('formType');
    const mobile = formData.get('mobile');

    const appId = `APP-${Date.now()}`;

    // 1. Save to main applications table (migration form doesn't have email/regNo in all cases)
    await env.DB.prepare(
        `INSERT INTO applications (id, student_email, form_type, applicant_name, reg_no, campus)
         VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(appId, '', formType, applicantName, '', campus).run();

    // 2. Save to form-specific table
    await env.DB.prepare(
        `INSERT INTO form_migration_certificate
         (application_id, student_name, Mobile_Number, admission_year, Campus_of_admission,
          last_examination_passed, degree_recieved, university_to_migrate, correspondence_address)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
        appId,
        formData.get('applicantName') || '',
        formData.get('mobile') || '',
        formData.get('yearofAdmission') || '',
        formData.get('campus') || '',
        formData.get('lastExam') || '',
        formData.get('degreeRecieved') || '',
        formData.get('universityInstitute') || '',
        formData.get('migrationAddress') || ''
    ).run();

    // 3. Handle File Uploads (if Google credentials configured)
    if (env.GOOGLE_SERVICE_ACCOUNT_EMAIL && env.GOOGLE_PRIVATE_KEY && env.GOOGLE_DRIVE_FOLDER_ID) {
        const auth = await getGoogleAuth(env);

        for (const [key, value] of formData.entries()) {
            if (value instanceof File) {
                const fileData = await uploadToDrive(auth, value, value.name, env.GOOGLE_DRIVE_FOLDER_ID);

                await env.DB.prepare(
                    `INSERT INTO file_attachments (application_id, file_name, drive_file_id, file_type)
                     VALUES (?, ?, ?, ?)`
                ).bind(appId, value.name, fileData.id, value.type).run();
            }
        }
    }

    // 4. Send notification email (if Google credentials configured)
    if (env.GOOGLE_SERVICE_ACCOUNT_EMAIL && env.GOOGLE_PRIVATE_KEY) {
        const auth = await getGoogleAuth(env);
        const directorEmail = getDirectorEmail(campus, env);
        const url = new URL(request.url);
        await sendEmail(auth, {
            to: directorEmail,
            subject: `New Application: ${formType} - ${appId}`,
            htmlBody: `<h3>New Application Received</h3>
                   <p><strong>App ID:</strong> ${appId}</p>
                   <p><strong>Form:</strong> ${formType}</p>
                   <p><strong>Student:</strong> ${applicantName}</p>
                   <p><a href="${url.origin}/approve?id=${appId}&role=Director&action=Approve">Approve</a> |
                      <a href="${url.origin}/approve?id=${appId}&role=Director&action=Reject">Reject</a></p>`
        });
    }

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
