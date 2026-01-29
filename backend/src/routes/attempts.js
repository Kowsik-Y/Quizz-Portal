const express = require('express');
const router = express.Router();
const attemptController = require('../controllers/attemptController');
const { auth, checkRole } = require('../middleware/auth');

// All routes require authentication
// Students, teachers, and admins can start tests (teachers/admins for testing purposes)
router.post('/start', auth, attemptController.startAttempt);
router.post('/answer', auth, attemptController.submitAnswer);
router.post('/submit', auth, attemptController.submitAttempt);
router.post('/mark-code-correct', auth, attemptController.markCodeAnswerCorrect);
router.get('/:attempt_id/review', auth, attemptController.getAttemptReview);
router.post('/:attempt_id/violation', auth, attemptController.logViolation);

// Student Reports - Students can view their own, Teachers/Admins can view any
router.get('/student/:student_id/test/:test_id', auth, attemptController.getStudentAttempts);
router.get('/detail/:attempt_id', auth, attemptController.getAttemptDetail);

// Teacher/Admin routes - Reports and Analytics
router.get('/live', auth, checkRole('teacher', 'admin'), attemptController.getLiveAttempts);
router.get('/accessible-tests', auth, checkRole('teacher', 'admin'), attemptController.getAccessibleTests);
router.get('/report/:test_id', auth, checkRole('teacher', 'admin'), attemptController.getTestReport);

module.exports = router;
