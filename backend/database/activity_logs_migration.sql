-- Activity Logs Table Migration
-- This table stores all system activity for audit and monitoring purposes

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(255) NOT NULL,
  action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('login', 'logout', 'create', 'edit', 'delete', 'error', 'success', 'access')),
  details TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action_type ON activity_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_created ON activity_logs(user_id, created_at DESC);

-- Insert sample activity logs for testing
INSERT INTO activity_logs (user_id, action, action_type, details, ip_address, created_at) VALUES
-- Login activities
((SELECT id FROM users WHERE email = 'admin@quiz.com'), 'User Login', 'login', 'Successful admin login', '192.168.1.100', NOW() - INTERVAL '5 minutes'),
((SELECT id FROM users WHERE email = 'teacher@quiz.com'), 'User Login', 'login', 'Successful teacher login', '192.168.1.101', NOW() - INTERVAL '2 hours'),
((SELECT id FROM users WHERE email = 'student@quiz.com'), 'User Login', 'login', 'Successful student login', '192.168.1.102', NOW() - INTERVAL '1 day'),

-- Course activities
((SELECT id FROM users WHERE email = 'admin@quiz.com'), 'Created Course', 'create', 'Created new course: Data Structures', '192.168.1.100', NOW() - INTERVAL '3 hours'),
((SELECT id FROM users WHERE email = 'teacher@quiz.com'), 'Updated Course', 'edit', 'Modified course content: Web Development', '192.168.1.101', NOW() - INTERVAL '5 hours'),
((SELECT id FROM users WHERE email = 'admin@quiz.com'), 'Deleted Course', 'delete', 'Removed outdated course: Old Java Programming', '192.168.1.100', NOW() - INTERVAL '1 day'),

-- Test activities
((SELECT id FROM users WHERE email = 'teacher@quiz.com'), 'Created Test', 'create', 'Created new test: Midterm Exam', '192.168.1.101', NOW() - INTERVAL '6 hours'),
((SELECT id FROM users WHERE email = 'teacher@quiz.com'), 'Updated Test', 'edit', 'Modified test questions: Final Exam', '192.168.1.101', NOW() - INTERVAL '8 hours'),
((SELECT id FROM users WHERE email = 'admin@quiz.com'), 'Deleted Test', 'delete', 'Removed expired test', '192.168.1.100', NOW() - INTERVAL '2 days'),

-- User management activities
((SELECT id FROM users WHERE email = 'admin@quiz.com'), 'Created User', 'create', 'Added new student account', '192.168.1.100', NOW() - INTERVAL '4 hours'),
((SELECT id FROM users WHERE email = 'admin@quiz.com'), 'Updated User', 'edit', 'Modified user role: student to teacher', '192.168.1.100', NOW() - INTERVAL '7 hours'),
((SELECT id FROM users WHERE email = 'admin@quiz.com'), 'Deleted User', 'delete', 'Removed inactive user account', '192.168.1.100', NOW() - INTERVAL '3 days'),

-- Department activities
((SELECT id FROM users WHERE email = 'admin@quiz.com'), 'Created Department', 'create', 'Added new department: Data Science', '192.168.1.100', NOW() - INTERVAL '10 minutes'),
((SELECT id FROM users WHERE email = 'admin@quiz.com'), 'Updated Department', 'edit', 'Renamed department: CS to Computer Science', '192.168.1.100', NOW() - INTERVAL '1 day'),

-- System activities
((SELECT id FROM users WHERE email = 'admin@quiz.com'), 'Database Backup', 'success', 'Successfully backed up database', '192.168.1.100', NOW() - INTERVAL '12 hours'),
((SELECT id FROM users WHERE email = 'admin@quiz.com'), 'System Settings Updated', 'edit', 'Modified system configuration', '192.168.1.100', NOW() - INTERVAL '2 days'),

-- Error activities
(NULL, 'Failed Login Attempt', 'error', 'Invalid credentials for: unknown@quiz.com', '192.168.1.200', NOW() - INTERVAL '30 minutes'),
(NULL, 'Database Error', 'error', 'Connection timeout during query execution', '192.168.1.100', NOW() - INTERVAL '4 days'),
((SELECT id FROM users WHERE email = 'student@quiz.com'), 'Access Denied', 'error', 'Attempted to access admin panel', '192.168.1.102', NOW() - INTERVAL '1 hour'),

-- Recent activities
((SELECT id FROM users WHERE email = 'admin@quiz.com'), 'Viewed Analytics', 'access', 'Accessed analytics dashboard', '192.168.1.100', NOW() - INTERVAL '15 minutes'),
((SELECT id FROM users WHERE email = 'admin@quiz.com'), 'Exported Report', 'success', 'Generated and downloaded analytics report', '192.168.1.100', NOW() - INTERVAL '20 minutes'),
((SELECT id FROM users WHERE email = 'teacher@quiz.com'), 'Created Question', 'create', 'Added 5 new questions to test pool', '192.168.1.101', NOW() - INTERVAL '45 minutes');

-- Create a function to automatically log certain activities (optional but recommended)
CREATE OR REPLACE FUNCTION log_activity(
  p_user_id INTEGER,
  p_action VARCHAR(255),
  p_action_type VARCHAR(50),
  p_details TEXT DEFAULT NULL,
  p_ip_address VARCHAR(45) DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
  new_log_id INTEGER;
BEGIN
  INSERT INTO activity_logs (user_id, action, action_type, details, ip_address)
  VALUES (p_user_id, p_action, p_action_type, p_details, p_ip_address)
  RETURNING id INTO new_log_id;
  
  RETURN new_log_id;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE activity_logs IS 'Stores all system activity for audit trail and monitoring';
COMMENT ON COLUMN activity_logs.user_id IS 'User who performed the action (NULL for system actions)';
COMMENT ON COLUMN activity_logs.action IS 'Description of the action performed';
COMMENT ON COLUMN activity_logs.action_type IS 'Type of action: login, logout, create, edit, delete, error, success, access';
COMMENT ON COLUMN activity_logs.details IS 'Additional details about the action';
COMMENT ON COLUMN activity_logs.ip_address IS 'IP address from which the action was performed';
COMMENT ON COLUMN activity_logs.user_agent IS 'Browser/device user agent string';
COMMENT ON COLUMN activity_logs.created_at IS 'Timestamp when the action occurred';

-- Display success message
DO $$
BEGIN
  RAISE NOTICE 'Activity logs table created successfully with sample data!';
  RAISE NOTICE 'Total logs inserted: %', (SELECT COUNT(*) FROM activity_logs);
END $$;
