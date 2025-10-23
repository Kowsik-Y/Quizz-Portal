const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

// Use DATABASE_URL if provided (for Neon), otherwise use individual config
const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    }
  : {
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT || 5432,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    };

const pool = new Pool(poolConfig);

async function setupSchema() {
  const client = await pool.connect();

  try {
    console.log('🚀 Setting up database schema...\n');

    // Read and execute schema file
    const schemaSQL = fs.readFileSync(
      path.join(__dirname, 'database/schema_enhanced.sql'),
      'utf8'
    );

    await client.query(schemaSQL);
    console.log('✅ Schema setup completed successfully!');

  } catch (error) {
    console.error('❌ Schema setup error:', error.message);
    console.error('Full error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

setupSchema();