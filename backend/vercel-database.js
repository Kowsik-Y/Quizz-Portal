const { Pool } = require('pg');
require('dotenv').config();

// Vercel-specific database configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  // Reduce connection pool for serverless
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};