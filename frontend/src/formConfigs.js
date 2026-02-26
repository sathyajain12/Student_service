const PROGRAMME_OPTIONS = [
    'Bachelor of Arts (Honours) / (Honours with Research) in Economics',
    'Bachelor of Arts (Honours) / (Honours with Research) in English Language and Literature',
    'Bachelor of Business Administration (Honours)',
    'Bachelor of Commerce (Honours) / (Honours with Research)',
    'Bachelor of Education',
    'Bachelor of Performing Arts (Honours) in Music',
    'Bachelor of Performing Arts in Music',
    'Bachelor of Science (Honours) / (Honours with Research) in Actuarial Data Science',
    'Bachelor of Science (Honours) / (Honours with Research) in Artificial Intelligence and Computational Biology',
    'Bachelor of Science (Honours) / (Honours with Research) in Biosciences and Biotechnology',
    'Bachelor of Science (Honours) / (Hons. with Research) in Chemistry',
    'Bachelor of Science (Honours) / (Honours with Research) in Computer Science',
    'Bachelor of Science (Honours) / (Honours with Research) in Computer Science and Artificial Intelligence',
    'Bachelor of Science (Honours) / (Honours with Research) in Economics',
    'Bachelor of Science (Honours) / (Honours with Research) in Finance, Economics & Data Analytics',
    'Bachelor of Science (Honours) / (Honours with Research) in Food and Nutritional Sciences',
    'Bachelor of Science (Honours) / (Honours with Research) in Mathematics',
    'Bachelor of Science (Honours) / (Honours with Research) in Mathematical Sciences and Computing',
    'Bachelor of Science (Honours) / (Honours with Research) in Physics',
    'Master of Arts in Economics',
    'Master of Arts in English Language and Literature',
    'Master of Business Administration',
    'Master of Science in Biosciences',
    'Master of Science in Chemistry',
    'Master of Science in Data Science and Computing',
    'Master of Science in Food and Nutritional Sciences',
    'Master of Science in Mathematics',
    'Master of Science in Physics',
    'Master of Technology in Computer Science',
    'Master of Technology in Optoelectronics and Communications',
    'Others',
];

const COMMON_ACADEMIC_FIELDS = [
    { name: 'applicantName', label: 'Candidate Name', type: 'text', required: true },
    { name: 'regNo', label: 'Registered Number', type: 'number', required: true },
    { name: 'abcApaarId', label: 'ABC / APAAR ID', type: 'number', required: false },
    { name: 'campus', label: 'Campus', type: 'select', options: ['Prashanti Nilayam Campus', 'Anantapur Campus', 'Brindavan Campus', 'Nandigiri Campus'], required: true },
    { name: 'program', label: 'Academic Programme', type: 'select', options: PROGRAMME_OPTIONS, required: true },
    { name: 'mobile', label: 'Mobile Number', type: 'number', required: true },
    { name: 'email', label: 'Email Address', type: 'email', required: true },
    { type: 'heading', label: 'Permanent Address', name: 'addressHeading' },
    { name: 'addressLine1', label: 'Address Line 1', type: 'text', required: true },
    { name: 'addressLine2', label: 'Address Line 2', type: 'text', required: false },
    { name: 'country', label: 'Country', type: 'countrySelect', required: true },
    { name: 'stateProvince', label: 'State/Province/Region', type: 'stateSelect', required: true },
    { name: 'city', label: 'City', type: 'text', required: true },
    { name: 'postalCode', label: 'Postal Code', type: 'text', required: true },




];

const CONTROLLER_ADDRESS = {
    title: 'The Controller of Examinations',
    office: 'Administrative Office',
    institution: 'Sri Sathya Sai Institute of Higher Learning',
    location: 'Prasanthi Nilayam – 515134',
    district: 'Sri Sathya Sai District, Andhra Pradesh',
    contact: {
        tel: '+91 8555 287 191',
        email: 'controller@sssihl.edu.in',
        web: 'sssihl.edu.in'
    }
};


export const FORM_CONFIGS = {
    'duplicate-grade-card': {
        needsDirectorApproval: true,
        title: 'Application for Duplicate Grade Card',
        description: 'This form is applicable only to students belonging to batches up to and including 2020. Students from 2021 batch onwards can download their Duplicate Grade Cards from [DigiLocker](https://accounts.digilocker.gov.in/v3/7b9f84c86732efd21cd8076ff06f3fd60b1fbe146732fa57444b03b35f3740a4--en).',

        instructions: [
            'Before applying for a Duplicate Grade Card, the applicant must make all reasonable efforts to trace the Original Grade Card. Only after being fully satisfied that the Original Grade Card has been lost beyond recovery may the candidate proceed to apply for a Duplicate Grade Card.',
            'In the event of loss in transit or misplacement of the Original Grade Card, the candidate is required to lodge a police complaint and obtain an official acknowledgment from the concerned police station. A scanned copy of the police complaint, along with the original acknowledgment, must be uploaded.',
            'An affidavit, sworn before a Notary Public or a First-Class Magistrate, in accordance with the prescribed format, must be uploaded.',
            { type: 'format', text: '**AFFIDAVIT FOR DUPLICATE GRADE CARD**\\n**To be sworn before a Notary Public / First-Class Magistrate**\\n\\nI, _________________________ (Name), son/daughter of _________________________, do hereby solemnly affirm and declare that:\\n\\n1. I am a bonafide student/alumnus of Sri Sathya Sai Institute of Higher Learning, Prasanthi Nilayam.\\n2. The Institute had issued me the Original Grade Card for Semester _______ of Programme _________________________, bearing  Registered Number  _________________________.\\n3. The said Original Grade Card has been lost whilst in my possession despite exercising due care.\\n4. I have applied to the Institute for issuance of a Duplicate Grade Card.\\n5. I hereby undertake that:\\n   - If the Original Grade Card is recovered by me at any time, I shall immediately surrender it to the Institute.\\n   - I shall be solely responsible for any misuse of the lost Original Grade Card.\\n6. The statements made herein are true to the best of my knowledge and belief.\n\nDate:\n\nStudent Signature:\n\n**VERIFICATION**\n\nI, the deponent above named, do hereby solemnly affirm and state that the contents of the above affidavit are true and correct to my knowledge and belief, and that no part of it is false and nothing  has been concealed therein.\nSolemnly affirmed / Sworn on this ______ day of _________________________________ at _________________________________\n\n **Attested and identified by me**\t**Signature of Deponent**\n\n(Signature and Seal of Notary Public / First-Class Magistrate)' },
            { type: 'address', text: 'Applicants are required to send a self-addressed, cloth-lined envelope (16 × 12 inches in size), affixed with stamps totalling ₹95, to the address mentioned below. The Institute requires this for dispatch of the Duplicate Grade Card to the applicant by Speed Post service of India Post.', details: CONTROLLER_ADDRESS },

            'The name of the applicant, along with the complete postal address, including the town / city, PIN code, district and state must be clearly written or typed on the envelope.',
            'Students of foreign nationality may affix appropriate postage for an envelope weighing 100-120 g.',
            'Once the application is submitted, the applicant must wait for the Director\'s approval. Only after the Director approves the application will the Examination Section process it further. The applicant can track the status of the application using the Application ID provided at the time of submission.',
        ],
        titleLink: {
            text: 'Please click here to make the payment of ₹500 for each Duplicate Grade Card using SBI Collect',
            url: 'https://www.onlinesbi.sbi/sbicollect/icollecthome.htm?corpID=350506&categoryName=SSSIHL%20Exams%20App%20Duplicate%20Grade%20Card'
        },
        fields: [
            { name: 'applicantName', label: 'Candidate Name', type: 'text', required: true },
            { name: 'regNo', label: 'Registered Number', type: 'number', required: true },
            { name: 'abcApaarId', label: 'ABC / APAAR ID', type: 'number', required: false },
            { name: 'campus', label: 'Campus', type: 'select', options: ['Prashanti Nilayam Campus', 'Anantapur Campus', 'Brindavan Campus', 'Nandigiri Campus'], required: true },
            { name: 'program', label: 'Academic Programme', type: 'select', options: PROGRAMME_OPTIONS, required: true },
            { name: 'periodOfStudy', label: 'Period of Study', type: 'daterange', required: true, placeholder: 'e.g., June 2019 - March 2022' },
            { name: 'semester', label: 'Semester', type: 'select', options: ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'], required: true },
            { name: 'mobile', label: 'Mobile Number', type: 'number', required: true },
            { name: 'email', label: 'Email Address', type: 'email', required: true },
            { type: 'heading', label: 'Permanent Address', name: 'addressHeading' },
            { name: 'addressLine1', label: 'Address Line 1', type: 'text', required: true },
            { name: 'addressLine2', label: 'Address Line 2', type: 'text', required: false },
            { name: 'country', label: 'Country', type: 'countrySelect', required: true },
            { name: 'stateProvince', label: 'State/Province/Region', type: 'stateSelect', required: true },
            { name: 'city', label: 'City', type: 'text', required: true },
            { name: 'postalCode', label: 'Postal Code', type: 'text', required: true },
            { name: 'separator1', label: '', type: 'separator' },
            { name: 'reason', label: 'Reason for Loss', type: 'textarea', required: true },
        ],
        files: [
            { name: 'policeComplaint', label: 'Police Complaint', required: true },
            { name: 'affidavit', label: 'Sworn Affidavit', required: true },
            { name: 'sbiReceipt', label: 'SBI Collect Receipt (₹500)', required: true },
            { name: 'gradeCard', label: 'Original Grade Card  (SCAN COPY IF AVAILABLE)', required: false }

        ]
    },
    'cgpa-conversion': {
        title: 'Application for CGPA to Percentage Conversion',
        instructions: [
            'As the Institute follows a grading system, grade cards, which are already issued to the students by the Institute-serve as Statement of Marks. No other mark statements are issued. However, if required, a Statement of CGPA Equivalent Percentage of Marks is issued on application to pursue further studies or to seek a job.',
            'No Fee is charged for the issue of a Statement of CGPA Equivalent Percentage of Marks.',
            { type: 'address', text: 'Applicants are required to send a self-addressed envelope affixed with stamps totalling ₹95, to the address mentioned below. The Institute requires this for dispatch of the statement of conversion of CGPA into equivalent percentage of marks to the applicant by Speed Post service of India Post.', details: CONTROLLER_ADDRESS },
            'The name of the applicant, along with the complete postal address, including the town / city, PIN code, district and state must be clearly written or typed on the envelope.',            
            'Students of foreign nationality may affix appropriate postage for an envelope weighing 100-120 g.',
        ],
        fields: [{ name: 'applicantName', label: 'Candidate Name', type: 'text', required: true },
        { name: 'regNo', label: 'Registered Number', type: 'number', required: true },
        { name: 'abcApaarId', label: 'ABC / APAAR ID', type: 'number', required: false },
        { name: 'campus', label: 'Campus', type: 'select', options: ['Prashanti Nilayam Campus', 'Anantapur Campus', 'Brindavan Campus', 'Nandigiri Campus'], required: true },
        { name: 'program', label: 'Academic Programme', type: 'select', options: PROGRAMME_OPTIONS, required: true },
        {
            name: "periodOfStudy",
            label: "Period of Study",
            type: "daterange",
            required: true,
            placeholder: "Select period of study"
        },
        {
            name: "monthOfPassing",
            label: "Month and Year of Passing",
            type: "daterange",
            required: true,
            placeholder: "Select month and year"
        },
        { name: 'separator2', label: '', type: 'separator' },
        {
            name: 'cgpa',
            label: 'CGPA',
            type: 'number',
            required: true,
            placeholder: 'Enter your CGPA',
            step: '0.01',
            min: '0',
            max: '10'
        },
        { name: 'mobile', label: 'Mobile Number', type: 'number', required: true },
        { name: 'email', label: 'Email Address', type: 'email', required: true },
        { type: 'heading', label: 'Permanent Address', name: 'addressHeading' },
        { name: 'addressLine1', label: 'Address Line 1', type: 'text', required: true },
        { name: 'addressLine2', label: 'Address Line 2', type: 'text', required: false },
        { name: 'country', label: 'Country', type: 'countrySelect', required: true },
        { name: 'stateProvince', label: 'State/Province/Region', type: 'stateSelect', required: true },
        { name: 'city', label: 'City', type: 'text', required: true },
        { name: 'postalCode', label: 'Postal Code', type: 'text', required: true },

        
        ],
        files: [

        ]
    },
    'supplementary-exam': {
        needsDirectorApproval: true,
        title: 'Application for Supplementary Examinations Registration',
        instructions: [
            'Ensure you have the correct Course Code(s) and Course Title.',
            'If unable to repeat on medical grounds, inform the Director and Controller of Examinations in advance.',
            'Failure to inform in advance may result in forfeiture of candidature for the next examination.'


        ],
        fields: [

            {
                type: 'heading',
                label: 'Candidate Details',
                name: 'heading1'
            },
            { name: 'applicantName', label: 'Candidate Name', type: 'text', required: true },
            { name: 'regNo', label: 'Registered Number', type: 'number', required: true },
            { name: 'abcApaarId', label: 'ABC / APAAR ID', type: 'number', required: false },
            { name: 'campus', label: 'Campus', type: 'select', options: ['Prashanti Nilayam Campus', 'Anantapur Campus', 'Brindavan Campus', 'Nandigiri Campus'], required: true },
            { name: 'program', label: 'Academic Programme', type: 'select', options: PROGRAMME_OPTIONS, required: true },
            {
                name: "periodOfStudy",
                label: "Period of Study",
                type: "daterange",
                required: true,
                placeholder: "Select period of study"
            },
            { name: 'mobile', label: 'Mobile Number', type: 'number', required: true },
            { name: 'email', label: 'Email Address', type: 'email', required: true },
            { type: 'heading', label: 'Permanent Address', name: 'addressHeading' },
            { name: 'addressLine1', label: 'Address Line 1', type: 'text', required: true },
            { name: 'addressLine2', label: 'Address Line 2', type: 'text', required: false },
            { name: 'country', label: 'Country', type: 'countrySelect', required: true },
            { name: 'stateProvince', label: 'State/Province/Region', type: 'stateSelect', required: true },
            { name: 'city', label: 'City', type: 'text', required: true },
            { name: 'postalCode', label: 'Postal Code', type: 'text', required: true },
            {
                type: 'heading',
                label: 'Course Details',
                name: 'heading2'
            },
            {
                type: 'paperTable',
                label: 'Courses for Supplementary Examination',
                name: 'paperDetails',
                required: true
            },
            { name: 'separator2', label: '', type: 'separator' },
            {
                type: 'singleCheckbox',
                name: 'declaration',
                label: 'I request that my name may kindly be registered for the above Supplementary Examination.\n\nIf I, on medical grounds, find it difficult to take the examination, I will duly inform the Director of the Campus and the Controller of Examinations in advance, so that my candidature for the next examination may not stand forfeited.',
                required: true
            },
        ],
        files: [

        ]
    },
    'duplicate-degree': {
        title: 'Application for Duplicate Degree Certificate',
        description: 'This form is applicable only to students belonging to batches up to and including 2020. Students from 2021 batch onwards can download their Duplicate Degree Certificate from [DigiLocker](https://accounts.digilocker.gov.in/v3/7b9f84c86732efd21cd8076ff06f3fd60b1fbe146732fa57444b03b35f3740a4--en).',
        instructions: [
            'Before applying for a Duplicate Degree Certificate, the applicant must make all reasonable efforts to trace the Original Degree Certificate. Only after being fully satisfied that the Original Degree Certificate has been lost beyond recovery may the candidate proceed to apply for a Duplicate Degree Certificate.',
            'In the event of loss in transit or misplacement of the Original Degree Certificate, the candidate is required to lodge a police complaint and obtain an official acknowledgment from the concerned police station. A scanned copy of the police complaint, along with the original acknowledgment, must be uploaded.',
            'A press notification, in the prescribed format, must be published in a recognized daily newspaper. A scanned copy of the newspaper cutting must be uploaded.',
            'An affidavit, sworn before a Notary Public or a First-Class Magistrate, in accordance with the prescribed format, must be uploaded.',
            'The applicant must clearly state the reason for the loss of the Original Degree Certificate.',
            { type: 'address', text: 'Applicants are required to send a self-addressed, cloth-lined envelope (16 × 12 inches in size), affixed with stamps totalling ₹95, to the address mentioned below. The Institute requires this for dispatch of the Duplicate Degree Certificate to the applicant by Speed Post service of India Post.', details: CONTROLLER_ADDRESS },
            'The name of the applicant, along with the complete postal address, including the town / city, PIN code, district and state must be clearly written or typed on the envelope.',
            'Students of foreign nationality may affix appropriate postage for an envelope weighing 100-120 g.',
            { type: 'format', text: '**FORMAT OF THE NEWSPAPER NOTIFICATION**\n\nNotice is hereby given that the undersigned has lost the Original Degree Certificate pertaining to the _________________________________ Academic Programme, issued by Sri Sathya Sai Institute of Higher Learning. Any person who finds the said certificate is requested to return it to the undersigned without delay. Possession of the certificate despite this public notice shall be deemed unauthorized and unlawful, and the holder shall be liable for any misuse thereof.\n\nName of the Candidate:\nMobile No:\nAddress(with city and state):\n\nDate:' },
            { type: 'format', text: '**FORMAT FOR AFFIDAVIT**\n\nI, _________________________ (Name), son/daughter of _________________________, Registered Number _________________________, do hereby solemnly affirm and declare that:\n\n1. That the Original Degree Certificate pertaining to the _________________________________ Academic Programme, issued to me by Sri Sathya Sai Institute of Higher Learning, Prasanthi Nilayam, has been irrecoverably lost or destroyed.\n\n2. That I have made a thorough and diligent search for the said Original Degree Certificate, but despite my best efforts, I have been unable to recover it.\n\n3. That a duplicate copy of the ________ Degree Certificate is now required by me, for the purpose of\n___________________________________________________________________________\n(state clearly why the duplicate is required and where it is to be submitted or produced).\n\n4. That I understand and acknowledge that if the lost Original Degree Certificate is misused by me or by any other person into whose possession it may fall, I shall be fully liable for all consequences arising therefrom. I further undertake to indemnify and hold harmless the Institute against any loss or consequences that may arise due to any improper or unfair use of the aforesaid Degree Certificate.\n\nDate:\n\nStudent Signature:\n\n**VERIFICATION**\n\nI, the deponent above named, do hereby solemnly affirm and state that the contents of Paragraphs 1 to 4 of the above affidavit are true and correct to my knowledge, and that no part of it is false and nothing  has been concealed therein.\nSolemnly affirmed / Sworn on this ______ day of _________________________________ at _________________________________\n\n **Attested and identified by me**\t**Signature of Deponent**\n\n(Signature and Seal of Notary Public / First-Class Magistrate)' }
        ],
        titleLink: {
            text: 'Please click here to make the payment of ₹1000 for each Duplicate Degree Certificate using SBI Collect',
            url: 'https://www.onlinesbi.sbi/sbicollect/icollecthome.htm?corpID=350506&categoryName=SSSIHL%20Exams%20App%20Duplicate%20Grade%20Cardhttps://onlinesbi.sbi.bank.in/sbicollect/icollecthome.htm'
        },
        fields: [
            { name: 'applicantName', label: 'Candidate Name', type: 'text', required: true },
            { name: 'regNo', label: 'Registered Number', type: 'number', required: true },
            { name: 'abcApaarId', label: 'ABC / APAAR ID', type: 'number', required: false },
            { name: 'campus', label: 'Campus', type: 'select', options: ['Prashanti Nilayam Campus', 'Anantapur Campus', 'Brindavan Campus', 'Nandigiri Campus'], required: true },
            { name: 'program', label: 'Academic Programme', type: 'select', options: PROGRAMME_OPTIONS, required: true },
            {
                name: "periodOfStudy",
                label: "Period of Study",
                type: "daterange",
                required: true,
                placeholder: "Select period of study"
            },
            {
                name: 'yearOforiginalDegree',
                label: 'Year of Original Degree Certificate Issue',
                type: 'date',
                required: true
            },
            { name: 'mobile', label: 'Mobile Number', type: 'text', required: true },
            { name: 'email', label: 'Email Address', type: 'email', required: true },
            { type: 'heading', label: 'Permanent Address', name: 'addressHeading' },
            { name: 'addressLine1', label: 'Address Line 1', type: 'text', required: true },
            { name: 'addressLine2', label: 'Address Line 2', type: 'text', required: false },
            { name: 'country', label: 'Country', type: 'countrySelect', required: true },
            { name: 'stateProvince', label: 'State/Province/Region', type: 'stateSelect', required: true },
            { name: 'city', label: 'City', type: 'text', required: true },
            { name: 'postalCode', label: 'Postal Code', type: 'text', required: true },
            {
                name: 'reason',
                label: 'State clearly the reason for the loss of the Original Degree Certificate.',
                type: 'textarea',
                required: true
            }
        ],
        files: [
            {
                name: 'policeComplaint',
                label: 'Police Complaint',
                required: true
            },
            {
                name: 'pressNotification',
                label: 'Press Notification / Advertisement',
                required: true
            },
            {
                name: 'affidavit',
                label: 'Sworn Affidavit',
                required: true
            },
            {
                name: 'originalDegreeScan',
                label: 'Original Degree Certificate (SCAN COPY IF AVAILABLE)',
                required: false

            },
            {
                name: 'sbiReceipt',
                label: 'SBI Collect Receipt (₹1000)',
                required: true
            },
        ],
        declarations: [
            {
                name: 'declaration',
                label: 'I acknowledge that my Original Degree Certificate has been irrecoverably lost, and I undertake to accept responsibility for any consequences that may result from its misuse by any person who may obtain it.',
                required: true
            }
        ]
    },
    'name-change': {
        needsDirectorApproval: true,
        title: 'Application for Registration of Student Name change in the Institute Records',
        instructions: [
            'Any change of name must be notified through the Official Gazette of the Government of India as per the prescribed procedure. The Gazette notification shall serve as the primary legal proof of the change of name and shall be valid for all official purposes.',
            'It shall be the sole responsibility of the applicant to ensure that the changed name, as notified in the Official Gazette, is duly reflected and consistently recorded across all previous qualifying examination documents, and that the same has been duly updated by the respective issuing authorities prior to submission.',
            { type: 'address', text: 'Applicants are required to send a self-addressed, cloth-lined envelope (16 × 12 inches in size), affixed with stamps totalling ₹95, to the address mentioned below. The Institute requires this for dispatch of the updated academic documents reflecting the changed name to the applicant by Speed Post service of India Post.', details: CONTROLLER_ADDRESS },
            { type: 'format', text: '**AFFIDAVIT FOR NAME CHANGE**\\nI, _________________________ (Former Name), son/daughter of _________________________, Registered Number _________________________, do hereby solemnly affirm and declare that:\n\n1. That I was formerly known by the name _________________________ and that I have now changed my name to _________________________ for personal / legal / matrimonial reasons (strike out whichever is not applicable).\n\n2. That the name _________________________ and the name _________________________ both refer to one and the same person, that is, myself, and that I am the sole and same individual in both instances.\n\n3. That all academic records, certificates, and documents issued to me by Sri Sathya Sai Institute of Higher Learning, Prasanthi Nilayam, including my Degree Certificate pertaining to the _________________________________ Academic Programme, stand recorded under my former name _________________________.\n\n4. That I now require my academic records / Degree Certificate to be updated to reflect my changed name _________________________, for the purpose of ___________________________________________________________________________ (state clearly why the name change is required and where the updated document is to be submitted or produced).\n\n5. That I understand and acknowledge that I shall be fully liable for all consequences arising from any false or misleading information provided in this affidavit. I further undertake to indemnify and hold harmless the Institute against any loss, claim, or consequences that may arise due to any improper or fraudulent use of documents issued pursuant to this declaration.\n\nDate:\nStudent Signature:\n\n**VERIFICATION**\n\nI, the deponent above named, do hereby solemnly affirm and state that the contents of Paragraphs 1 to 5 of the above affidavit are true and correct to my knowledge, and that no part of it is false and nothing has been concealed therein.\n\nSolemnly affirmed / Sworn on this ______ day of _________________________________ at _________________________________\n\n**Attested and identified by me**\t\t\t\t**Signature of Deponent**\n(Signature and Seal of Notary Public / First-Class Magistrate)' },
            'The applicant must submit the original academic documents issued by the Institute, such as Grade Cards and Degree Certificate, in hard copy to the Examinations Section. These documents will then be reissued with the new name and sent back to the applicant. In case the applicant has lost any of the original documents, they must apply for duplicate documents before submitting the request for a name change.',
            'Once the application is submitted, the applicant must wait for clearance from the Director of the concerned Campus of the Institute. Only after the Director clears the application will the Examination Section process it further. The applicant can track the status of the application using the Application ID provided at the time of submission.'
        ],
        titleLink: {
            text: 'Please click here to make the payment of ₹500 using SBI Collect',
            url: 'https://www.onlinesbi.sbi/sbicollect/icollecthome.htm?corpID=350506&categoryName=SSSIHL%20Exams%20App%20Change%20of%20Name'
        },
        fields: [
            {
                name: 'applicantName',
                label: 'Former Name',
                type: 'text',
                required: true
            },
            {
                name: 'newName',
                label: 'Changed Name as per the Gazette notification',
                type: 'text',
                required: true
            },
            {
                name: 'fatherName',
                label: 'Father\'s Name',
                type: 'text',
                required: true
            },
            {
                name: 'regNo',
                label: 'Registered Number',
                type: 'number',
                required: true
            },
            {
                name: 'abcApaarId',
                label: 'ABC / APAAR ID',
                type: 'number',
                required: false
            },
            {
                name: 'campus',
                label: 'Campus',
                type: 'select',
                options: ['Prashanti Nilayam Campus', 'Anantapur Campus', 'Brindavan Campus', 'Nandigiri Campus'],
                required: true
            },
            {
                name: 'program',
                label: 'Academic Programme',
                type: 'select',
                options: PROGRAMME_OPTIONS,
                required: true
            },

            {
                name: "periodOfStudy",
                label: "Period of Study",
                type: "daterange",
                required: true,
                placeholder: "Select period of study"
            },

            {
                name: 'mobile',
                label: 'Mobile Number',
                type: 'text',
                required: true
            },
            {
                name: 'email',
                label: 'Email Address',
                type: 'email',
                required: true
            },

            { type: 'heading', label: 'Permanent Address', name: 'addressHeading' },
            { name: 'addressLine1', label: 'Address Line 1', type: 'text', required: true },
            { name: 'addressLine2', label: 'Address Line 2', type: 'text', required: false },
            { name: 'country', label: 'Country', type: 'countrySelect', required: true },
            { name: 'stateProvince', label: 'State/Province/Region', type: 'stateSelect', required: true },
            { name: 'city', label: 'City', type: 'text', required: true },
            { name: 'postalCode', label: 'Postal Code', type: 'text', required: true },


        ],
        files: [
            { name: 'gazetteNotification', label: 'Gazette Notification', required: true },
            { name: 'previousQualificationCertificate', label: 'Previous Qualification Certificate reflecting the changed name', required: true },
            { name: 'identityProof', label: 'Identity Proof', required: true },
            { name: 'affidavit', label: 'Affidavit', required: true },
            { name: 'sbiReceipt', label: 'SBI Collect Receipt', required: true },
        ]
    },
    'repeat-paper': {
        needsDirectorApproval: true,
        title: 'Application for Repeating Examinations Registration (CIE and ESE)',
        description: 'FOR THOSE WHO HAVE EXHAUSTED SUPPLEMENTARY EXAMINATION CHANCES',
        instructions: [
            'Ensure you have the correct Course Code(s) and Course Title.',
            'If unable to repeat on medical grounds, inform the Director and Controller of Examinations in advance.',
            'Failure to inform in advance may result in forfeiture of candidature for the next examination.'
        ],
        fields: [

            {
                type: 'heading',
                label: 'Student Details',
                name: 'heading1'
            },
            { name: 'applicantName', label: 'Candidate Name', type: 'text', required: true },
            { name: 'regNo', label: 'Registered Number', type: 'number', required: true },
            { name: 'abcApaarId', label: 'ABC / APAAR ID', type: 'number', required: false },
            { name: 'campus', label: 'Campus', type: 'select', options: ['Prashanti Nilayam Campus', 'Anantapur Campus', 'Brindavan Campus', 'Nandigiri Campus'], required: true },
            { name: 'program', label: 'Academic Programme', type: 'select', options: PROGRAMME_OPTIONS, required: true },
            {
                name: "periodOfStudy",
                label: "Period of Study",
                type: "daterange",
                required: true,
                placeholder: "Select period of study"
            },
            { name: 'mobile', label: 'Mobile Number', type: 'number', required: true },
            { name: 'email', label: 'Email Address', type: 'email', required: true },
            { type: 'heading', label: 'Permanent Address', name: 'addressHeading' },
            { name: 'addressLine1', label: 'Address Line 1', type: 'text', required: true },
            { name: 'addressLine2', label: 'Address Line 2', type: 'text', required: false },
            { name: 'country', label: 'Country', type: 'countrySelect', required: true },
            { name: 'stateProvince', label: 'State/Province/Region', type: 'stateSelect', required: true },
            { name: 'city', label: 'City', type: 'text', required: true },
            { name: 'postalCode', label: 'Postal Code', type: 'text', required: true },


            {
                type: 'heading',
                label: 'Course Details',
                name: 'heading2'
            },
            {
                type: 'paperTable',
                label: 'Courses to Repeat',
                name: 'paperDetails',
                required: true
            },
            { name: 'separatorDeclaration', label: '', type: 'separator' },
            {
                type: 'singleCheckbox',
                name: 'declaration',
                label: 'I request that my name may kindly be registered for repeating the above paper(s).\n\nIf I, on medical grounds, find it difficult to repeat the paper(s), I will duly inform the Director of the Campus and the Controller of Examinations in advance, so that my candidature for the next examination may not stand forfeited.',
                required: true
            }
        ],
        files: []
    },

    'retotaling': {
        title: 'Application for Re-Totalling of Marks',
        description: 'The application will be considered only within 10 days from the date of receipt of the respective Semester Grade Cards by the Campus Office',
        instructions: [
            'This service is for verification of marks totaling in your answer script.',
            'Select whether it is for End-Semester or Supplementary Examinations.',
            'Grade Card upload is optional but recommended.',
            { type: 'address', text: 'Applicants are required to send a self-addressed envelope affixed with stamps totalling ₹95, to the address mentioned below.', details: CONTROLLER_ADDRESS }
        ],

        titleLink: {
            text: 'Please click here to make the payment of ₹100 for each Re-Totalling Application using SBI Collect',
            url: 'https://www.onlinesbi.sbi/sbicollect/icollecthome.htm?corpID=350506&categoryName=SSSIHL%20Exam%20App%20%20Re-Totaling%20of%20Marks'
        },
        fields: [...COMMON_ACADEMIC_FIELDS,
        {
            name: 'examType',
            label: 'Examination Type',
            type: 'radio',
            required: true,
            options: ['End-Semester Examinations', 'Supplementary Examinations']
        },

        {
            name: 'examMonthYear',
            label: 'Month & Year of Examination',
            type: 'conditionalSelect',
            required: true,
            dependsOn: 'examType',
            optionsMap: {
                'End-Semester Examinations': ['April 2024', 'February 2024', 'April 2025', 'February 2025', 'April 2026', 'February 2026'],
                'Supplementary Examinations': ['June 2024', 'December 2024', 'June 2025', 'December 2025', 'June 2026', 'December 2026']
            }
        },

        {
            name: 'subjectCode',
            label: 'Papers for Re-Totalling',
            type: 'paperTable',
            required: true
        }],

        files: [
            {
                name: 'gradeCard',
                label: 'Grade Card (Optional)',
                required: false
            },
            {
                name: 'sbiReceipt',
                label: 'SBI Collect Receipt',
                required: true
            }
        ]
    },
    'on-request-degree': {
        title: 'Application for On-Request Degree Certificate',
        titleLink: {
            text: 'Please click here to make the payment of ₹3000 using SBI Collect',
            url: 'https://onlinesbi.sbi.bank.in/sbicollect/icollecthome.htm?corpID=350506&categoryName=APP%20on%20Request%20Degree%20Certificate%20Issue'
        },
        description: 'This application is exclusively for candidates who were absent from the convocation ceremony of their respective batch and have not yet received their Degree Certificate. Only such candidates are eligible to submit an application through this portal.',
        instructions: [
            
            { type: 'address', text: 'Applicants are required to send a self-addressed, cloth-lined envelope waterproof (16 × 12 inches in size), affixed with stamps totalling ₹95, to the address mentioned below. The Institute requires this for dispatch of the On-Request Degree Certificate to the applicant by Speed Post service of India Post.', details: CONTROLLER_ADDRESS },
            'The envelope should state clearly the name and programme of the student. The full and complete postal address must be clearly written or typed on it, including the town / city, PIN code, district and state.',
            'Students of foreign nationality may affix appropriate postage for an envelope weighing 100-120 gms.',
            'Candidates applying for the Degree Certificate for Undergraduate degrees such as B.A. / B.A. (Hons.) / B.Sc. / B.Sc. (Hons.) / B.Com. (Hons.) / B.P.A. / B.B.M. / B.B.A. and B.C.A. should upload the soft copy of the Original Pass Certificate of the Intermediate or Pre-University Examination issued by the Board.',
            'Candidates applying for the Degree Certificate for Postgraduate degrees such as M.A. / M.Sc. / M.B.A. / M.B.A. (Fin.) / M.F.M. / M.Tech. / B.Ed. / M.Ed. should upload the soft copy of the Qualifying Degree Pass Certificate.',
        ],
        fields: [
            { type: 'heading', label: 'Candidate Details', name: 'heading1' },
            { name: 'applicantName', label: 'Candidate Name', type: 'text', required: true },
            { name: 'regNo', label: 'Registered Number', type: 'number', required: true },
            { name: 'abcApaarId', label: 'ABC / APAAR ID', type: 'number', required: false },
            { name: 'campus', label: 'Campus', type: 'select', options: ['Prashanti Nilayam Campus', 'Anantapur Campus', 'Brindavan Campus', 'Nandigiri Campus'], required: true },
            { name: 'degreeAppliedFor', label: 'Degree Applied For', type: 'select', options: ['Undergraduate Degree', 'Postgraduate Degree', 'Professional Degree', 'PhD'], required: true },
            { name: 'program', label: 'Academic Programme', type: 'select', options: PROGRAMME_OPTIONS, required: true },
            { name: 'mobile', label: 'Mobile Number', type: 'number', required: true },
            { name: 'email', label: 'Email Address', type: 'email', required: true },
            { type: 'heading', label: 'Permanent Address', name: 'addressHeading' },
            { name: 'addressLine1', label: 'Address Line 1', type: 'text', required: true },
            { name: 'addressLine2', label: 'Address Line 2', type: 'text', required: false },
            { name: 'country', label: 'Country', type: 'countrySelect', required: true },
            { name: 'stateProvince', label: 'State/Province/Region', type: 'stateSelect', required: true },
            { name: 'city', label: 'City', type: 'text', required: true },
            { name: 'postalCode', label: 'Postal Code', type: 'text', required: true },
        ],

        files: [
            { name: 'qualifyingCert', label: 'Previous Qualifying Certificate', required: true },
            { name: 'sbiReceipt', label: 'SBI Collect Receipt', required: true }
        ]
    },
    'migration': {
        title: 'Application for Migration Certificate',
        instructions: [
            'No Fees is charged for issuing of Migration Certificate.',
            {
                type: 'deliveryOptions',
                digilockerUrl: 'https://accounts.digilocker.gov.in/v3/7b9f84c86732efd21cd8076ff06f3fd60b1fbe146732fa57444b03b35f3740a4--en',
                addressText: 'Send a self-addressed envelope (11 × 5 inches in size), affixed with stamps totalling ₹65, to the address below. The Migration Certificate will be dispatched by Speed Post service of India Post.',
                addressDetails: CONTROLLER_ADDRESS,
                envelopeNotes: [
                    'The name of the applicant, along with the complete postal address, including the town / city, PIN code, district and state must be clearly written or typed on the envelope.',
                    'Students of foreign nationality may affix appropriate postage for an envelope weighing 100-120 g.'
                ]
            }
        ],
        fields: [
            {
                name: 'applicantName',
                label: 'Candidate Name',
                type: 'text',
                required: true
            },
            {
                name: 'dateOfBirth',
                label: 'Date of Birth',
                type: 'date',
                required: true
            },
            {
                name: 'yearofAdmission',
                label: 'Year of Admission',
                type: 'date',
                required: true
            },
            {
                name: 'campus',
                label: 'Campus',
                type: 'select',
                options: ['Prashanti Nilayam Campus', 'Anantapur Campus', 'Brindavan Campus', 'Nandigiri Campus'],
                required: true
            },
            {
                name: 'lastExamRegNo',
                label: 'Last Examination Registered Number',
                type: 'text',
                required: true
            },
            {
                name: 'abcApaarId',
                label: 'ABC / APAAR ID',
                type: 'number',
                required: false
            },
            {
                name: 'lastExamDate',
                label: 'Month & Year of Last Examination',
                type: 'monthyear',
                required: true
            },
            {
                name: 'degreeRecieved',
                label: 'Have you received your Degree Certificate?',
                type: 'radio',
                options: ['Yes', 'No'],
                required: true
            },
            {
                name: 'universityInstitute',
                label: 'The University / Institute which you propose to join ',
                type: 'text',
                required: true
            },
            {
                name: 'mobile',
                label: 'Mobile Number',
                type: 'text',
                required: true
            },
            {
                name: 'email',
                label: 'Email Address',
                type: 'email',
                required: true
            },
            { type: 'heading', label: 'Permanent Address', name: 'addressHeading' },
            { name: 'addressLine1', label: 'Address Line 1', type: 'text', required: true },
            { name: 'addressLine2', label: 'Address Line 2', type: 'text', required: false },
            { name: 'country', label: 'Country', type: 'countrySelect', required: true },
            { name: 'stateProvince', label: 'State/Province/Region', type: 'stateSelect', required: true },
            { name: 'city', label: 'City', type: 'text', required: true },
            { name: 'postalCode', label: 'Postal Code', type: 'text', required: true }
        ],
        
    }
};

