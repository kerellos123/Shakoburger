const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/sales', (req, res) => {
  const { from, to, airline_id, customer_id, currency_id } = req.query;
  const clauses = ["t.status = 'issued'"];
  const params = [];
  if (from) { clauses.push('t.ticket_date >= ?'); params.push(from); }
  if (to) { clauses.push('t.ticket_date <= ?'); params.push(to); }
  if (airline_id) { clauses.push('t.airline_id = ?'); params.push(airline_id); }
  if (customer_id) { clauses.push('t.customer_id = ?'); params.push(customer_id); }
  if (currency_id) { clauses.push('t.currency_id = ?'); params.push(currency_id); }
  const where = `WHERE ${clauses.join(' AND ')}`;

  const rows = db.prepare(`
    SELECT t.*, a.name_ar AS airline_name_ar, a.name_en AS airline_name_en,
      c.name_ar AS customer_name_ar, c.name_en AS customer_name_en,
      cur.code AS currency_code, cur.symbol AS currency_symbol
    FROM tickets t
    LEFT JOIN airlines a ON a.id = t.airline_id
    LEFT JOIN customers c ON c.id = t.customer_id
    LEFT JOIN currencies cur ON cur.id = t.currency_id
    ${where}
    ORDER BY t.ticket_date DESC, t.id DESC
  `).all(...params);

  const totalsByCurrency = db.prepare(`
    SELECT t.currency_id, cur.code, cur.symbol,
      COUNT(*) AS ticket_count,
      SUM(t.total) AS total_sales,
      SUM(t.income) AS total_income
    FROM tickets t
    JOIN currencies cur ON cur.id = t.currency_id
    ${where}
    GROUP BY t.currency_id
  `).all(...params);

  res.json({ rows, totalsByCurrency });
});

router.get('/customer-statement/:id', (req, res) => {
  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  if (!customer) return res.status(404).json({ error: 'Not found' });
  const entries = db.prepare(`
    SELECT e.*, cur.code AS currency_code, cur.symbol AS currency_symbol, t.voucher_no, t.pax_name
    FROM account_entries e
    JOIN currencies cur ON cur.id = e.currency_id
    LEFT JOIN tickets t ON t.id = e.ticket_id
    WHERE e.customer_id = ?
    ORDER BY e.entry_date ASC, e.id ASC
  `).all(req.params.id);
  res.json({ customer, entries });
});

module.exports = router;
