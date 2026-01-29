-- Add random question selection and review visibility fields to tests table
ALTER TABLE tests
ADD COLUMN questions_to_ask INTEGER,
ADD COLUMN show_review_to_students BOOLEAN DEFAULT FALSE;

-- Add selected_questions field to test_attempts table for storing randomly selected questions
ALTER TABLE test_attempts
ADD COLUMN selected_questions INTEGER[];

-- Add comment for clarity
COMMENT ON COLUMN tests.questions_to_ask IS 'Number of questions to randomly select from the test pool. If null, all questions are used.';
COMMENT ON COLUMN tests.show_review_to_students IS 'Whether students can view the review/answers after completing the test.';
COMMENT ON COLUMN test_attempts.selected_questions IS 'Array of question IDs that were randomly selected for this attempt. If null, all questions are used.';