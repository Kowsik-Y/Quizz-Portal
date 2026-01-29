const pool = require('../config/database');

// Get all departments
exports.getAllDepartments = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM departments ORDER BY name ASC'
    );
    
    res.json({
      success: true,
      departments: result.rows
    });
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch departments'
    });
  }
};

// Get single department
exports.getDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM departments WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Department not found'
      });
    }
    
    res.json({
      success: true,
      department: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching department:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch department'
    });
  }
};

// Create department
exports.createDepartment = async (req, res) => {
  try {
    const { name, code, description } = req.body;
    
    // Validation
    if (!name || !code) {
      return res.status(400).json({
        success: false,
        error: 'Department name and code are required'
      });
    }
    
    // Check if code already exists
    const existing = await pool.query(
      'SELECT id FROM departments WHERE code = $1',
      [code]
    );
    
    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Department code already exists'
      });
    }
    
    const result = await pool.query(
      `INSERT INTO departments (name, code, description) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [name, code, description || null]
    );
    
    res.status(201).json({
      success: true,
      department: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating department:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create department'
    });
  }
};

// Update department
exports.updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, description } = req.body;
    
    // Validation
    if (!name || !code) {
      return res.status(400).json({
        success: false,
        error: 'Department name and code are required'
      });
    }
    
    // Check if code already exists for different department
    const existing = await pool.query(
      'SELECT id FROM departments WHERE code = $1 AND id != $2',
      [code, id]
    );
    
    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Department code already exists'
      });
    }
    
    const result = await pool.query(
      `UPDATE departments 
       SET name = $1, code = $2, description = $3, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $4 
       RETURNING *`,
      [name, code, description || null, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Department not found'
      });
    }
    
    res.json({
      success: true,
      department: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating department:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update department'
    });
  }
};

// Delete department
exports.deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if department is in use
    const coursesCheck = await pool.query(
      'SELECT id FROM courses WHERE department_id = $1 LIMIT 1',
      [id]
    );
    
    if (coursesCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete department that has courses'
      });
    }
    
    const result = await pool.query(
      'DELETE FROM departments WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Department not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Department deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting department:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete department'
    });
  }
};
