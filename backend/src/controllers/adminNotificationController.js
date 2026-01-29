const { createNotification } = require('./notificationController');
const db = require('../config/database');

// Send system announcement to all users or specific role
const sendAnnouncement = async (req, res) => {
  try {
    const { title, message, target_role } = req.body;
    
    // Validate required fields
    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message are required' });
    }
    
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized. Admin access required.' });
    }
    
    // Build query to get target users
    let query = 'SELECT id FROM users WHERE 1=1';
    const params = [];
    
    if (target_role && target_role !== 'all') {
      query += ' AND role = $1';
      params.push(target_role);
    }
    
    const usersResult = await db.query(query, params);
    
    // Send notification to all target users
    const notificationPromises = usersResult.rows.map(user =>
      createNotification(
        user.id,
        'system',
        title,
        message,
        { 
          announcement: true, 
          sent_by: req.user.id,
          sent_by_name: req.user.name,
          target_role: target_role || 'all'
        }
      )
    );
    
    await Promise.all(notificationPromises);
    
    res.json({ 
      message: 'Announcement sent successfully',
      recipient_count: usersResult.rows.length,
      target: target_role || 'all users'
    });
  } catch (error) {
    console.error('Send announcement error:', error);
    res.status(500).json({ error: 'Failed to send announcement' });
  }
};

// Manually create notification for specific user (Admin only)
const createManualNotification = async (req, res) => {
  try {
    const { user_id, type, title, message, data } = req.body;
    
    if (!user_id || !type || !title || !message) {
      return res.status(400).json({ error: 'user_id, type, title, and message are required' });
    }
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    await createNotification(user_id, type, title, message, data);
    
    res.json({ message: 'Notification created successfully' });
  } catch (error) {
    console.error('Create manual notification error:', error);
    res.status(500).json({ error: 'Failed to create notification' });
  }
};

module.exports = {
  sendAnnouncement,
  createManualNotification,
};
