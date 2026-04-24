const { Pool } = require('pg');
require('dotenv').config();

// Single shared pg connection pool for the whole app.
// Uses DATABASE_URL from .env (e.g. postgresql://user:pass@localhost:5432/usage_insights)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err.message);
});

module.exports = pool;
