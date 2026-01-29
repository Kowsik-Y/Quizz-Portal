const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { auth, checkRole } = require('../middleware/auth');

// Apply auth and admin role check to all routes
router.use(auth);
router.use(checkRole('admin'));

// Export analytics report
router.post('/export', async (req, res) => {
  try {
    const { format, stats } = req.body;

    if (!format || !['pdf', 'csv'].includes(format)) {
      return res.status(400).json({ error: 'Invalid format. Use "pdf" or "csv"' });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `analytics_report_${timestamp}.${format}`;

    if (format === 'pdf') {
      // Generate PDF report
      // In production, you would use a library like pdfkit or puppeteer
      console.log('Generating PDF report with stats:', stats);
      
      // Example PDF content structure:
      const reportContent = {
        title: 'Analytics Report',
        generatedAt: new Date().toISOString(),
        stats: {
          users: {
            total: stats.totalUsers || 0,
            students: stats.totalStudents || 0,
            teachers: stats.totalTeachers || 0,
            admins: stats.totalAdmins || 0,
            active: stats.activeUsers || 0,
            inactive: stats.inactiveUsers || 0
          },
          courses: {
            total: stats.totalCourses || 0,
            active: stats.activeCourses || 0
          },
          tests: {
            total: stats.totalTests || 0,
            active: stats.activeTests || 0
          }
        }
      };

      res.json({
        message: 'Analytics report exported successfully as PDF',
        filename,
        format: 'pdf',
        data: reportContent
      });
    } else if (format === 'csv') {
      // Generate CSV export
      console.log('Generating CSV export with stats:', stats);

      // Example CSV structure
      const csvData = [
        ['Category', 'Metric', 'Value'],
        ['Users', 'Total Users', stats.totalUsers || 0],
        ['Users', 'Students', stats.totalStudents || 0],
        ['Users', 'Teachers', stats.totalTeachers || 0],
        ['Users', 'Admins', stats.totalAdmins || 0],
        ['Users', 'Active Users', stats.activeUsers || 0],
        ['Users', 'Inactive Users', stats.inactiveUsers || 0],
        ['Courses', 'Total Courses', stats.totalCourses || 0],
        ['Courses', 'Active Courses', stats.activeCourses || 0],
        ['Tests', 'Total Tests', stats.totalTests || 0],
        ['Tests', 'Active Tests', stats.activeTests || 0]
      ];

      res.json({
        message: 'Analytics data exported successfully as CSV',
        filename,
        format: 'csv',
        data: csvData
      });
    }
  } catch (error) {
    console.error('Export analytics error:', error);
    res.status(500).json({ error: 'Failed to export analytics report' });
  }
});

// Get detailed analytics data
router.get('/detailed', async (req, res) => {
  try {
    // Fetch detailed analytics from database
    const [usersResult, coursesResult, testsResult, attemptsResult] = await Promise.all([
      pool.query(`
        SELECT 
          role,
          is_active,
          COUNT(*) as count
        FROM users
        GROUP BY role, is_active
      `),
      pool.query(`
        SELECT 
          is_active,
          COUNT(*) as count
        FROM courses
        GROUP BY is_active
      `),
      pool.query(`
        SELECT 
          is_active,
          COUNT(*) as count
        FROM tests
        GROUP BY is_active
      `),
      pool.query(`
        SELECT 
          COUNT(*) as total_attempts,
          AVG(score) as avg_score,
          MAX(score) as highest_score,
          MIN(score) as lowest_score
        FROM attempts
        WHERE submitted_at IS NOT NULL
      `)
    ]);

    const analytics = {
      users: usersResult.rows,
      courses: coursesResult.rows,
      tests: testsResult.rows,
      attempts: attemptsResult.rows[0] || {}
    };

    res.json({ analytics });
  } catch (error) {
    console.error('Get detailed analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch detailed analytics' });
  }
});

// Get user activity trends
router.get('/trends', async (req, res) => {
  try {
    const { period = '7d' } = req.query;

    // Calculate date range based on period
    let dateQuery;
    switch (period) {
      case '24h':
        dateQuery = "NOW() - INTERVAL '24 hours'";
        break;
      case '7d':
        dateQuery = "NOW() - INTERVAL '7 days'";
        break;
      case '30d':
        dateQuery = "NOW() - INTERVAL '30 days'";
        break;
      default:
        dateQuery = "NOW() - INTERVAL '7 days'";
    }

    // Get user registration trends
    const registrationTrends = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as new_users
      FROM users
      WHERE created_at > ${dateQuery}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);

    // Get test submission trends
    const submissionTrends = await pool.query(`
      SELECT 
        DATE(submitted_at) as date,
        COUNT(*) as submissions,
        AVG(score) as avg_score
      FROM attempts
      WHERE submitted_at > ${dateQuery} AND submitted_at IS NOT NULL
      GROUP BY DATE(submitted_at)
      ORDER BY date DESC
    `);

    res.json({
      trends: {
        registrations: registrationTrends.rows,
        submissions: submissionTrends.rows,
        period
      }
    });
  } catch (error) {
    console.error('Get trends error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics trends' });
  }
});

module.exports = router;
