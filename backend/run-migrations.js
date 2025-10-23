const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

async function runMigrations() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting migrations...\n');

    // Migration 004: Add anti-cheating fields
    console.log('📝 Running migration 004: Add anti-cheating fields to tests table');
    const migration004 = fs.readFileSync(
      path.join(__dirname, 'database/migrations/004_add_anti_cheating_fields.sql'),
      'utf8'
    );
    await client.query(migration004);
    console.log('✅ Migration 004 completed\n');

    // Migration 005: Add test violations table
    console.log('📝 Running migration 005: Add test violations table');
    const migration005 = fs.readFileSync(
      path.join(__dirname, 'database/migrations/005_add_test_violations_table.sql'),
      'utf8'
    );
    await client.query(migration005);
    console.log('✅ Migration 005 completed\n');

    // Migration 006: Add test results column
    console.log('📝 Running migration 006: Add test results column to student_answers table');
    const migration006 = fs.readFileSync(
      path.join(__dirname, 'database/migrations/add_test_results.sql'),
      'utf8'
    );
    await client.query(migration006);
    console.log('✅ Migration 006 completed\n');

    // Migration 007: Add randomization and review fields
    console.log('📝 Running migration 007: Add randomization and review fields to tests and test_attempts tables');
    const migration007 = fs.readFileSync(
      path.join(__dirname, 'database/migrations/add_test_randomization_and_review.sql'),
      'utf8'
    );
    await client.query(migration007);
    console.log('✅ Migration 007 completed\n');

    // Migration 008: Change booked_slot to VARCHAR
    console.log('📝 Running migration 008: Change booked_slot column to VARCHAR for time slot strings');
    const migration008 = fs.readFileSync(
      path.join(__dirname, 'database/migrations/006_change_booked_slot_to_varchar.sql'),
      'utf8'
    );
    await client.query(migration008);
    console.log('✅ Migration 008 completed\n');

    console.log('🎉 All migrations completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    console.error('Full error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();
