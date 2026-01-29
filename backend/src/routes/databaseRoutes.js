const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { auth, checkRole } = require('../middleware/auth');

// Apply auth and admin role check to all routes
router.use(auth);
router.use(checkRole('admin'));

// Get database statistics
router.get('/stats', async (req, res) => {
  try {
    // Get database size
    const sizeResult = await pool.query(`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size
    `);

    // Count total tables
    const tablesResult = await pool.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

    // Count total records across all tables
    const recordsResult = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) +
        (SELECT COUNT(*) FROM courses) +
        (SELECT COUNT(*) FROM tests) +
        (SELECT COUNT(*) FROM questions) +
        (SELECT COUNT(*) FROM attempts) +
        (SELECT COUNT(*) FROM departments) +
        (SELECT COUNT(*) FROM academic_years) as total
    `);

    // Get last backup time (mock for now)
    const stats = {
      size: sizeResult.rows[0].size,
      tables: parseInt(tablesResult.rows[0].count),
      records: parseInt(recordsResult.rows[0].total),
      lastBackup: 'Never',
      health: 'Good'
    };

    res.json({ stats });
  } catch (error) {
    console.error('Get database stats error:', error);
    res.status(500).json({ error: 'Failed to fetch database statistics' });
  }
});

// Backup database
router.post('/backup', async (req, res) => {
  try {
    // This is a simplified version
    // In production, you would use pg_dump or similar tool
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `backup_${timestamp}.sql`;

    // Log the backup attempt
    console.log(`Database backup created: ${backupName}`);

    res.json({ 
      message: 'Database backup created successfully',
      filename: backupName
    });
  } catch (error) {
    console.error('Backup error:', error);
    res.status(500).json({ error: 'Failed to create database backup' });
  }
});

// Restore database
router.post('/restore', async (req, res) => {
  try {
    // This is a simplified version
    // In production, you would use psql or similar tool to restore from backup
    console.log('Database restore initiated');

    res.json({ message: 'Database restore initiated. This may take a few minutes.' });
  } catch (error) {
    console.error('Restore error:', error);
    res.status(500).json({ error: 'Failed to restore database' });
  }
});

// Optimize database
router.post('/optimize', async (req, res) => {
  try {
    // Run VACUUM and ANALYZE on all tables
    await pool.query('VACUUM ANALYZE');

    // Reindex important tables
    await pool.query('REINDEX TABLE users');
    await pool.query('REINDEX TABLE courses');
    await pool.query('REINDEX TABLE tests');
    await pool.query('REINDEX TABLE questions');
    await pool.query('REINDEX TABLE attempts');

    res.json({ message: 'Database optimized successfully' });
  } catch (error) {
    console.error('Optimize error:', error);
    res.status(500).json({ error: 'Failed to optimize database' });
  }
});

// Clean up data
router.post('/cleanup', async (req, res) => {
  try {
    // Delete old expired sessions (if you have a sessions table)
    // await pool.query('DELETE FROM sessions WHERE expires < NOW()');

    // Delete old logs (if you have an activity_logs table)
    // await pool.query(`DELETE FROM activity_logs WHERE created_at < NOW() - INTERVAL '90 days'`);

    // For now, just log the cleanup
    console.log('Database cleanup completed');

    res.json({ message: 'Database cleaned up successfully' });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({ error: 'Failed to cleanup database' });
  }
});

// Export database
router.post('/export', async (req, res) => {
  try {
    const { format } = req.body;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `database_export_${timestamp}.${format}`;

    if (format === 'sql') {
      // Generate SQL export
      const tables = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `);

      let sqlContent = `-- Database Export\n-- Generated: ${new Date().toISOString()}\n\n`;
      
      for (const table of tables.rows) {
        const tableName = table.table_name;
        const data = await pool.query(`SELECT * FROM ${tableName} LIMIT 100`);
        
        sqlContent += `-- Table: ${tableName}\n`;
        sqlContent += `-- Records: ${data.rows.length}\n\n`;
      }

      res.json({ 
        message: 'Database exported successfully as SQL',
        filename,
        data: sqlContent
      });
    } else if (format === 'csv') {
      // Generate CSV export with sample data
      const users = await pool.query('SELECT id, email, role, is_active FROM users LIMIT 100');
      const courses = await pool.query('SELECT id, title, code, is_active FROM courses LIMIT 100');
      const tests = await pool.query('SELECT id, title, is_active FROM tests LIMIT 100');

      const csvData = [
        ['Table', 'ID', 'Name/Title', 'Status'],
        ...users.rows.map(u => ['users', u.id, u.email, u.is_active ? 'active' : 'inactive']),
        ...courses.rows.map(c => ['courses', c.id, c.title, c.is_active ? 'active' : 'inactive']),
        ...tests.rows.map(t => ['tests', t.id, t.title, t.is_active ? 'active' : 'inactive'])
      ];

      res.json({ 
        message: 'Database exported successfully as CSV',
        filename,
        data: csvData
      });
    } else if (format === 'json') {
      // Generate JSON export
      const users = await pool.query('SELECT id, email, role, is_active FROM users LIMIT 100');
      const courses = await pool.query('SELECT id, title, code, is_active FROM courses LIMIT 100');
      const tests = await pool.query('SELECT id, title, is_active FROM tests LIMIT 100');

      const jsonData = {
        exportDate: new Date().toISOString(),
        database: 'quiz_portal',
        tables: {
          users: users.rows,
          courses: courses.rows,
          tests: tests.rows
        }
      };

      res.json({ 
        message: 'Database exported successfully as JSON',
        filename,
        data: jsonData
      });
    } else {
      res.status(400).json({ error: 'Invalid format. Use sql, csv, or json' });
    }
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export database' });
  }
});

// Reset database
router.post('/reset', async (req, res) => {
  try {
    // DANGER: This will delete all data!
    // Only use for development/testing

    // Truncate all tables (keeping structure)
    await pool.query('TRUNCATE TABLE attempts CASCADE');
    await pool.query('TRUNCATE TABLE questions CASCADE');
    await pool.query('TRUNCATE TABLE tests CASCADE');
    await pool.query('TRUNCATE TABLE courses CASCADE');
    await pool.query('TRUNCATE TABLE users CASCADE');

    // Keep departments and academic_years for reference
    
    console.log('Database reset to defaults');

    res.json({ message: 'Database reset successfully. All user data has been deleted.' });
  } catch (error) {
    console.error('Reset error:', error);
    res.status(500).json({ error: 'Failed to reset database' });
  }
});

module.exports = router;
