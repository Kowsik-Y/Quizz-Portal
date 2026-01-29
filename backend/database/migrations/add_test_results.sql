-- Add test_results column to student_answers table for storing individual test case results
ALTER TABLE student_answers ADD COLUMN IF NOT EXISTS test_results JSONB;

-- Add comment for documentation
COMMENT ON COLUMN student_answers.test_results IS 'Detailed test case results for code questions in JSON format: [{"input": "...", "expected_output": "...", "actual_output": "...", "passed": true/false}]';