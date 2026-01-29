-- ============================================
-- DIAGNOSTIC SQL SCRIPT
-- Run this in psql to check your setup
-- ============================================

-- Connect to database first:
-- psql -U postgres -d quiz_portal

\echo '=========================================='
\echo 'CHECKING COURSES'
\echo '=========================================='

-- Show all courses with their active status
SELECT 
    id, 
    title, 
    is_active,
    CASE 
        WHEN is_active THEN '✓ Active' 
        ELSE '✗ Inactive' 
    END as status
FROM courses
ORDER BY id;

-- Count active and inactive courses
\echo ''
\echo 'Course Statistics:'
SELECT 
    COUNT(*) as total_courses,
    COUNT(*) FILTER (WHERE is_active = true) as active_courses,
    COUNT(*) FILTER (WHERE is_active = false) as inactive_courses
FROM courses;

\echo ''
\echo '=========================================='
\echo 'CHECKING TESTS'
\echo '=========================================='

-- Show all tests with their active status
SELECT 
    t.id, 
    t.title, 
    c.title as course_title,
    t.is_active,
    CASE 
        WHEN t.is_active THEN '✓ Active' 
        ELSE '✗ Inactive' 
    END as status
FROM tests t
LEFT JOIN courses c ON t.course_id = c.id
ORDER BY t.id;

-- Count active and inactive tests
\echo ''
\echo 'Test Statistics:'
SELECT 
    COUNT(*) as total_tests,
    COUNT(*) FILTER (WHERE is_active = true) as active_tests,
    COUNT(*) FILTER (WHERE is_active = false) as inactive_tests
FROM tests;

\echo ''
\echo '=========================================='
\echo 'RECOMMENDATIONS'
\echo '=========================================='

-- Check if we need to create inactive items
DO $$
DECLARE
    inactive_courses INT;
    inactive_tests INT;
BEGIN
    SELECT COUNT(*) INTO inactive_courses FROM courses WHERE is_active = false;
    SELECT COUNT(*) INTO inactive_tests FROM tests WHERE is_active = false;
    
    IF inactive_courses = 0 THEN
        RAISE NOTICE 'ℹ  No inactive courses found!';
        RAISE NOTICE '   Run: UPDATE courses SET is_active = false WHERE id = (SELECT id FROM courses LIMIT 1);';
    ELSE
        RAISE NOTICE '✓ Found % inactive course(s)', inactive_courses;
    END IF;
    
    IF inactive_tests = 0 THEN
        RAISE NOTICE 'ℹ  No inactive tests found!';
        RAISE NOTICE '   Run: UPDATE tests SET is_active = false WHERE id = (SELECT id FROM tests LIMIT 1);';
    ELSE
        RAISE NOTICE '✓ Found % inactive test(s)', inactive_tests;
    END IF;
END $$;

\echo ''
\echo '=========================================='
\echo 'QUICK FIXES'
\echo '=========================================='
\echo ''
\echo 'To create an inactive course:'
\echo '  UPDATE courses SET is_active = false WHERE id = 1;'
\echo ''
\echo 'To create an inactive test:'
\echo '  UPDATE tests SET is_active = false WHERE id = 1;'
\echo ''
\echo 'To reactivate a course:'
\echo '  UPDATE courses SET is_active = true WHERE id = 1;'
\echo ''
\echo 'To reactivate a test:'
\echo '  UPDATE tests SET is_active = true WHERE id = 1;'
\echo ''
