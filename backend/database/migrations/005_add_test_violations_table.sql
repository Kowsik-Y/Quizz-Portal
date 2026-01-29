-- Migration: Create test_violations table to track anti-cheating violations
-- Created: 2024
-- Description: Tracks window switches, screenshot attempts, phone calls during tests

-- Create test_violations table
CREATE TABLE IF NOT EXISTS test_violations (
  id SERIAL PRIMARY KEY,
  attempt_id INTEGER REFERENCES test_attempts(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  test_id INTEGER REFERENCES tests(id) ON DELETE CASCADE,
  violation_type VARCHAR(50) NOT NULL CHECK (violation_type IN ('window_switch', 'screenshot_attempt', 'phone_call', 'tab_switch', 'copy_paste', 'other')),
  violation_count INTEGER DEFAULT 1,
  details JSONB, -- Additional context: {"timestamp": "...", "duration": "...", "caller_number": "..."}
  severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_violations_attempt ON test_violations(attempt_id);
CREATE INDEX IF NOT EXISTS idx_violations_user ON test_violations(user_id);
CREATE INDEX IF NOT EXISTS idx_violations_test ON test_violations(test_id);
CREATE INDEX IF NOT EXISTS idx_violations_type ON test_violations(violation_type);

-- Add comments
COMMENT ON TABLE test_violations IS 'Tracks anti-cheating violations during test attempts';
COMMENT ON COLUMN test_violations.violation_type IS 'Type of violation: window_switch, screenshot_attempt, phone_call, etc.';
COMMENT ON COLUMN test_violations.violation_count IS 'Number of times this violation occurred';
COMMENT ON COLUMN test_violations.details IS 'Additional context as JSON (timestamps, duration, etc.)';
COMMENT ON COLUMN test_violations.severity IS 'Severity level: low, medium, high, critical';

-- Add violation summary columns to test_attempts table
ALTER TABLE test_attempts 
ADD COLUMN IF NOT EXISTS total_violations INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS window_switches INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS screenshot_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS phone_calls INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS violation_flags JSONB DEFAULT '{}';

-- Add comments for new columns
COMMENT ON COLUMN test_attempts.total_violations IS 'Total number of violations during this attempt';
COMMENT ON COLUMN test_attempts.window_switches IS 'Count of window/tab switches';
COMMENT ON COLUMN test_attempts.screenshot_attempts IS 'Count of screenshot attempts';
COMMENT ON COLUMN test_attempts.phone_calls IS 'Count of phone calls received/made';
COMMENT ON COLUMN test_attempts.violation_flags IS 'JSON flags for various violation types';
