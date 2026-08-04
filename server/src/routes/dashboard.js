const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/summary', (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const monthStart = today.slice(0, 7) + '-01';

  const todayTickets = db.prepare(
    "SELECT COUNT(*) AS c FROM tickets WHERE status='issued' AND ticket_date = ?"
  ).get(today).c;

  const monthByCurrency = db.prepare(`
    SELECT t.currency_id, cur.code, cur.symbol,
      COUNT(*) AS ticket_count, SUM(t.total) AS total_sales, SUM(t.income) AS total_income
    FROM tickets t JOIN currencies cur ON cur.id = t.currency_id
    WHERE t.status = 'issued' AND t.ticket_date >= ?
    GROUP BY t.currency_id
  `).all(monthStart);

  const customerCount = db.prepare("SELECT COUNT(*) AS c FROM customers WHERE active = 1").get().c;
  const ticketCount = db.prepare("SELECT COUNT(*) AS c FROM tickets WHERE status = 'issued'").get().c;

  const outstandingByCurrency = db.prepare(`
    SELECT e.currency_id, cur.code, cur.symbol,
      SUM(CASE WHEN e.entry_type = 'debit' THEN e.amount ELSE -e.amount END) AS balance
    FROM account_entries e JOIN currencies cur ON cur.id = e.currency_id
    GROUP BY e.currency_id
    HAVING balance != 0
  `).all();

  const recentTickets = db.prepare(`
    SELECT t.id, t.voucher_no, t.ticket_date, t.pax_name, t.total, t.status,
      cur.code AS currency_code, cur.symbol AS currency_symbol,
      c.name_ar AS customer_name_ar, c.name_en AS customer_name_en
    FROM tickets t
    LEFT JOIN customers c ON c.id = t.customer_id
    LEFT JOIN currencies cur ON cur.id = t.currency_id
    ORDER BY t.id DESC LIMIT 8
  `).all();

  res.json({ todayTickets, monthByCurrency, customerCount, ticketCount, outstandingByCurrency, recentTickets });
});

module.exports = router;
