@echo off
echo ========================================
echo  Quiz Portal Backend - Production Setup
echo ========================================

echo Installing dependencies...
npm install

echo Running database migrations...
call run-migrations.bat

echo Checking database connection...
node -e "require('./src/config/database'); setTimeout(() => process.exit(0), 2000)"

echo Starting production server with PM2...
npm run prod

echo.
echo Production server started!
echo Check status: pm2 status
echo View logs: pm2 logs quiz-portal-backend
echo Stop server: npm run prod:stop
echo.