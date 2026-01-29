const express = require('express');
const router = express.Router();
const adminNotificationController = require('../controllers/adminNotificationController');
const { auth, checkRole } = require('../middleware/auth');

// All routes require admin authentication
router.use(auth);
router.use(checkRole('admin'));

// Send system announcement
router.post('/announcement', adminNotificationController.sendAnnouncement);

// Create manual notification for specific user
router.post('/manual', adminNotificationController.createManualNotification);

module.exports = router;
