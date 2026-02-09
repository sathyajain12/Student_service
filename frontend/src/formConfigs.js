const COMMON_ACADEMIC_FIELDS = [
    { name: 'applicantName', label: 'Candidate Name', type: 'text', required: true },
    { name: 'regNo', label: 'Registered Number', type: 'number', required: true },
    { name: 'campus', label: 'Campus', type: 'select', options: ['Prashanti Nilayam Campus', 'Anantapur Campus', 'Brindavan Campus', 'Nandigiri Campus'], required: true },
    { name: 'program', label: 'Academic Programme', type: 'text', required: true },
    { name: 'mobile', label: 'Mobile Number', type: 'number', required: true },
    { name: 'email', label: 'Email Address', type: 'email', required: true },
    { type: 'heading', label: 'Address', name: 'addressHeading' },
    { name: 'addressLine1', label: 'Address Line 1', type: 'text', required: true },
    { name: 'addressLine2', label: 'Address Line 2', type: 'text', required: false },
    { name: 'country', label: 'Country', type: 'countrySelect', required: true },
    { name: 'stateProvince', label: 'State/Province/Region', type: 'stateSelect', required: true },
    { name: 'city', label: 'City', type: 'text', required: true },
    { name: 'postalCode', label: 'Postal Code', type: 'text', required: true },
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
            '**AFFIDAVIT FOR DUPLICATE GRADE CARD**\\n*To be sworn before a Notary Public / First-Class Magistrate*\\n\\nI, _________________________ (Name), son/daughter of _________________________, Registration Number _________________________, do hereby solemnly affirm and declare that:\\n\\n1. I am a bonafide student/alumnus of Sri Sathya Sai Institute of Higher Learning, Prasanthi Nilayam.\\n2. The Institute had issued me the Original Grade Card for Semester _______ of Programme _________________________, bearing Registration Number _________________________.\\n3. The said Original Grade Card has been lost whilst in my possession despite exercising due care.\\n4. I have applied to the Institute for issuance of a Duplicate Grade Card.\\n5. I hereby undertake that:\\n   - If the Original Grade Card is recovered by me at any time, I shall immediately surrender it to the Institute.\\n   - I shall be solely responsible for any misuse of the lost Original Grade Card.\\n6. The statements made herein are true to the best of my knowledge and belief.\\n\\n\\n**DEPONENT**\\nSignature: _________________________\\nName: _________________________\\nRegistration Number: _________________________\\nDate: _________________________',
            'Keep your SBI Collect receipt ready for upload.',
            'Original Grade Card scan is optional but recommended if available.'
        ],
        titleLink: {
            text: 'Please click here to make the payment of ₹500 using SBI Collect',
            url: 'https://www.onlinesbi.sbi/sbicollect/icollecthome.htm?corpID=350506&categoryName=SSSIHL%20Exams%20App%20Duplicate%20Grade%20Card'
        },
        fields: [
            ...COMMON_ACADEMIC_FIELDS,
            { name: 'periodOfStudy', label: 'Period of Study', type: 'daterange', required: true, placeholder: 'e.g., June 2019 - March 2022' },
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
            'As the Institute follows a grading system, grade cards-which are already issued to the students by the Institute-serve as Statement of Marks. No other mark statements are issued. However, if required, a Statement of CGPA Equivalent Percentage of Marks is issued on application to pursue further studies or to seek a job.',
            'No Fee is charged for the issue of a Statement of CGPA Equivalent Percentage of Marks.',


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
            placeholder: 'Enter your CGPA',
            step: '0.01',
            min: '0',
            max: '10'
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
                type: 'paperTable',
                label: 'Papers for Supplementary Examination',
                name: 'paperDetails',
                required: true
            },

        ],
        files: [

        ]
    },
    'duplicate-degree': {
        title: 'Application for Duplicate Degree Certificate',
        instructions: [
            'Before applying for a Duplicate Degree Certificate, the candidate must make all reasonable efforts to trace the Original Degree Certificate. Only after being fully satisfied that the Original Degree Certificate has been lost beyond recovery may the candidate proceed to apply for a Duplicate Degree Certificate.',
            'In the event of loss in transit or misplacement of the Original Degree Certificate, the candidate is required to lodge a formal police complaint and obtain an official acknowledgment from the concerned police station. A scanned copy of the complaint, along with the original acknowledgment, must be uploaded through the designated form.',
            'A press notification, in the prescribed format, must be published in a recognized daily newspaper. A scanned copy of the newspaper cutting shall be uploaded through the designated form.',
            'An affidavit, sworn before a Notary Public or a First-Class Magistrate, must be enclosed in accordance with the prescribed format.',
            'The candidate must clearly state the reason for the loss of the Original Degree Certificate.',
            '**FORMAT OF THE NEWSPAPER NOTIFICATION**\n\nNotice is hereby given that the undersigned has lost the Original Degree Certificate pertaining to the _________________________________ Academic Programme, issued by Sri Sathya Sai Institute of Higher Learning. Any person who finds the said certificate is requested to return it to the undersigned without delay. Possession of the certificate despite this public notice shall be deemed unauthorized and unlawful, and the holder shall be liable for any misuse thereof.\n\nName of the Candidate:\nMobile No:\nAddress(with city and state):\n\nDate:',
            '**FORMAT FOR AFFIDAVIT**\n\nI, _________________________________, daughter/son of \n_________________________________, aged ______, residing at  _________ , do hereby solemnly affirm and declare as follows:\n\n1. That the Original Degree Certificate pertaining to the _________________________________ Academic Programme, issued to me by Sri Sathya Sai Institute of Higher Learning, Prasanthi Nilayam, has been irrecoverably lost or destroyed.\n\n2. That I have made a thorough and diligent search for the said Original Degree Certificate, but despite my best efforts, I have been unable to recover it.\n\n3. That a duplicate copy of the ________ Degree Certificate is now required by me, for the purpose of\n___________________________________________________________________________\n(state clearly why the duplicate is required and where it is to be submitted or produced).\n\n4. That I understand and acknowledge that if the lost Original Degree Certificate is misused by me or by any other person into whose possession it may fall, I shall be fully liable for all consequences arising therefrom. I further undertake to indemnify and hold harmless the Institute against any loss or consequences that may arise due to any improper or unfair use of the aforesaid Degree Certificate.\n\nDate:\n\nStudent Signature:\n\n **VERIFICATION**\n\n I, the deponent above named, do hereby solemnly affirm and state that the contents of Paragraphs 1 to 4 of the above affidavit are true and correct to my knowledge, and that no part of it is false and nothing material has been concealed therein.\nSolemnly affirmed/sworn on this ______ day of _________________________________ at _________________________________\n\n **Attested and identified by me** (Signature and Seal of Notary Public / First-Class Magistrate)'
        ],
        titleLink: {
            text: 'Please click here to make the payment of ₹1000 using SBI Collect',
            url: 'https://www.onlinesbi.sbi/sbicollect/icollecthome.htm?corpID=350506&categoryName=SSSIHL%20Exams%20App%20Duplicate%20Grade%20Cardhttps://onlinesbi.sbi.bank.in/sbicollect/icollecthome.htm'
        },
        fields: [
            { name: 'applicantName', label: 'Candidate Name', type: 'text', required: true },
            { name: 'regNo', label: 'Registered Number', type: 'number', required: true },
            { name: 'campus', label: 'Campus', type: 'select', options: ['Prashanti Nilayam Campus', 'Anantapur Campus', 'Brindavan Campus', 'Nandigiri Campus'], required: true },
            { name: 'program', label: 'Academic Programme', type: 'text', required: true },
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
                description: 'This must be supported by an affidavit–see Instructions',
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
                label: 'Press Notification/Advertisement',
                required: true
            },
            {
                name: 'affidavit',
                label: 'Sworn Affidavit',
                required: true
            },
            {
                name: 'originalDegreeScan',
                label: 'Original Degree Certificate (Scanned) (Optional)',
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
                label: 'I undertake that if my Original Degree Certificate, which has been irrecoverably lost, is put to unfair use by any person who may lay hands on it, I shall be liable for all consequences and loss which may accrue from such misuse.',
                required: true
            }
        ]
    },
    'name-change': {
        title: 'Application for Registration of Student Name change in the Institute Records',
        instructions: [
            'A fee of ₹500 must be paid via SBI Collect before submission.',
            'You must have a valid Gazette Notification for the name change.',
            'Upload your Previous Qualification Certificate as proof.',
            'The new name should exactly match the Gazette notification.',
            'Complete address details are required.',
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
            { type: 'heading', label: 'Address', name: 'addressHeading' },
            { name: 'addressLine1', label: 'Address Line 1', type: 'text', required: true },
            { name: 'addressLine2', label: 'Address Line 2', type: 'text', required: false },
            { name: 'country', label: 'Country', type: 'countrySelect', required: true },
            { name: 'stateProvince', label: 'State/Province/Region', type: 'stateSelect', required: true },
            { name: 'city', label: 'City', type: 'text', required: true },
            { name: 'postalCode', label: 'Postal Code', type: 'text', required: true },
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
                type: 'paperTable',
                label: 'Papers to Repeat',
                name: 'paperDetails',
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
            type: 'radio',
            required: true,
            options: ['End-Semester Examinations', 'Supplementary Examinations']
        },

        {
            name: 'examMonth',
            label: 'Month of Examination',
            type: 'conditionalSelect',
            required: true,
            dependsOn: 'examType',
            optionsMap: {
                'End-Semester Examinations': ['April', 'February'],
                'Supplementary Examinations': ['June', 'December']
            }
        },

        {
            name: 'examYear',
            label: 'Year of Examination',
            type: 'select',
            required: true,
            options: ['2024', '2025', '2026']
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
            'Provide complete postal address details.',
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
                name: 'mobile',
                label: 'Mobile Number',
                type: 'text',
                required: true
            },
            { type: 'heading', label: 'Address to which the Migration Certificate should be posted', name: 'addressHeading' },
            { name: 'addressLine1', label: 'Address Line 1', type: 'text', required: true },
            { name: 'addressLine2', label: 'Address Line 2', type: 'text', required: false },
            { name: 'country', label: 'Country', type: 'countrySelect', required: true },
            { name: 'stateProvince', label: 'State/Province/Region', type: 'stateSelect', required: true },
            { name: 'city', label: 'City', type: 'text', required: true },
            { name: 'postalCode', label: 'Postal Code', type: 'text', required: true }
        ],
        files: [{
            name: 'gradeCard',
            label: 'Consolidated Grade Card',
            required: true
        }]
    }
};

