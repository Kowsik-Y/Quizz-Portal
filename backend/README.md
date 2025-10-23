# Quiz Portal Backend

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

## Database Setup

### Option 1: Neon PostgreSQL (Recommended for Production)

1. **Create a Neon account** and create a new project
2. **Get your connection string** from the Neon dashboard
3. **Update your `.env` file**:
   ```env
   DATABASE_URL=postgresql://neondb_owner:your_password@ep-damp-dew-ad2aseny-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```

4. **Run database setup**:
   ```bash
   # Setup base schema
   node setup-schema.js

   # Run additional migrations
   node run-additional-migrations.js
   ```

### Option 2: Local PostgreSQL

1. **Install PostgreSQL** locally
2. **Create database**:
   ```sql
   createdb quiz_portal
   ```

3. **Configure environment**:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=quiz_portal
   DB_USER=postgres
   DB_PASSWORD=your_password
   ```

4. **Run migrations** as above

### 3. Configure Environment
```bash
# Copy example env file
cp .env.example .env

# Edit .env with your database credentials
```

### 4. Start Server
```bash
# Development
npm run dev

# Production
npm start
```

## 🚀 Cloud Deployment Options

### 🚂 Railway (Highly Recommended)

Railway is the best choice for your Quiz Portal backend:

**Why Railway?**
- ✅ Full Node.js support (no serverless limitations)
- ✅ Built-in PostgreSQL or connect your Neon DB
- ✅ Persistent database connections
- ✅ Auto-scaling and monitoring
- ✅ Git-based deployments

**Quick Start:**
1. Go to [railway.app](https://railway.app)
2. Connect your GitHub repository
3. Railway auto-deploys your backend
4. Set environment variables in dashboard

**See detailed guide**: [RAILWAY_DEPLOYMENT.md](RAILWAY_DEPLOYMENT.md)

### ☁️ Vercel (Alternative)

Vercel works but has limitations for database apps:

**⚠️ Limitations:**
- Serverless execution time limits (10s hobby, 15min pro)
- Database connection pooling issues
- No WebSocket support

**See deployment guide**: [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md)

### Other Cloud Platforms
- **Render**: Similar to Railway, good alternative
- **DigitalOcean App Platform**: Cloud-native deployment
- **Heroku**: Traditional but reliable
- **AWS/GCP/Azure**: Full control, more complex

## Production Deployment (Self-Hosted)

### Prerequisites
- Node.js 16+
- PostgreSQL 12+
- PM2 (Process Manager)

### Production Setup
1. **Install PM2 globally** (if not already installed):
   ```bash
   npm install -g pm2
   ```

2. **Configure Environment**:
   ```bash
   cp .env.example .env
   # Edit .env with production values
   # Ensure NODE_ENV=production
   # Set secure JWT_SECRET (min 32 characters)
   # Configure production database credentials
   ```

3. **Database Setup**:
   ```bash
   # Run all migrations
   node setup-schema.js
   node run-additional-migrations.js
   ```

4. **Start Production Server**:
   ```bash
   # Using PM2
   npm run prod

   # Or using the convenience script
   ./start-production.bat
   ```

### Production Management
```bash
# Check status
pm2 status

# View logs
pm2 logs quiz-portal-backend

# Restart server
npm run prod:restart

# Stop server
npm run prod:stop

# Delete PM2 process
npm run prod:delete
```

### Production Features
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Compression**: Gzip compression enabled
- **Security**: Helmet.js security headers
- **Logging**: Winston structured logging to files
- **Graceful Shutdown**: Proper process termination
- **Process Management**: PM2 for production process management
- **Error Handling**: Comprehensive error handling with logging

### Environment Variables (Production)
```env
NODE_ENV=production
PORT=5000
# For Neon PostgreSQL (recommended)
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
# Alternative: Individual database config
# DB_HOST=your_db_host
# DB_USER=your_db_user
# DB_PASSWORD=your_secure_password
JWT_SECRET=your_32_char_minimum_secret
FRONTEND_URL=https://yourdomain.com
```

### Monitoring
- Logs are stored in `logs/` directory
- PM2 logs available via `pm2 logs`
- Health check endpoint: `GET /health`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Courses
- `GET /api/courses` - Get all courses
- `POST /api/courses` - Create course (teacher/admin)
- `GET /api/courses/:id` - Get course details
- `PUT /api/courses/:id` - Update course
- `DELETE /api/courses/:id` - Delete course

### Tests
- `GET /api/courses/:courseId/tests` - Get tests for course
- `POST /api/courses/:courseId/tests` - Create test
- `GET /api/tests/:id` - Get test details
- `PUT /api/tests/:id` - Update test
- `DELETE /api/tests/:id` - Delete test

### Questions
- `GET /api/tests/:testId/questions` - Get questions
- `POST /api/tests/:testId/questions` - Add question
- `PUT /api/questions/:id` - Update question
- `DELETE /api/questions/:id` - Delete question

### Test Attempts
- `POST /api/tests/:testId/start` - Start test attempt
- `POST /api/attempts/:attemptId/answer` - Submit answer
- `POST /api/attempts/:attemptId/submit` - Submit test
- `GET /api/attempts/:attemptId/review` - Review results

### Code Execution
- `POST /api/code/execute` - Execute code
- `POST /api/code/test` - Run code with test cases

## Tech Stack
- Node.js + Express
- PostgreSQL
- JWT Authentication
- VM2 (Code Execution)
