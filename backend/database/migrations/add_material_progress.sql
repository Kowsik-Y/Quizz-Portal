-- Migration: Add material_progress table for tracking student material viewing progress
-- Date: 2026-01-29

-- Create Material Progress Table
CREATE TABLE IF NOT EXISTS material_progress (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  material_id INTEGER NOT NULL,
  material_type VARCHAR(20) NOT NULL CHECK (material_type IN ('test', 'course')),
  viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  last_position INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, material_id, material_type)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_material_progress_student ON material_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_material_progress_material ON material_progress(material_id, material_type);
CREATE INDEX IF NOT EXISTS idx_material_progress_student_material ON material_progress(student_id, material_id, material_type);

-- Add comment for documentation
COMMENT ON TABLE material_progress IS 'Tracks student progress viewing test and course materials';
COMMENT ON COLUMN material_progress.material_id IS 'ID of the material (references test_materials.id or course_materials.id)';
COMMENT ON COLUMN material_progress.material_type IS 'Type of material: test or course';
COMMENT ON COLUMN material_progress.completion_percentage IS 'Percentage of material completed (0-100)';
COMMENT ON COLUMN material_progress.last_position IS 'Last position in material (seconds for videos, page number for documents)';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Migration completed: material_progress table added successfully';
END $$;
