-- Migration: Add is_response and uploaded_by columns to file_blobs table
-- These columns are required for the admin response-document upload feature.
-- is_response distinguishes admin-uploaded response docs from student-uploaded files.
-- uploaded_by records which admin user uploaded the response document.

ALTER TABLE file_blobs ADD COLUMN is_response BOOLEAN DEFAULT FALSE;
ALTER TABLE file_blobs ADD COLUMN uploaded_by TEXT;
