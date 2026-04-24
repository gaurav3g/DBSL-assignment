require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const eventsRouter   = require('./routes/events');
const insightsRouter = require('./routes/insights');
const alertsRouter   = require('./routes/alerts');

const app  = express();
const PORT = process.env.PORT || 4000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/events',   eventsRouter);
app.use('/api/insights', insightsRouter);
app.use('/api/alerts',   alertsRouter);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// ── Global error handler ──────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// ── Start server (skip when required by tests) ────────────────────────────────
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Usage Insights API running on http://localhost:${PORT}`);
  });
}

module.exports = app;
