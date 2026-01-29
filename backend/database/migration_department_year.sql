-- Migration: Add Departments and Academic Years Management
-- Date: 2024-10-17
-- Purpose: Update database schema to support department and year management system

-- 1. Ensure departments table exists with correct structure
CREATE TABLE IF NOT EXISTS departments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create academic_years table
CREATE TABLE IF NOT EXISTS academic_years (
  id SERIAL PRIMARY KEY,
  year VARCHAR(20) NOT NULL UNIQUE,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Update courses table to use year_id instead of semester/academic_year
-- First, add the year_id column if it doesn't exist
ALTER TABLE courses ADD COLUMN IF NOT EXISTS year_id INTEGER REFERENCES academic_years(id);

-- Backup old semester/academic_year data (optional - you can remove these columns later)
-- ALTER TABLE courses DROP COLUMN IF EXISTS semester;
-- ALTER TABLE courses DROP COLUMN IF EXISTS academic_year;

-- 4. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_courses_year_id ON courses(year_id);
CREATE INDEX IF NOT EXISTS idx_courses_department_id ON courses(department_id);
CREATE INDEX IF NOT EXISTS idx_academic_years_is_active ON academic_years(is_active);

-- 5. Insert sample departments (modify as needed)
INSERT INTO departments (name, code, description) VALUES
  ('Computer Science & Engineering', 'CSE', 'Department of Computer Science and Engineering'),
  ('Electronics & Communication', 'ECE', 'Department of Electronics and Communication Engineering'),
  ('Mechanical Engineering', 'ME', 'Department of Mechanical Engineering'),
  ('Civil Engineering', 'CE', 'Department of Civil Engineering'),
  ('Information Technology', 'IT', 'Department of Information Technology')
ON CONFLICT (code) DO NOTHING;

-- 6. Insert sample academic years (modify as needed)
INSERT INTO academic_years (year, start_date, end_date, is_active) VALUES
  ('2024-2025', '2024-09-01', '2025-06-30', true),
  ('2023-2024', '2023-09-01', '2024-06-30', false),
  ('2025-2026', '2025-09-01', '2026-06-30', false)
ON CONFLICT (year) DO NOTHING;

-- 7. Ensure only one academic year is active
UPDATE academic_years 
SET is_active = false 
WHERE year != '2024-2025';

UPDATE academic_years 
SET is_active = true 
WHERE year = '2024-2025';

-- 8. Verify migration
SELECT 'Departments count: ' || COUNT(*) FROM departments;
SELECT 'Academic years count: ' || COUNT(*) FROM academic_years;
SELECT 'Active year: ' || year FROM academic_years WHERE is_active = true;

-- Migration complete!
