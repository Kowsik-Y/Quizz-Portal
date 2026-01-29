const express = require('express');
const router = express.Router();
const violationController = require('../controllers/violationController');
const { auth } = require('../middleware/auth');

// Record a single violation
router.post('/record', auth, violationController.recordViolation);

// Record multiple violations at once
router.post('/bulk', auth, violationController.recordBulkViolations);

// Get violations for a specific attempt
router.get('/attempt/:attemptId', auth, violationController.getAttemptViolations);

// Get all violations for a test (teachers/admins only)
router.get('/test/:testId', auth, violationController.getTestViolations);

// Get violations for a specific user (admins only or own violations)
router.get('/user/:userId', auth, violationController.getUserViolations);

module.exports = router;
