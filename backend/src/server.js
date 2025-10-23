const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
require('dotenv').config();
require('express-async-errors');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const courseRoutes = require('./routes/courses');
const testRoutes = require('./routes/tests');
const questionRoutes = require('./routes/questions');
const attemptRoutes = require('./routes/attempts');
const codeRoutes = require('./routes/code');
const departmentRoutes = require('./routes/departmentRoutes');
const academicYearRoutes = require('./routes/academicYearRoutes');
const materialRoutes = require('./routes/materials');
const bookingRoutes = require('./routes/bookings');
const violationRoutes = require('./routes/violations');
const databaseRoutes = require('./routes/databaseRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const activityLogsRoutes = require('./routes/activityLogsRoutes');
const deviceRoutes = require('./routes/deviceRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

// Winston logger configuration
const logger = winston.createLogger({
  level: isProduction ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'quiz-portal-backend' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (!isProduction) {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProduction ? 100 : 1000, // limit each IP to 100 requests per windowMs in production
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: isProduction ? undefined : false, // Disable CSP in development
}));
app.use(compression()); // Enable gzip compression
app.use(limiter); // Apply rate limiting
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests from multiple frontend URLs (for mobile and web)
    const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:8081').split(',');
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(cookieParser());
app.use(morgan(isProduction ? 'combined' : 'dev')); // Use combined format in production
app.use(express.json({ limit: '10mb' })); // Limit JSON payload size
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Quiz Portal API is running' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/academic-years', academicYearRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/attempts', attemptRoutes);
app.use('/api/code', codeRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/violations', violationRoutes);
app.use('/api/admin/database', databaseRoutes);
app.use('/api/admin/settings', settingsRoutes);
app.use('/api/admin/analytics', analyticsRoutes);
app.use('/api/admin/logs', activityLogsRoutes);
app.use('/api/devices', deviceRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
const server = app.listen(PORT, () => {
  logger.info(`Quiz Portal API Server started`, {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version
  });

  console.log(`
╔═══════════════════════════════════════╗
║      Quiz Portal API Server           ║
║                                       ║
║   📡 Port: ${PORT}                       ║
║   🌍 Environment: ${process.env.NODE_ENV || 'development'}         ║
║   💚 Status: Running                  ║
╚═══════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

module.exports = app;
