-- Migration: Add is_active column to users table
-- Date: 2025-10-14

-- Add is_active column to users table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'is_active'
  ) THEN
    ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    COMMENT ON COLUMN users.is_active IS 'Indicates whether the user account is active';
  END IF;
END $$;

-- Update existing users to be active by default
UPDATE users SET is_active = TRUE WHERE is_active IS NULL;

-- Add NOT NULL constraint after setting defaults
ALTER TABLE users ALTER COLUMN is_active SET NOT NULL;

COMMIT;
