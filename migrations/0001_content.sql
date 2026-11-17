CREATE TABLE IF NOT EXISTS content (
  id TEXT PRIMARY KEY CHECK (id = 'estrela-dalva'),
  body TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS request_limits (
  ip_hash TEXT NOT NULL,
  window_start INTEGER NOT NULL,
  hits INTEGER NOT NULL,
  PRIMARY KEY (ip_hash, window_start)
);
