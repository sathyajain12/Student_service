-- Migration to allow NULL values for optional file fields in form_duplicate_grade_card
-- SQLite doesn't support ALTER TABLE to change column constraints directly
-- We need to recreate the table

-- Step 1: Create a new table with corrected constraints
CREATE TABLE form_duplicate_grade_card_new (
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
  Police_complaint_file TEXT DEFAULT '',
  Affidavit_file TEXT DEFAULT '',
  Grade_copy_file TEXT DEFAULT '',
  SBI_receipt_file TEXT DEFAULT '',
  director_status TEXT DEFAULT 'PENDING',
  director_remarks TEXT,
  director_response_date DATETIME,
  controller_status TEXT,
  controller_comments TEXT,
  controller_response_date DATETIME,
  Final_status TEXT
);

-- Step 2: Copy existing data
INSERT INTO form_duplicate_grade_card_new SELECT * FROM form_duplicate_grade_card;

-- Step 3: Drop old table
DROP TABLE form_duplicate_grade_card;

-- Step 4: Rename new table
ALTER TABLE form_duplicate_grade_card_new RENAME TO form_duplicate_grade_card;
