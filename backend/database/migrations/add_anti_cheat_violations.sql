-- Migration: Add Anti-Cheating Violations Table
-- Created: 2025-10-17
-- Description: Adds table to track anti-cheating violations during test attempts

-- Create test_violations table
CREATE TABLE IF NOT EXISTS test_violations (
  id SERIAL PRIMARY KEY,
  attempt_id INTEGER NOT NULL REFERENCES test_attempts(id) ON DELETE CASCADE,
  violation_type VARCHAR(50) NOT NULL, -- 'window_switch', 'tab_switch', 'screenshot', 'copy', 'paste', 'phone_call', 'visibility_change'
  details TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_violations_attempt_id ON test_violations(attempt_id);
CREATE INDEX IF NOT EXISTS idx_violations_type ON test_violations(violation_type);
CREATE INDEX IF NOT EXISTS idx_violations_created_at ON test_violations(created_at);

-- Add violation_count column to test_attempts if it doesn't exist
ALTER TABLE test_attempts 
ADD COLUMN IF NOT EXISTS violation_count INTEGER DEFAULT 0;

-- Create function to auto-increment violation count
CREATE OR REPLACE FUNCTION increment_violation_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE test_attempts 
  SET violation_count = COALESCE(violation_count, 0) + 1
  WHERE id = NEW.attempt_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-increment on violation insert
DROP TRIGGER IF EXISTS trigger_increment_violation_count ON test_violations;
CREATE TRIGGER trigger_increment_violation_count
AFTER INSERT ON test_violations
FOR EACH ROW
EXECUTE FUNCTION increment_violation_count();

-- Add comment
COMMENT ON TABLE test_violations IS 'Tracks anti-cheating violations detected during test attempts';
COMMENT ON COLUMN test_violations.violation_type IS 'Type of violation: window_switch, tab_switch, screenshot, copy, paste, phone_call, visibility_change';
COMMENT ON COLUMN test_violations.details IS 'Additional details about the violation';
COMMENT ON COLUMN test_violations.detected_at IS 'When the violation was detected';
