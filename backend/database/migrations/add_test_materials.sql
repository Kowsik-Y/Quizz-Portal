-- Migration: Add test_materials table and created_by column to tests
-- Date: 2025-10-15

-- Add created_by column to tests table
ALTER TABLE tests 
ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- Create Test Materials Table
CREATE TABLE IF NOT EXISTS test_materials (
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

-- Create index for test materials
CREATE INDEX IF NOT EXISTS idx_materials_test ON test_materials(test_id);

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Migration completed: test_materials table and created_by column added successfully';
END $$;
