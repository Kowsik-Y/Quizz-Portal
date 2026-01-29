-- Enhanced Quiz Portal Database Schema with Departments
-- PostgreSQL

-- Drop existing tables (in correct order due to foreign keys)
DROP TABLE IF EXISTS student_answers CASCADE;
DROP TABLE IF EXISTS test_bookings CASCADE;
DROP TABLE IF EXISTS test_attempts CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS tests CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Departments Table
CREATE TABLE departments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  code VARCHAR(10) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users Table with Department and Roll Number
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'teacher', 'student')),
  name VARCHAR(255) NOT NULL,
  roll_number VARCHAR(50), -- For students
  department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
  phone VARCHAR(20),
  avatar_url VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Courses Table with Department
CREATE TABLE courses (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  code VARCHAR(20) UNIQUE NOT NULL,
  department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
  teacher_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  semester VARCHAR(20),
  academic_year VARCHAR(20),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tests/Quizzes Table
CREATE TABLE tests (
  id SERIAL PRIMARY KEY,
  course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  quiz_type VARCHAR(20) NOT NULL CHECK (quiz_type IN ('mcq', 'code', 'mixed')),
  test_type VARCHAR(20) NOT NULL CHECK (test_type IN ('instant', 'booking', 'timed')),
  duration_minutes INTEGER NOT NULL,
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  passing_score INTEGER DEFAULT 60,
  total_marks INTEGER DEFAULT 100,
  platform_restriction VARCHAR(20) DEFAULT 'any' CHECK (platform_restriction IN ('any', 'mobile', 'web')),
  allowed_browsers TEXT[], -- ['chrome', 'firefox', 'safari', 'edge']
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  -- New fields for random question selection and review visibility
  questions_to_ask INTEGER, -- Number of questions to randomly select (null = all questions)
  show_review_to_students BOOLEAN DEFAULT FALSE, -- Whether students can see review/answers
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Questions Table
CREATE TABLE questions (
  id SERIAL PRIMARY KEY,
  test_id INTEGER REFERENCES tests(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type VARCHAR(20) NOT NULL CHECK (question_type IN ('mcq', 'code')),
  options JSONB, -- For MCQ: ["option1", "option2", "option3", "option4"]
  correct_answer TEXT, -- For MCQ
  test_cases JSONB, -- For code: [{"input": "...", "expected_output": "..."}]
  points INTEGER DEFAULT 10,
  difficulty VARCHAR(20) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  order_number INTEGER DEFAULT 1,
  explanation TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Test Attempts Table
CREATE TABLE test_attempts (
  id SERIAL PRIMARY KEY,
  test_id INTEGER REFERENCES tests(id) ON DELETE CASCADE,
  student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted')),
  score DECIMAL(5,2) DEFAULT 0,
  total_points INTEGER,
  platform VARCHAR(20),
  browser VARCHAR(50),
  device_info JSONB,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  submitted_at TIMESTAMP,
  -- New field for random question selection
  selected_questions INTEGER[], -- Array of question IDs randomly selected for this attempt
  UNIQUE(test_id, student_id)
);

-- Student Answers Table
CREATE TABLE student_answers (
  id SERIAL PRIMARY KEY,
  attempt_id INTEGER REFERENCES test_attempts(id) ON DELETE CASCADE,
  question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
  answer TEXT,
  code_submission TEXT,
  is_correct BOOLEAN DEFAULT FALSE,
  is_flagged BOOLEAN DEFAULT FALSE,
  points_earned DECIMAL(5,2) DEFAULT 0,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(attempt_id, question_id)
);

-- Test Bookings Table
CREATE TABLE test_bookings (
  id SERIAL PRIMARY KEY,
  test_id INTEGER REFERENCES tests(id) ON DELETE CASCADE,
  student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  booked_slot TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'booked' CHECK (status IN ('booked', 'cancelled', 'completed')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(test_id, student_id)
);

-- Course Materials Table
CREATE TABLE course_materials (
  id SERIAL PRIMARY KEY,
  course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  material_type VARCHAR(50) DEFAULT 'document' CHECK (material_type IN ('document', 'video', 'link', 'pdf', 'code', 'other')),
  file_url VARCHAR(500),
  content TEXT,
  order_number INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Test Materials Table
CREATE TABLE test_materials (
  id SERIAL PRIMARY KEY,
  test_id INTEGER REFERENCES tests(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  material_type VARCHAR(50) DEFAULT 'document' CHECK (material_type IN ('document', 'video', 'link', 'pdf', 'code', 'other')),
  file_url VARCHAR(500),
  file_size BIGINT,
  content TEXT,
  order_number INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Indexes
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_department ON users(department_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_courses_department ON courses(department_id);
CREATE INDEX idx_courses_teacher ON courses(teacher_id);
CREATE INDEX idx_tests_course ON tests(course_id);
CREATE INDEX idx_questions_test ON questions(test_id);
CREATE INDEX idx_attempts_test ON test_attempts(test_id);
CREATE INDEX idx_attempts_student ON test_attempts(student_id);
CREATE INDEX idx_bookings_test ON test_bookings(test_id);
CREATE INDEX idx_bookings_student ON test_bookings(student_id);
CREATE INDEX idx_materials_course ON course_materials(course_id);
CREATE INDEX idx_materials_test ON test_materials(test_id);

-- Insert Sample Departments
INSERT INTO departments (name, code, description) VALUES
('Computer Science', 'CSE', 'Department of Computer Science and Engineering'),
('Information Technology', 'IT', 'Department of Information Technology'),
('Electronics', 'ECE', 'Department of Electronics and Communication Engineering'),
('Mechanical', 'MECH', 'Department of Mechanical Engineering'),
('Civil', 'CIVIL', 'Department of Civil Engineering');

-- Insert Demo Users with Auto-role Detection Pattern
-- Email pattern: admin@*, teacher@*, rollnumber@* (student)
-- All demo accounts use password: password123

-- Admin (email starts with admin)
INSERT INTO users (email, password, role, name, department_id) VALUES
('admin@quiz.com', '$2a$10$nyYNRNBxMaK64KhqgpU/Ce9vRMB26NjcCuefI6igzHiUz4FIT5.Ie', 'admin', 'System Admin', 1);

-- Teachers (email starts with teacher or contains @dept)
INSERT INTO users (email, password, role, name, department_id) VALUES
('teacher@cse.quiz.com', '$2a$10$nyYNRNBxMaK64KhqgpU/Ce9vRMB26NjcCuefI6igzHiUz4FIT5.Ie', 'teacher', 'Dr. Sarah Johnson', 1),
('teacher@it.quiz.com', '$2a$10$nyYNRNBxMaK64KhqgpU/Ce9vRMB26NjcCuefI6igzHiUz4FIT5.Ie', 'teacher', 'Prof. Michael Chen', 2);

-- Students (email pattern: rollnumber@dept or student@)
INSERT INTO users (email, password, role, name, roll_number, department_id) VALUES
('21cse001@student.com', '$2a$10$nyYNRNBxMaK64KhqgpU/Ce9vRMB26NjcCuefI6igzHiUz4FIT5.Ie', 'student', 'John Smith', '21CSE001', 1),
('21cse002@student.com', '$2a$10$nyYNRNBxMaK64KhqgpU/Ce9vRMB26NjcCuefI6igzHiUz4FIT5.Ie', 'student', 'Emily Davis', '21CSE002', 1),
('21it001@student.com', '$2a$10$nyYNRNBxMaK64KhqgpU/Ce9vRMB26NjcCuefI6igzHiUz4FIT5.Ie', 'student', 'Alex Kumar', '21IT001', 2);

-- Sample Courses
INSERT INTO courses (title, description, code, department_id, teacher_id, semester, academic_year) VALUES
('Data Structures & Algorithms', 'Fundamental data structures and algorithms', 'CSE201', 1, 2, 'Fall', '2024-2025'),
('Web Development', 'Full-stack web development with modern frameworks', 'IT301', 2, 3, 'Fall', '2024-2025'),
('Database Management', 'Relational databases and SQL', 'CSE301', 1, 2, 'Fall', '2024-2025');

-- Sample Test
INSERT INTO tests (course_id, title, description, quiz_type, test_type, duration_minutes, passing_score) VALUES
(1, 'Midterm Assessment - DSA', 'Data Structures and Algorithms midterm test', 'mixed', 'timed', 90, 60);

-- Sample Questions
INSERT INTO questions (test_id, question_text, question_type, options, correct_answer, points) VALUES
(1, 'What is the time complexity of binary search?', 'mcq', '["O(n)", "O(log n)", "O(n^2)", "O(1)"]', 'O(log n)', 10);

INSERT INTO questions (test_id, question_text, question_type, test_cases, points) VALUES
(1, 'Write a function to reverse a string in JavaScript', 'code', '[{"input": "hello", "expected_output": "olleh"}, {"input": "world", "expected_output": "dlrow"}]', 20);

COMMIT;
