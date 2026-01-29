const db = require('../config/database');

// Get all notifications for the authenticated user
const getNotifications = async (req, res) => {
  const userId = req.user.id;
  const { limit = 50, offset = 0, is_read } = req.query;

  try {
    let query = 'SELECT * FROM notifications WHERE user_id = $1';
    const params = [userId];
    let paramIndex = 2;

    if (is_read !== undefined) {
      query += ` AND is_read = $${paramIndex}`;
      params.push(is_read === 'true');
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    const notificationsResult = await db.query(query, params);

    // Get unread count
    const unreadResult = await db.query(
      'SELECT COUNT(*) as unread_count FROM notifications WHERE user_id = $1 AND is_read = false',
      [userId]
    );

    res.json({
      notifications: notificationsResult.rows,
      total: notificationsResult.rows.length,
      unread_count: parseInt(unreadResult.rows[0].unread_count),
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

// Get unread count
const getUnreadCount = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await db.query(
      'SELECT COUNT(*) as unread_count FROM notifications WHERE user_id = $1 AND is_read = false',
      [userId]
    );

    res.json({ unread_count: parseInt(result.rows[0].unread_count) });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
};

// Mark notification as read
const markAsRead = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  try {
    const result = await db.query(
      'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
};

// Mark all notifications as read
const markAllAsRead = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await db.query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false',
      [userId]
    );

    res.json({
      message: 'All notifications marked as read',
      updated_count: result.rowCount,
    });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
};

// Delete a notification
const deleteNotification = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  try {
    const result = await db.query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
};

// Delete all notifications
const deleteAll = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await db.query(
      'DELETE FROM notifications WHERE user_id = $1',
      [userId]
    );

    res.json({
      message: 'All notifications deleted',
      deleted_count: result.rowCount,
    });
  } catch (error) {
    console.error('Error deleting all notifications:', error);
    res.status(500).json({ error: 'Failed to delete all notifications' });
  }
};

// Get notification settings
const getSettings = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await db.query(
      'SELECT * FROM notification_settings WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      // Create default settings if they don't exist
      await db.query(
        `INSERT INTO notification_settings (user_id) VALUES ($1)`,
        [userId]
      );

      return res.json({
        settings: {
          emailNotifications: true,
          pushNotifications: true,
          testReminders: true,
          gradeUpdates: true,
          courseUpdates: true,
          systemAnnouncements: true,
          achievementNotifications: true,
          discussionReplies: true,
        },
      });
    }

    const setting = result.rows[0];
    res.json({
      settings: {
        emailNotifications: setting.email_notifications,
        pushNotifications: setting.push_notifications,
        testReminders: setting.test_reminders,
        gradeUpdates: setting.grade_updates,
        courseUpdates: setting.course_updates,
        systemAnnouncements: setting.system_announcements,
        achievementNotifications: setting.achievement_notifications,
        discussionReplies: setting.discussion_replies,
      },
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
};

// Update notification settings
const updateSettings = async (req, res) => {
  const userId = req.user.id;
  const {
    emailNotifications,
    pushNotifications,
    testReminders,
    gradeUpdates,
    courseUpdates,
    systemAnnouncements,
    achievementNotifications,
    discussionReplies,
  } = req.body;

  try {
    // Check if settings exist
    const existing = await db.query(
      'SELECT user_id FROM notification_settings WHERE user_id = $1',
      [userId]
    );

    if (existing.rows.length === 0) {
      // Insert new settings
      await db.query(
        `INSERT INTO notification_settings 
        (user_id, email_notifications, push_notifications, test_reminders, 
         grade_updates, course_updates, system_announcements, 
         achievement_notifications, discussion_replies) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          userId,
          emailNotifications,
          pushNotifications,
          testReminders,
          gradeUpdates,
          courseUpdates,
          systemAnnouncements,
          achievementNotifications,
          discussionReplies,
        ]
      );
    } else {
      // Update existing settings
      await db.query(
        `UPDATE notification_settings SET 
        email_notifications = $1, push_notifications = $2, test_reminders = $3, 
        grade_updates = $4, course_updates = $5, system_announcements = $6, 
        achievement_notifications = $7, discussion_replies = $8, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $9`,
        [
          emailNotifications,
          pushNotifications,
          testReminders,
          gradeUpdates,
          courseUpdates,
          systemAnnouncements,
          achievementNotifications,
          discussionReplies,
          userId,
        ]
      );
    }

    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
};

// Send test notification
const sendTestNotification = async (req, res) => {
  const userId = req.user.id;

  try {
    await db.query(
      `INSERT INTO notifications (user_id, type, title, message, data) 
       VALUES ($1, $2, $3, $4, $5)`,
      [
        userId,
        'system',
        'Test Notification',
        'This is a test notification from Quiz Portal. If you can see this, notifications are working correctly!',
        JSON.stringify({ test: true }),
      ]
    );

    res.json({ message: 'Test notification sent successfully' });
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({ error: 'Failed to send test notification' });
  }
};

// Helper function to create a notification (can be used by other controllers)
const createNotification = async (userId, type, title, message, data = null) => {
  try {
    await db.query(
      `INSERT INTO notifications (user_id, type, title, message, data) 
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, type, title, message, data ? JSON.stringify(data) : null]
    );
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAll,
  getSettings,
  updateSettings,
  sendTestNotification,
  createNotification,
};
