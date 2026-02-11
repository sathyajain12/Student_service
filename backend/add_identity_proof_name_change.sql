-- Migration: Add identity_proof_file and affidavit_file columns to form_name_change table
ALTER TABLE form_name_change ADD COLUMN identity_proof_file TEXT;
ALTER TABLE form_name_change ADD COLUMN affidavit_file TEXT;
