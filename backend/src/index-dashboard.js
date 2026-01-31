// Simplified Worker for Dashboard Deployment (No npm dependencies)
// Google Drive and Email features disabled - only database storage enabled

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
            return await handleDuplicateGradeCard(formData, env, corsHeaders);
        case 'CGPA to Marks Conversion':
            return await handleCGPAConversion(formData, env, corsHeaders);
        case 'Supplementary Examination':
            return await handleSupplementaryExam(formData, env, corsHeaders);
        case 'Duplicate Degree Certificate':
            return await handleDuplicateDegree(formData, env, corsHeaders);
        case 'Application for Registration of Student Name change in the Institute Records':
            return await handleNameChange(formData, env, corsHeaders);
        case 'Application for repeating a paper for supplementary examinations(CIE and ESE)':
            return await handleRepeatPaper(formData, env, corsHeaders);
        case 'Application for Re-Totalling of Marks':
            return await handleRetotaling(formData, env, corsHeaders);
        case 'On-Request Degree Certificate':
            return await handleOnRequestDegree(formData, env, corsHeaders);
        case 'Application for Migration Certificate':
            return await handleMigration(formData, env, corsHeaders);
        default:
            return new Response(JSON.stringify({ success: false, error: 'Unknown form type' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
    }
}

async function handleDuplicateGradeCard(formData, env, corsHeaders) {
    const email = formData.get('email');
    const applicantName = formData.get('applicantName');
    const regNo = formData.get('regNo');
    const campus = formData.get('campus');
    const formType = formData.get('formType');

    const appId = `APP-${Date.now()}`;

    await env.DB.prepare(
        `INSERT INTO applications (id, student_email, form_type, applicant_name, reg_no, campus)
         VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(appId, email, formType, applicantName, regNo, campus).run();

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

    return new Response(JSON.stringify({ success: true, appId }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function handleCGPAConversion(formData, env, corsHeaders) {
    const email = formData.get('email');
    const applicantName = formData.get('applicantName');
    const regNo = formData.get('regNo');
    const campus = formData.get('campus');
    const formType = formData.get('formType');

    const appId = `APP-${Date.now()}`;

    await env.DB.prepare(
        `INSERT INTO applications (id, student_email, form_type, applicant_name, reg_no, campus)
         VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(appId, email, formType, applicantName, regNo, campus).run();

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

    return new Response(JSON.stringify({ success: true, appId }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function handleSupplementaryExam(formData, env, corsHeaders) {
    const email = formData.get('email');
    const applicantName = formData.get('applicantName');
    const regNo = formData.get('regNo');
    const campus = formData.get('campus');
    const formType = formData.get('formType');

    const appId = `APP-${Date.now()}`;

    await env.DB.prepare(
        `INSERT INTO applications (id, student_email, form_type, applicant_name, reg_no, campus)
         VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(appId, email, formType, applicantName, regNo, campus).run();

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

    return new Response(JSON.stringify({ success: true, appId }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function handleRepeatPaper(formData, env, corsHeaders) {
    const email = formData.get('email');
    const applicantName = formData.get('applicantName');
    const regNo = formData.get('regNo');
    const campus = formData.get('campus');
    const formType = formData.get('formType');

    const appId = `APP-${Date.now()}`;

    await env.DB.prepare(
        `INSERT INTO applications (id, student_email, form_type, applicant_name, reg_no, campus)
         VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(appId, email, formType, applicantName, regNo, campus).run();

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

    return new Response(JSON.stringify({ success: true, appId }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function handleDuplicateDegree(formData, env, corsHeaders) {
    const email = formData.get('email');
    const applicantName = formData.get('applicantName');
    const regNo = formData.get('regNo');
    const campus = formData.get('campus');
    const formType = formData.get('formType');

    const appId = `APP-${Date.now()}`;

    await env.DB.prepare(
        `INSERT INTO applications (id, student_email, form_type, applicant_name, reg_no, campus)
         VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(appId, email, formType, applicantName, regNo, campus).run();

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

    return new Response(JSON.stringify({ success: true, appId }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function handleNameChange(formData, env, corsHeaders) {
    const email = formData.get('email');
    const applicantName = formData.get('applicantName');
    const regNo = formData.get('regNo');
    const campus = formData.get('campus');
    const formType = formData.get('formType');

    const appId = `APP-${Date.now()}`;

    await env.DB.prepare(
        `INSERT INTO applications (id, student_email, form_type, applicant_name, reg_no, campus)
         VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(appId, email, formType, applicantName, regNo, campus).run();

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

    return new Response(JSON.stringify({ success: true, appId }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function handleRetotaling(formData, env, corsHeaders) {
    const email = formData.get('email');
    const applicantName = formData.get('applicantName');
    const regNo = formData.get('regNo');
    const campus = formData.get('campus');
    const formType = formData.get('formType');

    const appId = `APP-${Date.now()}`;

    await env.DB.prepare(
        `INSERT INTO applications (id, student_email, form_type, applicant_name, reg_no, campus)
         VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(appId, email, formType, applicantName, regNo, campus).run();

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

    return new Response(JSON.stringify({ success: true, appId }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function handleOnRequestDegree(formData, env, corsHeaders) {
    const email = formData.get('email');
    const applicantName = formData.get('applicantName');
    const regNo = formData.get('regNo');
    const campus = formData.get('campus');
    const formType = formData.get('formType');

    const appId = `APP-${Date.now()}`;

    await env.DB.prepare(
        `INSERT INTO applications (id, student_email, form_type, applicant_name, reg_no, campus)
         VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(appId, email, formType, applicantName, regNo, campus).run();

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

    return new Response(JSON.stringify({ success: true, appId }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function handleMigration(formData, env, corsHeaders) {
    const applicantName = formData.get('applicantName');
    const campus = formData.get('campus');
    const formType = formData.get('formType');

    const appId = `APP-${Date.now()}`;

    await env.DB.prepare(
        `INSERT INTO applications (id, student_email, form_type, applicant_name, reg_no, campus)
         VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(appId, '', formType, applicantName, '', campus).run();

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
    }

    return new Response(`Application ${id} ${action}d by ${role}`, { headers: corsHeaders });
}
