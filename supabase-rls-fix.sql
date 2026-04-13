-- PMC Tasks Tracker - Full RLS Policies
-- Run this in Supabase SQL Editor

-- Profiles: allow all for authenticated users
DROP POLICY IF EXISTS "Allow all for authenticated" ON profiles;
CREATE POLICY "Allow all for authenticated" 
ON profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Tasks: allow all for authenticated users
DROP POLICY IF EXISTS "Allow all for authenticated" ON tasks;
CREATE POLICY "Allow all for authenticated" 
ON tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Task Assignees: allow all for authenticated users
DROP POLICY IF EXISTS "Allow all for authenticated" ON task_assignees;
CREATE POLICY "Allow all for authenticated" 
ON task_assignees FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- User Permissions: allow all for authenticated users
DROP POLICY IF EXISTS "Allow all for authenticated" ON user_permissions;
CREATE POLICY "Allow all for authenticated" 
ON user_permissions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Log Entries: allow all for authenticated users
DROP POLICY IF EXISTS "Allow all for authenticated" ON log_entries;
CREATE POLICY "Allow all for authenticated" 
ON log_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Tags: allow all for authenticated users
DROP POLICY IF EXISTS "Allow all for authenticated" ON tags;
CREATE POLICY "Allow all for authenticated" 
ON tags FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Audit Logs: allow all for authenticated users
DROP POLICY IF EXISTS "Allow all for authenticated" ON audit_logs;
CREATE POLICY "Allow all for authenticated" 
ON audit_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);
