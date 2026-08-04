const express = require('express');
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM currencies WHERE active = 1 ORDER BY is_base DESC, code ASC').all();
  res.json(rows);
});

router.post('/', requireAdmin, (req, res) => {
  const { code, name_ar, name_en, symbol, exchange_rate } = req.body || {};
  if (!code || !name_ar || !name_en) return res.status(400).json({ error: 'code, name_ar, name_en are required' });
  try {
    const info = db.prepare(
      'INSERT INTO currencies (code, name_ar, name_en, symbol, exchange_rate) VALUES (?, ?, ?, ?, ?)'
    ).run(code.toUpperCase(), name_ar, name_en, symbol || '', Number(exchange_rate) || 1);
    res.status(201).json(db.prepare('SELECT * FROM currencies WHERE id = ?').get(info.lastInsertRowid));
  } catch (e) {
    res.status(400).json({ error: 'Currency code already exists' });
  }
});

router.put('/:id', requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT * FROM currencies WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const { name_ar, name_en, symbol, exchange_rate } = req.body || {};
  db.prepare(
    `UPDATE currencies SET name_ar = ?, name_en = ?, symbol = ?, exchange_rate = ?, updated_at = datetime('now') WHERE id = ?`
  ).run(
    name_ar ?? existing.name_ar,
    name_en ?? existing.name_en,
    symbol ?? existing.symbol,
    exchange_rate != null ? Number(exchange_rate) : existing.exchange_rate,
    req.params.id
  );
  res.json(db.prepare('SELECT * FROM currencies WHERE id = ?').get(req.params.id));
});

router.delete('/:id', requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT * FROM currencies WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  if (existing.is_base) return res.status(400).json({ error: 'Cannot delete base currency' });
  db.prepare('UPDATE currencies SET active = 0 WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
