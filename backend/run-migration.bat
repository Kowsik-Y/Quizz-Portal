@echo off
echo ================================================
echo Running Database Migration: Add is_active to users
echo ================================================
echo.

REM Load environment variables
for /f "tokens=1,2 delims==" %%a in (.env) do (
    if "%%a"=="DB_USER" set DB_USER=%%b
    if "%%a"=="DB_PASSWORD" set DB_PASSWORD=%%b
    if "%%a"=="DB_NAME" set DB_NAME=%%b
    if "%%a"=="DB_HOST" set DB_HOST=%%b
    if "%%a"=="DB_PORT" set DB_PORT=%%b
)

echo Database: %DB_NAME%
echo Host: %DB_HOST%:%DB_PORT%
echo User: %DB_USER%
echo.

REM Set PGPASSWORD environment variable
set PGPASSWORD=%DB_PASSWORD%

echo Running migration...
echo.

REM Run the migration
psql -U %DB_USER% -h %DB_HOST% -p %DB_PORT% -d %DB_NAME% -f database\migrations\add_users_is_active.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ================================================
    echo Migration completed successfully!
    echo ================================================
) else (
    echo.
    echo ================================================
    echo Migration failed! Error code: %ERRORLEVEL%
    echo ================================================
)

REM Clear the password from environment
set PGPASSWORD=

pause
