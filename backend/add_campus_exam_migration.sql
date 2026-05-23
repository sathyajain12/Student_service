-- Migration: Add campus examination section intermediate step columns
ALTER TABLE applications ADD COLUMN campus_exam_status TEXT DEFAULT NULL;
ALTER TABLE applications ADD COLUMN campus_exam_case_type TEXT DEFAULT NULL;
ALTER TABLE applications ADD COLUMN campus_exam_cie_satisfied TEXT DEFAULT NULL;
ALTER TABLE applications ADD COLUMN campus_exam_remarks TEXT DEFAULT NULL;
