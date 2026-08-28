const express = require('express');
const bcrypt = require('bcryptjs');

const router = express.Router();

async function passwordMatches(password) {
  if (process.env.APP_PASSWORD_HASH) {
    return bcrypt.compare(password, process.env.APP_PASSWORD_HASH);
  }
  if (process.env.APP_PASSWORD) {
    return password === process.env.APP_PASSWORD;
  }
  return false;
}

router.post('/login', async (req, res) => {
  const { password } = req.body || {};

  if (!process.env.APP_PASSWORD_HASH && !process.env.APP_PASSWORD) {
    return res.status(500).json({ success: false, error: 'APP_PASSWORD_HASH o APP_PASSWORD no configurada en el servidor' });
  }

  if (typeof password !== 'string' || !(await passwordMatches(password))) {
    return res.status(401).json({ success: false, error: 'Contraseña incorrecta' });
  }

  req.session.authenticated = true;
  res.json({ success: true });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

router.get('/session', (req, res) => {
  res.json({ authenticated: Boolean(req.session && req.session.authenticated) });
});

module.exports = router;
