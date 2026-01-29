const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");
require("dotenv").config();

// Use DATABASE_URL if provided (for Neon), otherwise use individual config
const poolConfig = process.env.DATABASE_URL
	? {
			connectionString: process.env.DATABASE_URL,
			ssl: { rejectUnauthorized: false },
		}
	: {
			user: process.env.DB_USER,
			host: process.env.DB_HOST,
			database: process.env.DB_NAME,
			password: process.env.DB_PASSWORD,
			port: process.env.DB_PORT || 5432,
			ssl:
				process.env.NODE_ENV === "production"
					? { rejectUnauthorized: false }
					: false,
		};

const pool = new Pool(poolConfig);

async function runMigrations() {
	const client = await pool.connect();

	try {
		console.log("🚀 Starting migrations...\n");

		// Helper to run a migration file and skip 'already exists' errors
		const runMigrationFile = async (relativePath, description) => {
			try {
				console.log(`📝 Running migration: ${description}`);
				const migrationSql = fs.readFileSync(
					path.join(__dirname, relativePath),
					"utf8",
				);
				await client.query(migrationSql);
				console.log(`✅ ${description} completed\n`);
			} catch (err) {
				// Postgres duplicate column/table errors use code 42701 or message contains 'already exists'
				if (
					err &&
					(err.code === "42701" || /already exists/i.test(err.message || ""))
				) {
					console.warn(`⚠️ Migration skipped (already applied): ${description}`);
				} else {
					throw err;
				}
			}
		};

		await runMigrationFile(
			// Add material progress tracking table
			"database/migrations/add_material_progress.sql",
			"Add material_progress table",
		);

		await runMigrationFile(
			"database/migrations/003_add_code_language.sql",
			"003: Add code_language column to questions table",
		);
		await runMigrationFile(
			"database/migrations/004_add_anti_cheating_fields.sql",
			"004: Add anti-cheating fields to tests table",
		);
		await runMigrationFile(
			"database/migrations/005_add_test_violations_table.sql",
			"005: Add test violations table",
		);
		await runMigrationFile(
			"database/migrations/add_test_results.sql",
			"006: Add test results column to student_answers table",
		);
		await runMigrationFile(
			"database/migrations/add_test_randomization_and_review.sql",
			"007: Add randomization and review fields to tests and test_attempts tables",
		);
		await runMigrationFile(
			"database/migrations/add_certificates.sql",
			"Add certificates table",
		);
		await runMigrationFile(
			"database/migrations/006_change_booked_slot_to_varchar.sql",
			"008: Change booked_slot column to VARCHAR for time slot strings",
		);

		console.log("🎉 All migrations processed (some may have been skipped).");
	} catch (error) {
		console.error("❌ Migration error:", error.message);
		console.error("Full error:", error);
	} finally {
		client.release();
		await pool.end();
	}
}

runMigrations();
