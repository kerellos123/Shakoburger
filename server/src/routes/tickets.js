const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

const TAX_FIELDS = ['tax_sd', 'tax_yr', 'tax_yq', 'tax_xt', 'tax_qr', 'tax_eq', 'tax_jk', 'tax_ny'];

function nextVoucherNo() {
  const row = db.prepare("SELECT MAX(CAST(voucher_no AS INTEGER)) AS m FROM tickets").get();
  const next = (row.m || 0) + 1;
  return String(next).padStart(8, '0');
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function computeTicket(body) {
  const fare = num(body.fare);
  const taxes = TAX_FIELDS.reduce((sum, f) => sum + num(body[f]), 0);
  const total = fare + taxes;

  const comm_percent = num(body.comm_percent);
  const comm_amount = body.comm_amount != null && body.comm_amount !== ''
    ? num(body.comm_amount)
    : +(fare * comm_percent / 100).toFixed(2);

  const discount_percent = num(body.discount_percent);
  const discount_amount = body.discount_amount != null && body.discount_amount !== ''
    ? num(body.discount_amount)
    : +(total * discount_percent / 100).toFixed(2);

  const extra_percent = num(body.extra_percent);
  const extra_comm = body.extra_comm != null && body.extra_comm !== ''
    ? num(body.extra_comm)
    : +(fare * extra_percent / 100).toFixed(2);

  const is_zero_comm = body.is_zero_comm ? 1 : 0;
  const effectiveComm = is_zero_comm ? 0 : comm_amount;

  const income = +(effectiveComm + extra_comm - discount_amount).toFixed(2);
  const amount_due = +(total - discount_amount).toFixed(2);

  return { fare, taxes, total, comm_percent, comm_amount: effectiveComm, discount_percent, discount_amount, extra_percent, extra_comm, income, amount_due };
}

function serializeTicket(row) {
  return row;
}

router.get('/', (req, res) => {
  const { customer_id, airline_id, currency_id, status, from, to, q } = req.query;
  const clauses = [];
  const params = [];
  if (customer_id) { clauses.push('t.customer_id = ?'); params.push(customer_id); }
  if (airline_id) { clauses.push('t.airline_id = ?'); params.push(airline_id); }
  if (currency_id) { clauses.push('t.currency_id = ?'); params.push(currency_id); }
  if (status) { clauses.push('t.status = ?'); params.push(status); }
  if (from) { clauses.push('t.ticket_date >= ?'); params.push(from); }
  if (to) { clauses.push('t.ticket_date <= ?'); params.push(to); }
  if (q) {
    clauses.push('(t.pax_name LIKE ? OR t.tkt_no LIKE ? OR t.voucher_no LIKE ? OR t.route LIKE ?)');
    const like = `%${q}%`;
    params.push(like, like, like, like);
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const rows = db.prepare(`
    SELECT t.*, a.code AS airline_code, a.name_ar AS airline_name_ar, a.name_en AS airline_name_en,
      c.code AS customer_code, c.name_ar AS customer_name_ar, c.name_en AS customer_name_en,
      cur.code AS currency_code, cur.symbol AS currency_symbol
    FROM tickets t
    LEFT JOIN airlines a ON a.id = t.airline_id
    LEFT JOIN customers c ON c.id = t.customer_id
    LEFT JOIN currencies cur ON cur.id = t.currency_id
    ${where}
    ORDER BY t.ticket_date DESC, t.id DESC
    LIMIT 500
  `).all(...params);
  res.json(rows);
});

router.get('/:id', (req, res) => {
  const row = db.prepare(`
    SELECT t.*, a.code AS airline_code, a.name_ar AS airline_name_ar, a.name_en AS airline_name_en,
      c.code AS customer_code, c.name_ar AS customer_name_ar, c.name_en AS customer_name_en,
      cur.code AS currency_code, cur.symbol AS currency_symbol
    FROM tickets t
    LEFT JOIN airlines a ON a.id = t.airline_id
    LEFT JOIN customers c ON c.id = t.customer_id
    LEFT JOIN currencies cur ON cur.id = t.currency_id
    WHERE t.id = ?
  `).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

router.post('/', (req, res) => {
  const body = req.body || {};
  if (!body.customer_id) return res.status(400).json({ error: 'customer_id is required' });
  if (!body.currency_id) return res.status(400).json({ error: 'currency_id is required' });
  if (!body.pax_name) return res.status(400).json({ error: 'pax_name is required' });

  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(body.customer_id);
  if (!customer) return res.status(400).json({ error: 'Customer not found' });
  const currency = db.prepare('SELECT * FROM currencies WHERE id = ?').get(body.currency_id);
  if (!currency) return res.status(400).json({ error: 'Currency not found' });

  const calc = computeTicket(body);
  const voucher_no = nextVoucherNo();
  const ticket_date = body.ticket_date || new Date().toISOString().slice(0, 10);
  const ex_rate = num(body.ex_rate) || currency.exchange_rate || 1;
  const payment_method = body.payment_method || 'account';

  const insert = db.prepare(`
    INSERT INTO tickets (
      voucher_no, ticket_date, airline_id, customer_id, pax_name, tkt_no, route, class, sign,
      fare, tax_sd, tax_yr, tax_yq, tax_xt, tax_qr, tax_eq, tax_jk, tax_ny,
      comm_percent, comm_amount, discount_percent, discount_amount, extra_percent, extra_comm,
      total, income, currency_id, ex_rate, payment_method,
      is_non_iata, is_zero_comm, is_bsp, is_group, is_broker, status, notes, created_by
    ) VALUES (?,?,?,?,?,?,?,?,?, ?,?,?,?,?,?,?,?,?, ?,?,?,?,?,?, ?,?,?,?,?, ?,?,?,?,?, 'issued', ?, ?)
  `);
  const info = insert.run(
    voucher_no, ticket_date, body.airline_id || null, body.customer_id, body.pax_name, body.tkt_no || null,
    body.route || null, body.class || null, body.sign || null,
    calc.fare, num(body.tax_sd), num(body.tax_yr), num(body.tax_yq), num(body.tax_xt),
    num(body.tax_qr), num(body.tax_eq), num(body.tax_jk), num(body.tax_ny),
    calc.comm_percent, calc.comm_amount, calc.discount_percent, calc.discount_amount,
    calc.extra_percent, calc.extra_comm,
    calc.total, calc.income, body.currency_id, ex_rate, payment_method,
    body.is_non_iata ? 1 : 0, body.is_zero_comm ? 1 : 0, body.is_bsp ? 1 : 0,
    body.is_group ? 1 : 0, body.is_broker ? 1 : 0, body.notes || null, req.user.id
  );
  const ticketId = info.lastInsertRowid;

  const base_amount = +(calc.amount_due * ex_rate).toFixed(2);
  db.prepare(`
    INSERT INTO account_entries (customer_id, ticket_id, entry_date, entry_type, description, amount, currency_id, ex_rate, base_amount, payment_method, created_by)
    VALUES (?, ?, ?, 'debit', ?, ?, ?, ?, ?, ?, ?)
  `).run(
    body.customer_id, ticketId, ticket_date,
    `Ticket ${voucher_no} - ${body.pax_name}`,
    calc.amount_due, body.currency_id, ex_rate, base_amount, payment_method, req.user.id
  );

  if (payment_method === 'cash' || payment_method === 'bank') {
    db.prepare(`
      INSERT INTO account_entries (customer_id, ticket_id, entry_date, entry_type, description, amount, currency_id, ex_rate, base_amount, payment_method, created_by)
      VALUES (?, ?, ?, 'credit', ?, ?, ?, ?, ?, ?, ?)
    `).run(
      body.customer_id, ticketId, ticket_date,
      `Payment received (${payment_method}) - Ticket ${voucher_no}`,
      calc.amount_due, body.currency_id, ex_rate, base_amount, payment_method, req.user.id
    );
  }

  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(ticketId);
  res.status(201).json(serializeTicket(ticket));
});

router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  if (existing.status === 'voided') return res.status(400).json({ error: 'Cannot edit a voided ticket' });

  const body = { ...existing, ...req.body };
  const currency = db.prepare('SELECT * FROM currencies WHERE id = ?').get(body.currency_id);
  if (!currency) return res.status(400).json({ error: 'Currency not found' });

  const calc = computeTicket(body);
  const ex_rate = num(body.ex_rate) || currency.exchange_rate || 1;
  const payment_method = body.payment_method || 'account';

  db.prepare(`
    UPDATE tickets SET
      ticket_date=?, airline_id=?, customer_id=?, pax_name=?, tkt_no=?, route=?, class=?, sign=?,
      fare=?, tax_sd=?, tax_yr=?, tax_yq=?, tax_xt=?, tax_qr=?, tax_eq=?, tax_jk=?, tax_ny=?,
      comm_percent=?, comm_amount=?, discount_percent=?, discount_amount=?, extra_percent=?, extra_comm=?,
      total=?, income=?, currency_id=?, ex_rate=?, payment_method=?,
      is_non_iata=?, is_zero_comm=?, is_bsp=?, is_group=?, is_broker=?, notes=?, updated_at=datetime('now')
    WHERE id=?
  `).run(
    body.ticket_date, body.airline_id || null, body.customer_id, body.pax_name, body.tkt_no || null,
    body.route || null, body.class || null, body.sign || null,
    calc.fare, num(body.tax_sd), num(body.tax_yr), num(body.tax_yq), num(body.tax_xt),
    num(body.tax_qr), num(body.tax_eq), num(body.tax_jk), num(body.tax_ny),
    calc.comm_percent, calc.comm_amount, calc.discount_percent, calc.discount_amount,
    calc.extra_percent, calc.extra_comm,
    calc.total, calc.income, body.currency_id, ex_rate, payment_method,
    body.is_non_iata ? 1 : 0, body.is_zero_comm ? 1 : 0, body.is_bsp ? 1 : 0,
    body.is_group ? 1 : 0, body.is_broker ? 1 : 0, body.notes || null,
    req.params.id
  );

  db.prepare('DELETE FROM account_entries WHERE ticket_id = ?').run(req.params.id);
  const base_amount = +(calc.amount_due * ex_rate).toFixed(2);
  db.prepare(`
    INSERT INTO account_entries (customer_id, ticket_id, entry_date, entry_type, description, amount, currency_id, ex_rate, base_amount, payment_method, created_by)
    VALUES (?, ?, ?, 'debit', ?, ?, ?, ?, ?, ?, ?)
  `).run(
    body.customer_id, req.params.id, body.ticket_date,
    `Ticket ${existing.voucher_no} - ${body.pax_name}`,
    calc.amount_due, body.currency_id, ex_rate, base_amount, payment_method, req.user.id
  );
  if (payment_method === 'cash' || payment_method === 'bank') {
    db.prepare(`
      INSERT INTO account_entries (customer_id, ticket_id, entry_date, entry_type, description, amount, currency_id, ex_rate, base_amount, payment_method, created_by)
      VALUES (?, ?, ?, 'credit', ?, ?, ?, ?, ?, ?, ?)
    `).run(
      body.customer_id, req.params.id, body.ticket_date,
      `Payment received (${payment_method}) - Ticket ${existing.voucher_no}`,
      calc.amount_due, body.currency_id, ex_rate, base_amount, payment_method, req.user.id
    );
  }

  res.json(db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id));
});

router.post('/:id/void', (req, res) => {
  const existing = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  if (existing.status === 'voided') return res.status(400).json({ error: 'Ticket already voided' });
  db.prepare("UPDATE tickets SET status = 'voided', updated_at = datetime('now') WHERE id = ?").run(req.params.id);
  db.prepare('DELETE FROM account_entries WHERE ticket_id = ?').run(req.params.id);
  res.json(db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id));
});

module.exports = router;
