const db = require('../config/database');

// Get all courses (with optional department filter)
exports.getAllCourses = async (req, res) => {
  try {
    const { department_id, include_inactive } = req.query;
    
    // Teachers and admins can see all courses (including inactive)
    // Students only see active courses
    const userRole = req.user?.role || 'student';
    const isTeacherOrAdmin = userRole === 'teacher' || userRole === 'admin';
    const showInactive = include_inactive === 'true' && isTeacherOrAdmin;
    
    console.log('getAllCourses - User info:', { 
      userId: req.user?.id,
      userRole, 
      isTeacherOrAdmin, 
      include_inactive,
      showInactive 
    });
    
    let query = `
      SELECT c.*, u.name as teacher_name,
        d.name as department_name, d.code as department_code,
        ay.year as academic_year,
        (SELECT COUNT(*) FROM tests WHERE course_id = c.id) as test_count
      FROM courses c
      LEFT JOIN users u ON c.teacher_id = u.id
      LEFT JOIN departments d ON c.department_id = d.id
      LEFT JOIN academic_years ay ON c.year_id = ay.id
      WHERE 1=1
    `;
    
    // Students only see active courses
    // Teachers/Admins see all courses if include_inactive=true
    if (!isTeacherOrAdmin || !showInactive) {
      query += ' AND c.is_active = true';
    }
    
    const params = [];
    
    // Filter by department if provided
    if (department_id) {
      params.push(department_id);
      query += ` AND c.department_id = $${params.length}`;
    }
    
    query += ' ORDER BY c.created_at DESC';
    
    const result = await db.query(query, params);

    res.json({ courses: result.rows });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
};

// Get course by ID
exports.getCourseById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(`
      SELECT c.*, u.name as teacher_name,
        d.name as department_name, d.code as department_code,
        ay.year as academic_year
      FROM courses c
      LEFT JOIN users u ON c.teacher_id = u.id
      LEFT JOIN departments d ON c.department_id = d.id
      LEFT JOIN academic_years ay ON c.year_id = ay.id
      WHERE c.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Get tests for this course
    // Teachers and admins see all tests (including inactive)
    // Students only see active tests
    const userRole = req.user?.role || 'student';
    const isTeacherOrAdmin = userRole === 'teacher' || userRole === 'admin';
    
    let testsQuery = `
      SELECT id, title, description, quiz_type, test_type, duration_minutes, passing_score, total_marks, is_active
      FROM tests
      WHERE course_id = $1
    `;
    
    // Students only see active tests
    if (!isTeacherOrAdmin) {
      testsQuery += ' AND is_active = true';
    }
    
    testsQuery += ' ORDER BY created_at DESC';
    
    const tests = await db.query(testsQuery, [id]);

    res.json({
      course: result.rows[0],
      tests: tests.rows
    });
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({ error: 'Failed to fetch course' });
  }
};

// Create course (teacher/admin only)
exports.createCourse = async (req, res) => {
  try {
    const { title, description, code, department_id, year_id } = req.body;
    const teacherId = req.user.id;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    // Use teacher's department if not provided
    let finalDepartmentId = department_id;
    if (!finalDepartmentId) {
      const userResult = await db.query('SELECT department_id FROM users WHERE id = $1', [teacherId]);
      finalDepartmentId = userResult.rows[0]?.department_id || 1;
    }

    const result = await db.query(`
      INSERT INTO courses (title, description, code, teacher_id, department_id, year_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [title, description, code, teacherId, finalDepartmentId, year_id || null]);

    res.status(201).json({
      message: 'Course created successfully',
      course: result.rows[0]
    });
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ error: 'Failed to create course' });
  }
};

// Update course
exports.updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, code, department_id, year_id, is_active } = req.body;

    const result = await db.query(`
      UPDATE courses
      SET title = COALESCE($1, title),
          description = COALESCE($2, description),
          code = COALESCE($3, code),
          department_id = COALESCE($4, department_id),
          year_id = COALESCE($5, year_id),
          is_active = COALESCE($6, is_active),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *
    `, [title, description, code, department_id, year_id, is_active, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json({
      message: 'Course updated successfully',
      course: result.rows[0]
    });
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ error: 'Failed to update course' });
  }
};

// Delete course
exports.deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query('DELETE FROM courses WHERE id = $1', [id]);

    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ error: 'Failed to delete course' });
  }
};
