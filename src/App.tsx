import { HashRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { TaskList } from './pages/TaskList';
import { LogBook } from './pages/LogBook';
import Settings from './pages/Settings';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './lib/supabase';

const INVITE_CODES: Record<string, string> = {
  a283: 'admin',
  m375: 'member',
  v838: 'viewer',
};

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: 40 }}>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function LoginForm({ defaultRole }: { defaultRole?: string }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const signUpMode = !!defaultRole;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignUp || signUpMode) {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name } } });
        if (error) throw error;
        // Set role in profile after signup
        if (data.user) {
          const role = defaultRole || 'member';
          // Wait a moment for trigger to create profile, then update role
          setTimeout(async () => {
            await supabase.from('profiles').update({ role }).eq('id', data.user!.id);
          }, 2000);
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'var(--bg)' }}>
      <div style={{ width: '100%', maxWidth: 420, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 24, padding: '40px 32px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 8, color: 'var(--text)' }}>PMC Tasks Tracker</h1>
        <p style={{ textAlign: 'center', marginBottom: 32, color: 'var(--text-muted)' }}>{(isSignUp || signUpMode) ? 'Create account' : 'Sign in to continue'}</p>
        
        {error && <div style={{ marginBottom: 20, padding: 16, borderRadius: 12, background: '#fef2f2', color: '#ef4444', fontSize: 14 }}>{error}</div>}
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {(isSignUp || signUpMode) && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, display: 'block', color: 'var(--text-muted)' }}>Name</label>
              <input value={name} onChange={e => setName(e.target.value)} required style={{ width: '100%', padding: '14px 18px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg)', fontSize: 14, boxSizing: 'border-box' }} />
            </div>
          )}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, display: 'block', color: 'var(--text-muted)' }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@company.com" style={{ width: '100%', padding: '14px 18px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg)', fontSize: 14, boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, display: 'block', color: 'var(--text-muted)' }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} placeholder="Min 6 characters" style={{ width: '100%', padding: '14px 18px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg)', fontSize: 14, boxSizing: 'border-box' }} />
          </div>
          <button type="submit" disabled={loading} style={{ padding: '14px 28px', borderRadius: 12, background: 'var(--primary)', color: 'white', fontWeight: 600, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1, fontSize: 14, marginTop: 4 }}>
            {loading ? 'Please wait...' : ((isSignUp || signUpMode) ? 'Create Account' : 'Sign In')}
          </button>
        </form>
        
        {!signUpMode && (
          <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--text-muted)' }}>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button onClick={() => setIsSignUp(!isSignUp)} style={{ color: 'var(--primary)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>
              {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
          </p>
        )}
      </div>
    </div>
  );
}

function InvitePage() {
  const { code } = useParams();
  const role = code ? INVITE_CODES[code] : undefined;
  
  if (!role) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ color: 'var(--text)', marginBottom: 8 }}>Invalid Invite</h2>
          <p style={{ color: 'var(--text-muted)' }}>This invite link is not valid.</p>
        </div>
      </div>
    );
  }

  return <LoginForm defaultRole={role} />;
}

function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/invite/:code" element={<InvitePage />} />
          <Route path="/" element={<ProtectedRoute><Layout><TaskList /></Layout></ProtectedRoute>} />
          <Route path="/task/:taskId" element={<ProtectedRoute><Layout><LogBook /></Layout></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}

export default App;
