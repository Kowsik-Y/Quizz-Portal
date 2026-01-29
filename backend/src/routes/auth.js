const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth, checkRole } = require('../middleware/auth');

// Public routes
router.post('/login', authController.login);
router.get('/departments', authController.getDepartments); // Get departments for dropdown

// Protected routes (Admin only can create users)
router.post('/register', auth, checkRole('admin'), authController.register);
router.get('/me', auth, authController.getMe);
router.post('/logout', auth, authController.logout);

module.exports = router;
