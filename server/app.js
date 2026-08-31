require('dotenv').config();
const path = require('path');
const express = require('express');
const cookieSession = require('cookie-session');

const authRoutes = require('./routes/auth');
const dataRoutes = require('./routes/data');
const emailRoutes = require('./routes/email');
const aiRoutes = require('./routes/ai');

const app = express();
const isProd = process.env.NODE_ENV === 'production';

// Behind a reverse proxy or serverless edge (Apache, Vercel, etc.), Express
// only sees the request after TLS is already terminated. Without trust
// proxy, req.secure stays false and the Secure cookie flag below silently
// fails to protect the session. Trusting X-Forwarded-Proto fixes that.
if (isProd) app.set('trust proxy', 1);

app.use(express.json({ limit: '5mb' }));

// Session data lives signed inside the cookie itself (no server-side store):
// serverless functions don't share memory between invocations, so an
// in-memory session store (the previous approach) would log everyone out
// on every cold start. The session only ever holds { authenticated: true },
// nothing sensitive, so a signed (not encrypted) cookie is enough.
app.use(cookieSession({
  name: 'session',
  secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  httpOnly: true,
  sameSite: 'lax',
  secure: isProd,
  maxAge: 1000 * 60 * 60 * 24 * 7
}));

app.use('/api/auth', authRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/ai', aiRoutes);

// Only reached when this app serves its own static build (local dev and the
// VPS deployment). On Vercel, static files and the SPA fallback are handled
// by the platform itself before a request ever reaches this function.
const distDir = path.join(__dirname, '..', 'dist');
app.use(express.static(distDir));
app.get('*', (req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

module.exports = app;
