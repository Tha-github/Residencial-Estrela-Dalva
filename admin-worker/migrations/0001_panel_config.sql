CREATE TABLE IF NOT EXISTS panel_config (
  id TEXT PRIMARY KEY CHECK (id = 'estrela-dalva'),
  ciphertext TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
