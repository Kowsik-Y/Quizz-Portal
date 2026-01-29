const express = require('express');
const router = express.Router();
const codeController = require('../controllers/codeController');
const { auth } = require('../middleware/auth');

// Execute code
router.post('/execute', auth, codeController.executeCode);
router.post('/test', auth, codeController.testCode);

module.exports = router;
