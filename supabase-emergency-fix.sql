-- Emergency RLS Fix - Restore proper permissions
-- Run this in Supabase SQL Editor

-- First, check if RLS is enabled and enable it
ALTER TABLE IF EXISTS log_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS task_assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tags ENABLE ROW LEVEL SECURITY;

-- Drop conflicting policies
DROP POLICY IF EXISTS "Allow all for anon" ON log_entries;
DROP POLICY IF EXISTS "Allow all for authenticated" ON log_entries;
DROP POLICY IF EXISTS "Allow all tasks for anon" ON tasks;
DROP POLICY IF EXISTS "Allow all profiles for anon" ON profiles;

-- Create permissive policy for ALL roles (including anon and authenticated)
-- This allows anyone to read/insert/update/delete

-- Log Entries - allow ALL (including anon key from web app)
CREATE POLICY "Enable all access for all users" ON log_entries
  FOR ALL USING (true) WITH CHECK (true);

-- Tasks - allow ALL
CREATE POLICY "Enable all access for all users" ON tasks
  FOR ALL USING (true) WITH CHECK (true);

-- Profiles - allow ALL  
CREATE POLICY "Enable all access for all users" ON profiles
  FOR ALL USING (true) WITH CHECK (true);

-- Task Assignees - allow ALL
CREATE POLICY "Enable all access for all users" ON task_assignees
  FOR ALL USING (true) WITH CHECK (true);

-- Tags - allow ALL
CREATE POLICY "Enable all access for all users" ON tags
  FOR ALL USING (true) WITH CHECK (true);