const db = require('../config/database');

// Get all test materials for a test
exports.getTestMaterials = async (req, res) => {
  try {
    const { testId } = req.params;

    const result = await db.query(`
      SELECT tm.*, u.name as uploaded_by_name
      FROM test_materials tm
      LEFT JOIN users u ON tm.uploaded_by = u.id
      WHERE tm.test_id = $1 AND tm.is_active = true
      ORDER BY tm.order_number ASC, tm.created_at DESC
    `, [testId]);

    res.json({ materials: result.rows });
  } catch (error) {
    console.error('Get test materials error:', error);
    res.status(500).json({ error: 'Failed to fetch materials' });
  }
};

// Get all course materials for a course
exports.getCourseMaterials = async (req, res) => {
  try {
    const { courseId } = req.params;

    const result = await db.query(`
      SELECT *
      FROM course_materials
      WHERE course_id = $1 AND is_active = true
      ORDER BY order_number ASC, created_at DESC
    `, [courseId]);

    res.json({ materials: result.rows });
  } catch (error) {
    console.error('Get course materials error:', error);
    res.status(500).json({ error: 'Failed to fetch materials' });
  }
};

// Create test material
exports.createTestMaterial = async (req, res) => {
  try {
    const {
      test_id,
      title,
      description,
      material_type,
      file_url,
      file_size,
      content,
      order_number
    } = req.body;

    if (!test_id || !title || !material_type) {
      return res.status(400).json({ error: 'Missing required fields: test_id, title, material_type' });
    }

    // Validate material_type
    const validTypes = ['document', 'video', 'link', 'pdf', 'code', 'other'];
    if (!validTypes.includes(material_type)) {
      return res.status(400).json({ error: `Invalid material_type. Must be one of: ${validTypes.join(', ')}` });
    }

    const uploadedBy = req.user ? req.user.id : null;

    const result = await db.query(`
      INSERT INTO test_materials (
        test_id, title, description, material_type,
        file_url, file_size, content, order_number, uploaded_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      test_id, title, description, material_type,
      file_url, file_size, content, order_number || 1, uploadedBy
    ]);

    res.status(201).json({
      message: 'Material added successfully',
      material: result.rows[0]
    });
  } catch (error) {
    console.error('Create test material error:', error);
    res.status(500).json({ error: 'Failed to create material' });
  }
};

// Update test material
exports.updateTestMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      material_type,
      file_url,
      file_size,
      content,
      order_number,
      is_active
    } = req.body;

    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      values.push(title);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (material_type !== undefined) {
      const validTypes = ['document', 'video', 'link', 'pdf', 'code', 'other'];
      if (!validTypes.includes(material_type)) {
        return res.status(400).json({ error: `Invalid material_type. Must be one of: ${validTypes.join(', ')}` });
      }
      updates.push(`material_type = $${paramCount++}`);
      values.push(material_type);
    }
    if (file_url !== undefined) {
      updates.push(`file_url = $${paramCount++}`);
      values.push(file_url);
    }
    if (file_size !== undefined) {
      updates.push(`file_size = $${paramCount++}`);
      values.push(file_size);
    }
    if (content !== undefined) {
      updates.push(`content = $${paramCount++}`);
      values.push(content);
    }
    if (order_number !== undefined) {
      updates.push(`order_number = $${paramCount++}`);
      values.push(order_number);
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(is_active);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await db.query(`
      UPDATE test_materials
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Material not found' });
    }

    res.json({
      message: 'Material updated successfully',
      material: result.rows[0]
    });
  } catch (error) {
    console.error('Update test material error:', error);
    res.status(500).json({ error: 'Failed to update material' });
  }
};

// Delete test material
exports.deleteTestMaterial = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(`
      DELETE FROM test_materials
      WHERE id = $1
      RETURNING *
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Material not found' });
    }

    res.json({ message: 'Material deleted successfully' });
  } catch (error) {
    console.error('Delete test material error:', error);
    res.status(500).json({ error: 'Failed to delete material' });
  }
};

module.exports = exports;
