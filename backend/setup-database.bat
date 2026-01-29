@echo off
echo ============================================
echo Quiz Portal - Database Setup Script
echo ============================================
echo.

REM Set variables
set DB_USER=postgres
set DB_NAME=quiz_portal
set SCHEMA_FILE=database\schema_enhanced.sql

echo Step 1: Creating database (if it doesn't exist)...
psql -U %DB_USER% -p 5433 -c "CREATE DATABASE %DB_NAME%;" 2>nul
if %errorlevel% equ 0 (
    echo Database created successfully!
) else (
    echo Database already exists or creation failed - continuing...
)
echo.

echo Step 2: Running schema file...
psql -U %DB_USER% -p 5433 -d %DB_NAME% -f %SCHEMA_FILE%
if %errorlevel% equ 0 (
    echo.
    echo ============================================
    echo Database setup completed successfully!
    echo ============================================
    echo.
    echo Demo Login Credentials:
    echo.
    echo Admin:
    echo   Email: admin@quiz.com
    echo   Password: password123
    echo.
    echo Teacher:
    echo   Email: teacher@cse.quiz.com
    echo   Password: password123
    echo.
    echo Student:
    echo   Email: 21cse001@student.com
    echo   Password: password123
    echo.
    echo ============================================
) else (
    echo.
    echo ERROR: Schema installation failed!
    echo Please check the error messages above.
    echo.
)

pause
