const path = require('node:path');
const fs = require('node:fs');
const { DatabaseSync } = require('node:sqlite');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new DatabaseSync(path.join(DATA_DIR, 'travel.db'));
db.exec('PRAGMA foreign_keys = ON;');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'agent',
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS currencies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  symbol TEXT NOT NULL DEFAULT '',
  is_base INTEGER NOT NULL DEFAULT 0,
  exchange_rate REAL NOT NULL DEFAULT 1,
  active INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS airlines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  credit_limit REAL NOT NULL DEFAULT 0,
  default_currency_id INTEGER REFERENCES currencies(id),
  notes TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  voucher_no TEXT UNIQUE NOT NULL,
  ticket_date TEXT NOT NULL,
  airline_id INTEGER REFERENCES airlines(id),
  customer_id INTEGER REFERENCES customers(id),
  pax_name TEXT NOT NULL,
  tkt_no TEXT,
  route TEXT,
  class TEXT,
  sign TEXT,
  fare REAL NOT NULL DEFAULT 0,
  tax_sd REAL NOT NULL DEFAULT 0,
  tax_yr REAL NOT NULL DEFAULT 0,
  tax_yq REAL NOT NULL DEFAULT 0,
  tax_xt REAL NOT NULL DEFAULT 0,
  tax_qr REAL NOT NULL DEFAULT 0,
  tax_eq REAL NOT NULL DEFAULT 0,
  tax_jk REAL NOT NULL DEFAULT 0,
  tax_ny REAL NOT NULL DEFAULT 0,
  comm_percent REAL NOT NULL DEFAULT 0,
  comm_amount REAL NOT NULL DEFAULT 0,
  discount_percent REAL NOT NULL DEFAULT 0,
  discount_amount REAL NOT NULL DEFAULT 0,
  extra_percent REAL NOT NULL DEFAULT 0,
  extra_comm REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0,
  income REAL NOT NULL DEFAULT 0,
  currency_id INTEGER NOT NULL REFERENCES currencies(id),
  ex_rate REAL NOT NULL DEFAULT 1,
  payment_method TEXT NOT NULL DEFAULT 'account',
  is_non_iata INTEGER NOT NULL DEFAULT 0,
  is_zero_comm INTEGER NOT NULL DEFAULT 0,
  is_bsp INTEGER NOT NULL DEFAULT 0,
  is_group INTEGER NOT NULL DEFAULT 0,
  is_broker INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'issued',
  notes TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS account_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  ticket_id INTEGER REFERENCES tickets(id),
  entry_date TEXT NOT NULL,
  entry_type TEXT NOT NULL,
  description TEXT,
  amount REAL NOT NULL,
  currency_id INTEGER NOT NULL REFERENCES currencies(id),
  ex_rate REAL NOT NULL DEFAULT 1,
  base_amount REAL NOT NULL,
  payment_method TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_tickets_customer ON tickets(customer_id);
CREATE INDEX IF NOT EXISTS idx_tickets_date ON tickets(ticket_date);
CREATE INDEX IF NOT EXISTS idx_tickets_airline ON tickets(airline_id);
CREATE INDEX IF NOT EXISTS idx_ledger_customer ON account_entries(customer_id);
`);

function seed() {
  const userCount = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
  if (userCount === 0) {
    const hash = bcrypt.hashSync('admin123', 10);
    db.prepare(
      'INSERT INTO users (username, password_hash, full_name, role) VALUES (?, ?, ?, ?)'
    ).run('admin', hash, 'System Administrator', 'admin');
  }

  const currCount = db.prepare('SELECT COUNT(*) AS c FROM currencies').get().c;
  if (currCount === 0) {
    const insert = db.prepare(
      'INSERT INTO currencies (code, name_ar, name_en, symbol, is_base, exchange_rate) VALUES (?, ?, ?, ?, ?, ?)'
    );
    insert.run('SDG', 'جنيه سوداني', 'Sudanese Pound', 'ج.س', 1, 1);
    insert.run('USD', 'دولار أمريكي', 'US Dollar', '$', 0, 600);
    insert.run('EGP', 'جنيه مصري', 'Egyptian Pound', 'ج.م', 0, 12.5);
    insert.run('SAR', 'ريال سعودي', 'Saudi Riyal', 'ر.س', 0, 160);
    insert.run('AED', 'درهم إماراتي', 'UAE Dirham', 'د.إ', 0, 163);
    insert.run('EUR', 'يورو', 'Euro', '€', 0, 650);
  }

  const airlineCount = db.prepare('SELECT COUNT(*) AS c FROM airlines').get().c;
  if (airlineCount === 0) {
    const insert = db.prepare(
      'INSERT INTO airlines (code, name_ar, name_en) VALUES (?, ?, ?)'
    );
    insert.run('SV', 'الخطوط السعودية', 'Saudi Airlines');
    insert.run('MS', 'مصر للطيران', 'EgyptAir');
    insert.run('EK', 'طيران الإمارات', 'Emirates');
    insert.run('QR', 'الخطوط القطرية', 'Qatar Airways');
    insert.run('TK', 'الخطوط التركية', 'Turkish Airlines');
    insert.run('SD', 'الخطوط السودانية', 'Sudan Airways');
    insert.run('FZ', 'فلاي دبي', 'Flydubai');
    insert.run('EY', 'الاتحاد للطيران', 'Etihad Airways');
  }
}

seed();

module.exports = db;
