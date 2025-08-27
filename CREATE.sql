-- Run this against your Postgres (database: test-plivo)

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reset_token TEXT,
  reset_token_expires_at TIMESTAMPTZ
);

-- Optional index for quick lookups by email
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);


