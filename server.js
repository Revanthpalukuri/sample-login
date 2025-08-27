require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

// Postgres pool
const pool = new Pool({
  user: process.env.PGUSER || 'postgres',
  host: process.env.PGHOST || 'localhost',
  database: process.env.PGDATABASE || 'test-plivo',
  password: process.env.PGPASSWORD || '8711',
  port: Number(process.env.PGPORT || 5432),
});

async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      reset_token TEXT,
      reset_token_expires_at TIMESTAMPTZ
    );
  `);
}

// Healthcheck
app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

// Signup
app.post('/api/signup', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const normalizedEmail = String(email).trim().toLowerCase();
    const passwordHash = await bcrypt.hash(String(password), 12);

    const insertResult = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at',
      [normalizedEmail, passwordHash]
    );

    return res.status(201).json({ user: insertResult.rows[0] });
  } catch (err) {
    if (err && err.code === '23505') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    console.error('Signup error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const normalizedEmail = String(email).trim().toLowerCase();
    const userResult = await pool.query('SELECT id, email, password_hash FROM users WHERE email=$1', [normalizedEmail]);
    if (userResult.rowCount === 0) return res.status(401).json({ error: 'Invalid credentials' });

    const user = userResult.rows[0];
    const ok = await bcrypt.compare(String(password), user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    return res.json({ message: 'Login successful' });
  } catch (err) {
    console.error('Login error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Forgot password: request reset token
app.post('/api/forgot', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    const normalizedEmail = String(email).trim().toLowerCase();
    const token = Math.random().toString(36).slice(2, 10);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    const result = await pool.query('UPDATE users SET reset_token=$1, reset_token_expires_at=$2 WHERE email=$3 RETURNING id', [token, expiresAt, normalizedEmail]);
    if (result.rowCount === 0) return res.status(200).json({ message: 'If that email exists, reset link sent' });

    // In real app, email the token; for demo, return it
    return res.json({ message: 'Reset token generated', token });
  } catch (err) {
    console.error('Forgot error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Reset password
app.post('/api/reset', async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;
    if (!email || !token || !newPassword) return res.status(400).json({ error: 'Email, token, newPassword required' });
    const normalizedEmail = String(email).trim().toLowerCase();

    const userResult = await pool.query('SELECT id, reset_token, reset_token_expires_at FROM users WHERE email=$1', [normalizedEmail]);
    if (userResult.rowCount === 0) return res.status(400).json({ error: 'Invalid token' });

    const user = userResult.rows[0];
    if (!user.reset_token || user.reset_token !== token) return res.status(400).json({ error: 'Invalid token' });
    if (user.reset_token_expires_at && new Date(user.reset_token_expires_at) < new Date()) return res.status(400).json({ error: 'Token expired' });

    const passwordHash = await bcrypt.hash(String(newPassword), 12);
    await pool.query('UPDATE users SET password_hash=$1, reset_token=NULL, reset_token_expires_at=NULL WHERE id=$2', [passwordHash, user.id]);
    return res.json({ message: 'Password reset successful' });
  } catch (err) {
    console.error('Reset error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

ensureSchema()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server listening on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start server', err);
    process.exit(1);
  });


