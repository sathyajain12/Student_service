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
  student_name TEXT,
  student_address TEXT,
  Mobile_Number TEXT,
  Registration_Number TEXT,
  Programme TEXT,
  Period_of_Study TEXT,
  graduation_year TEXT,
  CGPA float
);

CREATE TABLE form_supplementary_exam (
  application_id TEXT PRIMARY KEY REFERENCES applications(id),
  student_email TEXT NOT NULL,
  Period_of_Study TEXT NOT NULL,
  student_name TEXT NOT NULL,
  Registration_Number TEXT NOT NULL,
  Campus TEXT NOT NULL,
  Programme TEXT NOT NULL,
  Mobile_Number TEXT NOT NULL,
  student_address TEXT NOT NULL,
  paper_codes TEXT NOT NULL,
  paper_titles TEXT NOT NULL,
  Semester TEXT NOT NULL,
  director_approval_status TEXT DEFAULT 'PENDING',
  director_remarks TEXT,
  controller_approval_status TEXT DEFAULT 'PENDING',
  controller_remarks TEXT
);

CREATE TABLE form_duplicate_degree (
  application_id TEXT PRIMARY KEY REFERENCES applications(id),
  student_name TEXT,
  student_email TEXT,
  student_address TEXT,
  reg_no numeric,
  Campus TEXT,
  Programme TEXT,
  Period_of_Study TEXT,
  year_of_passing TEXT,
  Reason TEXT,
  Police_complaint_file TEXT,
  Affidavit_file TEXT,
  Press_notification_file TEXT
);

CREATE TABLE form_name_change (
  application_id TEXT PRIMARY KEY REFERENCES applications(id),
  existing_name TEXT,
  Father_name TEXT,
  reg_no numeric,
  Campus TEXT,
  Mobile_Number numeric(10),
  Period_of_Study TEXT,
  student_address TEXT,
  changed_name TEXT,
  gazzete_notification_file TEXT,
  SBI_receipt_file TEXT,
  Director_notified_date DATETIME,
  controller_notified_date DATETIME
);

CREATE TABLE form_repeat_paper (
  application_id TEXT PRIMARY KEY REFERENCES applications(id),
  Period_of_Study TEXT,
  student_name TEXT,
  reg_no numeric,
  Campus TEXT,
  Programme TEXT,
  Mobile_Number numeric(10),
  student_address TEXT,
  paper_codes TEXT,
  paper_titles TEXT,
  Semester TEXT,
  Director_comments TEXT,
  controller_approval_status TEXT DEFAULT 'PENDING',
  controller_comments TEXT
);

CREATE TABLE form_retotaling (
  application_id TEXT PRIMARY KEY REFERENCES applications(id),
  exam_type TEXT,
  student_name TEXT,
  reg_no numeric,
  Campus TEXT,
  Programme TEXT,
  paper_codes_titles_for_retotaling TEXT,
  scanned_copy_of_grade_card_file TEXT,
  combined_numeric_point  float,
  Mobile_Number numeric(10),
  student_address TEXT,
  SBI_receipt_file TEXT,
  student_email TEXT
);

CREATE TABLE form_on_request_degree (
  application_id TEXT PRIMARY KEY REFERENCES applications(id),
  student_name TEXT,
  reg_no numeric,
  DOB DATETIME,
  Campus TEXT,
  Student_address TEXT,
  Mobile_Number numeric(10),
  Degree_applied_for TEXT,
  pass_Certificate_file_intermediate TEXT,
  qualifying_degree_file TEXT,
  qualifying_PG_Pro_degree_file TEXT,
  SBI_receipt_file TEXT
 
);

CREATE TABLE form_migration_certificate (
  application_id TEXT PRIMARY KEY REFERENCES applications(id),
  student_name TEXT,
  Mobile_Number numeric(10),
  admission_year TEXT,
  Campus_of_admission TEXT,
  last_examination_passed TEXT,
  degree_recieved TEXT,
  university_to_migrate TEXT,
  correspondence_address TEXT
);
