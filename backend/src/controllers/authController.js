const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { logLogin, logLogout, logActivity } = require('../middleware/activityLogger');
const { registerDevice, checkDeviceLimit, removeOldestDevice } = require('../middleware/deviceTracker');

// Auto-detect role from email pattern
const detectRoleFromEmail = (email) => {
  const lowerEmail = email.toLowerCase();
  
  // Admin: admin@* or *@admin.*
  if (lowerEmail.startsWith('admin@') || lowerEmail.includes('@admin.')) {
    return 'admin';
  }
  
  // Teacher: teacher@* or *@teacher.* or *.teacher@*
  if (lowerEmail.startsWith('teacher@') || 
      lowerEmail.includes('@teacher.') || 
      lowerEmail.includes('.teacher@')) {
    return 'teacher';
  }
  
  // Student: everything else
  return 'student';
};

// Extract roll number from email for students
const extractRollNumber = (email) => {
  // Pattern: 21cse001@student.com -> 21CSE001
  const match = email.match(/^(\d{2}[a-z]+\d+)@/i);
  if (match) {
    return match[1].toUpperCase();
  }
  return null;
};

// Detect department from email
const detectDepartmentFromEmail = (email) => {
  const lowerEmail = email.toLowerCase();
  
  // Department code mapping
  const deptPatterns = {
    'cse': 1,  // Computer Science
    'it': 2,   // Information Technology
    'ece': 3,  // Electronics
    'mech': 4, // Mechanical
    'civil': 5 // Civil
  };
  
  for (const [code, deptId] of Object.entries(deptPatterns)) {
    if (lowerEmail.includes(code)) {
      return deptId;
    }
  }
  
  return 1; // Default to CSE
};

// Register new user - admin can specify role
exports.register = async (req, res) => {
  try {
    let { email, password, name, roll_number, department_id, role } = req.body;

    // Validate input
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password and name are required' });
    }

    // Check if user exists
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Use provided role or default to 'student'
    if (!role) {
      role = 'student';
    }

    // Validate role
    if (!['admin', 'teacher', 'student'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be admin, teacher, or student' });
    }
    
    // Auto-extract roll number for students if not provided
    if (role === 'student' && !roll_number) {
      roll_number = extractRollNumber(email);
    }
    
    // Auto-detect department from email if not provided
    if (!department_id) {
      department_id = detectDepartmentFromEmail(email);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = await db.query(
      `INSERT INTO users (email, password, name, role, roll_number, department_id) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, email, name, role, roll_number, department_id, created_at`,
      [email, hashedPassword, name, role, roll_number, department_id]
    );

    const user = result.rows[0];

    // Get department info
    const deptResult = await db.query(
      'SELECT name, code FROM departments WHERE id = $1',
      [user.department_id]
    );
    const department = deptResult.rows[0];

    // Generate token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        roll_number: user.roll_number,
        department: department
      },
      token
    });

    // Log registration activity
    await logActivity({
      userId: user.id,
      action: 'User Registration',
      actionType: 'create',
      details: `New ${user.role} account created`,
      ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.ip,
      userAgent: req.headers['user-agent']
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 Login attempt:', { email, passwordLength: password?.length });

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user with department info
    const result = await db.query(
      `SELECT u.*, d.name as department_name, d.code as department_code 
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE u.email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      console.log('❌ User not found:', email);
      // Log failed login attempt
      await logLogin(req, null, false);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    console.log('✅ User found:', { email: user.email, role: user.role });

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    console.log('🔑 Password validation:', isValidPassword);
    
    if (!isValidPassword) {
      console.log('❌ Invalid password for:', email);
      // Log failed login attempt
      await logLogin(req, user.id, false);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check device limit
    const deviceLimit = await checkDeviceLimit(user.id);
    
    if (deviceLimit.isLimitReached) {
      // Remove oldest device to make room
      await removeOldestDevice(user.id);
      console.log(`⚠️  Device limit reached for user ${user.id}. Removed oldest device.`);
    }
    
    // Register/update current device
    try {
      await registerDevice(user.id, req);
      console.log(`📱 Device registered for user ${user.id}`);
    } catch (deviceError) {
      console.error('Device registration error:', deviceError);
      // Don't fail login if device registration fails
    }

    // Generate token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        roll_number: user.roll_number,
        department: {
          id: user.department_id,
          name: user.department_name,
          code: user.department_code
        }
      },
      token
    });

    // Log successful login
    await logLogin(req, user.id, true);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

// Get current user
exports.getMe = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT u.id, u.email, u.name, u.role, u.roll_number, u.phone, u.avatar_url,
              d.id as department_id, d.name as department_name, d.code as department_code
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        roll_number: user.roll_number,
        phone: user.phone,
        avatar_url: user.avatar_url,
        department: {
          id: user.department_id,
          name: user.department_name,
          code: user.department_code
        }
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
};

// Logout user
exports.logout = async (req, res) => {
  try {
    // Log the logout activity BEFORE clearing cookie
    if (req.user?.id) {
      await logLogout(req);
    }

    // Clear cookie
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    });

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
};

// Get all departments
exports.getDepartments = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, name, code, description FROM departments ORDER BY name'
    );

    res.json({ departments: result.rows });
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({ error: 'Failed to get departments' });
  }
};
