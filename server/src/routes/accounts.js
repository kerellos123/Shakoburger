const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { balancesFor } = require('./customers');

const router = express.Router();
router.use(requireAuth);

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

router.post('/payments', (req, res) => {
  const body = req.body || {};
  const { customer_id, currency_id, amount, entry_type, entry_date, payment_method, description } = body;
  if (!customer_id || !currency_id || !amount) {
    return res.status(400).json({ error: 'customer_id, currency_id and amount are required' });
  }
  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(customer_id);
  if (!customer) return res.status(400).json({ error: 'Customer not found' });
  const currency = db.prepare('SELECT * FROM currencies WHERE id = ?').get(currency_id);
  if (!currency) return res.status(400).json({ error: 'Currency not found' });

  const ex_rate = num(body.ex_rate) || currency.exchange_rate || 1;
  const amt = Math.abs(num(amount));
  const type = entry_type === 'debit' ? 'debit' : 'credit';
  const base_amount = +(amt * ex_rate).toFixed(2);
  const date = entry_date || new Date().toISOString().slice(0, 10);

  const info = db.prepare(`
    INSERT INTO account_entries (customer_id, entry_date, entry_type, description, amount, currency_id, ex_rate, base_amount, payment_method, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    customer_id, date, type,
    description || (type === 'credit' ? 'Payment received' : 'Manual debit adjustment'),
    amt, currency_id, ex_rate, base_amount, payment_method || 'cash', req.user.id
  );

  res.status(201).json({
    entry: db.prepare('SELECT * FROM account_entries WHERE id = ?').get(info.lastInsertRowid),
    balances: balancesFor(customer_id),
  });
});

router.get('/summary', (req, res) => {
  const rows = db.prepare(`
    SELECT cust.id AS customer_id, cust.code, cust.name_ar, cust.name_en,
      e.currency_id, cur.code AS currency_code, cur.symbol,
      SUM(CASE WHEN e.entry_type = 'debit' THEN e.amount ELSE -e.amount END) AS balance
    FROM account_entries e
    JOIN customers cust ON cust.id = e.customer_id
    JOIN currencies cur ON cur.id = e.currency_id
    GROUP BY cust.id, e.currency_id
    HAVING balance != 0
    ORDER BY balance DESC
  `).all();
  res.json(rows);
});

module.exports = router;
