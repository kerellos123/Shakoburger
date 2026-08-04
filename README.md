# Shako Travel & Tourism — Ticket Sales & Accounts System

A bilingual (Arabic/English, RTL/LTR) travel agency management system built around ticket sales, customers, and multi-currency accounts — inspired by the TABOS ticketing workflow (GDS ticket entry, commissions, taxes, customer ledgers).

## Stack

- **Backend**: Node.js + Express + SQLite (`node:sqlite`, no native build step), JWT auth.
- **Frontend**: Vanilla HTML/CSS/JS single-page app, no build tooling required.

## Getting started

```bash
cd server
npm install
npm start
```

The server runs on `http://localhost:4000` (override with `PORT`) and serves the frontend from `/public` automatically.

Default login: **admin / admin123**

## What's included (v1)

- **Tickets** — GDS-style ticket entry (airline, customer, PAX, TKT No, fare, tax breakdown SD/YR/YQ/XT/QR/EQ/JK/NY, route, class, commission %/amount, discount %/amount, extra commission, payment method, Non-IATA/Zero-Comm/BSP/Group/Broker flags), searchable ticket list, edit, void.
- **Customers** — CRUD, phone/email/credit limit, multi-currency balance shown per customer.
- **Accounts** — per-customer statement (debit/credit ledger), record cash/bank payments.
- **Airlines** and **Currencies** — admin lookup tables; currency exchange rates are entered/updated manually (no external FX dependency).
- **Reports** — sales report with date/airline/customer/currency filters and totals.
- **Dashboard** — today's tickets, month sales by currency, outstanding balances, recent tickets.
- Every ticket automatically posts a ledger entry against the customer (paid tickets post an offsetting payment entry so cash/bank sales don't show as outstanding).

## Not yet built (candidates for a v2)

- Banks, Cash boxes, HR/Employees, Supervisor modules from the original reference system.
- Multi-user role management UI (only a single seeded admin exists).
- PDF/print ticket & invoice layouts.

## Project layout

```
server/       Express API + SQLite (server/src/routes/*, server/src/db.js)
public/       Frontend SPA (login page + app shell + per-module JS in public/js/pages)
```

The unrelated `index.html` / `Logo.jpg` at the repo root are a separate Shako Burger ordering page and were left untouched.
