const express = require('express');
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM airlines WHERE active = 1 ORDER BY name_en ASC').all();
  res.json(rows);
});

router.post('/', requireAdmin, (req, res) => {
  const { code, name_ar, name_en } = req.body || {};
  if (!code || !name_ar || !name_en) return res.status(400).json({ error: 'code, name_ar, name_en are required' });
  try {
    const info = db.prepare(
      'INSERT INTO airlines (code, name_ar, name_en) VALUES (?, ?, ?)'
    ).run(code.toUpperCase(), name_ar, name_en);
    res.status(201).json(db.prepare('SELECT * FROM airlines WHERE id = ?').get(info.lastInsertRowid));
  } catch (e) {
    res.status(400).json({ error: 'Airline code already exists' });
  }
});

router.put('/:id', requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT * FROM airlines WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const { name_ar, name_en } = req.body || {};
  db.prepare('UPDATE airlines SET name_ar = ?, name_en = ? WHERE id = ?').run(
    name_ar ?? existing.name_ar,
    name_en ?? existing.name_en,
    req.params.id
  );
  res.json(db.prepare('SELECT * FROM airlines WHERE id = ?').get(req.params.id));
});

router.delete('/:id', requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT * FROM airlines WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  db.prepare('UPDATE airlines SET active = 0 WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
