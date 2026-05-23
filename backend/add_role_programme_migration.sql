-- Migration: Add role to admin_users and programme to applications table
ALTER TABLE admin_users ADD COLUMN role TEXT DEFAULT 'admin';
ALTER TABLE applications ADD COLUMN programme TEXT;
