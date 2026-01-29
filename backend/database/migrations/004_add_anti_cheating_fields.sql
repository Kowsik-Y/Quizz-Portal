-- Migration: Add anti-cheating and security fields to tests table
-- Created: 2024
-- Description: Adds max_attempts, window switch detection, screenshot prevention, and call detection fields

-- Add max_attempts column (default 1 attempt)
ALTER TABLE tests 
ADD COLUMN IF NOT EXISTS max_attempts INTEGER DEFAULT 1;

-- Add window switch detection flag (default true)
ALTER TABLE tests 
ADD COLUMN IF NOT EXISTS detect_window_switch BOOLEAN DEFAULT TRUE;

-- Add screenshot prevention flag (default true)
ALTER TABLE tests 
ADD COLUMN IF NOT EXISTS prevent_screenshot BOOLEAN DEFAULT TRUE;

-- Add phone call detection flag (default false)
ALTER TABLE tests 
ADD COLUMN IF NOT EXISTS detect_phone_call BOOLEAN DEFAULT FALSE;

-- Add comment to document these fields
COMMENT ON COLUMN tests.max_attempts IS 'Maximum number of attempts allowed per student';
COMMENT ON COLUMN tests.detect_window_switch IS 'Track when student switches windows/apps during test';
COMMENT ON COLUMN tests.prevent_screenshot IS 'Prevent screenshots during test (mobile only)';
COMMENT ON COLUMN tests.detect_phone_call IS 'Monitor phone calls during test (mobile only)';
