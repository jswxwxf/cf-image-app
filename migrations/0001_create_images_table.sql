-- Migration number: 0001 	 2026-03-03T09:39:56.392Z
CREATE TABLE images (
  id TEXT PRIMARY KEY,
  analysis TEXT,
  completed INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
