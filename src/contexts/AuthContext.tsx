import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

type Role = 'admin' | 'member' | 'viewer';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: { id: string; name: string; email: string; role: Role } | null;
  loading: boolean;
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
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else { setProfile(null); setLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, email, role')
      .eq('id', userId)
      .single();

    if (data) {
      setProfile(data);
      setLoading(false);
      return;
    }

    // Auto-create missing profile for existing auth users
    const { data: sessionData } = await supabase.auth.getSession();
    const authUser = sessionData.session?.user;
    if (authUser && authUser.id === userId) {
      const fallbackProfile = {
        id: authUser.id,
        name: (authUser.user_metadata?.name as string) || authUser.email?.split('@')[0] || 'User',
        email: authUser.email || '',
        role: 'member' as Role,
      };

      const { data: upserted, error: upsertError } = await supabase
        .from('profiles')
        .upsert(fallbackProfile, { onConflict: 'id' })
        .select('id, name, email, role')
        .single();

      if (!upsertError && upserted) {
        setProfile(upserted);
      } else {
        console.error('fetchProfile upsert failed:', upsertError || error);
        setProfile(null);
      }
    } else {
      console.error('fetchProfile failed:', error);
      setProfile(null);
    }

    setLoading(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{
      user, session, profile, loading,
      signOut, isAdmin: profile?.role === 'admin'
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
