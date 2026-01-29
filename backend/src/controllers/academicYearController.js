const pool = require('../config/database');

// Get all academic years
exports.getAllAcademicYears = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM academic_years ORDER BY year DESC'
    );
    
    res.json({
      success: true,
      academicYears: result.rows
    });
  } catch (error) {
    console.error('Error fetching academic years:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch academic years'
    });
  }
};

// Get single academic year
exports.getAcademicYear = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM academic_years WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Academic year not found'
      });
    }
    
    res.json({
      success: true,
      academicYear: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching academic year:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch academic year'
    });
  }
};

// Create academic year
exports.createAcademicYear = async (req, res) => {
  try {
    const { year, start_date, end_date, is_active } = req.body;
    
    // Validation
    if (!year) {
      return res.status(400).json({
        success: false,
        error: 'Academic year is required'
      });
    }
    
    // Check if year already exists
    const existing = await pool.query(
      'SELECT id FROM academic_years WHERE year = $1',
      [year]
    );
    
    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Academic year already exists'
      });
    }
    
    // If setting as active, deactivate others
    if (is_active === true) {
      await pool.query(
        'UPDATE academic_years SET is_active = false WHERE is_active = true'
      );
    }
    
    const result = await pool.query(
      `INSERT INTO academic_years (year, start_date, end_date, is_active) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [year, start_date || null, end_date || null, is_active !== undefined ? is_active : true]
    );
    
    res.status(201).json({
      success: true,
      academicYear: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating academic year:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create academic year'
    });
  }
};

// Update academic year
exports.updateAcademicYear = async (req, res) => {
  try {
    const { id } = req.params;
    const { year, start_date, end_date, is_active } = req.body;
    
    // Validation
    if (!year) {
      return res.status(400).json({
        success: false,
        error: 'Academic year is required'
      });
    }
    
    // Check if year already exists for different record
    const existing = await pool.query(
      'SELECT id FROM academic_years WHERE year = $1 AND id != $2',
      [year, id]
    );
    
    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Academic year already exists'
      });
    }
    
    // If setting as active, deactivate others
    if (is_active === true) {
      await pool.query(
        'UPDATE academic_years SET is_active = false WHERE is_active = true AND id != $1',
        [id]
      );
    }
    
    const result = await pool.query(
      `UPDATE academic_years 
       SET year = $1, start_date = $2, end_date = $3, is_active = $4, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $5 
       RETURNING *`,
      [year, start_date || null, end_date || null, is_active !== undefined ? is_active : true, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Academic year not found'
      });
    }
    
    res.json({
      success: true,
      academicYear: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating academic year:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update academic year'
    });
  }
};

// Delete academic year
exports.deleteAcademicYear = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if academic year is in use
    const coursesCheck = await pool.query(
      'SELECT id FROM courses WHERE year_id = $1 LIMIT 1',
      [id]
    );
    
    if (coursesCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete academic year that has courses'
      });
    }
    
    const result = await pool.query(
      'DELETE FROM academic_years WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Academic year not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Academic year deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting academic year:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete academic year'
    });
  }
};
