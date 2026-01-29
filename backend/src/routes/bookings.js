const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middleware/auth');
const db = require('../config/database');

// Get all bookings for a test (teacher/admin)
router.get('/test/:test_id', auth, checkRole('teacher', 'admin'), async (req, res) => {
  try {
    const { test_id } = req.params;
    
    const result = await db.query(
      `SELECT b.*, u.name as student_name, u.email as student_email, u.roll_number
       FROM test_bookings b
       JOIN users u ON b.student_id = u.id
       WHERE b.test_id = $1
       ORDER BY b.booked_slot ASC`,
      [test_id]
    );

    res.json({ bookings: result.rows });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Get student's bookings
router.get('/my-bookings', auth, async (req, res) => {
  try {
    const studentId = req.user.id;
    
    const result = await db.query(
      `SELECT b.*, t.title as test_title, t.duration_minutes, t.total_marks,
              c.title as course_title
       FROM test_bookings b
       JOIN tests t ON b.test_id = t.id
       JOIN courses c ON t.course_id = c.id
       WHERE b.student_id = $1
       ORDER BY b.booked_slot DESC`,
      [studentId]
    );

    res.json({ bookings: result.rows });
  } catch (error) {
    console.error('Get my bookings error:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Book a test slot (student only)
router.post('/', auth, checkRole('student'), async (req, res) => {
  try {
    const { test_id, booked_slot } = req.body;
    const studentId = req.user.id;

    if (!test_id || !booked_slot) {
      return res.status(400).json({ error: 'Test ID and booking slot are required' });
    }

    // Check if test exists and is of type 'booking'
    const testResult = await db.query(
      'SELECT test_type FROM tests WHERE id = $1 AND is_active = true',
      [test_id]
    );

    if (testResult.rows.length === 0) {
      return res.status(404).json({ error: 'Test not found' });
    }

    if (testResult.rows[0].test_type !== 'booking') {
      return res.status(400).json({ error: 'This test does not require booking' });
    }

    // Check if already booked
    const existingBooking = await db.query(
      'SELECT id FROM test_bookings WHERE test_id = $1 AND student_id = $2',
      [test_id, studentId]
    );

    if (existingBooking.rows.length > 0) {
      return res.status(400).json({ error: 'You have already booked this test' });
    }

    // Create booking
    const result = await db.query(
      `INSERT INTO test_bookings (test_id, student_id, booked_slot)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [test_id, studentId, booked_slot]
    );

    res.status(201).json({
      message: 'Test booked successfully',
      booking: result.rows[0]
    });
  } catch (error) {
    console.error('Book test error:', error);
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ error: 'You have already booked this test' });
    }
    res.status(500).json({ error: 'Failed to book test' });
  }
});

// Cancel booking (student)
router.put('/:booking_id/cancel', auth, checkRole('student'), async (req, res) => {
  try {
    const { booking_id } = req.params;
    const studentId = req.user.id;

    const result = await db.query(
      `UPDATE test_bookings 
       SET status = 'cancelled'
       WHERE id = $1 AND student_id = $2 AND status = 'booked'
       RETURNING *`,
      [booking_id, studentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found or already cancelled' });
    }

    res.json({
      message: 'Booking cancelled successfully',
      booking: result.rows[0]
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

// Update booking status (teacher/admin)
router.put('/:booking_id/status', auth, checkRole('teacher', 'admin'), async (req, res) => {
  try {
    const { booking_id } = req.params;
    const { status } = req.body;

    if (!['booked', 'cancelled', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const result = await db.query(
      `UPDATE test_bookings 
       SET status = $1
       WHERE id = $2
       RETURNING *`,
      [status, booking_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json({
      message: 'Booking status updated successfully',
      booking: result.rows[0]
    });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({ error: 'Failed to update booking status' });
  }
});

module.exports = router;
