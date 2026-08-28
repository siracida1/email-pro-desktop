const express = require('express');
const { requireAuth } = require('../middleware/auth');
const db = require('../lib/db');

const router = express.Router();

router.get('/:key', requireAuth, (req, res) => {
  res.json({ value: db.getData(req.params.key) });
});

router.put('/:key', requireAuth, (req, res) => {
  db.saveData(req.params.key, req.body?.value ?? null);
  res.json({ success: true });
});

module.exports = router;
