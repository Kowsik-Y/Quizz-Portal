const db = require('../config/database');

// Start test attempt
exports.startAttempt = async (req, res) => {
  try {
    const { test_id } = req.body;
    const { platform, browser, device_info } = req.body;
    const student_id = req.user.id;

    console.log('🚀 Start Attempt Request:', {
      test_id,
      platform,
      browser,
      student_id,
      user_role: req.user.role
    });

    // Get test details
    const testResult = await db.query('SELECT * FROM tests WHERE id = $1', [test_id]);
    if (testResult.rows.length === 0) {
      console.log('❌ Test not found:', test_id);
      return res.status(404).json({ error: 'Test not found' });
    }

    const test = testResult.rows[0];
    console.log('✅ Test found:', test.title);

    // Check platform restriction (normalize platform values)
    // Platform values: 'web', 'android', 'ios', 'mobile' (android/ios)
    // Restriction values: 'any', 'web', 'mobile'
    if (test.platform_restriction && test.platform_restriction !== 'any') {
      const normalizedPlatform = (platform === 'android' || platform === 'ios') ? 'mobile' : platform;
      const restriction = test.platform_restriction.toLowerCase();
      
      console.log('🔍 Platform check:', {
        received_platform: platform,
        normalized_platform: normalizedPlatform,
        restriction: restriction
      });
      
      if (restriction !== normalizedPlatform) {
        console.log('❌ Platform restriction failed');
        return res.status(403).json({
          error: `This test is restricted to ${test.platform_restriction.toUpperCase()} only`
        });
      }
    }

    // Check browser restriction
    if (test.allowed_browsers && test.allowed_browsers.length > 0) {
      if (!test.allowed_browsers.includes(browser)) {
        console.log('❌ Browser restriction failed');
        return res.status(403).json({
          error: `This test only allows: ${test.allowed_browsers.join(', ')}`
        });
      }
    }

    // Get total points
    const pointsResult = await db.query(
      'SELECT SUM(points) as total FROM questions WHERE test_id = $1',
      [test_id]
    );
    const total_points = pointsResult.rows[0].total || 0;
    console.log('📊 Total points:', total_points);

    // Check if test has random question selection enabled
    let selectedQuestionIds = null;
    if (test.questions_to_ask && test.questions_to_ask > 0) {
      // Get all question IDs for this test
      const allQuestionsResult = await db.query(
        'SELECT id FROM questions WHERE test_id = $1 ORDER BY order_number',
        [test_id]
      );
      const allQuestionIds = allQuestionsResult.rows.map(q => q.id);

      if (test.questions_to_ask < allQuestionIds.length) {
        // Randomly select questions without replacement
        const shuffled = [...allQuestionIds].sort(() => 0.5 - Math.random());
        selectedQuestionIds = shuffled.slice(0, test.questions_to_ask);
        console.log(`🎲 Randomly selected ${test.questions_to_ask} questions out of ${allQuestionIds.length}`);
      }
    }

    // Check if student already has an IN-PROGRESS attempt for this test
    // Allow multiple attempts, but not multiple simultaneous in-progress attempts
    const existingAttempt = await db.query(
      'SELECT * FROM test_attempts WHERE test_id = $1 AND student_id = $2 AND status = $3',
      [test_id, student_id, 'in_progress']
    );

    if (existingAttempt.rows.length > 0) {
      console.log('⚠️ In-progress attempt already exists:', existingAttempt.rows[0].id);
      return res.status(200).json({
        message: 'You have an in-progress attempt for this test',
        attempt: existingAttempt.rows[0]
      });
    }

    // Check if test allows multiple attempts
    if (test.max_attempts && test.max_attempts > 0) {
      const attemptCountResult = await db.query(
        'SELECT COUNT(*) as count FROM test_attempts WHERE test_id = $1 AND student_id = $2 AND status = $3',
        [test_id, student_id, 'submitted']
      );
      
      const attemptCount = parseInt(attemptCountResult.rows[0].count);
      console.log(`📊 Attempt count: ${attemptCount} / ${test.max_attempts}`);
      
      if (attemptCount >= test.max_attempts) {
        console.log('❌ Max attempts reached');
        return res.status(403).json({
          error: `You have reached the maximum number of attempts (${test.max_attempts}) for this test`
        });
      }
    }

    // Create attempt
    console.log('Creating new attempt...');
    const result = await db.query(`
      INSERT INTO test_attempts (
        test_id, student_id, platform, browser, device_info, total_points, selected_questions
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [test_id, student_id, platform, browser, JSON.stringify(device_info), total_points, selectedQuestionIds]);

    console.log('✅ Attempt created successfully:', result.rows[0].id);

    res.status(201).json({
      message: 'Test started successfully',
      attempt: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Start attempt error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error code:', error.code);
    
    // Check for unique constraint violation
    if (error.code === '23505') {
      return res.status(409).json({ 
        error: 'You already have an attempt for this test',
        details: 'Please continue your existing attempt or contact administrator'
      });
    }
    
    res.status(500).json({ error: 'Failed to start test', details: error.message });
  }
};

// Submit answer
exports.submitAnswer = async (req, res) => {
  try {
    const { attempt_id, question_id, answer, code_submission, is_flagged } = req.body;

    if (!attempt_id || !question_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get question details
    const questionResult = await db.query(
      'SELECT * FROM questions WHERE id = $1',
      [question_id]
    );

    if (questionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }

    const question = questionResult.rows[0];
    let is_correct = false;
    let points_earned = 0;

    // Check answer
    if (question.question_type === 'mcq') {
      is_correct = answer === question.correct_answer;
      points_earned = is_correct ? question.points : 0;
    }
    // For code questions, we'll evaluate later with test cases

    // Insert or update answer
    const result = await db.query(`
      INSERT INTO student_answers (
        attempt_id, question_id, answer, code_submission, is_correct, is_flagged, points_earned
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (attempt_id, question_id)
      DO UPDATE SET
        answer = EXCLUDED.answer,
        code_submission = EXCLUDED.code_submission,
        is_correct = EXCLUDED.is_correct,
        is_flagged = EXCLUDED.is_flagged,
        points_earned = EXCLUDED.points_earned,
        submitted_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [attempt_id, question_id, answer, code_submission, is_correct, is_flagged, points_earned]);

    res.json({
      message: 'Answer saved successfully',
      answer: result.rows[0]
    });
  } catch (error) {
    console.error('Submit answer error:', error);
    res.status(500).json({ error: 'Failed to submit answer' });
  }
};

// Submit test
exports.submitAttempt = async (req, res) => {
  try {
    const { attempt_id } = req.body;

    // Get attempt details to check for selected questions
    const attemptResult = await db.query('SELECT test_id, selected_questions FROM test_attempts WHERE id = $1', [attempt_id]);
    if (attemptResult.rows.length === 0) {
      return res.status(404).json({ error: 'Attempt not found' });
    }
    const attempt = attemptResult.rows[0];

    // Calculate total score
    const scoreResult = await db.query(
      'SELECT SUM(points_earned) as score FROM student_answers WHERE attempt_id = $1',
      [attempt_id]
    );
    const score = scoreResult.rows[0].score || 0;

    // Calculate total points based on selected questions or all questions
    let totalPoints = 0;
    if (attempt.selected_questions && attempt.selected_questions.length > 0) {
      // Use selected questions for total points calculation
      const placeholders = attempt.selected_questions.map((_, i) => `$${i + 1}`).join(',');
      const totalPointsResult = await db.query(
        `SELECT SUM(points) as total FROM questions WHERE id IN (${placeholders})`,
        attempt.selected_questions
      );
      totalPoints = totalPointsResult.rows[0].total || 0;
    } else {
      // Fallback to all questions (for backward compatibility)
      const totalPointsResult = await db.query(
        'SELECT SUM(points) as total FROM questions WHERE test_id = $1',
        [attempt.test_id]
      );
      totalPoints = totalPointsResult.rows[0].total || 0;
    }

    // Update attempt
    const result = await db.query(`
      UPDATE test_attempts
      SET status = 'submitted', score = $1, total_points = $2, submitted_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `, [score, totalPoints, attempt_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Attempt not found' });
    }

    const percentage = totalPoints > 0 ? (score / totalPoints) * 100 : 0;

    res.json({
      message: 'Test submitted successfully',
      attempt: result.rows[0],
      score,
      total_points: totalPoints,
      percentage: Math.round(percentage)
    });
  } catch (error) {
    console.error('Submit attempt error:', error);
    res.status(500).json({ error: 'Failed to submit test' });
  }
};

// Mark code answer as correct after test case validation
exports.markCodeAnswerCorrect = async (req, res) => {
  try {
    const { attempt_id, question_id, passed_count, total_test_cases, test_results } = req.body;
    if (!attempt_id || !question_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get question details
    const questionResult = await db.query(
      'SELECT * FROM questions WHERE id = $1',
      [question_id]
    );
    if (questionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }
    const question = questionResult.rows[0];
    if (question.question_type !== 'code') {
      return res.status(400).json({ error: 'Not a code question' });
    }

    // Calculate partial points based on passed test cases
    let pointsEarned = 0;
    if (passed_count && total_test_cases && total_test_cases > 0) {
      const pointsPerTestCase = question.points / total_test_cases;
      pointsEarned = passed_count * pointsPerTestCase;
    } else {
      // Fallback to full points if no partial scoring data provided
      pointsEarned = question.points;
    }

    // First, ensure there's an answer record for this question
    // If not, create one with the current code submission
    const existingAnswer = await db.query(
      'SELECT * FROM student_answers WHERE attempt_id = $1 AND question_id = $2',
      [attempt_id, question_id]
    );

    if (existingAnswer.rows.length === 0) {
      // No answer exists yet, this shouldn't happen but let's handle it
      console.warn('No answer found for code question, creating one...');
      await db.query(`
        INSERT INTO student_answers (
          attempt_id, question_id, answer, code_submission, is_correct, is_flagged, points_earned, test_results
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [attempt_id, question_id, null, '', passed_count > 0, false, pointsEarned, JSON.stringify(test_results || [])]);
    } else {
      // Update existing answer
      await db.query(
        `UPDATE student_answers
          SET is_correct = $1, points_earned = $2, test_results = $3
          WHERE attempt_id = $4 AND question_id = $5`,
        [passed_count > 0, pointsEarned, JSON.stringify(test_results || []), attempt_id, question_id]
      );
    }

    res.json({
      message: 'Code answer marked with partial points',
      points_awarded: pointsEarned,
      passed_count: passed_count || 0,
      total_test_cases: total_test_cases || 0,
      test_results: test_results || []
    });
  } catch (error) {
    console.error('Mark code answer correct error:', error);
    res.status(500).json({ error: 'Failed to mark code answer correct' });
  }
};

// Get attempt review
exports.getAttemptReview = async (req, res) => {
  try {
    const { attempt_id } = req.params;

    // Get attempt details with test info
    const attemptResult = await db.query(`
      SELECT ta.*, t.title as test_title, t.passing_score, t.show_review_to_students
      FROM test_attempts ta
      JOIN tests t ON ta.test_id = t.id
      WHERE ta.id = $1 AND ta.student_id = $2
    `, [attempt_id, req.user.id]);

    if (attemptResult.rows.length === 0) {
      return res.status(404).json({ error: 'Attempt not found' });
    }

    const attemptData = attemptResult.rows[0];

    // Check if student can view reviews
    if (req.user.role === 'student' && !attemptData.show_review_to_students) {
      return res.status(403).json({ error: 'Review is not available for this test' });
    }

    if (attemptResult.rows.length === 0) {
      return res.status(404).json({ error: 'Attempt not found' });
    }

    // Get all answers with questions
    const answersResult = await db.query(`
      SELECT sa.*, q.question_text, q.question_type, q.options, q.correct_answer, q.explanation, q.test_cases, sa.test_results
      FROM student_answers sa
      JOIN questions q ON sa.question_id = q.id
      WHERE sa.attempt_id = $1
      ORDER BY q.order_number
    `, [attempt_id]);

    // Parse JSON fields and ensure test_results is an array
    const processedAnswers = answersResult.rows.map(answer => ({
      ...answer,
      options: answer.options ? (typeof answer.options === 'string' ? JSON.parse(answer.options) : answer.options) : null,
      test_cases: answer.test_cases ? (typeof answer.test_cases === 'string' ? JSON.parse(answer.test_cases) : answer.test_cases) : null,
      test_results: answer.test_results ? (typeof answer.test_results === 'string' ? JSON.parse(answer.test_results) : answer.test_results) : null
    }));

    // Recalculate the current score from answers (important for code questions that may be marked correct after testing)
    const currentScore = answersResult.rows.reduce((sum, answer) => {
      return sum + (parseFloat(answer.points_earned) || 0);
    }, 0);

    // Calculate total points based on selected questions or all questions
    let totalPoints = 0;
    if (attemptData.selected_questions && attemptData.selected_questions.length > 0) {
      // Ensure selected_questions is an array (it may be stored as JSON string)
      let selectedQuestions = attemptData.selected_questions;
      if (typeof selectedQuestions === 'string') {
        try {
          selectedQuestions = JSON.parse(selectedQuestions);
        } catch (e) {
          // If parsing fails, fall back to empty array so we use test_id fallback
          selectedQuestions = [];
        }
      }

      if (!Array.isArray(selectedQuestions) || selectedQuestions.length === 0) {
        // Fallback to all questions if selectedQuestions is empty or invalid
        const totalPointsResult = await db.query(
          'SELECT SUM(points) as total FROM questions WHERE test_id = $1',
          [attemptData.test_id]
        );
        totalPoints = totalPointsResult.rows[0].total || 0;
      } else {
        // Use Postgres ANY() with an int[] to avoid ambiguous parameter types
        const totalPointsResult = await db.query(
          'SELECT SUM(points) as total FROM questions WHERE id = ANY($1::int[])',
          [selectedQuestions]
        );
        totalPoints = totalPointsResult.rows[0].total || 0;
      }
    } else {
      // Fallback to all questions (for backward compatibility)
      const totalPointsResult = await db.query(
        'SELECT SUM(points) as total FROM questions WHERE test_id = $1',
        [attemptData.test_id]
      );
      totalPoints = totalPointsResult.rows[0].total || 0;
    }

    const percentage = totalPoints > 0 ? (currentScore / totalPoints) * 100 : 0;

    res.json({
      attempt: {
        ...attemptData,
        score: currentScore,
        total_points: totalPoints, // Use recalculated total points
        percentage: Math.round(percentage)
      },
      answers: processedAnswers
    });
  } catch (error) {
    console.error('Get review error:', error);
    res.status(500).json({ error: 'Failed to get review' });
  }
};

// Get live test attempts (for teachers/admins)
exports.getLiveAttempts = async (req, res) => {
  try {
    const { test_id } = req.query;

    if (!test_id) {
      return res.status(400).json({ error: 'test_id is required' });
    }

    const testId = parseInt(test_id, 10);
    if (isNaN(testId)) {
      return res.status(400).json({ error: 'Invalid test_id' });
    }

    // Debug: Log user info
    console.log('📊 Live Attempts Request - User:', req.user.name, '| Role:', req.user.role);

    // Verify user is teacher or admin (middleware already checks, but double-check)
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      console.log('❌ Access denied for role:', req.user.role);
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check access: Admins can see all, teachers can only see their own tests OR tests created by other teachers
    const testResult = await db.query(`
      SELECT t.*, u.name as creator_name, u.role as creator_role
      FROM tests t
      LEFT JOIN users u ON t.created_by = u.id
      WHERE t.id = $1
    `, [testId]);

    if (testResult.rows.length === 0) {
      return res.status(404).json({ error: 'Test not found' });
    }

    const test = testResult.rows[0];
    
    // Access control logic:
    // 1. Admins can access ALL tests
    // 2. Test owner (creator) can access their own test
    if (req.user.role === 'teacher' && test.created_by !== req.user.id) {
      console.log('❌ Teacher access denied - Not the test owner');
      return res.status(403).json({ 
        error: 'Access denied. You can only view attempters for tests you created.' 
      });
    }

    console.log('✅ Access granted - Role:', req.user.role, '| Test creator:', test.creator_name);

    // Get all attempts for this test with student details
    const attemptsResult = await db.query(`
      SELECT 
        ta.id,
        ta.status,
        ta.score,
        ta.total_points,
        ta.platform,
        ta.browser,
        ta.started_at,
        ta.submitted_at,
        u.id as student_id,
        u.name as student_name,
        u.email as student_email,
        u.roll_number as enrollment_number,
        (
          SELECT COUNT(*) 
          FROM student_answers sa 
          WHERE sa.attempt_id = ta.id
        ) as answered_count,
        (
          SELECT COUNT(*) 
          FROM questions q 
          WHERE q.test_id = ta.test_id
        ) as total_questions
      FROM test_attempts ta
      JOIN users u ON ta.student_id = u.id
      WHERE ta.test_id = $1
      ORDER BY ta.started_at DESC
    `, [testId]);

    res.json({
      attempts: attemptsResult.rows,
      live_count: attemptsResult.rows.filter(a => a.status === 'in_progress').length,
      completed_count: attemptsResult.rows.filter(a => a.status === 'submitted').length,
      total_count: attemptsResult.rows.length
    });
  } catch (error) {
    console.error('Get live attempts error:', error);
    res.status(500).json({ error: 'Failed to get live attempts' });
  }
};

// Get all accessible test reports for teacher/admin
exports.getAccessibleTests = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user.id;

    console.log('📋 Accessible Tests Request - User:', req.user.name, '| Role:', userRole);

    // Verify user is teacher or admin
    if (userRole !== 'teacher' && userRole !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    let testsResult;

    if (userRole === 'admin') {
      // Admins can see ALL tests
      testsResult = await db.query(`
        SELECT 
          t.id,
          t.title,
          t.description,
          t.quiz_type,
          t.test_type,
          t.duration_minutes,
          t.total_marks,
          t.is_active,
          t.created_at,
          t.created_by,
          u.name as creator_name,
          u.role as creator_role,
          c.title as course_title,
          c.code as course_code,
          (SELECT COUNT(*) FROM test_attempts WHERE test_id = t.id) as total_attempts,
          (SELECT COUNT(*) FROM test_attempts WHERE test_id = t.id AND status = 'submitted') as completed_attempts,
          (SELECT COUNT(*) FROM test_attempts WHERE test_id = t.id AND status = 'in_progress') as ongoing_attempts
        FROM tests t
        LEFT JOIN users u ON t.created_by = u.id
        LEFT JOIN courses c ON t.course_id = c.id
        ORDER BY t.created_at DESC
      `);
    } else {
      // Teachers can see only tests they created
      testsResult = await db.query(`
        SELECT 
          t.id,
          t.title,
          t.description,
          t.quiz_type,
          t.test_type,
          t.duration_minutes,
          t.total_marks,
          t.is_active,
          t.created_at,
          t.created_by,
          u.name as creator_name,
          u.role as creator_role,
          c.title as course_title,
          c.code as course_code,
          (SELECT COUNT(*) FROM test_attempts WHERE test_id = t.id) as total_attempts,
          (SELECT COUNT(*) FROM test_attempts WHERE test_id = t.id AND status = 'submitted') as completed_attempts,
          (SELECT COUNT(*) FROM test_attempts WHERE test_id = t.id AND status = 'in_progress') as ongoing_attempts
        FROM tests t
        LEFT JOIN users u ON t.created_by = u.id
        LEFT JOIN courses c ON t.course_id = c.id
        WHERE t.created_by = $1
        ORDER BY t.created_at DESC
      `, [userId]);
    }

    console.log(`✅ Found ${testsResult.rows.length} accessible tests for ${userRole}`);

    res.json({
      tests: testsResult.rows,
      total_count: testsResult.rows.length,
      user_role: userRole
    });
  } catch (error) {
    console.error('Get accessible tests error:', error);
    res.status(500).json({ error: 'Failed to get accessible tests' });
  }
};

// Get detailed test report with all attempts and statistics
exports.getTestReport = async (req, res) => {
  try {
    const { test_id } = req.params;
    const userRole = req.user.role;
    const userId = req.user.id;

    const testId = parseInt(test_id, 10);
    if (isNaN(testId)) {
      return res.status(400).json({ error: 'Invalid test_id' });
    }

    console.log('📊 Test Report Request - Test ID:', testId, '| User:', req.user.name, '| Role:', userRole);

    // Verify user is teacher or admin
    if (userRole !== 'teacher' && userRole !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get test details with creator info
    const testResult = await db.query(`
      SELECT t.*, u.name as creator_name, u.role as creator_role, c.title as course_title
      FROM tests t
      LEFT JOIN users u ON t.created_by = u.id
      LEFT JOIN courses c ON t.course_id = c.id
      WHERE t.id = $1
    `, [testId]);

    if (testResult.rows.length === 0) {
      return res.status(404).json({ error: 'Test not found' });
    }

    const test = testResult.rows[0];

    // Access control: Admin sees all, Test owner sees their own tests
    if (userRole === 'teacher' && test.created_by !== userId) {
      console.log('❌ Teacher access denied - Not the test owner');
      return res.status(403).json({ 
        error: 'Access denied. You can only view reports for tests you created.' 
      });
    }

    // Get all attempts with student details and violations
    const attemptsResult = await db.query(`
      SELECT 
        ta.id,
        ta.status,
        ta.score,
        ta.total_points,
        ROUND((ta.score / NULLIF((SELECT SUM(q.points) FROM questions q WHERE q.test_id = ta.test_id), 0)::numeric) * 100, 2) as percentage,
        ta.platform,
        ta.browser,
        ta.started_at,
        ta.submitted_at,
        ta.violation_count,
        u.id as student_id,
        u.name as student_name,
        u.email as student_email,
        u.roll_number,
        d.name as department_name,
        (
          SELECT COUNT(*) 
          FROM student_answers sa 
          WHERE sa.attempt_id = ta.id
        ) as answered_count,
        (
          SELECT json_agg(json_build_object(
            'violation_type', tv.violation_type,
            'details', tv.details,
            'created_at', tv.created_at
          ) ORDER BY tv.created_at)
          FROM test_violations tv
          WHERE tv.attempt_id = ta.id
        ) as violations
      FROM test_attempts ta
      JOIN users u ON ta.student_id = u.id
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE ta.test_id = $1
      ORDER BY ta.started_at DESC
    `, [testId]);

    // Calculate statistics
    const attempts = attemptsResult.rows;
    const submittedAttempts = attempts.filter(a => a.status === 'submitted');
    const scores = submittedAttempts.map(a => parseFloat(a.score));
    
    const statistics = {
      total_attempts: attempts.length,
      submitted_count: submittedAttempts.length,
      in_progress_count: attempts.filter(a => a.status === 'in_progress').length,
      average_score: scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2) : 0,
      highest_score: scores.length > 0 ? Math.max(...scores) : 0,
      lowest_score: scores.length > 0 ? Math.min(...scores) : 0,
      pass_count: submittedAttempts.filter(a => parseFloat(a.score) >= test.passing_score).length,
      fail_count: submittedAttempts.filter(a => parseFloat(a.score) < test.passing_score).length,
      total_violations: attempts.reduce((sum, a) => sum + (parseInt(a.violation_count) || 0), 0)
    };

    console.log('✅ Test report generated successfully');

    res.json({
      test: {
        ...test,
        question_count: await db.query('SELECT COUNT(*) FROM questions WHERE test_id = $1', [testId]).then(r => r.rows[0].count)
      },
      attempts,
      statistics,
      access_info: {
        can_view: true,
        user_role: userRole,
        is_creator: test.created_by === userId
      }
    });
  } catch (error) {
    console.error('Get test report error:', error);
    res.status(500).json({ error: 'Failed to get test report' });
  }
};

// Log anti-cheating violation
exports.logViolation = async (req, res) => {
  try {
    const { attempt_id } = req.params;
    const { violation_type, details, timestamp } = req.body;
    const student_id = req.user.id;

    const attemptId = parseInt(attempt_id, 10);
    if (isNaN(attemptId)) {
      return res.status(400).json({ error: 'Invalid attempt_id' });
    }

    console.log('⚠️ Violation Logged:', {
      attempt_id: attemptId,
      student_id,
      violation_type,
      details
    });

    // Verify the attempt belongs to this student
    const attemptResult = await db.query(
      'SELECT * FROM test_attempts WHERE id = $1 AND student_id = $2',
      [attemptId, student_id]
    );

    if (attemptResult.rows.length === 0) {
      return res.status(404).json({ error: 'Attempt not found' });
    }

    // Insert violation record
    // Details should be a JSON object for JSONB column
    const detailsJson = typeof details === 'string' 
      ? JSON.stringify({ message: details })
      : JSON.stringify(details);
    
    await db.query(`
      INSERT INTO test_violations (
        attempt_id, violation_type, details, created_at
      )
      VALUES ($1, $2, $3::jsonb, $4)
    `, [attemptId, violation_type, detailsJson, timestamp || new Date().toISOString()]);

    // Update attempt's violation count
    // Also update specific violation type counters
    let specificColumn = '';
    if (violation_type === 'window_switch' || violation_type === 'tab_switch') {
      specificColumn = ', window_switches = COALESCE(window_switches, 0) + 1';
    } else if (violation_type === 'screenshot_attempt') {
      specificColumn = ', screenshot_attempts = COALESCE(screenshot_attempts, 0) + 1';
    } else if (violation_type === 'phone_call') {
      specificColumn = ', phone_calls = COALESCE(phone_calls, 0) + 1';
    }

    await db.query(`
      UPDATE test_attempts 
      SET total_violations = COALESCE(total_violations, 0) + 1${specificColumn}
      WHERE id = $1
    `, [attemptId]);

    console.log('✅ Violation logged and attempt updated');

    res.status(201).json({ 
      message: 'Violation logged successfully',
      violation_type 
    });
  } catch (error) {
    console.error('❌ Log violation error:', error);
    res.status(500).json({ error: 'Failed to log violation' });
  }
};

// Get all attempts for a student on a specific test
exports.getStudentAttempts = async (req, res) => {
  try {
    const { student_id, test_id } = req.params;
    const requesting_user_id = req.user.id;
    const requesting_user_role = req.user.role;

    const studentId = parseInt(student_id, 10);
    if (isNaN(studentId)) {
      return res.status(400).json({ error: 'Invalid student_id' });
    }

    const testId = parseInt(test_id, 10);
    if (isNaN(testId)) {
      return res.status(400).json({ error: 'Invalid test_id' });
    }

    console.log('📊 Student Attempts Request:', {
      student_id: studentId,
      test_id: testId,
      requesting_user: requesting_user_id,
      role: requesting_user_role
    });

    // Access control: Student can only see their own attempts
    // Teachers/Admins can see any student's attempts (with proper test access)
    if (requesting_user_role === 'student' && studentId !== requesting_user_id) {
      return res.status(403).json({ error: 'You can only view your own test attempts' });
    }

    // If teacher, verify they are the test owner
    if (requesting_user_role === 'teacher') {
      const testResult = await db.query(`
        SELECT t.*, u.role as creator_role
        FROM tests t
        LEFT JOIN users u ON t.created_by = u.id
        WHERE t.id = $1
      `, [testId]);

      if (testResult.rows.length === 0) {
        return res.status(404).json({ error: 'Test not found' });
      }

      const test = testResult.rows[0];
      // Teacher must be the test owner
      if (test.created_by !== requesting_user_id) {
        return res.status(403).json({ 
          error: 'Access denied. You can only view reports for tests you created.' 
        });
      }
    }

    // Get all attempts for this student on this test with violation counts
    const attemptsResult = await db.query(`
      WITH numbered_attempts AS (
        SELECT 
          ta.id,
          ta.status,
          ta.score,
          ta.total_points,
          ROUND((ta.score / NULLIF((SELECT SUM(q.points) FROM questions q WHERE q.test_id = ta.test_id), 0)::numeric) * 100, 2) as percentage,
          ta.platform,
          ta.browser,
          ta.started_at,
          ta.submitted_at,
          ROW_NUMBER() OVER (ORDER BY ta.started_at ASC) as attempt_number
        FROM test_attempts ta
        WHERE ta.student_id = $1 AND ta.test_id = $2
      )
      SELECT 
        na.*,
        COALESCE(COUNT(tv.id), 0) as violation_count
      FROM numbered_attempts na
      LEFT JOIN test_violations tv ON na.id = tv.attempt_id
      GROUP BY na.id, na.status, na.score, na.total_points, na.percentage, 
               na.platform, na.browser, na.started_at, na.submitted_at, na.attempt_number
      ORDER BY na.started_at DESC
    `, [studentId, testId]);

    console.log(`✅ Found ${attemptsResult.rows.length} attempts`);

    res.json({
      attempts: attemptsResult.rows,
      total_attempts: attemptsResult.rows.length,
      best_score: attemptsResult.rows.length > 0 
        ? Math.max(...attemptsResult.rows.map(a => parseFloat(a.percentage) || 0)) 
        : 0
    });
  } catch (error) {
    console.error('Get student attempts error:', error);
    res.status(500).json({ error: 'Failed to get student attempts' });
  }
};

// Get detailed attempt with violations and questions
exports.getAttemptDetail = async (req, res) => {
  try {
    const { attempt_id } = req.params;
    const requesting_user_id = req.user.id;
    const requesting_user_role = req.user.role;

    const attemptId = parseInt(attempt_id, 10);
    if (isNaN(attemptId)) {
      return res.status(400).json({ error: 'Invalid attempt_id' });
    }

    console.log('📄 Attempt Detail Request:', {
      attempt_id: attemptId,
      requesting_user: requesting_user_id,
      role: requesting_user_role
    });

    // Get attempt details with correct attempt number
    const attemptResult = await db.query(`
      WITH attempt_data AS (
        SELECT 
          ta.id,
          ta.test_id,
          ta.student_id,
          ta.status,
          ta.score,
          ta.total_points,
          ROUND((ta.score / NULLIF((SELECT SUM(q.points) FROM questions q WHERE q.test_id = ta.test_id), 0)::numeric) * 100, 2) as percentage,
          ta.platform,
          ta.browser,
          ta.started_at,
          ta.submitted_at,
          (SELECT COUNT(*) FROM test_violations WHERE attempt_id = ta.id) as violation_count,
          (SELECT COUNT(*) FROM questions WHERE test_id = ta.test_id) as total_questions,
          (SELECT COUNT(DISTINCT question_id) FROM student_answers WHERE attempt_id = ta.id) as questions_attempted
        FROM test_attempts ta
        WHERE ta.id = $1
      )
      SELECT 
        ad.*,
        (
          SELECT ROW_NUMBER() OVER (ORDER BY ta2.started_at ASC)
          FROM test_attempts ta2
          WHERE ta2.student_id = ad.student_id 
          AND ta2.test_id = ad.test_id 
          AND ta2.id = ad.id
        ) as attempt_number
      FROM attempt_data ad
    `, [attemptId]);

    if (attemptResult.rows.length === 0) {
      return res.status(404).json({ error: 'Attempt not found' });
    }

    const attempt = attemptResult.rows[0];

    // Access control
    if (requesting_user_role === 'student') {
      // Student can only view their own attempts
      if (attempt.student_id !== requesting_user_id) {
        return res.status(403).json({ error: 'You can only view your own test attempts' });
      }
    } else if (requesting_user_role === 'teacher') {
      // Teacher must be the test owner
      const testResult = await db.query(`
        SELECT t.*, u.role as creator_role
        FROM tests t
        LEFT JOIN users u ON t.created_by = u.id
        WHERE t.id = $1
      `, [attempt.test_id]);

      if (testResult.rows.length === 0) {
        return res.status(404).json({ error: 'Test not found' });
      }

      const test = testResult.rows[0];
      if (test.created_by !== requesting_user_id) {
        return res.status(403).json({ 
          error: 'Access denied. You can only view attempts for tests you created.' 
        });
      }
    }

    // Get violations for this attempt
    const violationsResult = await db.query(`
      SELECT 
        id,
        violation_type,
        details,
        created_at
      FROM test_violations
      WHERE attempt_id = $1
      ORDER BY created_at DESC
    `, [attemptId]);

    console.log(`✅ Found ${violationsResult.rows.length} violations`);

    res.json({
      ...attempt,
      violations: violationsResult.rows
    });
  } catch (error) {
    console.error('Get attempt detail error:', error);
    res.status(500).json({ error: 'Failed to get attempt details' });
  }
};

