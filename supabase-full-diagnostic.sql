-- ============================================
-- FULL SUPABASE DIAGNOSTIC & FIX
-- Run this entire SQL to check and fix everything
-- ============================================

-- 1. Check if RLS is enabled on all tables
SELECT 
  schemaname,
  tablename,
  relrowsecurity as rls_enabled
FROM pg_class
JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
WHERE schemaname = 'public'
AND tablename IN ('tasks', 'log_entries', 'profiles', 'task_assignees', 'tags')
ORDER BY tablename;

-- 2. Check all policies (should show 5 tables with 'Allow all' for {public})
SELECT 
  tablename,
  policyname,
  permissive,
  roles::text,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('tasks', 'log_entries', 'profiles', 'task_assignees', 'tags')
ORDER BY tablename, policyname;

-- 3. Check for triggers that might block operations
SELECT 
  event_object_table AS table_name,
  trigger_name
FROM information_schema.triggers
WHERE event_object_schema = 'public'
AND event_object_table IN ('tasks', 'log_entries', 'profiles', 'task_assignees', 'tags')
ORDER BY event_object_table;

-- 4. Check table constraints
SELECT 
  table_name,
  constraint_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'public'
AND table_name IN ('tasks', 'log_entries', 'profiles', 'task_assignees', 'tags')
AND constraint_type IN ('FOREIGN KEY', 'CHECK')
ORDER BY table_name, constraint_type;