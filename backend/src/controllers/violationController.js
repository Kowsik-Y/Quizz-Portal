const db = require('../config/database');

// Record a violation during test attempt
exports.recordViolation = async (req, res) => {
  try {
    const {
      attempt_id,
      test_id,
      violation_type,
      details,
      severity
    } = req.body;

    const userId = req.user ? req.user.id : null;

    if (!attempt_id || !test_id || !violation_type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate violation type
    const validTypes = ['window_switch', 'screenshot_attempt', 'phone_call', 'tab_switch', 'copy_paste', 'other'];
    if (!validTypes.includes(violation_type)) {
      return res.status(400).json({ error: 'Invalid violation type' });
    }

    // Insert violation record
    const violationResult = await db.query(`
      INSERT INTO test_violations (
        attempt_id, user_id, test_id, violation_type, details, severity
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [attempt_id, userId, test_id, violation_type, details || {}, severity || 'medium']);

    // Update violation counts in test_attempts table
    let updateColumn = 'total_violations';
    if (violation_type === 'window_switch' || violation_type === 'tab_switch') {
      updateColumn = 'window_switches';
    } else if (violation_type === 'screenshot_attempt') {
      updateColumn = 'screenshot_attempts';
    } else if (violation_type === 'phone_call') {
      updateColumn = 'phone_calls';
    }

    await db.query(`
      UPDATE test_attempts 
      SET 
        total_violations = total_violations + 1,
        ${updateColumn} = ${updateColumn} + 1
      WHERE id = $1
    `, [attempt_id]);

    res.status(201).json({
      message: 'Violation recorded successfully',
      violation: violationResult.rows[0]
    });
  } catch (error) {
    console.error('Record violation error:', error);
    res.status(500).json({ error: 'Failed to record violation' });
  }
};

// Get violations for a specific attempt
exports.getAttemptViolations = async (req, res) => {
  try {
    const { attemptId } = req.params;

    const result = await db.query(`
      SELECT 
        v.*,
        u.username,
        u.full_name,
        t.title as test_title
      FROM test_violations v
      LEFT JOIN users u ON v.user_id = u.id
      LEFT JOIN tests t ON v.test_id = t.id
      WHERE v.attempt_id = $1
      ORDER BY v.created_at DESC
    `, [attemptId]);

    // Get violation summary
    const summaryResult = await db.query(`
      SELECT 
        total_violations,
        window_switches,
        screenshot_attempts,
        phone_calls,
        violation_flags
      FROM test_attempts
      WHERE id = $1
    `, [attemptId]);

    res.json({
      violations: result.rows,
      summary: summaryResult.rows[0] || {
        total_violations: 0,
        window_switches: 0,
        screenshot_attempts: 0,
        phone_calls: 0
      }
    });
  } catch (error) {
    console.error('Get violations error:', error);
    res.status(500).json({ error: 'Failed to fetch violations' });
  }
};

// Get all violations for a test
exports.getTestViolations = async (req, res) => {
  try {
    const { testId } = req.params;

    const result = await db.query(`
      SELECT 
        v.*,
        u.username,
        u.full_name,
        ta.score,
        ta.status as attempt_status
      FROM test_violations v
      LEFT JOIN users u ON v.user_id = u.id
      LEFT JOIN test_attempts ta ON v.attempt_id = ta.id
      WHERE v.test_id = $1
      ORDER BY v.created_at DESC
    `, [testId]);

    // Get violation statistics
    const statsResult = await db.query(`
      SELECT 
        violation_type,
        COUNT(*) as count,
        AVG(CASE WHEN severity = 'low' THEN 1 WHEN severity = 'medium' THEN 2 WHEN severity = 'high' THEN 3 ELSE 4 END) as avg_severity
      FROM test_violations
      WHERE test_id = $1
      GROUP BY violation_type
    `, [testId]);

    res.json({
      violations: result.rows,
      statistics: statsResult.rows
    });
  } catch (error) {
    console.error('Get test violations error:', error);
    res.status(500).json({ error: 'Failed to fetch test violations' });
  }
};

// Get violations for a specific user
exports.getUserViolations = async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await db.query(`
      SELECT 
        v.*,
        t.title as test_title,
        t.quiz_type,
        ta.score,
        ta.status as attempt_status
      FROM test_violations v
      LEFT JOIN tests t ON v.test_id = t.id
      LEFT JOIN test_attempts ta ON v.attempt_id = ta.id
      WHERE v.user_id = $1
      ORDER BY v.created_at DESC
    `, [userId]);

    // Get user violation summary
    const summaryResult = await db.query(`
      SELECT 
        COUNT(*) as total_violations,
        COUNT(DISTINCT test_id) as tests_with_violations,
        COUNT(DISTINCT attempt_id) as attempts_with_violations
      FROM test_violations
      WHERE user_id = $1
    `, [userId]);

    res.json({
      violations: result.rows,
      summary: summaryResult.rows[0] || {
        total_violations: 0,
        tests_with_violations: 0,
        attempts_with_violations: 0
      }
    });
  } catch (error) {
    console.error('Get user violations error:', error);
    res.status(500).json({ error: 'Failed to fetch user violations' });
  }
};

// Bulk record violations (for batch updates)
exports.recordBulkViolations = async (req, res) => {
  try {
    const { violations } = req.body;

    if (!Array.isArray(violations) || violations.length === 0) {
      return res.status(400).json({ error: 'Violations array is required' });
    }

    const userId = req.user ? req.user.id : null;
    const insertedViolations = [];

    // Insert all violations
    for (const violation of violations) {
      const { attempt_id, test_id, violation_type, details, severity } = violation;

      const result = await db.query(`
        INSERT INTO test_violations (
          attempt_id, user_id, test_id, violation_type, details, severity
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [attempt_id, userId, test_id, violation_type, details || {}, severity || 'medium']);

      insertedViolations.push(result.rows[0]);
    }

    // Update attempt totals
    const attemptIds = [...new Set(violations.map(v => v.attempt_id))];
    for (const attemptId of attemptIds) {
      const attemptViolations = violations.filter(v => v.attempt_id === attemptId);
      
      const windowSwitches = attemptViolations.filter(v => 
        v.violation_type === 'window_switch' || v.violation_type === 'tab_switch'
      ).length;
      
      const screenshotAttempts = attemptViolations.filter(v => 
        v.violation_type === 'screenshot_attempt'
      ).length;
      
      const phoneCalls = attemptViolations.filter(v => 
        v.violation_type === 'phone_call'
      ).length;

      await db.query(`
        UPDATE test_attempts 
        SET 
          total_violations = total_violations + $1,
          window_switches = window_switches + $2,
          screenshot_attempts = screenshot_attempts + $3,
          phone_calls = phone_calls + $4
        WHERE id = $5
      `, [attemptViolations.length, windowSwitches, screenshotAttempts, phoneCalls, attemptId]);
    }

    res.status(201).json({
      message: 'Violations recorded successfully',
      count: insertedViolations.length,
      violations: insertedViolations
    });
  } catch (error) {
    console.error('Bulk record violations error:', error);
    res.status(500).json({ error: 'Failed to record violations' });
  }
};
