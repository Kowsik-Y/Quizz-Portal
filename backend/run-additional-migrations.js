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

async function runAdditionalMigrations() {
  const client = await pool.connect();

  try {
    console.log('🚀 Running additional migrations...\n');

    // Migration 1: User devices
    console.log('📝 Running user_devices migration');
    const userDevicesSQL = fs.readFileSync(
      path.join(__dirname, 'database/user_devices_migration.sql'),
      'utf8'
    );
    await client.query(userDevicesSQL);
    console.log('✅ User devices migration completed\n');

    // Migration 2: Activity logs
    console.log('📝 Running activity_logs migration');
    const activityLogsSQL = fs.readFileSync(
      path.join(__dirname, 'database/activity_logs_migration.sql'),
      'utf8'
    );
    await client.query(activityLogsSQL);
    console.log('✅ Activity logs migration completed\n');

    // Migration 3: Academic years and departments
    console.log('📝 Running academic years migration');
    const academicYearsSQL = fs.readFileSync(
      path.join(__dirname, 'database/migration_department_year.sql'),
      'utf8'
    );
    await client.query(academicYearsSQL);
    console.log('✅ Academic years migration completed\n');

    console.log('🎉 All additional migrations completed successfully!');

  } catch (error) {
    console.error('❌ Migration error:', error.message);
    console.error('Full error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

runAdditionalMigrations();