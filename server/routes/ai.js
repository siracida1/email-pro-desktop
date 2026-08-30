const express = require('express');
const { requireAuth } = require('../middleware/auth');
const ai = require('../lib/ai');

const router = express.Router();

router.post('/ask', requireAuth, async (req, res) => {
  const { question } = req.body || {};
  const result = await ai.askHelp(question);
  res.json(result);
});

module.exports = router;
