const pool = require('../config/database');
const UAParser = require('ua-parser-js');

/**
 * Extract IP address from request
 */
const getIpAddress = (req) => {
  let ip = req.headers['x-forwarded-for'] || 
           req.headers['x-real-ip'] ||
           req.connection?.remoteAddress || 
           req.socket?.remoteAddress ||
           req.ip;
  
  if (ip === '::1' || ip === '::ffff:127.0.0.1') {
    ip = '127.0.0.1';
  }
  
  if (ip && ip.includes(',')) {
    ip = ip.split(',')[0].trim();
  }
  
  if (ip && ip.startsWith('::ffff:')) {
    ip = ip.substring(7);
  }
  
  return ip || 'Unknown';
};

/**
 * Parse user agent to extract device info
 */
const parseUserAgent = (userAgent) => {
  // Handle empty or missing user agent
  if (!userAgent || userAgent === 'Unknown') {
    return {
      browser: 'Mobile App',
      browserVersion: '',
      os: 'Unknown',
      osVersion: '',
      deviceType: 'mobile',
      deviceVendor: '',
      deviceModel: ''
    };
  }

  // Check if it's our custom mobile app user agent
  // Format: QuizPortal/1.0 (Android 13; Samsung SM-G991B) Expo/50.0.0
  if (userAgent.includes('QuizPortal')) {
    const androidMatch = userAgent.match(/Android\s+([\d.]+);?\s*([^)]*)/);
    const iosMatch = userAgent.match(/iOS\s+([\d.]+);?\s*([^)]*)/);
    
    if (androidMatch) {
      return {
        browser: 'Quiz Portal App',
        browserVersion: '1.0',
        os: 'Android',
        osVersion: androidMatch[1] || '',
        deviceType: 'mobile',
        deviceVendor: '',
        deviceModel: androidMatch[2]?.trim() || 'Android Device'
      };
    }
    
    if (iosMatch) {
      return {
        browser: 'Quiz Portal App',
        browserVersion: '1.0',
        os: 'iOS',
        osVersion: iosMatch[1] || '',
        deviceType: 'mobile',
        deviceVendor: 'Apple',
        deviceModel: iosMatch[2]?.trim() || 'iPhone'
      };
    }
  }

  // Use UAParser for standard user agents
  const parser = new UAParser(userAgent);
  const result = parser.getResult();
  
  // Provide better defaults
  return {
    browser: result.browser.name || 'Mobile App',
    browserVersion: result.browser.version || '',
    os: result.os.name || 'Unknown',
    osVersion: result.os.version || '',
    deviceType: result.device.type || (result.os.name === 'Android' || result.os.name === 'iOS' ? 'mobile' : 'desktop'),
    deviceVendor: result.device.vendor || '',
    deviceModel: result.device.model || ''
  };
};

/**
 * Generate device name from parsed info
 */
const generateDeviceName = (deviceInfo) => {
  // If we have vendor and model (e.g., "Samsung SM-G991B")
  if (deviceInfo.deviceModel && deviceInfo.deviceVendor) {
    return `${deviceInfo.deviceVendor} ${deviceInfo.deviceModel}`;
  }
  
  // If we only have model
  if (deviceInfo.deviceModel && deviceInfo.deviceModel !== 'Unknown Device') {
    return deviceInfo.deviceModel;
  }
  
  // For mobile apps without specific device info
  if (deviceInfo.browser === 'Quiz Portal App' || deviceInfo.browser === 'Mobile App') {
    if (deviceInfo.os === 'Android') {
      return 'Android Device';
    }
    if (deviceInfo.os === 'iOS') {
      return deviceInfo.deviceModel || 'iPhone';
    }
  }
  
  // Fallback to OS + Browser
  if (deviceInfo.os !== 'Unknown' && deviceInfo.browser !== 'Unknown') {
    return `${deviceInfo.os} - ${deviceInfo.browser}`;
  }
  
  // Last resort fallback
  return deviceInfo.os !== 'Unknown' ? `${deviceInfo.os} Device` : 'Unknown Device';
};

/**
 * Register or update user device
 */
const registerDevice = async (userId, req) => {
  try {
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const ipAddress = getIpAddress(req);
    
    // Debug logging
    console.log('📱 Device Registration:', {
      userId,
      userAgent,
      ipAddress,
      headers: {
        'user-agent': req.headers['user-agent'],
        'x-forwarded-for': req.headers['x-forwarded-for']
      }
    });
    
    const deviceInfo = parseUserAgent(userAgent);
    const deviceName = generateDeviceName(deviceInfo);
    
    console.log('🔍 Parsed Device Info:', {
      deviceName,
      ...deviceInfo
    });
    
    // Check if device already exists
    const existingDevice = await pool.query(
      'SELECT id FROM user_devices WHERE user_id = $1 AND user_agent = $2',
      [userId, userAgent]
    );
    
    if (existingDevice.rows.length > 0) {
      // Update last active time
      await pool.query(
        `UPDATE user_devices 
         SET last_active = CURRENT_TIMESTAMP, ip_address = $1 
         WHERE id = $2`,
        [ipAddress, existingDevice.rows[0].id]
      );
      console.log('✅ Device updated:', existingDevice.rows[0].id);
      return existingDevice.rows[0].id;
    } else {
      // Insert new device
      const result = await pool.query(
        `INSERT INTO user_devices 
         (user_id, device_name, device_type, browser, os, ip_address, user_agent) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         RETURNING id`,
        [
          userId,
          deviceName,
          deviceInfo.deviceType,
          `${deviceInfo.browser} ${deviceInfo.browserVersion}`.trim(),
          `${deviceInfo.os} ${deviceInfo.osVersion}`.trim(),
          ipAddress,
          userAgent
        ]
      );
      console.log('✅ New device registered:', result.rows[0].id);
      return result.rows[0].id;
    }
  } catch (error) {
    console.error('❌ Register device error:', error);
    throw error;
  }
};

/**
 * Check if user has reached device limit
 */
const checkDeviceLimit = async (userId) => {
  try {
    // Default to 3 devices (can be configured in settings)
    const maxDevices = 3;
    
    // Count active devices (active in last 30 days)
    const countResult = await pool.query(
      `SELECT COUNT(*) as count 
       FROM user_devices 
       WHERE user_id = $1 
       AND last_active > NOW() - INTERVAL '30 days'`,
      [userId]
    );
    
    const currentDevices = parseInt(countResult.rows[0].count);
    
    return {
      currentDevices,
      maxDevices,
      isLimitReached: currentDevices >= maxDevices
    };
  } catch (error) {
    console.error('Check device limit error:', error);
    return {
      currentDevices: 0,
      maxDevices: 3,
      isLimitReached: false
    };
  }
};

/**
 * Remove oldest device for user
 */
const removeOldestDevice = async (userId) => {
  try {
    await pool.query(
      `DELETE FROM user_devices 
       WHERE id = (
         SELECT id FROM user_devices 
         WHERE user_id = $1 
         ORDER BY last_active ASC 
         LIMIT 1
       )`,
      [userId]
    );
  } catch (error) {
    console.error('Remove oldest device error:', error);
    throw error;
  }
};

/**
 * Get user's devices
 */
const getUserDevices = async (userId) => {
  try {
    const result = await pool.query(
      `SELECT 
        id,
        device_name,
        device_type,
        browser,
        os,
        ip_address,
        last_active,
        created_at,
        CASE 
          WHEN last_active > NOW() - INTERVAL '5 minutes' THEN 'active'
          WHEN last_active > NOW() - INTERVAL '1 day' THEN 'recent'
          WHEN last_active > NOW() - INTERVAL '7 days' THEN 'inactive'
          ELSE 'expired'
        END as status
       FROM user_devices 
       WHERE user_id = $1 
       ORDER BY last_active DESC`,
      [userId]
    );
    
    return result.rows;
  } catch (error) {
    console.error('Get user devices error:', error);
    return [];
  }
};

/**
 * Remove device
 */
const removeDevice = async (userId, deviceId) => {
  try {
    await pool.query(
      'DELETE FROM user_devices WHERE id = $1 AND user_id = $2',
      [deviceId, userId]
    );
  } catch (error) {
    console.error('Remove device error:', error);
    throw error;
  }
};

/**
 * Remove all devices except current
 */
const removeAllDevicesExceptCurrent = async (userId, currentUserAgent) => {
  try {
    await pool.query(
      'DELETE FROM user_devices WHERE user_id = $1 AND user_agent != $2',
      [userId, currentUserAgent]
    );
  } catch (error) {
    console.error('Remove all devices error:', error);
    throw error;
  }
};

module.exports = {
  registerDevice,
  checkDeviceLimit,
  removeOldestDevice,
  getUserDevices,
  removeDevice,
  removeAllDevicesExceptCurrent,
  getIpAddress,
  parseUserAgent
};
