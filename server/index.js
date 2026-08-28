require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');

const authRoutes = require('./routes/auth');
const dataRoutes = require('./routes/data');
const emailRoutes = require('./routes/email');

const app = express();
const isProd = process.env.NODE_ENV === 'production';
// MASSMAIL_API_PORT takes priority over PORT: in local dev, PORT (and other
// generically-named port variables) may be claimed by the Vite dev server
// (npm run dev:web) or injected by tooling, so the API needs an unambiguous
// variable of its own to avoid colliding with it. In production (no Vite
// process), PORT alone is used, matching what most Node hosts inject.
const PORT = process.env.MASSMAIL_API_PORT || process.env.PORT || 3001;

// Behind a reverse proxy (Apache/nginx terminating TLS), Express only sees a
// plain HTTP connection to the Node process. Without trust proxy, req.secure
// stays false and express-session silently drops the Secure cookie instead
// of setting it, breaking login. Trusting X-Forwarded-Proto fixes that.
if (isProd) app.set('trust proxy', 1);

app.use(express.json({ limit: '5mb' }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
}));

app.use('/api/auth', authRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/email', emailRoutes);

const distDir = path.join(__dirname, '..', 'dist');
app.use(express.static(distDir));
app.get('*', (req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`MassMail Pro server listening on port ${PORT}`);
});
