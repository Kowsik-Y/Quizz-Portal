const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { auth, checkRole } = require('../middleware/auth');

// Apply auth and admin role check to all routes
router.use(auth);
router.use(checkRole('admin'));

// Get all activity logs
router.get('/', async (req, res) => {
  try {
    const { type, search, limit = 100, offset = 0 } = req.query;

    // Build query with filters
    let query = `
      SELECT 
        al.*,
        u.email as user_email,
        u.name as user_name
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    // Filter by type
    if (type && type !== 'all') {
      paramCount++;
      query += ` AND al.action_type = $${paramCount}`;
      params.push(type);
    }

    // Filter by search query
    if (search) {
      paramCount++;
      query += ` AND (
        u.email ILIKE $${paramCount} OR 
        al.action ILIKE $${paramCount} OR 
        al.details ILIKE $${paramCount}
      )`;
      params.push(`%${search}%`);
    }

    // Add ordering and pagination
    query += ` ORDER BY al.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) FROM activity_logs al LEFT JOIN users u ON al.user_id = u.id WHERE 1=1';
    const countParams = [];
    let countParamNum = 0;

    if (type && type !== 'all') {
      countParamNum++;
      countQuery += ` AND al.action_type = $${countParamNum}`;
      countParams.push(type);
    }

    if (search) {
      countParamNum++;
      countQuery += ` AND (u.email ILIKE $${countParamNum} OR al.action ILIKE $${countParamNum} OR al.details ILIKE $${countParamNum})`;
      countParams.push(`%${search}%`);
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    const logs = result.rows.map(row => ({
      id: row.id,
      user: row.user_name || row.user_email || 'System',
      action: row.action,
      type: row.action_type,
      details: row.details,
      timestamp: row.created_at,
      ip: row.ip_address,
      user_agent: row.user_agent
    }));

    res.json({ 
      logs,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + logs.length < total
      }
    });
  } catch (error) {
    console.error('Get activity logs error:', error);
    res.status(500).json({ error: 'Failed to fetch activity logs' });
  }
});

// Create activity log (for system to log actions)
router.post('/', async (req, res) => {
  try {
    const { user_id, action, action_type, details, ip_address, user_agent } = req.body;

    const result = await pool.query(
      `INSERT INTO activity_logs 
        (user_id, action, action_type, details, ip_address, user_agent) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [user_id, action, action_type, details, ip_address, user_agent]
    );

    res.json({ 
      message: 'Activity logged successfully',
      log: result.rows[0]
    });
  } catch (error) {
    console.error('Create activity log error:', error);
    res.status(500).json({ error: 'Failed to create activity log' });
  }
});

// Get activity log statistics
router.get('/stats', async (req, res) => {
  try {
    const { period = '7d' } = req.query;

    // Calculate date range
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

    // Get activity counts by type
    const typeStats = await pool.query(`
      SELECT 
        action_type,
        COUNT(*) as count
      FROM activity_logs
      WHERE created_at > ${dateQuery}
      GROUP BY action_type
      ORDER BY count DESC
    `);

    // Get activity trend (daily counts)
    const trendStats = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM activity_logs
      WHERE created_at > ${dateQuery}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);

    // Get most active users
    const userStats = await pool.query(`
      SELECT 
        u.email,
        COUNT(*) as activity_count
      FROM activity_logs al
      JOIN users u ON al.user_id = u.id
      WHERE al.created_at > ${dateQuery}
      GROUP BY u.email
      ORDER BY activity_count DESC
      LIMIT 10
    `);

    res.json({
      stats: {
        byType: typeStats.rows,
        trend: trendStats.rows,
        topUsers: userStats.rows,
        period
      }
    });
  } catch (error) {
    console.error('Get activity stats error:', error);
    res.status(500).json({ error: 'Failed to fetch activity statistics' });
  }
});

// Delete old logs (cleanup)
router.delete('/cleanup', async (req, res) => {
  try {
    const { days = 90 } = req.query;

    const result = await pool.query(
      `DELETE FROM activity_logs 
       WHERE created_at < NOW() - INTERVAL '${parseInt(days)} days'
       RETURNING id`
    );

    res.json({ 
      message: `Deleted ${result.rowCount} old activity logs`,
      deleted: result.rowCount
    });
  } catch (error) {
    console.error('Cleanup logs error:', error);
    res.status(500).json({ error: 'Failed to cleanup activity logs' });
  }
});

module.exports = router;
