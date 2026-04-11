import { ReactNode } from 'react';
import { LayoutDashboard, CheckSquare, Users, Settings, LogOut } from 'lucide-react';
import { CURRENT_USER } from '../types';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: CheckSquare, label: 'Tasks', path: '/' },
  { icon: Users, label: 'Team', path: '/' },
  { icon: Settings, label: 'Settings', path: '/' },
];

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex md:w-60 md:flex-col md:fixed md:inset-y-0 bg-white border-r border-[var(--color-border)]">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-[var(--color-border)]">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center">
            <span className="text-white font-bold text-sm">T</span>
          </div>
          <span className="ml-3 font-bold text-lg text-[var(--color-primary)]">TaskFlow</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.path}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--color-text-secondary)] hover:bg-gray-50 hover:text-[var(--color-text)] transition-colors"
            >
              <item.icon size={18} />
              {item.label}
            </a>
          ))}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-[var(--color-border)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white text-sm font-medium">
              {CURRENT_USER.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{CURRENT_USER.name}</p>
              <p className="text-xs text-[var(--color-text-secondary)]">Admin</p>
            </div>
            <button className="text-[var(--color-text-secondary)] hover:text-[var(--color-text)]">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-60">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-[var(--color-border)] flex items-center justify-between px-4 md:px-6">
          <h1 className="text-lg font-semibold text-[var(--color-text)]">
            Task Management
          </h1>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-[var(--color-primary)]/10 text-[var(--color-primary)] px-2 py-1 rounded-full font-medium">
              {CURRENT_USER.role === 'admin' ? 'Admin' : 'Member'}
            </span>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 md:p-6">
          {children}
        </div>
      </main>

      {/* Bottom Nav - Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[var(--color-border)] flex justify-around py-2 z-50">
        {navItems.map((item) => (
          <a
            key={item.label}
            href={item.path}
            className="flex flex-col items-center gap-0.5 px-3 py-1 text-[var(--color-text-secondary)]"
          >
            <item.icon size={20} />
            <span className="text-[10px]">{item.label}</span>
          </a>
        ))}
      </nav>
    </div>
  );
}
