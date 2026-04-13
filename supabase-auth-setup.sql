-- PMC Tasks Tracker - Auth Setup SQL
-- Run this in Supabase Dashboard → SQL Editor

-- ============================================
-- 1. ADD ROLE TO PROFILES
-- ============================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer'));

-- Update existing to member
UPDATE profiles SET role = 'member' WHERE role IS NULL;

-- ============================================
-- 2. CREATE USER_PERMISSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  permission_key TEXT NOT NULL,
  granted BOOLEAN NOT NULL,
  set_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, permission_key)
);

CREATE INDEX idx_user_permissions_user ON user_permissions(user_id);

-- ============================================
-- 3. CREATE AUDIT_LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  user_email TEXT,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ============================================
-- 4. ENABLE RLS ON ALL TABLES
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE log_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. DROP OLD PUBLIC POLICIES (FROM V1.0)
-- ============================================
DROP POLICY IF EXISTS "Public read profiles" ON profiles;
DROP POLICY IF EXISTS "Public read tasks" ON tasks;
DROP POLICY IF EXISTS "Public read task_assignees" ON task_assignees;
DROP POLICY IF EXISTS "Public read log_entries" ON log_entries;
DROP POLICY IF EXISTS "Public insert tasks" ON tasks;
DROP POLICY IF EXISTS "Public update tasks" ON tasks;
DROP POLICY IF EXISTS "Public delete tasks" ON tasks;
DROP POLICY IF EXISTS "Public insert log_entries" ON log_entries;
DROP POLICY IF EXISTS "Public update log_entries" ON log_entries;
DROP POLICY IF EXISTS "Public delete log_entries" ON log_entries;

-- ============================================
-- 6. NEW RLS POLICIES
-- ============================================

-- PROFILES
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can read all profiles" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can update any profile" ON profiles FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- TASKS
CREATE POLICY "Everyone can view tasks" ON tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can create tasks" ON tasks FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can update any task" ON tasks FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Members can update assigned tasks" ON tasks FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM task_assignees WHERE task_id = tasks.id AND user_id = auth.uid()));
CREATE POLICY "Admins can delete tasks" ON tasks FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- LOG_ENTRIES
CREATE POLICY "Everyone can view logs" ON log_entries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Members can create logs" ON log_entries FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM task_assignees WHERE task_id = log_entries.task_id AND user_id = auth.uid()) OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Users can update own logs" ON log_entries FOR UPDATE TO authenticated USING (created_by = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Users can delete own logs" ON log_entries FOR DELETE TO authenticated USING (created_by = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- USER_PERMISSIONS & AUDIT_LOGS (Admin only)
CREATE POLICY "Only admins can view user_permissions" ON user_permissions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Only admins can manage user_permissions" ON user_permissions FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Only admins can view audit_logs" ON audit_logs FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "System can create audit_logs" ON audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- Success message
SELECT 'Auth setup complete!' as status;
