-- Simple Anti-Cheat Migration (Error-Free Version)
-- Run this if the main migration fails

-- Step 1: Create test_violations table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'test_violations') THEN
        CREATE TABLE test_violations (
          id SERIAL PRIMARY KEY,
          attempt_id INTEGER NOT NULL REFERENCES test_attempts(id) ON DELETE CASCADE,
          violation_type VARCHAR(50) NOT NULL,
          details TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        RAISE NOTICE 'Created test_violations table';
    ELSE
        RAISE NOTICE 'test_violations table already exists';
    END IF;
END $$;

-- Step 2: Add indexes
CREATE INDEX IF NOT EXISTS idx_violations_attempt_id ON test_violations(attempt_id);
CREATE INDEX IF NOT EXISTS idx_violations_type ON test_violations(violation_type);
CREATE INDEX IF NOT EXISTS idx_violations_created_at ON test_violations(created_at);

-- Step 3: Add violation_count column to test_attempts
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'test_attempts' AND column_name = 'violation_count'
    ) THEN
        ALTER TABLE test_attempts ADD COLUMN violation_count INTEGER DEFAULT 0;
        RAISE NOTICE 'Added violation_count column to test_attempts';
    ELSE
        RAISE NOTICE 'violation_count column already exists';
    END IF;
END $$;

-- Step 4: Create or replace function to auto-increment violation count
CREATE OR REPLACE FUNCTION increment_violation_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE test_attempts 
  SET violation_count = COALESCE(violation_count, 0) + 1
  WHERE id = NEW.attempt_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Drop and recreate trigger
DROP TRIGGER IF EXISTS trigger_increment_violation_count ON test_violations;
CREATE TRIGGER trigger_increment_violation_count
AFTER INSERT ON test_violations
FOR EACH ROW
EXECUTE FUNCTION increment_violation_count();

-- Step 6: Verify migration
DO $$ 
DECLARE
    table_exists BOOLEAN;
    column_exists BOOLEAN;
    trigger_exists BOOLEAN;
BEGIN
    -- Check table
    SELECT EXISTS (
        SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'test_violations'
    ) INTO table_exists;
    
    -- Check column
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'test_attempts' AND column_name = 'violation_count'
    ) INTO column_exists;
    
    -- Check trigger
    SELECT EXISTS (
        SELECT FROM information_schema.triggers 
        WHERE trigger_name = 'trigger_increment_violation_count'
    ) INTO trigger_exists;
    
    RAISE NOTICE '=================================';
    RAISE NOTICE 'Migration Verification:';
    RAISE NOTICE 'test_violations table: %', CASE WHEN table_exists THEN '✅ EXISTS' ELSE '❌ MISSING' END;
    RAISE NOTICE 'violation_count column: %', CASE WHEN column_exists THEN '✅ EXISTS' ELSE '❌ MISSING' END;
    RAISE NOTICE 'violation trigger: %', CASE WHEN trigger_exists THEN '✅ EXISTS' ELSE '❌ MISSING' END;
    RAISE NOTICE '=================================';
    
    IF table_exists AND column_exists AND trigger_exists THEN
        RAISE NOTICE '✅ Migration completed successfully!';
    ELSE
        RAISE WARNING '⚠️ Migration incomplete - check errors above';
    END IF;
END $$;
