const jwt = require('jsonwebtoken');
const db = require('../config/database');

const auth = async (req, res, next) => {
  try {
    // Check for token in cookies first, then Authorization header
    let token = req.cookies?.token;
    
    if (!token) {
      token = req.header('Authorization')?.replace('Bearer ', '');
    }

    if (!token) {
      return res.status(401).json({ error: 'No authentication token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await db.query(
      'SELECT id, email, name, role FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = result.rows[0];
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Please authenticate' });
  }
};

const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    console.log('🔐 Role Check - User role:', req.user.role, '| Allowed roles:', allowedRoles);

    if (!allowedRoles.includes(req.user.role)) {
      console.log('❌ Role check failed - User:', req.user.name, 'has role:', req.user.role);
      return res.status(403).json({ 
        error: 'Access denied. Insufficient permissions.' 
      });
    }

    console.log('✅ Role check passed');
    next();
  };
};

module.exports = { auth, checkRole };
