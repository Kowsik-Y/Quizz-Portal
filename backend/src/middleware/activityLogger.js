const pool = require('../config/database');

/**
 * Activity Logger Middleware
 * Automatically logs user activities to the activity_logs table
 */

/**
 * Log an activity to the database
 * @param {Object} params - Activity parameters
 * @param {number} params.userId - User ID (optional, null for system actions)
 * @param {string} params.action - Action description
 * @param {string} params.actionType - Action type: login, logout, create, edit, delete, error, success, access
 * @param {string} params.details - Additional details
 * @param {string} params.ipAddress - IP address
 * @param {string} params.userAgent - User agent string
 */
const logActivity = async ({ userId, action, actionType, details, ipAddress, userAgent }) => {
  try {
    await pool.query(
      `INSERT INTO activity_logs (user_id, action, action_type, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId || null, action, actionType, details || null, ipAddress || null, userAgent || null]
    );
  } catch (error) {
    console.error('Activity logging error:', error);
    // Don't throw error to prevent breaking the main operation
  }
};

/**
 * Middleware to automatically log authenticated user activities
 * Usage: router.post('/endpoint', auth, logUserActivity('Created something', 'create'), handler)
 */
const logUserActivity = (action, actionType, getDetails) => {
  return async (req, res, next) => {
    // Store the original json and send methods
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);

    // Get IP address from request
    const ipAddress = getIpAddress(req);
    const userAgent = req.headers['user-agent'];

    // Function to log after response
    const logAfterResponse = async (statusCode) => {
      // Only log successful operations (2xx status codes)
      if (statusCode >= 200 && statusCode < 300) {
        try {
          const details = typeof getDetails === 'function' ? getDetails(req, res) : null;
          await logActivity({
            userId: req.user?.id,
            action,
            actionType,
            details,
            ipAddress,
            userAgent
          });
        } catch (error) {
          console.error('Failed to log activity:', error);
        }
      }
    };

    // Override res.json
    res.json = function (data) {
      logAfterResponse(res.statusCode || 200);
      return originalJson(data);
    };

    // Override res.send
    res.send = function (data) {
      logAfterResponse(res.statusCode || 200);
      return originalSend(data);
    };

    next();
  };
};

/**
 * Extract IP address from request
 */
const getIpAddress = (req) => {
  let ip = req.headers['x-forwarded-for'] || 
           req.headers['x-real-ip'] ||
           req.connection?.remoteAddress || 
           req.socket?.remoteAddress ||
           req.ip;
  
  // Handle IPv6 localhost
  if (ip === '::1' || ip === '::ffff:127.0.0.1') {
    ip = '127.0.0.1';
  }
  
  // Extract first IP if multiple (x-forwarded-for can have multiple IPs)
  if (ip && ip.includes(',')) {
    ip = ip.split(',')[0].trim();
  }
  
  // Remove IPv6 prefix if present
  if (ip && ip.startsWith('::ffff:')) {
    ip = ip.substring(7);
  }
  
  return ip || 'Unknown';
};

/**
 * Log login activity
 */
const logLogin = async (req, userId, success = true) => {
  const ipAddress = getIpAddress(req);
  const userAgent = req.headers['user-agent'];

  await logActivity({
    userId: success ? userId : null,
    action: success ? 'User Login' : 'Failed Login Attempt',
    actionType: success ? 'login' : 'error',
    details: success ? 'Successful login' : `Failed login attempt for: ${req.body.email}`,
    ipAddress,
    userAgent
  });
};

/**
 * Log logout activity
 */
const logLogout = async (req) => {
  const ipAddress = getIpAddress(req);
  const userAgent = req.headers['user-agent'];

  await logActivity({
    userId: req.user?.id,
    action: 'User Logout',
    actionType: 'logout',
    details: 'User logged out',
    ipAddress,
    userAgent
  });
};

/**
 * Log system errors
 */
const logError = async (error, req, context = '') => {
  const ipAddress = req ? getIpAddress(req) : 'Unknown';
  const userAgent = req?.headers['user-agent'];

  await logActivity({
    userId: req?.user?.id || null,
    action: 'System Error',
    actionType: 'error',
    details: `${context}: ${error.message}`,
    ipAddress,
    userAgent
  });
};

/**
 * Express error logging middleware
 */
const errorLogger = async (err, req, res, next) => {
  await logError(err, req, 'Unhandled error');
  next(err);
};

module.exports = {
  logActivity,
  logUserActivity,
  logLogin,
  logLogout,
  logError,
  errorLogger
};
