const express = require('express');
const { requireAuth } = require('../middleware/auth');
const db = require('../lib/db');

const router = express.Router();

router.get('/:key', requireAuth, async (req, res) => {
  res.json({ value: await db.getData(req.params.key) });
});

router.put('/:key', requireAuth, async (req, res) => {
  const success = await db.saveData(req.params.key, req.body?.value ?? null);
  if (!success) return res.status(502).json({ success: false, error: 'No se pudo guardar en la base de datos' });
  res.json({ success: true });
});

module.exports = router;
