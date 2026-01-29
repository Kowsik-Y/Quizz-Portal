const db = require('../config/database');

// Get all questions (Admin only)
exports.getAllQuestions = async (req, res) => {
  try {
    const { test_id, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT q.*, t.title as test_title, c.title as course_title
      FROM questions q
      LEFT JOIN tests t ON q.test_id = t.id
      LEFT JOIN courses c ON t.course_id = c.id
    `;

    const params = [];
    let paramCount = 1;

    if (test_id) {
      const testId = parseInt(test_id, 10);
      if (isNaN(testId)) {
        return res.status(400).json({ error: 'Invalid test_id' });
      }
      query += ` WHERE q.test_id = $${paramCount}`;
      params.push(testId);
      paramCount++;
    }

    query += ` ORDER BY q.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.query(query, params);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM questions';
    const countParams = [];

    if (test_id) {
      const testId = parseInt(test_id, 10);
      if (isNaN(testId)) {
        return res.status(400).json({ error: 'Invalid test_id' });
      }
      countQuery += ' WHERE test_id = $1';
      countParams.push(testId);
    }

    const countResult = await db.query(countQuery, countParams);

    res.json({
      questions: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].total),
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + parseInt(limit) < parseInt(countResult.rows[0].total)
      }
    });
  } catch (error) {
    console.error('Get all questions error:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
};

// Get questions for a test
exports.getQuestions = async (req, res) => {
  try {
    const { test_id, attempt_id } = req.query;

    if (!test_id) {
      return res.status(400).json({ error: 'test_id is required' });
    }

    const testId = parseInt(test_id, 10);
    if (isNaN(testId)) {
      return res.status(400).json({ error: 'Invalid test_id' });
    }

    // Check if user is taking the test (student) or creating it (teacher)
    const isStudent = req.user.role === 'student';

    let query;
    let params = [testId];

    if (isStudent) {
      // Students don't see correct answers, but DO need test cases for code questions
      // If attempt_id is provided, check for selected questions
      if (attempt_id) {
        const attemptId = parseInt(attempt_id, 10);
        if (isNaN(attemptId)) {
          return res.status(400).json({ error: 'Invalid attempt_id' });
        }
        query = `
          SELECT q.id, q.test_id, q.question_type, q.question_text, q.code_language, q.options, q.points, q.order_number, q.test_cases
          FROM questions q
          JOIN test_attempts ta ON ta.test_id = q.test_id
          WHERE q.test_id = $1 AND ta.id = $2 AND ta.student_id = $3
          AND (ta.selected_questions IS NULL OR q.id = ANY(ta.selected_questions))
          ORDER BY q.order_number ASC
        `;
        params = [testId, attemptId, req.user.id];
      } else {
        // Fallback for when no attempt_id is provided
        query = `
          SELECT id, test_id, question_type, question_text, code_language, options, points, order_number, test_cases
          FROM questions
          WHERE test_id = $1
          ORDER BY order_number ASC
        `;
      }
    } else {
      // Teachers/admins see everything
      query = `
        SELECT *
        FROM questions
        WHERE test_id = $1
        ORDER BY order_number ASC
      `;
    }

    const result = await db.query(query, params);

    res.json({ questions: result.rows });
  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
};

// Create question
exports.createQuestion = async (req, res) => {
  try {
    const {
      test_id,
      question_type,
      question_text,
      code_language,
      options,
      correct_answer,
      test_cases,
      explanation,
      points
    } = req.body;

    // For coding questions, correct_answer is not required since test_cases determine correctness
    const isCodingQuestion = question_type === 'code';
    
    if (!test_id || !question_type || !question_text || (!isCodingQuestion && !correct_answer)) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const testId = parseInt(test_id, 10);
    if (isNaN(testId)) {
      return res.status(400).json({ error: 'Invalid test_id' });
    }

    // Get next order number
    const orderResult = await db.query(
      'SELECT COALESCE(MAX(order_number), 0) + 1 as next_order FROM questions WHERE test_id = $1',
      [testId]
    );
    const order_number = orderResult.rows[0].next_order;

    const result = await db.query(`
      INSERT INTO questions (
        test_id, question_type, question_text, code_language,
        options, correct_answer, test_cases, explanation, points, order_number
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      testId, question_type, question_text, code_language,
      JSON.stringify(options), correct_answer || null,
      JSON.stringify(test_cases), explanation,
      points || 1, order_number
    ]);

    res.status(201).json({
      message: 'Question created successfully',
      question: result.rows[0]
    });
  } catch (error) {
    console.error('Create question error:', error);
    res.status(500).json({ error: 'Failed to create question' });
  }
};

// Update question
exports.updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (updates.options) {
      updates.options = JSON.stringify(updates.options);
    }
    if (updates.test_cases) {
      updates.test_cases = JSON.stringify(updates.test_cases);
    }

    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(updates[key]);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);
    const query = `
      UPDATE questions
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }

    res.json({
      message: 'Question updated successfully',
      question: result.rows[0]
    });
  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({ error: 'Failed to update question' });
  }
};

// Delete question
exports.deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query('DELETE FROM questions WHERE id = $1', [id]);

    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({ error: 'Failed to delete question' });
  }
};
