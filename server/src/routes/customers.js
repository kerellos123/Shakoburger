const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

function nextCustomerCode() {
  const row = db.prepare('SELECT COUNT(*) AS c FROM customers').get();
  return 'C' + String(row.c + 1).padStart(5, '0');
}

function balancesFor(customerId) {
  return db.prepare(`
    SELECT c.currency_id, cur.code, cur.symbol, cur.name_ar, cur.name_en,
      SUM(CASE WHEN c.entry_type = 'debit' THEN c.amount ELSE -c.amount END) AS balance
    FROM account_entries c
    JOIN currencies cur ON cur.id = c.currency_id
    WHERE c.customer_id = ?
    GROUP BY c.currency_id
    HAVING balance != 0
  `).all(customerId);
}

router.get('/', (req, res) => {
  const q = (req.query.q || '').trim();
  let rows;
  if (q) {
    const like = `%${q}%`;
    rows = db.prepare(
      `SELECT * FROM customers WHERE active = 1 AND (code LIKE ? OR name_ar LIKE ? OR name_en LIKE ? OR phone LIKE ?) ORDER BY name_en ASC`
    ).all(like, like, like, like);
  } else {
    rows = db.prepare('SELECT * FROM customers WHERE active = 1 ORDER BY name_en ASC').all();
  }
  res.json(rows);
});

router.get('/:id', (req, res) => {
  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  if (!customer) return res.status(404).json({ error: 'Not found' });
  res.json({ ...customer, balances: balancesFor(customer.id) });
});

router.post('/', (req, res) => {
  const { name_ar, name_en, phone, email, credit_limit, default_currency_id, notes } = req.body || {};
  if (!name_ar || !name_en) return res.status(400).json({ error: 'name_ar and name_en are required' });
  const code = nextCustomerCode();
  const info = db.prepare(
    `INSERT INTO customers (code, name_ar, name_en, phone, email, credit_limit, default_currency_id, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(code, name_ar, name_en, phone || null, email || null, Number(credit_limit) || 0, default_currency_id || null, notes || null);
  res.status(201).json(db.prepare('SELECT * FROM customers WHERE id = ?').get(info.lastInsertRowid));
});

router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const { name_ar, name_en, phone, email, credit_limit, default_currency_id, notes } = req.body || {};
  db.prepare(
    `UPDATE customers SET name_ar=?, name_en=?, phone=?, email=?, credit_limit=?, default_currency_id=?, notes=? WHERE id=?`
  ).run(
    name_ar ?? existing.name_ar,
    name_en ?? existing.name_en,
    phone ?? existing.phone,
    email ?? existing.email,
    credit_limit != null ? Number(credit_limit) : existing.credit_limit,
    default_currency_id ?? existing.default_currency_id,
    notes ?? existing.notes,
    req.params.id
  );
  res.json(db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  db.prepare('UPDATE customers SET active = 0 WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

router.get('/:id/ledger', (req, res) => {
  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  if (!customer) return res.status(404).json({ error: 'Not found' });
  const entries = db.prepare(`
    SELECT e.*, cur.code AS currency_code, cur.symbol AS currency_symbol,
      t.voucher_no, t.pax_name
    FROM account_entries e
    JOIN currencies cur ON cur.id = e.currency_id
    LEFT JOIN tickets t ON t.id = e.ticket_id
    WHERE e.customer_id = ?
    ORDER BY e.entry_date DESC, e.id DESC
  `).all(req.params.id);
  res.json({ customer, balances: balancesFor(customer.id), entries });
});

module.exports = router;
module.exports.balancesFor = balancesFor;
