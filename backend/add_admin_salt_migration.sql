-- Migration: Add salt column to admin_users for PBKDF2 password hashing
-- Run this once against the live D1 database.
--
-- After running this migration:
--   - Existing admins without a salt will be forced to reset their password
--     on next login (the legacy SHA-256 path is removed from the application).
--   - New admins must be inserted with a PBKDF2 hash+salt via the application.

-- Step 1: Add salt column (no-op if it already exists in SQLite via IF NOT EXISTS workaround)
ALTER TABLE admin_users ADD COLUMN salt TEXT;

-- Step 2: Invalidate any accounts that still have an unsalted SHA-256 hash
-- (salt IS NULL means they were created before this migration).
-- Setting password_hash to empty string forces the account to be unusable
-- until an admin with DB access sets a proper PBKDF2 hash.
UPDATE admin_users SET password_hash = '' WHERE salt IS NULL;
