const express = require('express');
const path = require('path');

const authRoutes = require('./routes/auth');
const currencyRoutes = require('./routes/currencies');
const airlineRoutes = require('./routes/airlines');
const customerRoutes = require('./routes/customers');
const ticketRoutes = require('./routes/tickets');
const accountRoutes = require('./routes/accounts');
const reportRoutes = require('./routes/reports');
const dashboardRoutes = require('./routes/dashboard');

const app = express();

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/currencies', currencyRoutes);
app.use('/api/airlines', airlineRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use(express.static(path.join(__dirname, '..', '..', 'public')));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
