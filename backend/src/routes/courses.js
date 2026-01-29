const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { auth, checkRole } = require('../middleware/auth');

// Protected routes - auth required to check user role
router.get('/', auth, courseController.getAllCourses);
router.get('/:id', auth, courseController.getCourseById);

// Protected routes (teacher/admin only)
router.post('/', auth, checkRole('teacher', 'admin'), courseController.createCourse);
router.put('/:id', auth, checkRole('teacher', 'admin'), courseController.updateCourse);
router.delete('/:id', auth, checkRole('admin'), courseController.deleteCourse);

module.exports = router;
