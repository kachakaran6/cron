import React, { useState } from 'react';
import { Outlet, NavLink, Link, useLocation } from 'react-router-dom';
import { 
  LayoutGrid, 
  Clock, 
  Activity, 
  ShieldCheck, 
  Bell, 
  Key, 
  Settings, 
  ExternalLink,
  BookOpen,
  Sun,
  Moon,
  LogOut,
  User as UserIcon,
  Menu,
  X
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

export default function AppShell() {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'Overview', to: '/dashboard', icon: LayoutGrid, exact: true },
    { label: 'Schedules', to: '/dashboard/schedules', icon: Clock },
    { label: 'Execution History', to: '/dashboard/executions', icon: Activity },
    { label: 'Monitors', to: '/dashboard/monitors', icon: ShieldCheck },
    { label: 'Notifications', to: '/dashboard/notifications', icon: Bell },
    { label: 'API Keys', to: '/dashboard/api-keys', icon: Key },
    { label: 'Settings', to: '/dashboard/settings', icon: Settings },
  ];

  // Mobile bottom quick navigation
  const mobileQuickItems = [
    { label: 'Overview', to: '/dashboard', icon: LayoutGrid, exact: true },
    { label: 'Schedules', to: '/dashboard/schedules', icon: Clock },
    { label: 'History', to: '/dashboard/executions', icon: Activity },
    { label: 'Settings', to: '/dashboard/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans transition-colors bg-slate-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 selection:bg-zinc-300 dark:selection:bg-zinc-800">
      {/* Compact Header Bar */}
      <header className="h-14 border-b px-3 sm:px-6 flex items-center justify-between sticky top-0 z-40 bg-white/95 dark:bg-zinc-950/95 backdrop-blur border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none">
        <div className="flex items-center gap-3 sm:gap-6">
          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 -ml-1 rounded-md text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 focus:outline-none transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <div 
              style={{ backgroundColor: 'var(--accent)' }}
              className="w-6 h-6 rounded flex items-center justify-center font-mono font-bold text-xs text-white shadow-sm transition-colors"
            >
              SC
            </div>
            <span className="font-semibold text-sm tracking-tight text-zinc-900 dark:text-zinc-100">
              Samast Cron
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3 text-xs">
          {/* Light / Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="p-1.5 sm:p-2 rounded border transition-colors border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 shadow-sm dark:shadow-none"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-zinc-700" />}
          </button>

          <Link
            to="/docs"
            className="hidden sm:flex text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors items-center gap-1 py-1 px-2"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Docs</span>
          </Link>

          <a
            href="/api/docs"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:flex text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors items-center gap-1 py-1 px-2"
          >
            <span>OpenAPI</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          {/* User Profile & Logout */}
          <div className="flex items-center gap-2 pl-1.5 sm:pl-2 border-l border-zinc-200 dark:border-zinc-800">
            <span className="hidden lg:inline text-[11px] font-mono text-zinc-600 dark:text-zinc-400 max-w-[150px] truncate">
              {user?.email || 'admin@samast.pro'}
            </span>
            <button
              onClick={logout}
              className="p-1.5 sm:p-2 rounded border transition-colors border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-zinc-800"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs md:hidden animate-fade-in"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Navigation Slide-out Sheet */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[80vw] bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 p-4 flex flex-col justify-between transform transition-transform duration-250 ease-in-out md:hidden shadow-2xl ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-4 overflow-y-auto">
          {/* Mobile Drawer Header */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
            <Link 
              to="/dashboard" 
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5"
            >
              <div 
                style={{ backgroundColor: 'var(--accent)' }}
                className="w-7 h-7 rounded flex items-center justify-center font-mono font-bold text-xs text-white shadow-sm"
              >
                SC
              </div>
              <span className="font-semibold text-sm tracking-tight text-zinc-900 dark:text-zinc-100">
                Samast Cron
              </span>
            </Link>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="space-y-1">
            <div className="text-[10px] font-mono font-semibold text-zinc-500 uppercase tracking-wider px-2 py-1">
              Platform
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact 
                ? location.pathname === item.to || location.pathname === '/dashboard/'
                : location.pathname.startsWith(item.to);

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'nav-active-accent font-semibold'
                      : 'text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>

          {/* Additional Links */}
          <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-1">
            <div className="text-[10px] font-mono font-semibold text-zinc-500 uppercase tracking-wider px-2 py-1">
              Resources
            </div>
            <Link
              to="/docs"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
            >
              <BookOpen className="w-4 h-4 flex-shrink-0" />
              <span>Documentation</span>
            </Link>
            <a
              href="/api/docs"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between px-3 py-2 rounded-lg text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
            >
              <span className="flex items-center gap-3">
                <ExternalLink className="w-4 h-4 flex-shrink-0" />
                <span>OpenAPI Specs</span>
              </span>
            </a>
          </div>
        </div>

        {/* Mobile Drawer Footer */}
        <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex-shrink-0">
                <UserIcon className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate max-w-[130px]">
                  {user?.email || 'admin@samast.pro'}
                </div>
                <div className="text-[10px] text-zinc-500 font-mono">Console Active</div>
              </div>
            </div>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                logout();
              }}
              className="p-2 rounded-md border border-zinc-200 dark:border-zinc-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-zinc-900"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 dark:text-zinc-400 pt-2 border-t border-zinc-100 dark:border-zinc-900">
            <span>Samast Engine</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900">v1.4.2</span>
          </div>
        </div>
      </div>

      {/* Main Layout Body */}
      <div className="flex-1 flex pb-16 md:pb-0">
        {/* Navigation Sidebar (Desktop) */}
        <aside className="w-56 border-r p-3 hidden md:flex flex-col justify-between border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex-shrink-0">
          <div className="space-y-0.5">
            <div className="text-[10px] font-mono font-semibold text-zinc-500 uppercase tracking-wider px-2 py-1.5 mb-1">
              Platform
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact 
                ? location.pathname === item.to || location.pathname === '/dashboard/'
                : location.pathname.startsWith(item.to);

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
                    isActive
                      ? 'nav-active-accent pl-[9px]'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>

          <div className="px-2 py-2 border-t border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
            <span>Samast Engine</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900">v1.4.2</span>
          </div>
        </aside>

        {/* Dynamic Route View */}
        <main className="flex-1 p-3.5 sm:p-6 max-w-7xl mx-auto w-full overflow-x-hidden">
          <Outlet />
        </main>
      </div>

      {/* Mobile Sticky Bottom Quick-Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-zinc-950/95 backdrop-blur border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-around h-14 px-2 shadow-lg">
        {mobileQuickItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? location.pathname === item.to || location.pathname === '/dashboard/'
            : location.pathname.startsWith(item.to);

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-medium transition-colors ${
                isActive
                  ? 'text-[var(--accent)] font-semibold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}

        {/* More/Drawer button in bottom bar */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-medium transition-colors ${
            mobileMenuOpen 
              ? 'text-[var(--accent)] font-semibold' 
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <Menu className="w-5 h-5 mb-0.5" />
          <span>More</span>
        </button>
      </nav>
    </div>
  );
}
