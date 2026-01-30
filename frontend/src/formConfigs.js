const COMMON_ACADEMIC_FIELDS = [
    { name: 'applicantName', label: 'Applicant Name', type: 'text', required: true },
    { name: 'regNo', label: 'Registration Number', type: 'text', required: true },
    { name: 'campus', label: 'Campus', type: 'select', options: ['Prashanti Nilayam Campus', 'Anantapur Campus', 'Brindavan Campus', 'Nandigiri Campus'], required: true },
    { name: 'program', label: 'Academic Programme', type: 'text', required: true },
];

export const FORM_CONFIGS = {
    'duplicate-grade-card': {
        title: 'Duplicate Grade Card',
        fields: [
            ...COMMON_ACADEMIC_FIELDS,
            { name: 'mobile', label: 'Mobile Number', type: 'text', required: true },
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
        fields: [...COMMON_ACADEMIC_FIELDS],
        files: [
            { name: 'gradeCard', label: 'Grade Card Copy', required: true },
            { name: 'sbiReceipt', label: 'SBI Collect Receipt', required: true },
        ]
    },
    'supplementary-exam': {
        title: 'Supplementary Examination',
        fields: [
            ...COMMON_ACADEMIC_FIELDS,
            { name: 'subjectCode', label: 'Subject Code(s)', type: 'text', required: true },
            { name: 'semester', label: 'Semester', type: 'select', options: ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'], required: true },
        ],
        files: [
            { name: 'sbiReceipt', label: 'SBI Collect Receipt', required: true },
        ]
    },
    'duplicate-degree': {
        title: 'Duplicate Degree Certificate',
        fields: [...COMMON_ACADEMIC_FIELDS, { name: 'reason', label: 'Reason for Request', type: 'textarea', required: true }],
        files: [
            { name: 'policeComplaint', label: 'Police Complaint', required: true },
            { name: 'pressNotification', label: 'Press Notification/Advertisement', required: true },
            { name: 'affidavit', label: 'Sworn Affidavit', required: true },
        ]
    },
    'name-change': {
        title: 'Name Change Registration',
        fields: [
            ...COMMON_ACADEMIC_FIELDS,
            { name: 'newName', label: 'New Name (as per Gazette)', type: 'text', required: true },
        ],
        files: [
            { name: 'gazetteNotification', label: 'Gazette Notification', required: true },
            { name: 'sbiReceipt', label: 'SBI Collect Receipt', required: true },
        ]
    },
    'repeat-paper': {
        title: 'Repeat Paper (CIE + ESE)',
        fields: [...COMMON_ACADEMIC_FIELDS, { name: 'subjectCode', label: 'Subject Code', type: 'text', required: true }],
        files: [{ name: 'sbiReceipt', label: 'SBI Collect Receipt', required: true }]
    },
    'retotaling': {
        title: 'Re-totaling of Marks',
        fields: [...COMMON_ACADEMIC_FIELDS, { name: 'subjectCode', label: 'Subject Code', type: 'text', required: true }],
        files: [
            { name: 'gradeCard', label: 'Grade Card', required: true },
            { name: 'sbiReceipt', label: 'SBI Collect Receipt', required: true }
        ]
    },
    'on-request-degree': {
        title: 'On-Request Degree Certificate',
        fields: [...COMMON_ACADEMIC_FIELDS],
        files: [
            { name: 'qualifyingCert', label: 'Qualifying Certificate', required: true },
            { name: 'sbiReceipt', label: 'SBI Collect Receipt', required: true }
        ]
    },
    'migration': {
        title: 'Migration Certificate',
        fields: [...COMMON_ACADEMIC_FIELDS, { name: 'addressTo', label: 'Name of the University joining', type: 'text', required: true }],
        files: [{ name: 'gradeCard', label: 'Consolidated Grade Card', required: true }]
    }
};
