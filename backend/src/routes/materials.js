const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middleware/auth');
const db = require('../config/database');

// Get materials for a test
router.get('/test/:test_id', async (req, res) => {
  try {
    const { test_id } = req.params;
    
    const result = await db.query(
      `SELECT tm.*, u.name as uploaded_by_name 
       FROM test_materials tm
       LEFT JOIN users u ON tm.uploaded_by = u.id
       WHERE tm.test_id = $1 AND tm.is_active = true 
       ORDER BY tm.order_number ASC, tm.created_at ASC`,
      [test_id]
    );

    res.json({ materials: result.rows });
  } catch (error) {
    console.error('Get test materials error:', error);
    res.status(500).json({ error: 'Failed to fetch test materials' });
  }
});

// Get materials for a course
router.get('/course/:course_id', async (req, res) => {
  try {
    const { course_id } = req.params;
    
    const result = await db.query(
      `SELECT * FROM course_materials 
       WHERE course_id = $1 AND is_active = true 
       ORDER BY order_number ASC, created_at ASC`,
      [course_id]
    );

    res.json({ materials: result.rows });
  } catch (error) {
    console.error('Get materials error:', error);
    res.status(500).json({ error: 'Failed to fetch materials' });
  }
});

// Get single material
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      'SELECT * FROM course_materials WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Material not found' });
    }

    res.json({ material: result.rows[0] });
  } catch (error) {
    console.error('Get material error:', error);
    res.status(500).json({ error: 'Failed to fetch material' });
  }
});

// Create material (teacher/admin only)
router.post('/', auth, checkRole('teacher', 'admin'), async (req, res) => {
  try {
    const {
      course_id,
      test_id,
      title,
      description,
      material_type,
      file_url,
      file_size,
      content,
      order_number
    } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    // Determine if it's a test material or course material
    if (test_id) {
      // Create test material
      const result = await db.query(
        `INSERT INTO test_materials 
         (test_id, title, description, material_type, file_url, file_size, content, order_number, uploaded_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [test_id, title, description, material_type || 'document', file_url, file_size, content, order_number || 1, req.user.id]
      );

      return res.status(201).json({
        message: 'Test material created successfully',
        material: result.rows[0]
      });
    } else if (course_id) {
      // Create course material
      const result = await db.query(
        `INSERT INTO course_materials 
         (course_id, title, description, material_type, file_url, content, order_number)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [course_id, title, description, material_type || 'document', file_url, content, order_number || 1]
      );

      return res.status(201).json({
        message: 'Course material created successfully',
        material: result.rows[0]
      });
    } else {
      return res.status(400).json({ error: 'Either course_id or test_id is required' });
    }
  } catch (error) {
    console.error('Create material error:', error);
    res.status(500).json({ error: 'Failed to create material' });
  }
});

// Update material (teacher/admin only)
router.put('/:id', auth, checkRole('teacher', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      material_type,
      file_url,
      content,
      order_number,
      is_active
    } = req.body;

    const result = await db.query(
      `UPDATE course_materials 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           material_type = COALESCE($3, material_type),
           file_url = COALESCE($4, file_url),
           content = COALESCE($5, content),
           order_number = COALESCE($6, order_number),
           is_active = COALESCE($7, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING *`,
      [title, description, material_type, file_url, content, order_number, is_active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Material not found' });
    }

    res.json({
      message: 'Material updated successfully',
      material: result.rows[0]
    });
  } catch (error) {
    console.error('Update material error:', error);
    res.status(500).json({ error: 'Failed to update material' });
  }
});

// Delete material (admin only)
router.delete('/:id', auth, checkRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'DELETE FROM course_materials WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Material not found' });
    }

    res.json({ message: 'Material deleted successfully' });
  } catch (error) {
    console.error('Delete material error:', error);
    res.status(500).json({ error: 'Failed to delete material' });
  }
});

module.exports = router;
