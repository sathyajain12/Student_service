-- Migration: Add identity_proof_file column to form_name_change table
ALTER TABLE form_name_change ADD COLUMN identity_proof_file TEXT;
