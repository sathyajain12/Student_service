-- Student Service Application Schema (9-Table Structure)

-- Central metadata and status tracking
CREATE TABLE applications (
  id TEXT PRIMARY KEY,
  student_email TEXT NOT NULL,
  form_type TEXT NOT NULL,
  applicant_name TEXT,
  reg_no TEXT,
  campus TEXT,
  status TEXT DEFAULT 'PENDING',
  director_status TEXT DEFAULT 'PENDING',
  controller_status TEXT DEFAULT 'PENDING',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Centralized file storage linked to appId
CREATE TABLE file_attachments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id TEXT REFERENCES applications(id),
  file_name TEXT NOT NULL,
  drive_file_id TEXT NOT NULL,
  file_type TEXT NOT NULL
);

-- Specific tables for each of the 9 forms
CREATE TABLE form_duplicate_grade_card (
  Application_id TEXT PRIMARY KEY REFERENCES applications(id),
  student_email TEXT NOT NULL,
  student_name TEXT NOT NULL,
  student_address TEXT NOT NULL,
  Mobile_Number TEXT NOT NULL,
  Registration_Number TEXT NOT NULL,
  Campus TEXT NOT NULL,
  Programme TEXT NOT NULL,
  Period_of_Study TEXT NOT NULL,
  Semester TEXT NOT NULL,
  Reason TEXT NOT NULL,
  Police_complaint_file TEXT NOT NULL,
  Affidavit_file TEXT NOT NULL,
  Grade_copy_file TEXT NOT NULL,
  SBI_receipt_file TEXT NOT NULL,
  director_status TEXT DEFAULT 'PENDING',
  director_remarks TEXT,
  director_response_date DATETIME,
  controller_status TEXT,
  controller_comments TEXT,
  controller_response_date DATETIME,
  Final_status TEXT


);

CREATE TABLE form_cgpa_conversion (
  application_id TEXT PRIMARY KEY REFERENCES applications(id),
  additional_notes TEXT
);

CREATE TABLE form_supplementary_exam (
  application_id TEXT PRIMARY KEY REFERENCES applications(id),
  subject_code TEXT,
  semester TEXT
);

CREATE TABLE form_duplicate_degree (
  application_id TEXT PRIMARY KEY REFERENCES applications(id),
  reason TEXT
);

CREATE TABLE form_name_change (
  application_id TEXT PRIMARY KEY REFERENCES applications(id),
  new_name TEXT
);

CREATE TABLE form_repeat_paper (
  application_id TEXT PRIMARY KEY REFERENCES applications(id),
  subject_code TEXT
);

CREATE TABLE form_retotaling (
  application_id TEXT PRIMARY KEY REFERENCES applications(id),
  subject_code TEXT
);

CREATE TABLE form_on_request_degree (
  application_id TEXT PRIMARY KEY REFERENCES applications(id),
  graduation_year TEXT
);

CREATE TABLE form_migration_certificate (
  application_id TEXT PRIMARY KEY REFERENCES applications(id),
  university_joining TEXT
);
