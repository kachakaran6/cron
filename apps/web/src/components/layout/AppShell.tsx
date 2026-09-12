import React from 'react';
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
  User as UserIcon
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

export default function AppShell() {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  const navItems = [
    { label: 'Overview', to: '/dashboard', icon: LayoutGrid, exact: true },
    { label: 'Schedules', to: '/dashboard/schedules', icon: Clock },
    { label: 'Execution History', to: '/dashboard/executions', icon: Activity },
    { label: 'Monitors', to: '/dashboard/monitors', icon: ShieldCheck },
    { label: 'Notifications', to: '/dashboard/notifications', icon: Bell },
    { label: 'API Keys', to: '/dashboard/api-keys', icon: Key },
    { label: 'Settings', to: '/dashboard/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans transition-colors bg-slate-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 selection:bg-zinc-300 dark:selection:bg-zinc-800">
      {/* Compact Header Bar */}
      <header className="h-14 border-b px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 bg-white/95 dark:bg-zinc-950/95 backdrop-blur border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none">
        <div className="flex items-center gap-6">
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

          <div className="hidden md:flex items-center gap-2 px-2.5 py-0.5 rounded border text-[11px] font-mono border-zinc-200 dark:border-zinc-800 bg-zinc-100/80 dark:bg-zinc-900/60 text-zinc-700 dark:text-zinc-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Infrastructure: Operational</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          {/* Light / Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded border transition-colors border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 shadow-sm dark:shadow-none"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-zinc-700" />}
          </button>

          <Link
            to="/docs"
            className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors flex items-center gap-1 py-1 px-2"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Docs</span>
          </Link>

          <a
            href="/api/docs"
            target="_blank"
            rel="noreferrer"
            className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors flex items-center gap-1 py-1 px-2"
          >
            <span className="hidden sm:inline">OpenAPI</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          {/* User Profile & Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-zinc-200 dark:border-zinc-800">
            <span className="hidden lg:inline text-[11px] font-mono text-zinc-600 dark:text-zinc-400">
              {user?.email || 'admin@samast.pro'}
            </span>
            <button
              onClick={logout}
              className="p-1.5 rounded border transition-colors border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-zinc-800"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout Body */}
      <div className="flex-1 flex">
        {/* Navigation Sidebar */}
        <aside className="w-56 border-r p-3 hidden md:flex flex-col justify-between border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
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
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>

          <div className="p-2.5 rounded border text-[11px] space-y-1 border-zinc-200 dark:border-zinc-800/60 bg-zinc-50 dark:bg-zinc-900/40 text-zinc-600 dark:text-zinc-400">
            <div className="font-semibold text-zinc-800 dark:text-zinc-300">Free Infrastructure Plan</div>
            <p className="text-[10px] text-zinc-500 leading-normal">
              Unlimited cron schedules &amp; millisecond HTTP webhooks.
            </p>
          </div>
        </aside>

        {/* Dynamic Route View */}
        <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
