import type { ReactNode } from 'react';
import { LayoutDashboard, CheckSquare, Users, Settings, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { CURRENT_USER } from '../types';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/', active: true },
  { icon: CheckSquare, label: 'Tasks', path: '/' },
  { icon: Users, label: 'Team', path: '/' },
  { icon: Settings, label: 'Settings', path: '/' },
];

export function Layout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex">
      {/* Main */}
      <main className="flex-1 min-h-screen">
        {/* Top Bar */}
        <header className="h-[72px] flex items-center justify-between" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', paddingLeft: '20px', paddingRight: '20px' }}>
          <div className="flex items-center gap-3">
            <button className="p-1" onClick={() => setSidebarOpen(true)}>
              <Menu size={22} />
            </button>
            <h1 className="text-lg font-bold" style={{ color: 'var(--text)' }}>PMC Tasks Tracker</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: 'rgba(123,104,238,0.1)', color: 'var(--primary)' }}>
              Admin View
            </span>
          </div>
        </header>

        {/* Content */}
        <div className="p-4 lg:p-8 min-h-screen" style={{ background: 'var(--bg)' }}>
          <div className="max-w-5xl mx-auto">
            {children}
          </div>
        </div>
      </main>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-[260px] flex flex-col" style={{ background: 'var(--sidebar-bg)' }}>
            <div className="h-[72px] flex items-center justify-between px-6">
              <div className="flex items-center">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--primary)' }}>
                  <span className="text-white font-bold text-base">T</span>
                </div>
                <span className="ml-3 font-bold text-lg text-white tracking-tight">TaskFlow</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} style={{ color: 'var(--sidebar-text)' }} className="hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 px-4 py-2 space-y-1">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.path}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all"
                  style={{
                    color: item.active ? 'var(--sidebar-active)' : 'var(--sidebar-text)',
                    background: item.active ? 'var(--sidebar-hover)' : 'transparent',
                  }}
                  onMouseEnter={(e) => { if (!item.active) e.currentTarget.style.background = 'var(--sidebar-hover)'; }}
                  onMouseLeave={(e) => { if (!item.active) e.currentTarget.style.background = 'transparent'; }}
                >
                  <item.icon size={20} strokeWidth={item.active ? 2.2 : 1.8} />
                  {item.label}
                </a>
              ))}
            </nav>
            <div className="p-4 mx-3 mb-3 rounded-xl" style={{ background: 'var(--sidebar-hover)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold" style={{ background: 'var(--primary)', color: '#fff' }}>
                  {CURRENT_USER.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{CURRENT_USER.name}</p>
                  <p className="text-xs" style={{ color: 'var(--sidebar-text)' }}>Admin</p>
                </div>
                <button style={{ color: 'var(--sidebar-text)' }} className="hover:text-white transition-colors">
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Bottom Nav — Mobile only */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex justify-around items-end pb-safe pt-5 px-4" style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', minHeight: '80px' }}>
        {navItems.map((item) => (
          <a key={item.label} href={item.path} className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-lg"
            style={{ color: item.active ? 'var(--primary)' : 'var(--text-muted)' }}>
            <item.icon size={22} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </a>
        ))}
      </nav>
    </div>
  );
}
