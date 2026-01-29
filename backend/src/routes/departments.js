const express = require('express');
const router = express.Router();
const { getDepartments } = require('../controllers/authController');

// Get all departments (public - for registration dropdown)
router.get('/', getDepartments);

module.exports = router;
