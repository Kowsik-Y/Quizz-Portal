const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { auth, checkRole } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// Get user stats (Authenticated users - their own stats)
// ⚠️ IMPORTANT: This route MUST come before /:id route
router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get stats based on user role
    if (req.user.role === 'student') {
      // Student stats
      const statsResult = await pool.query(`
        SELECT 
          COUNT(DISTINCT c.id) as courses_enrolled,
          COUNT(DISTINCT CASE WHEN ta.status = 'submitted' THEN ta.id END) as tests_completed,
          COALESCE(AVG(CASE WHEN ta.status = 'submitted' THEN ta.score END), 0) as average_score,
          COALESCE(SUM(CASE WHEN ta.status = 'submitted' THEN ta.score END), 0) as total_score,
          0 as rank,
          0 as streak,
          0 as badges
        FROM users u
        LEFT JOIN test_attempts ta ON u.id = ta.student_id
        LEFT JOIN tests t ON ta.test_id = t.id
        LEFT JOIN courses c ON t.course_id = c.id
        WHERE u.id = $1
        GROUP BY u.id
      `, [userId]);

      res.json(statsResult.rows[0] || {
        courses_enrolled: 0,
        tests_completed: 0,
        average_score: 0,
        total_score: 0,
        rank: 0,
        streak: 0,
        badges: 0
      });
    } else {
      // Teacher/Admin stats
      const statsResult = await pool.query(`
        SELECT 
          COUNT(DISTINCT c.id) as courses_created,
          COUNT(DISTINCT t.id) as tests_created,
          COUNT(DISTINCT ta.id) as total_attempts,
          COALESCE(AVG(CASE WHEN ta.status = 'submitted' THEN ta.score END), 0) as average_score
        FROM users u
        LEFT JOIN courses c ON u.id = c.created_by
        LEFT JOIN tests t ON c.id = t.course_id
        LEFT JOIN test_attempts ta ON t.id = ta.test_id AND ta.status = 'submitted'
        WHERE u.id = $1
        GROUP BY u.id
      `, [userId]);

      const result = statsResult.rows[0] || {
        courses_created: 0,
        tests_created: 0,
        total_attempts: 0,
        average_score: 0
      };

      // Format for frontend (map to expected fields)
      res.json({
        coursesEnrolled: result.courses_created,
        testsCompleted: result.tests_created,
        averageScore: parseFloat(result.average_score).toFixed(1),
        totalScore: result.total_attempts,
        rank: 0,
        streak: 0,
        badges: 0
      });
    }
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Get all users (Admin only)
router.get('/', auth, checkRole('admin'), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.id,
        u.email,
        u.name,
        u.role,
        u.department_id,
        d.name as department_name,
        u.is_active,
        u.created_at
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      ORDER BY u.created_at DESC
    `);

    res.json({ users: result.rows });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get single user (Admin only)
router.get('/:id', auth, checkRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT 
        u.id,
        u.email,
        u.name,
        u.role,
        u.department_id,
        d.name as department_name,
        u.is_active,
        u.created_at
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update user (Admin only)
router.put('/:id', auth, checkRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { email, name, role, department_id, is_active, password } = req.body;

    // Check if user exists
    const userCheck = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (email !== undefined) {
      updates.push(`email = $${paramCount}`);
      values.push(email);
      paramCount++;
    }

    if (name !== undefined) {
      updates.push(`name = $${paramCount}`);
      values.push(name);
      paramCount++;
    }

    if (role !== undefined) {
      updates.push(`role = $${paramCount}`);
      values.push(role);
      paramCount++;
    }

    if (department_id !== undefined) {
      updates.push(`department_id = $${paramCount}`);
      values.push(department_id);
      paramCount++;
    }

    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount}`);
      values.push(is_active);
      paramCount++;
    }

    if (password !== undefined && password.trim() !== '') {
      const hashedPassword = await bcrypt.hash(password, 10);
      updates.push(`password = $${paramCount}`);
      values.push(hashedPassword);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    // Add updated_at
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    
    // Add user ID for WHERE clause
    values.push(id);

    const query = `
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, email, name, role, department_id, is_active
    `;

    const result = await pool.query(query, values);

    res.json({ 
      message: 'User updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Update user error:', error);
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user (Admin only)
router.delete('/:id', auth, checkRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deleting yourself
    if (parseInt(id) === req.user.userId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Toggle user active status (Admin only)
router.patch('/:id/toggle-status', auth, checkRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      UPDATE users 
      SET is_active = NOT is_active, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, email, is_active
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ 
      message: 'User status updated',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Toggle status error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

module.exports = router;
