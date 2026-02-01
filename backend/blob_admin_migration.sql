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
  email TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default admin user (password: admin123 - should be changed)
-- Password hash is SHA-256 of 'admin123'
INSERT OR IGNORE INTO admin_users (username, password_hash, email) 
VALUES ('admin', '240be518fabd2724ddb6f04eeb9d', 'sathyajain9@gmail.com');
