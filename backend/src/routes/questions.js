const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');
const { auth, checkRole } = require('../middleware/auth');

// Get all questions (Admin only)
router.get('/all', auth, checkRole('admin'), questionController.getAllQuestions);

// Get questions
router.get('/', auth, questionController.getQuestions);

// Protected routes (teacher/admin)
router.post('/', auth, checkRole('teacher', 'admin'), questionController.createQuestion);
router.put('/:id', auth, checkRole('teacher', 'admin'), questionController.updateQuestion);
router.delete('/:id', auth, checkRole('admin'), questionController.deleteQuestion);

module.exports = router;
