-- Migration: Add code_language column to questions table
-- Date: 2025-10-15

-- Add code_language column for coding questions
ALTER TABLE questions
ADD COLUMN IF NOT EXISTS code_language VARCHAR(50);

-- Update existing code questions to have a default language
UPDATE questions
SET code_language = 'c'
WHERE question_type = 'code' AND code_language IS NULL;
