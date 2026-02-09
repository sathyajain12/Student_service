-- Migration to add declaration column to form_duplicate_degree table
ALTER TABLE form_duplicate_degree ADD COLUMN declaration BOOLEAN DEFAULT FALSE;
