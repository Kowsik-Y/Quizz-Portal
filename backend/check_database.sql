-- ==========================================
-- QUICK DATABASE CHECK & FIX
-- ==========================================

\echo '==========================================';
\echo '1. CHECKING IF COURSES TABLE EXISTS';
\echo '==========================================';

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'courses')
        THEN '✓ Courses table exists'
        ELSE '✗ Courses table MISSING!'
    END as status;

\echo '';
\echo '==========================================';
\echo '2. COUNTING COURSES';
\echo '==========================================';

SELECT COUNT(*) as total_courses FROM courses;

\echo '';
\echo '==========================================';
\echo '3. SHOWING ALL COURSES';
\echo '==========================================';

SELECT id, title, is_active, created_at FROM courses ORDER BY id;

\echo '';
\echo '==========================================';
\echo '4. IF NO COURSES, RUN THESE COMMANDS:';
\echo '==========================================';
\echo '';
\echo 'INSERT INTO courses (title, description, department_id, teacher_id, is_active)';
\echo 'VALUES ';
\echo '  (''JavaScript Basics'', ''Learn JS fundamentals'', 1, 1, true),';
\echo '  (''Python Advanced'', ''Advanced Python topics'', 1, 1, false);';
\echo '';
