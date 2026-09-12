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
  BookOpen
} from 'lucide-react';

export default function AppShell() {
  const location = useLocation();

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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-zinc-800 selection:text-white">
      {/* Compact Header Bar */}
      <header className="h-14 border-b border-zinc-800 bg-zinc-950 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-6">
          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            {/* Geometric SVG Brand Mark */}
            <div className="w-6 h-6 rounded bg-zinc-100 text-zinc-950 flex items-center justify-center font-mono font-bold text-xs">
              SC
            </div>
            <span className="font-semibold text-sm text-zinc-100 tracking-tight">
              Samast Cron
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-2 px-2.5 py-0.5 rounded border border-zinc-800 bg-zinc-900/60 text-[11px] text-zinc-400 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Infrastructure: Operational</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <Link
            to="/docs"
            className="text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1 py-1 px-2"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Docs</span>
          </Link>

          <a
            href="/api/docs"
            target="_blank"
            rel="noreferrer"
            className="text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1 py-1 px-2"
          >
            <span>OpenAPI</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </header>

      {/* Main Layout Body */}
      <div className="flex-1 flex">
        {/* Navigation Sidebar */}
        <aside className="w-56 border-r border-zinc-800 bg-zinc-950 p-3 hidden md:flex flex-col justify-between">
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
                      ? 'bg-zinc-800 text-zinc-100 font-semibold'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-zinc-100' : 'text-zinc-400'}`} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>

          <div className="p-2.5 rounded border border-zinc-800/60 bg-zinc-900/40 text-[11px] text-zinc-400 space-y-1">
            <div className="font-semibold text-zinc-300">Free Infrastructure Plan</div>
            <p className="text-[10px] text-zinc-500 leading-normal">
              Unlimited cron schedules and millisecond webhooks.
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
