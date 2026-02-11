const COMMON_ACADEMIC_FIELDS = [
    { name: 'applicantName', label: 'Candidate Name', type: 'text', required: true },
    { name: 'regNo', label: 'Registered Number', type: 'number', required: true },
    { name: 'campus', label: 'Campus', type: 'select', options: ['Prashanti Nilayam Campus', 'Anantapur Campus', 'Brindavan Campus', 'Nandigiri Campus'], required: true },
    { name: 'program', label: 'Academic Programme', type: 'text', required: true },
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

export const FORM_CONFIGS = {
    'duplicate-grade-card': {
        title: 'Application for Duplicate Grade Card',
        description: 'Note: This form is applicable only for students from batches before 2021. Students from 2021 batch onwards can download their Grade Cards directly from DigiLocker.',
        descriptionLink: { text: 'To download your Grade Card,', linkText: 'please click here', url: 'https://accounts.digilocker.gov.in/v3/7b9f84c86732efd21cd8076ff06f3fd60b1fbe146732fa57444b03b35f3740a4--en' },
        instructions: [
            'This form is applicable only for students from batches before 2021.',
            'Students from 2021 batch onwards can download their Grade Cards directly from DigiLocker.',
            'A fee of ₹500 must be paid via SBI Collect before submission. To make the payment: Click on the SBI Collect link provided, which will open the SBI Collect homepage. Select "Educational Institutes" as the Category. Search for "SSSIHL-ADMN" in the search field. Select the appropriate Payment Category. In the payment category dropdown, select the application name for which you are applying (Duplicate Grade Card). Complete the payment process and keep your receipt for upload.',
            'You must upload a Police Complaint and a Sworn Affidavit.',
            { type: 'format', text: '**AFFIDAVIT FOR DUPLICATE GRADE CARD**\\n**To be sworn before a Notary Public / First-Class Magistrate**\\n\\nI, _________________________ (Name), son/daughter of _________________________, Registration Number _________________________, do hereby solemnly affirm and declare that:\\n\\n1. I am a bonafide student/alumnus of Sri Sathya Sai Institute of Higher Learning, Prasanthi Nilayam.\\n2. The Institute had issued me the Original Grade Card for Semester _______ of Programme _________________________, bearing Registration Number _________________________.\\n3. The said Original Grade Card has been lost whilst in my possession despite exercising due care.\\n4. I have applied to the Institute for issuance of a Duplicate Grade Card.\\n5. I hereby undertake that:\\n   - If the Original Grade Card is recovered by me at any time, I shall immediately surrender it to the Institute.\\n   - I shall be solely responsible for any misuse of the lost Original Grade Card.\\n6. The statements made herein are true to the best of my knowledge and belief.\\n\\n\\n**DEPONENT**\\nSignature: _________________________\\nName: _________________________\\nRegistration Number: _________________________\\nDate: _________________________' },
            'Applicants are required to send a self-addressed, cloth-lined envelope – 16x12 inches in size along with the application.The Institute requires this in order to send the Duplicate Grade Card back to the applicant by post.',
            'The name of the applicant, along with the full, complete postal address, including the town/city, PIN code, district and state must be clearly written or typed on the envelope.',
            'Stamps totalling ₹95 must be affixed on the top right-hand corner of the envelope. This will ensure safe delivery of the document by India Post, via Registered Post with Acknowledgement Due. Students of foreign nationality may affix appropriate postage for an envelope weighing 100-120 g.',
            'Keep your SBI Collect receipt ready for upload.',
            'Original Grade Card scan is optional but recommended if available.',
            'In the event of loss in transit or misplacement of the Original Grade card, the candidate is required to lodge a First Information Report(FIR) and obtain an official acknowledgment from the concerned police station. A scanned copy of the FIR, along with the original acknowledgment, must be uploaded through the designated form.'
        ],
        titleLink: {
            text: 'Please click here to make the payment of ₹500 using SBI Collect',
            url: 'https://www.onlinesbi.sbi/sbicollect/icollecthome.htm?corpID=350506&categoryName=SSSIHL%20Exams%20App%20Duplicate%20Grade%20Card'
        },
        fields: [
            { name: 'applicantName', label: 'Candidate Name', type: 'text', required: true },
            { name: 'regNo', label: 'Registered Number', type: 'number', required: true },
            { name: 'campus', label: 'Campus', type: 'select', options: ['Prashanti Nilayam Campus', 'Anantapur Campus', 'Brindavan Campus', 'Nandigiri Campus'], required: true },
            { name: 'program', label: 'Academic Programme', type: 'text', required: true },
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
            { name: 'gradeCard', label: 'Original Grade Card (Scanned) (Optional)', required: false },
            { name: 'sbiReceipt', label: 'SBI Collect Receipt (₹500)', required: true },
        ]
    },
    'cgpa-conversion': {
        title: 'Application for CGPA to Percentage Conversion',
        instructions: [
            'As the Institute follows a grading system, grade cards-which are already issued to the students by the Institute-serve as Statement of Marks. No other mark statements are issued. However, if required, a Statement of CGPA Equivalent Percentage of Marks is issued on application to pursue further studies or to seek a job.',
            'No Fee is charged for the issue of a Statement of CGPA Equivalent Percentage of Marks.',
            'Applicants are required to send a self-addressed, envelope along with the application. The Institute requires this in order to send it back to the applicant by post.',
            'The name of the applicant, along with the full, complete postal address, including the town/city, PIN code, district and state must be clearly written or typed on the envelope.',
            'Stamps totalling ₹95 must be affixed on the top right-hand corner of the envelope. This will ensure safe delivery of the document by India Post, via Registered Post with Acknowledgement Due. This is especially important since the Statement of CGPA Equivalent Percentage of Marks is an original document (like a Grade Card or the Degree Certificate).',
            'Students of foreign nationality may affix appropriate postage for an envelope weighing 100-120 g.',
        ],
        fields: [{ name: 'applicantName', label: 'Candidate Name', type: 'text', required: true },
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
        title: 'Application for End-Semester Supplementary Examinations Registration',
        instructions: [
            'This form is for students who need to appear for supplementary examinations.',
            'Ensure you have the correct Paper Code(s) and Paper Title(s).',
            'Select the appropriate semester for which you are applying.',


        ],
        fields: [

            {
                type: 'heading',
                label: 'Candidate Details',
                name: 'heading1'
            },
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
                label: 'Paper Details',
                name: 'heading2'
            },
            {
                type: 'paperTable',
                label: 'Papers for Supplementary Examination',
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
        description: 'Note: This form is applicable only for students from batches before 2021. Students from 2021 batch onwards can download their duplicate degree certificate directly from DigiLocker.',
        descriptionLink: { text: 'To download your Duplicate Degree Certificate,', linkText: 'please click here', url: 'https://accounts.digilocker.gov.in/v3/7b9f84c86732efd21cd8076ff06f3fd60b1fbe146732fa57444b03b35f3740a4--en' },
        instructions: [
            'Before applying for a Duplicate Degree Certificate, the candidate must make all reasonable efforts to trace the Original Degree Certificate. Only after being fully satisfied that the Original Degree Certificate has been lost beyond recovery may the candidate proceed to apply for a Duplicate Degree Certificate.',
            'In the event of loss in transit or misplacement of the Original Degree Certificate, the candidate is required to lodge a First Information Report(FIR) and obtain an official acknowledgment from the concerned police station. A scanned copy of the FIR, along with the original acknowledgment, must be uploaded through the designated form.',
            'A press notification, in the prescribed format, must be published in a recognized daily newspaper. A scanned copy of the newspaper cutting shall be uploaded through the designated form.',
            'An affidavit, sworn before a Notary Public or a First-Class Magistrate, must be enclosed in accordance with the prescribed format.',
            'The candidate must clearly state the reason for the loss of the Original Degree Certificate.',
            'Applicants are required to send a self-addressed, cloth-lined envelope – 16x12 inches in size along with the application. The Institute requires this in order to send the Duplicate Degree Certificate back to the applicant by post.',
            'The name of the applicant, along with the full, complete postal address, including the town/city, PIN code, district and state must be clearly written or typed on the envelope.',
            'Stamps totalling ₹95 must be affixed on the top right-hand corner of the envelope. This will ensure safe delivery of the document by India Post, via Registered Post with Acknowledgement Due.',
            'Students of foreign nationality may affix appropriate postage for an envelope weighing 100-120 g.',
            { type: 'format', text: '**FORMAT OF THE NEWSPAPER NOTIFICATION**\n\nNotice is hereby given that the undersigned has lost the Original Degree Certificate pertaining to the _________________________________ Academic Programme, issued by Sri Sathya Sai Institute of Higher Learning. Any person who finds the said certificate is requested to return it to the undersigned without delay. Possession of the certificate despite this public notice shall be deemed unauthorized and unlawful, and the holder shall be liable for any misuse thereof.\n\nName of the Candidate:\nMobile No:\nAddress(with city and state):\n\nDate:' },
            { type: 'format', text: '**FORMAT FOR AFFIDAVIT**\n\nI, _________________________________, daughter/son of \n_________________________________, aged ______, residing at  _________ , do hereby solemnly affirm and declare as follows:\n\n1. That the Original Degree Certificate pertaining to the _________________________________ Academic Programme, issued to me by Sri Sathya Sai Institute of Higher Learning, Prasanthi Nilayam, has been irrecoverably lost or destroyed.\n\n2. That I have made a thorough and diligent search for the said Original Degree Certificate, but despite my best efforts, I have been unable to recover it.\n\n3. That a duplicate copy of the ________ Degree Certificate is now required by me, for the purpose of\n___________________________________________________________________________\n(state clearly why the duplicate is required and where it is to be submitted or produced).\n\n4. That I understand and acknowledge that if the lost Original Degree Certificate is misused by me or by any other person into whose possession it may fall, I shall be fully liable for all consequences arising therefrom. I further undertake to indemnify and hold harmless the Institute against any loss or consequences that may arise due to any improper or unfair use of the aforesaid Degree Certificate.\n\nDate:\n\nStudent Signature:\n\n **VERIFICATION**\n\n I, the deponent above named, do hereby solemnly affirm and state that the contents of Paragraphs 1 to 4 of the above affidavit are true and correct to my knowledge, and that no part of it is false and nothing material has been concealed therein.\nSolemnly affirmed/sworn on this ______ day of _________________________________ at _________________________________\n\n **Attested and identified by me** \n\n(Signature and Seal of Notary Public / First-Class Magistrate)' }
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
                label: 'Original Degree Certificate (Optional)',
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
            'A fee of ₹500 must be paid via SBI Collect before submission. To make the payment: Click on the SBI Collect link provided, which will open the SBI Collect homepage. Select "Educational Institutes" as the Category. Search for "SSSIHL-ADMN" in the search field. Select the appropriate Payment Category. In the payment category dropdown, select the application name for which you are applying (Change of Name). Complete the payment process and keep your receipt for upload.',
            'You must have a valid Gazette Notification for the name change. The Gazette Notification must be from the Government of India (Gazette of India).',
            'Upload your Previous Qualification Certificate as proof.',
            'The new name should exactly match the Gazette notification.',
            'Complete address details are required.',
            { type: 'format', text: 'The Gazette Notification should be in the following format:\n\n**CHANGE OF NAME NOTIFICATION**\n\nI, [Old Name], son/daughter of [Father\'s Name], residing at [Complete Residential Address], student of Sri Sathya Sai Institute of Higher Learning, do hereby declare and affirm that:\n\n1. I was hitherto known as [Old Name].\n2. I have changed my name from [Old Name] to [New Name].\n3. I shall hereafter be known as [New Name] for all purposes.\n4. I have complied with all legal requirements and formalities in connection with this change of name.\n\nSignature of Declarant\n(Sign in Old Name)\n[Old Name]\nDate: _______________\nPlace: _______________\n\n**WITNESSES:**\nWitness 1:\nFull Name: _________________________________\nSignature: _________________________________\nAddress: __________________________________\nMobile No.: ________________________________\n\nWitness 2:\nFull Name: _________________________________\nSignature: _________________________________\nAddress: __________________________________\nMobile No.: ________________________________' }
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
            { name: 'identityProof', label: 'Identity Proof', required: true },
            { name: 'affidavit', label: 'Affidavit', required: true },
            { name: 'sbiReceipt', label: 'SBI Collect Receipt', required: true },
        ]
    },
    'repeat-paper': {
        title: 'Application for repeating a paper for supplementary examinations (CIE and ESE)',
        description: 'FOR THOSE WHO HAVE EXHAUSTED SUPPLEMENTARY EXAMINATION CHANCES',
        instructions: [
            'Ensure you have the correct Paper Code(s) and Paper Title(s).',
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
            { name: 'campus', label: 'Campus', type: 'select', options: ['Prashanti Nilayam Campus', 'Anantapur Campus', 'Brindavan Campus', 'Nandigiri Campus'], required: true },
            { name: 'program', label: 'Academic Programme', type: 'text', required: true },
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
                label: 'List of Paper(s) for which Candidate intends to repeat the paper.',
                name: 'heading2'
            },
            {
                type: 'paperTable',
                label: 'Papers to Repeat',
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
        description: 'Note: The application will be considered only within 10 days from the date of receipt of the respective Semester Grade Cards by the Campus Office',
        instructions: [
            'This service is for verification of marks totaling in your answer script.',
            'Select whether it is for End-Semester or Supplementary Examinations.',
            'Grade Card upload is optional but recommended.',
            'Each application must be enclosed in a self-addressed envelope affixing a postal stamp for ₹95.'
        ],

        titleLink: {
            text: 'Please click here to make the payment of ₹100 using SBI Collect',
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
            'Upload your Qualifying Certificate as proof of completion.',
            'Select the appropriate degree type (Undergraduate/Postgraduate/Professional/PhD).',

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
        descriptionLink: { text: 'To download your Migration Certificate,', linkText: 'please click here', url: 'https://accounts.digilocker.gov.in/v3/7b9f84c86732efd21cd8076ff06f3fd60b1fbe146732fa57444b03b35f3740a4--en' },
        instructions: [
            'No Fees is charged for migration certificate.',
            'This certificate is required for joining another University/Institute.',
            'Upload your Consolidated Grade Card as proof.',
            'Provide complete postal address details.',
            'Mention the University/Institute you propose to join.',
            'Indicate whether you have received your Degree Certificate.',
            'Applicants are required to send a self-addressed envelope along with the application.The Institute requires this in order to send the Migration Certificate back to the applicant by post',
            'The name of the applicant, along with the full, complete postal address, including the town/city, PIN code, district and state must be clearly written or typed on the envelope.',
            'Stamps totalling ₹65 must be affixed on the top right-hand corner of the envelope. This will ensure safe delivery of the document by India Post, via Registered Post with Acknowledgement Due.Students of foreign nationality may affix appropriate postage for an envelope weighing 100-120 g.'

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
            { type: 'heading', label: 'Permanent Address', name: 'addressHeading' },
            { name: 'addressLine1', label: 'Address Line 1', type: 'text', required: true },
            { name: 'addressLine2', label: 'Address Line 2', type: 'text', required: false },
            { name: 'country', label: 'Country', type: 'countrySelect', required: true },
            { name: 'stateProvince', label: 'State/Province/Region', type: 'stateSelect', required: true },
            { name: 'city', label: 'City', type: 'text', required: true },
            { name: 'postalCode', label: 'Postal Code', type: 'text', required: true }
        ],
        files: [{
            name: 'gradeCard',
            label: 'Grade Card',
            required: true
        }]
    }
};

