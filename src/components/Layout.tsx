import type { ReactNode } from 'react';
import { LayoutDashboard, CheckSquare, FileText, Settings, LogOut, Menu, X, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function Layout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut, isAdmin } = useAuth();
  const isTaskList = location.pathname === '/';

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex">
      {/* Desktop Sidebar - Always visible on lg+ */}
      <aside className="hidden lg:flex lg:flex-col w-[260px] flex-shrink-0" style={{ background: 'var(--sidebar-bg)' }}>
        <div className="h-[72px] flex items-center" style={{ paddingLeft: '24px', paddingRight: '24px' }}>
          <span className="font-bold text-lg text-white tracking-tight">PMC</span>
        </div>
        <nav className="overflow-y-auto" style={{ height: 'calc(100vh - 200px)', padding: '16px' }}>
          <button
            onClick={() => alert('Coming Soon')}
            className="w-full flex items-center gap-3 rounded-xl text-sm font-medium transition-all text-left"
            style={{ color: 'var(--sidebar-text)', background: 'transparent', padding: '14px 16px 14px 24px' }}>
            <LayoutDashboard size={20} strokeWidth={1.8} />
            Dashboard
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center gap-3 rounded-xl text-sm font-medium transition-all text-left"
            style={{
              color: isTaskList ? 'var(--sidebar-active)' : 'var(--sidebar-text)',
              background: isTaskList ? 'var(--sidebar-hover)' : 'transparent',
              padding: '14px 16px 14px 24px',
              marginTop: '16px'
            }}>
            <CheckSquare size={20} strokeWidth={isTaskList ? 2.2 : 1.8} />
            Tasks
          </button>
          <button
            onClick={() => navigate('/my-log')}
            className="w-full flex items-center gap-3 rounded-xl text-sm font-medium transition-all text-left"
            style={{
              color: location.pathname === '/my-log' ? 'var(--sidebar-active)' : 'var(--sidebar-text)',
              background: location.pathname === '/my-log' ? 'var(--sidebar-hover)' : 'transparent',
              padding: '14px 16px 14px 24px',
              marginTop: '16px'
            }}>
            <FileText size={20} strokeWidth={location.pathname === '/my-log' ? 2.2 : 1.8} />
            My Log
          </button>
          <button
            onClick={() => navigate('/settings')}
            className="w-full flex items-center gap-3 rounded-xl text-sm font-medium transition-all text-left"
            style={{ 
              color: location.pathname === '/settings' ? 'var(--sidebar-active)' : 'var(--sidebar-text)', 
              background: location.pathname === '/settings' ? 'var(--sidebar-hover)' : 'transparent', 
              padding: '14px 16px 14px 24px',
              marginTop: '16px'
            }}>
            <Settings size={20} strokeWidth={location.pathname === '/settings' ? 2.2 : 1.8} />
            Settings
          </button>
        </nav>
        <div className="mt-auto rounded-xl" style={{ background: 'var(--sidebar-hover)', padding: '16px', margin: '16px' }}>
          <div className="flex items-center" style={{ gap: '12px' }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold" style={{ background: 'var(--primary)', color: '#fff' }}>
              {profile?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{profile?.name || 'User'}</p>
              <p className="text-xs" style={{ color: 'var(--sidebar-text)' }}>{profile?.role || 'Member'}</p>
            </div>
            <button onClick={handleSignOut} style={{ color: 'var(--sidebar-text)' }} className="hover:text-white transition-colors">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-h-screen">
        {/* Top Bar */}
        <header className="h-[72px] flex items-center justify-between" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', paddingLeft: '20px', paddingRight: '20px' }}>
          <div className="flex items-center" style={{ gap: '12px' }}>
            {/* Mobile: Hamburger, Desktop: No hamburger */}
            <button style={{ padding: '4px' }} className="lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu size={22} />
            </button>
            <h1 className="text-lg font-bold" style={{ color: 'var(--text)' }}>PMC Tasks Tracker</h1>
          </div>
          <div className="flex items-center" style={{ gap: '12px' }}>
            <span className="text-xs font-semibold rounded-full" style={{ background: 'rgba(123,104,238,0.1)', color: 'var(--primary)', padding: '6px 12px' }}>
              {profile?.role === 'admin' ? 'Admin' : profile?.role === 'viewer' ? 'Viewer' : 'Member'} View
            </span>
            {/* User Menu */}
            <div className="relative">
              <button 
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center rounded-lg transition-colors"
                style={{ gap: '8px', padding: '8px' }}
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold" style={{ background: 'var(--primary)', color: '#fff' }}>
                  {profile?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) || 'U'}
                </div>
                <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 top-full rounded-xl shadow-lg z-50" style={{ background: 'var(--surface)', border: '1px solid var(--border)', marginTop: '8px', width: '192px' }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                    <div className="font-medium text-sm" style={{ color: 'var(--text)' }}>{profile?.name}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{profile?.email}</div>
                  </div>
                  {isAdmin && (
                    <button 
                      onClick={() => { setUserMenuOpen(false); navigate('/settings'); }}
                      className="w-full flex items-center text-left text-sm hover:bg-gray-50"
                      style={{ gap: '8px', padding: '10px 16px', color: 'var(--text)' }}
                    >
                      <Settings size={16} /> Settings
                    </button>
                  )}
                  <button 
                    onClick={handleSignOut}
                    className="w-full flex items-center text-left text-sm hover:bg-gray-50"
                    style={{ gap: '8px', padding: '10px 16px', color: '#ef4444' }}
                  >
                    <LogOut size={16} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="min-h-screen" style={{ background: 'var(--bg)', padding: '20px 20px 100px 20px' }}>
          <div style={{ maxWidth: '1024px', marginLeft: 'auto', marginRight: 'auto' }}>
            {children}
          </div>
        </div>
      </main>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-[260px] flex flex-col" style={{ background: 'var(--sidebar-bg)' }}>
            <div className="h-[72px] flex items-center justify-between" style={{ paddingLeft: '24px', paddingRight: '24px' }}>
              <span className="font-bold text-lg text-white tracking-tight">PMC</span>
              <button onClick={() => setSidebarOpen(false)} style={{ color: 'var(--sidebar-text)' }} className="hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <nav style={{ flex: '1 1 0%', padding: '16px' }}>
              {/* Dashboard - always inactive for now */}
              <button
                onClick={() => alert('Coming Soon')}
                className="w-full flex items-center gap-3 rounded-xl text-sm font-medium transition-all text-left"
                style={{ color: 'var(--sidebar-text)', background: 'transparent', padding: '12px 16px' }}>
                <LayoutDashboard size={20} strokeWidth={1.8} />
                Dashboard
              </button>
              {/* Tasks - active on task routes */}
              <button
                onClick={() => { setSidebarOpen(false); navigate('/'); }}
                className="w-full flex items-center gap-3 rounded-xl text-sm font-medium transition-all text-left"
                style={{
                  color: isTaskList ? 'var(--sidebar-active)' : 'var(--sidebar-text)',
                  background: isTaskList ? 'var(--sidebar-hover)' : 'transparent',
                  padding: '12px 16px',
                  marginTop: '8px'
                }}>
                <CheckSquare size={20} strokeWidth={isTaskList ? 2.2 : 1.8} />
                Tasks
              </button>
              {/* My Log */}
              <button
                onClick={() => alert('Coming Soon')}
                className="w-full flex items-center gap-3 rounded-xl text-sm font-medium transition-all text-left"
                style={{ color: 'var(--sidebar-text)', background: 'transparent', padding: '12px 16px', marginTop: '8px' }}>
                <FileText size={20} strokeWidth={1.8} />
                My Log
              </button>
              {/* Settings */}
              <button
                onClick={() => { setSidebarOpen(false); navigate('/settings'); }}
                className="w-full flex items-center gap-3 rounded-xl text-sm font-medium transition-all text-left"
                style={{ color: location.pathname === '/settings' ? 'var(--sidebar-active)' : 'var(--sidebar-text)', background: location.pathname === '/settings' ? 'var(--sidebar-hover)' : 'transparent', padding: '12px 16px', marginTop: '8px' }}>
                <Settings size={20} strokeWidth={location.pathname === '/settings' ? 2.2 : 1.8} />
                Settings
              </button>
            </nav>
            <div className="rounded-xl" style={{ background: 'var(--sidebar-hover)', padding: '16px', margin: '12px' }}>
              <div className="flex items-center" style={{ gap: '12px' }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold" style={{ background: 'var(--primary)', color: '#fff' }}>
                  {profile?.name?.charAt(0) || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{profile?.name || 'User'}</p>
                  <p className="text-xs" style={{ color: 'var(--sidebar-text)' }}>{profile?.role || 'Member'}</p>
                </div>
                <button onClick={handleSignOut} style={{ color: 'var(--sidebar-text)' }} className="hover:text-white transition-colors">
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Bottom Nav — Mobile only */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex justify-around items-end" style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', minHeight: '80px', paddingTop: '20px', paddingBottom: 'env(safe-area-inset-bottom)', paddingLeft: '16px', paddingRight: '16px' }}>
        <button onClick={() => alert('Coming Soon')} className="flex flex-col items-center rounded-lg"
          style={{ color: 'var(--text-muted)', gap: '2px', padding: '6px 16px' }}>
          <LayoutDashboard size={22} />
          <span className="text-[10px] font-medium">Dashboard</span>
        </button>
        <button 
          onClick={() => isTaskList ? window.location.reload() : navigate('/')}
          className="flex flex-col items-center rounded-lg"
          style={{ color: isTaskList ? 'var(--primary)' : 'var(--text-muted)', gap: '2px', padding: '6px 16px' }}>
          <CheckSquare size={22} />
          <span className="text-[10px] font-medium">Tasks</span>
        </button>
        <button onClick={() => navigate('/my-log')} 
          className="flex flex-col items-center rounded-lg"
          style={{ color: location.pathname === '/my-log' ? 'var(--primary)' : 'var(--text-muted)', gap: '2px', padding: '6px 16px' }}>
          <FileText size={22} />
          <span className="text-[10px] font-medium">My Log</span>
        </button>
        <button 
          onClick={() => navigate('/settings')}
          className="flex flex-col items-center rounded-lg"
          style={{ color: location.pathname === '/settings' ? 'var(--primary)' : 'var(--text-muted)', gap: '2px', padding: '6px 16px' }}>
          <Settings size={22} />
          <span className="text-[10px] font-medium">Settings</span>
        </button>
      </nav>

    </div>
  );
}
