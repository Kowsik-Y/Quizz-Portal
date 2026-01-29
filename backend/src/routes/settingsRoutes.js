const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { auth, checkRole } = require('../middleware/auth');

// Apply auth and admin role check to all routes
router.use(auth);
router.use(checkRole('admin'));

// Get system settings
router.get('/', async (req, res) => {
  try {
    // In a real app, you'd store these in a settings table
    // For now, return default settings
    const settings = {
      // General Settings
      siteName: 'Quiz Portal',
      siteDescription: 'Online Quiz and Test Management System',
      maintenanceMode: false,
      
      // Email Settings
      emailEnabled: true,
      smtpHost: 'smtp.gmail.com',
      smtpPort: '587',
      smtpUser: 'noreply@quizportal.com',
      
      // Notification Settings
      enableEmailNotifications: true,
      enablePushNotifications: false,
      notifyOnNewUser: true,
      notifyOnTestSubmission: true,
      
      // Security Settings
      requireEmailVerification: false,
      sessionTimeout: 30,
      maxLoginAttempts: 5,
      passwordMinLength: 8,
      maxDevicesPerUser: 3,
      
      // Performance Settings
      apiRateLimit: 100,
      enableCaching: true,
      cacheDuration: 3600,
    };

    res.json({ settings });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update system settings
router.put('/', async (req, res) => {
  try {
    const settings = req.body;

    // In a real app, you'd save these to a database
    // For now, just log and return success
    console.log('Settings updated:', settings);

    // You could create a settings table:
    // CREATE TABLE system_settings (
    //   id SERIAL PRIMARY KEY,
    //   key VARCHAR(100) UNIQUE NOT NULL,
    //   value TEXT,
    //   updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    // );

    // Then save each setting:
    // for (const [key, value] of Object.entries(settings)) {
    //   await pool.query(`
    //     INSERT INTO system_settings (key, value)
    //     VALUES ($1, $2)
    //     ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP
    //   `, [key, JSON.stringify(value)]);
    // }

    res.json({ message: 'Settings updated successfully', settings });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Reset settings to defaults
router.post('/reset', async (req, res) => {
  try {
    const defaultSettings = {
      siteName: 'Quiz Portal',
      siteDescription: 'Online Quiz and Test Management System',
      maintenanceMode: false,
      emailEnabled: true,
      smtpHost: 'smtp.gmail.com',
      smtpPort: '587',
      smtpUser: 'noreply@quizportal.com',
      enableEmailNotifications: true,
      enablePushNotifications: false,
      notifyOnNewUser: true,
      notifyOnTestSubmission: true,
      requireEmailVerification: false,
      sessionTimeout: 30,
      maxLoginAttempts: 5,
      passwordMinLength: 8,
      apiRateLimit: 100,
      enableCaching: true,
      cacheDuration: 3600,
    };

    // In a real app, you'd delete all settings from the database
    // await pool.query('DELETE FROM system_settings');

    console.log('Settings reset to defaults');

    res.json({ 
      message: 'Settings reset to defaults successfully',
      settings: defaultSettings
    });
  } catch (error) {
    console.error('Reset settings error:', error);
    res.status(500).json({ error: 'Failed to reset settings' });
  }
});

module.exports = router;
