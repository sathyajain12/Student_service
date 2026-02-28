CREATE TABLE IF NOT EXISTS form_settings (
  form_id    TEXT PRIMARY KEY,
  is_active  INTEGER NOT NULL DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO form_settings (form_id, is_active) VALUES ('retotaling', 0);
