const express = require('express');
const { requireAuth } = require('../middleware/auth');
const mailer = require('../lib/mailer');

const router = express.Router();

router.post('/send', requireAuth, async (req, res) => {
  const { config, to, subject, html } = req.body || {};
  const result = await mailer.sendEmail(config, to, subject, html);
  res.json(result);
});

router.post('/test-smtp', requireAuth, async (req, res) => {
  const { config, testRecipient } = req.body || {};
  const result = await mailer.testSmtp(config, testRecipient);
  res.json(result);
});

module.exports = router;
