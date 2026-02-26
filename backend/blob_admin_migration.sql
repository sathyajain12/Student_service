-- Migration: Add file_blobs table and admin_users table

-- Table to store uploaded files as base64 encoded text
CREATE TABLE IF NOT EXISTS file_blobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id TEXT REFERENCES applications(id),
  field_name TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  file_data TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table for admin authentication
CREATE TABLE IF NOT EXISTS admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  salt TEXT,
  email TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- NOTE: No default admin is seeded here.
-- Add admin accounts manually using the PBKDF2 migration script
-- (add_admin_salt_migration.sql) to ensure all passwords use strong hashing.
