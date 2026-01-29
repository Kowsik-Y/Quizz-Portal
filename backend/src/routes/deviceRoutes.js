const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { getUserDevices, removeDevice, removeAllDevicesExceptCurrent } = require('../middleware/deviceTracker');

// Get user's devices
router.get('/', auth, async (req, res) => {
  try {
    const devices = await getUserDevices(req.user.id);
    res.json({ devices });
  } catch (error) {
    console.error('Get devices error:', error);
    res.status(500).json({ error: 'Failed to fetch devices' });
  }
});

// Remove a specific device
router.delete('/:deviceId', auth, async (req, res) => {
  try {
    const { deviceId } = req.params;
    await removeDevice(req.user.id, deviceId);
    res.json({ message: 'Device removed successfully' });
  } catch (error) {
    console.error('Remove device error:', error);
    res.status(500).json({ error: 'Failed to remove device' });
  }
});

// Remove all devices except current
router.post('/remove-all-except-current', auth, async (req, res) => {
  try {
    const currentUserAgent = req.headers['user-agent'];
    await removeAllDevicesExceptCurrent(req.user.id, currentUserAgent);
    res.json({ message: 'All other devices logged out successfully' });
  } catch (error) {
    console.error('Remove all devices error:', error);
    res.status(500).json({ error: 'Failed to remove devices' });
  }
});

module.exports = router;
