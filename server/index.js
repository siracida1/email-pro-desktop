require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');

const authRoutes = require('./routes/auth');
const dataRoutes = require('./routes/data');
const emailRoutes = require('./routes/email');

const app = express();
const isProd = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 3001;

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
