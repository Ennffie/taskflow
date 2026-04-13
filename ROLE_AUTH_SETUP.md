# PMC Tasks Tracker - Role-Based Access Control (RBAC) Setup

## Overview

Implement flexible role-based access with **role defaults + individual permission overrides**.

**Base Roles:**
| Role | Description | Use Case |
|------|-------------|----------|
| `admin` | Full access + user management | Enfield (you) |
| `member` | Standard team member permissions | Designers |
| `viewer` | Read-only | Boss (Benne) |

**Flexible Permissions:**
Admin can set **base role** + **override individual functions**:
- Claire = member + can_delete_task (override)
- Silvie = member - cannot_assign (override removed)

**Access Matrix (Base):**
| Permission | Admin | Member | Viewer |
|------------|-------|--------|--------|
| view_tasks | ✅ | ✅ | ✅ |
| create_task | ✅ | ❌ | ❌ |
| edit_any_task | ✅ | ❌ | ❌ |
| edit_assigned_task | ✅ | ✅ | ❌ |
| create_log | ✅ | ✅ | ❌ |
| edit_own_log | ✅ | ✅ | ❌ |
| delete_task | ✅ | ❌ | ❌ |
| delete_log | ✅ | ❌ | ❌ |
| view_audit_log | ✅ | ❌ | ❌ |
| manage_users | ✅ | ❌ | ❌ |
| assign_members | ✅ | ✅ | ❌ |

---

## Phase 1: Database Schema Updates

### 1.1 Update profiles table

```sql
-- Add role column to profiles (3 roles: admin, member, viewer)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer'));

-- Update existing profiles to 'member' (or manually set admin/viewer)
UPDATE profiles SET role = 'member' WHERE role IS NULL;

-- Set specific users (run after they sign up)
-- UPDATE profiles SET role = 'admin' WHERE email = 'enfield.pccw@gmail.com';
-- UPDATE profiles SET role = 'viewer' WHERE email = 'benne.ng@pccw.com';
```

### 1.2 Create audit_logs table

```sql
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  user_email TEXT,
  action TEXT NOT NULL, -- CREATE_TASK, UPDATE_TASK, DELETE_TASK, CREATE_LOG, UPDATE_LOG, DELETE_LOG, LOGIN, LOGOUT
  table_name TEXT NOT NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast queries
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
```

### 1.3 Create user_permissions table (for overrides)

```sql
-- Granular permission overrides per user
-- NULL = inherit from role default, true/false = override
CREATE TABLE IF NOT EXISTS user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  permission_key TEXT NOT NULL, -- e.g. 'delete_task', 'create_task', 'assign_members'
  granted BOOLEAN NOT NULL, -- true = allow, false = deny
  set_by UUID REFERENCES profiles(id) ON DELETE SET NULL, -- admin who set this
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, permission_key)
);

-- Index for fast lookups
CREATE INDEX idx_user_permissions_user ON user_permissions(user_id);

-- All available permissions
-- view_tasks, create_task, edit_any_task, edit_assigned_task
-- create_log, edit_own_log, edit_any_log
-- delete_task, delete_own_log, delete_any_log
-- view_audit_log, manage_users, assign_members
```
```

### 1.3 RLS Policies

```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE log_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop old public policies (from v1.0)
DROP POLICY IF EXISTS "Public read profiles" ON profiles;
DROP POLICY IF EXISTS "Public read tasks" ON tasks;
-- ... etc for all old policies

-- ============================================
-- PROFILES POLICIES
-- ============================================
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can read all profiles (names for assignees)"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- TASKS POLICIES
-- Everyone (admin, member, viewer) can view tasks
-- Only admin can create/update/delete
-- Member can update assigned tasks
-- ============================================
CREATE POLICY "Everyone can view tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can create tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update any task"
  ON tasks FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Members can update assigned tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM task_assignees 
      WHERE task_id = tasks.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can delete tasks"
  ON tasks FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- LOG_ENTRIES POLICIES
-- ============================================
CREATE POLICY "Everyone can view logs"
  ON log_entries FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Members can create logs for assigned tasks"
  ON log_entries FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM task_assignees 
      WHERE task_id = log_entries.task_id AND user_id = auth.uid()
    )
    OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can update own logs"
  ON log_entries FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can delete own logs"
  ON log_entries FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- AUDIT_LOGS POLICIES (Admin only)
-- ============================================
CREATE POLICY "Only admins can view audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "System can create audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);
```

---

## Phase 2: Supabase Auth Setup

### 2.1 Enable Email/Password Auth

1. Go to Supabase Dashboard → Authentication → Providers
2. Enable **Email** provider
3. Settings:
   - Confirm email: OFF (for now, or use your email SMTP)
   - Secure email change: ON
   - Enable new users: ON

### 2.2 Create First Admin User

Option A: SQL (for existing user)
```sql
-- After user signs up, promote to admin
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'enfield.pccw@gmail.com';
```

Option B: Invite via Admin Dashboard (build later)

---

## Phase 3: Frontend Implementation

### 3.1 Create Auth Context

```typescript
// src/contexts/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

type Role = 'admin' | 'member';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: { id: string; name: string; email: string; role: Role } | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AuthContextType['profile']>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('id, name, email, role')
      .eq('id', userId)
      .single();
    setProfile(data);
    setLoading(false);
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signUp(email: string, password: string, name: string) {
    const { error, data } = await supabase.auth.signUp({ 
      email, 
      password,
      options: { data: { name } }
    });
    if (error) throw error;
    
    // Create profile (trigger should handle this, but fallback here)
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email,
        name,
        role: 'member' // Default role
      });
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{
      user, session, profile, loading,
      signIn, signUp, signOut,
      isAdmin: profile?.role === 'admin'
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
```

### 3.2 Create Login Page

```typescript
// src/pages/Login.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (isSignUp) {
        await signUp(email, password, name);
      } else {
        await signIn(email, password);
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-md rounded-2xl p-8" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <h1 className="text-2xl font-bold text-center mb-2" style={{ color: 'var(--text)' }}>PMC Tasks Tracker</h1>
        <p className="text-center mb-6" style={{ color: 'var(--text-muted)' }}>{isSignUp ? 'Create account' : 'Sign in to continue'}</p>
        
        {error && (
          <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: '#fef2f2', color: '#ef4444' }}>{error}</div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Name</label>
              <input 
                value={name} onChange={e => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg" 
                style={{ border: '1px solid var(--border)', background: 'var(--bg)' }}
                required
              />
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Email</label>
            <input 
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg" 
              style={{ border: '1px solid var(--border)', background: 'var(--bg)' }}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Password</label>
            <input 
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg" 
              style={{ border: '1px solid var(--border)', background: 'var(--bg)' }}
              required
              minLength={6}
            />
          </div>
          <button 
            type="submit" disabled={loading}
            className="w-full py-3 rounded-lg font-semibold text-white disabled:opacity-50"
            style={{ background: 'var(--primary)' }}
          >
            {loading ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Sign In')}
          </button>
        </form>
        
        <p className="text-center mt-4 text-sm" style={{ color: 'var(--text-muted)' }}>
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button onClick={() => setIsSignUp(!isSignUp)} className="font-medium" style={{ color: 'var(--primary)' }}>
            {isSignUp ? 'Sign in' : 'Sign up'}
          </button>
        </p>
      </div>
    </div>
  );
}
```

### 3.3 Protected Route Component

```typescript
// src/components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from './Layout';

export default function ProtectedRoute({ children, requireAdmin = false }: { 
  children: React.ReactNode; 
  requireAdmin?: boolean;
}) {
  const { user, profile, loading } = useAuth();

  if (loading) return <div className="p-8">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (requireAdmin && !profile?.role === 'admin') return <Navigate to="/" replace />;

  return <Layout>{children}</Layout>;
}
```

### 3.4 Update App.tsx Router

```typescript
// src/App.tsx
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import TaskList from './pages/TaskList';
import LogBook from './pages/LogBook';
import Settings from './pages/Settings'; // New

function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><TaskList /></ProtectedRoute>} />
          <Route path="/task/:taskId" element={<ProtectedRoute><LogBook /></ProtectedRoute>} />
          <Route path="/settings" element