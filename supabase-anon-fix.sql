-- Fix RLS policies to allow anon role (for development/demo)
-- Run this in Supabase SQL Editor

-- Log Entries: allow all for anon users (for demo/development)
DROP POLICY IF EXISTS "Allow all for anon" ON log_entries;
CREATE POLICY "Allow all for anon" 
ON log_entries FOR ALL TO anon USING (true) WITH CHECK (true);

-- Also allow authenticated users (keep backward compatibility)
DROP POLICY IF EXISTS "Allow all for authenticated" ON log_entries;
CREATE POLICY "Allow all for authenticated" 
ON log_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Profiles: allow all for anon
DROP POLICY IF EXISTS "Allow all profiles for anon" ON profiles;
CREATE POLICY "Allow all profiles for anon" 
ON profiles FOR ALL TO anon USING (true) WITH CHECK (true);

-- Tasks: allow all for anon  
DROP POLICY IF EXISTS "Allow all tasks for anon" ON tasks;
CREATE POLICY "Allow all tasks for anon" 
ON tasks FOR ALL TO anon USING (true) WITH CHECK (true);

-- Task Assignees: allow all for anon
DROP POLICY IF EXISTS "Allow all assignees for anon" ON task_assignees;
CREATE POLICY "Allow all assignees for anon" 
ON task_assignees FOR ALL TO anon USING (true) WITH CHECK (true);

-- Tags: allow all for anon
DROP POLICY IF EXISTS "Allow all tags for anon" ON tags;
CREATE POLICY "Allow all tags for anon" 
ON tags FOR ALL TO anon USING (true) WITH CHECK (true);

-- User Permissions: allow all for anon
DROP POLICY IF EXISTS "Allow all permissions for anon" ON user_permissions;
CREATE POLICY "Allow all permissions for anon" 
ON user_permissions FOR ALL TO anon USING (true) WITH CHECK (true);