const COMMON_ACADEMIC_FIELDS = [
    { name: 'applicantName', label: 'Candidate Name', type: 'text', required: true },
    { name: 'regNo', label: 'Registered Number', type: 'number', required: true },
    { name: 'campus', label: 'Campus', type: 'select', options: ['Prashanti Nilayam Campus', 'Anantapur Campus', 'Brindavan Campus', 'Nandigiri Campus'], required: true },
    { name: 'program', label: 'Academic Programme', type: 'text', required: true },
    { name: 'mobile', label: 'Mobile Number', type: 'text', required: true },
    { name: 'email', label: 'Email Address', type: 'email', required: true },
    { name: 'correspondenceAddress', label: 'Correspondence Address', type: 'textarea', required: true },

];

export const FORM_CONFIGS = {
    'duplicate-grade-card': {
        title: 'Application for Duplicate Grade Card',
        description: 'Note: This form is applicable only for students from batches before 2021. Students from 2021 batch onwards can download their Grade Cards directly from DigiLocker.',
        instructions: [
            'This form is applicable only for students from batches before 2021.',
            'Students from 2021 batch onwards can download their Grade Cards directly from DigiLocker.',
            'A fee of ₹500 must be paid via SBI Collect before submission.',
            'You must upload a Police Complaint and a Sworn Affidavit.',
            'The Sworn Affidavit must be sworn before a Notary / First-Class Magistrate with the following text: /n/n "Whereas the Sri Sathya Sai Institute of Higher Learning, Prasanthi Nilayam has accorded me the Original Grade Card bearing the Regd. No___ Semester No___ of the Programme that has been lost whilst in my possession, having been so lost, an application to the Institute for the grant of a Duplicate having been made, subject to the condition, that if, the Original Grade Card is recovered by me, I shall surrender it to the Institute."',
            'Keep your SBI Collect receipt ready for upload.',
            'Original Grade Card scan is optional but recommended if available.'
        ],
        fields: [
            ...COMMON_ACADEMIC_FIELDS,
            { name: 'periodOfStudy', label: 'Period of Study', type: 'text', required: true, placeholder: 'e.g., June 2019 - March 2022' },
            { name: 'semester', label: 'Semester', type: 'select', options: ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'], required: true },
            { name: 'reason', label: 'Reason for Loss', type: 'textarea', required: true },
        ],
        files: [
            { name: 'policeComplaint', label: 'Police Complaint', required: true },
            { name: 'affidavit', label: 'Sworn Affidavit', required: true },
            { name: 'gradeCard', label: 'Original Grade Card (Scanned) (Optional)', required: false },
            { name: 'sbiReceipt', label: 'SBI Collect Receipt (₹500)', required: true },
        ]
    },
    'cgpa-conversion': {
        title: 'Application for CGPA to Marks Conversion',
        instructions: [
            'This service converts your CGPA to equivalent percentage marks.',
            'Ensure you have your correct CGPA value ready.',
            'Select the appropriate degree level (Undergraduate/Postgraduate/Professional).',
            'The conversion certificate will be sent to your registered email.',
            
        ],
        fields: [...COMMON_ACADEMIC_FIELDS,
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
        {
            name: 'cgpa',
            label: 'CGPA',
            type: 'number',
            required: true,
            placeholder: 'Enter your CGPA'
        },
        {
            name: 'cgpaMarksEquivalence',
            label: 'CGPA Marks Equivalent Statement wanted for',
            type: 'checkbox',
            options: ['Undergraduate', 'Postgraduate', 'Professional'],
            required: true
        }
        ],
        files: [

        ]
    },
    'supplementary-exam': {
        title: 'Application for End-Semester Supplementary Examinations',
        instructions: [
            'This form is for students who need to appear for supplementary examinations.',
            'Ensure you have the correct Paper Code(s) and Paper Title(s).',
            'Select the appropriate semester for which you are applying.',
            'Check the examination schedule for supplementary exam dates.',
            'Application must be submitted before the deadline mentioned in the notification.'
        ],
        fields: [
            {
                name: "periodOfStudy",
                label: "Period of Study",
                type: "daterange",
                required: true,
                placeholder: "Select period of study"
            },
            {
                type: 'heading',
                label: 'Candidate Details',
                name: 'heading1'
            },
            ...COMMON_ACADEMIC_FIELDS,
            {
                type: 'heading',
                label: 'Paper Details',
                name: 'heading2'
            },
            {
                type: 'text',
                label: 'Paper Code(s)',
                name: 'paperCodes',
                required: true
            },
            {
                type: 'text',
                label: 'Paper Title(s)',
                name: 'paperTitles',
                required: true
            },
            {
                name: 'semester',
                label: 'Semester',
                type: 'select',
                options: ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'],
                required: true
            },

        ],
        files: [

        ]
    },
    'duplicate-degree': {
        title: 'Application for Duplicate Degree Certificate',
        instructions: [
            'A fee of ₹1000 must be paid via SBI Collect before submission.',
            'You must lodge a Police Complaint and upload the same.',
            'A Press Notification/Advertisement regarding the loss is mandatory.',
            'A Sworn Affidavit on non-judicial stamp paper is required.',
            'Clearly state the reason for loss of the original degree certificate.',
            'Processing may take 15-30 working days after verification.'
        ],
        fields: [...COMMON_ACADEMIC_FIELDS,
        {
            name: "periodOfStudy",
            label: "Period of Study",
            type: "daterange",
            required: true,
            placeholder: "Select period of study"
        },
        {
            name: 'yearOforiginalDegree',
            label: 'Year of Original Degree Issue',
            type: 'date',
            required: true
        },

        {
            name: 'reason',
            label: 'State clearly the reason for the loss of the Original Degree Certificate.',
            type: 'textarea',
            description: 'This must be supported by an affidavit–see Instructions',
            required: true
        }],
        files: [
            {
                name: 'policeComplaint',
                label: 'Police Complaint',
                required: true
            },
            {
                name: 'pressNotification',
                label: 'Press Notification/Advertisement',
                required: true
            },
            {
                name: 'affidavit',
                label: 'Sworn Affidavit',
                required: true
            },
            {
                name: 'sbiReceipt',
                label: 'SBI Collect Receipt (₹1000)',
                required: true
            },
        ]
    },
    'name-change': {
        title: 'Application for Registration of Student Name change in the Institute Records',
        instructions: [
            'A fee of ₹500 must be paid via SBI Collect before submission.',
            'You must have a valid Gazette Notification for the name change.',
            'Upload your Previous Qualification Certificate as proof.',
            'The new name should exactly match the Gazette notification.',
            'Both permanent and correspondence addresses are required.',
            'Processing may take 10-15 working days after verification.'
        ],
        titleLink: {
            text: 'Please click here to make the payment of ₹500 using SBI Collect',
            url: 'https://www.onlinesbi.sbi/sbicollect/icollecthome.htm?corpID=350506&categoryName=SSSIHL%20Exams%20App%20Change%20of%20Name'
        },
        fields: [
            {
                name: 'applicantName',
                label: 'Candidate Name',
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
                name: 'campus',
                label: 'Campus',
                type: 'select',
                options: ['Prashanti Nilayam Campus', 'Anantapur Campus', 'Brindavan Campus', 'Nandigiri Campus'],
                required: true
            },
            {
                name: 'program',
                label: 'Academic Programme',
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
            {
                name: "periodOfStudy",
                label: "Period of Study",
                type: "daterange",
                required: true,
                placeholder: "Select period of study"
            },
            {
                name: 'correspondenceAddress',
                label: 'Correspondence Address',
                type: 'textarea',
                required: true
            },
            {
                name: 'permanentAddress',
                label: 'Permanent Address',
                type: 'textarea',
                required: true

            },
            {
                name: 'newName',
                label: 'Changed Name as per the Gazette notification',
                type: 'text',
                required: true
            },
        ],
        files: [
            { name: 'gazetteNotification', label: 'Gazette Notification', required: true },
            { name: 'previousQualificationCertificate', label: 'Previous Qualification Certificate', required: true },
            { name: 'sbiReceipt', label: 'SBI Collect Receipt', required: true },
        ]
    },
    'repeat-paper': {
        title: 'Application for repeating a paper for supplementary examinations(CIE and ESE)',
        description: 'FOR THOSE WHO HAVE EXHAUSTED SUPPLEMENTARY EXAMINATION CHANCES',
        instructions: [
            'This form is only for students who have exhausted their supplementary examination chances.',
            'You will need to repeat both CIE (Continuous Internal Evaluation) and ESE (End Semester Examination).',
            'Ensure you have the correct Paper Code(s) and Paper Title(s).',
            'If unable to repeat on medical grounds, inform the Director and Controller of Examinations in advance.',
            'Failure to inform in advance may result in forfeiture of candidature for the next examination.'
        ],
        fields: [
            {
                name: "periodOfStudy",
                label: "Period of Study",
                type: "daterange",
                required: true,
                placeholder: "Select period of study"
            },
            {
                type: 'heading',
                label: 'Student Details',
                name: 'heading1'
            },
            ...COMMON_ACADEMIC_FIELDS,
            {
                type: 'heading',
                label: 'List of Paper(s) for which Candidate intends to repeat the paper.',
                name: 'heading2'
            },
            {
                name: 'paperCodes',
                label: 'Paper Codes',
                type: 'text',
                required: true
            },
            {
                name: 'paperTitles',
                label: 'Paper Titles',
                type: 'text',
                required: true
            },
            {
                name: 'semester',
                label: 'Semester',
                type: 'select',
                options: ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'],
                required: true
            },
            {
                type: 'paragraph',
                name: 'declaration',
                content: 'I request that my name may kindly be registered for repeating the above paper(s).\n\nIf I, on medical grounds, find it difficult to repeat the paper(s), I will duly inform the Director of the Campus and the Controller of Examinations in advance, so that my candidature for the next examination may not stand forfeited.'
            }
        ],
        files: []
    },

    'retotaling': {
        title: 'Application for Re-Totalling of Marks',
        instructions: [
            'This service is for verification of marks totaling in your answer script.',
            'Select whether it is for End-Semester or Supplementary Examinations.',
            'A fee must be paid via SBI Collect before submission.',
            'Provide the correct Subject Code for which re-totaling is requested.',
            'Grade Card upload is optional but recommended.',
            'Results will be communicated within 15 working days.'
        ],
        fields: [...COMMON_ACADEMIC_FIELDS,
        {
            name: 'examType',
            label: 'Examination Type',
            type: 'checkbox',
            requuired: true,
            options: ['End-Semester Examinations', 'Supplementary Examinations']
        },

        {
            name: 'periodOfStudy',
            label: 'Period of Examination',
            type: 'daterange',
            required: true,
            placeholder: 'Select period of Examination'
        },

        {
            name: 'subjectCode',
            label: 'Subject Code',
            type: 'text',
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
        instructions: [
            'This service is for early issuance of degree certificate before the convocation.',
            'A fee must be paid via SBI Collect before submission.',
            'Upload your Qualifying Certificate as proof of completion.',
            'Select the appropriate degree type (Undergraduate/Postgraduate/Professional/PhD).',
            'Processing may take 7-10 working days after verification.'
        ],
        fields: [
            {
                type: 'heading',
                label: 'Candidate Details',
                name: 'heading1'
            },
            ...COMMON_ACADEMIC_FIELDS,
            {
                name: 'degreeAppliedFor',
                label: 'Degree Applied For',
                type: 'select',
                options: ['Undergraduate Degree', 'Postgraduate Degree', 'Professional Degree', 'PhD'],
                required: true
            },
        ],

        files: [
            { name: 'qualifyingCert', label: 'Qualifying Certificate', required: true },
            { name: 'sbiReceipt', label: 'SBI Collect Receipt', required: true }
        ]
    },
    'migration': {
        title: 'Application for Migration Certificate',
        instructions: [
            'This certificate is required for joining another University/Institute.',
            'Upload your Consolidated Grade Card as proof.',
            'Provide complete postal address including PIN code, district, and state.',
            'Mention the University/Institute you propose to join.',
            'Indicate whether you have received your Degree Certificate.',
            'The Migration Certificate will be posted to the address provided.'
        ],
        fields: [
            {
                name: 'applicantName',
                label: 'Candidate Name',
                type: 'text',
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
                name: 'lastExam',
                label: 'Last examination appeared at this Institute(Registration no. and Month & Year of examination)',
                type: 'text',
                required: true
            },
            {
                name: 'degreeRecieved',
                label: 'Have you received your Degree Certificate ?',
                type: 'radio',
                options: ['Yes', 'No'],
                required: true
            },
            {
                name: 'universityInstitute',
                label: 'The University / Institute to which the candidate proposes to join ',
                type: 'text',
                required: true
            },
            {
                name: 'migrationAddress',
                label: 'Address to which the Migration Certificate should be posted',
                description: '( Full complete postal address, including the town/city, PIN code, district and state)',
                type: 'textarea',
                required: true
            },
            {
                name: 'mobile',
                label: 'Mobile Number',
                type: 'text',
            }
        ],
        files: [{
            name: 'gradeCard',
            label: 'Consolidated Grade Card',
            required: true
        }]
    }
};
