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
        title: 'Duplicate Grade Card',
        fields: [
            ...COMMON_ACADEMIC_FIELDS,
            { name: 'periodOfStudy', label: 'Period of Study', type: 'text', required: true, placeholder: 'e.g., June 2019 - March 2022' },
            { name: 'semester', label: 'Semester', type: 'select', options: ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'], required: true },
            { name: 'reason', label: 'Reason for Loss', type: 'textarea', required: true },
        ],
        files: [
            { name: 'policeComplaint', label: 'Police Complaint (if lodged)', required: false },
            { name: 'affidavit', label: 'Sworn Affidavit', required: true },
            { name: 'gradeCard', label: 'Original Grade Card (Scanned)', required: true },
            { name: 'sbiReceipt', label: 'SBI Collect Receipt (₹500)', required: true },
        ]
    },
    'cgpa-conversion': {
        title: 'CGPA to Marks Conversion',
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
        title: 'Supplementary Examination',
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
        title: 'Duplicate Degree Certificate',
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
        ]
    },
    'name-change': {
        title: 'Application for Registration of Student Name change in the Institute Records',
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
                name:'permanentAddress',
                label:'Permanent Address',
                type:'textarea',
                required:true

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
            { name: 'sbiReceipt', label: 'SBI Collect Receipt', required: true },
        ]
    },
    'repeat-paper': {
        title: 'Application for repeating a paper for supplementary examinations(CIE and ESE)',
        description: 'FOR THOSE WHO HAVE EXHAUSTED SUPPLEMENTARY EXAMINATION CHANCES',
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
        fields: [...COMMON_ACADEMIC_FIELDS,
            {
                name: 'examType',
                label: 'Examination Type',  
                type: 'checkbox',
                requuired: true,
                options: ['End-Semester Examinations', 'Supplementary Examinations' ]
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
                label: 'Grade Card',
                required: true
            },
            {
                name: 'sbiReceipt',
                label: 'SBI Collect Receipt',
                required: true
            }
        ]
    },
    'on-request-degree': {
        title: 'On-Request Degree Certificate',
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
                options: ['Undergraduate Degree', 'Postgraduate Degree', 'Professional Degree','PhD'],
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
