import React from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import { Clock, Key, ShieldCheck, Plus, ExternalLink } from 'lucide-react';

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30">
      {/* Top Global Header Bar */}
      <header className="h-16 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-6 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/dashboard/jobs" className="flex items-center gap-2.5 font-bold tracking-tight text-white group">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-lg bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
              CronPlatform
            </span>
          </Link>

          {/* Cluster Status Health Indicator */}
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-xs text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono">Engine: Operational (Lag &lt; 8ms)</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/api/docs"
            target="_blank"
            rel="noreferrer"
            className="hidden md:flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors px-3 py-1.5 rounded-md hover:bg-slate-900 border border-transparent hover:border-slate-800"
          >
            <span>Swagger API</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <Link
            to="/dashboard/jobs/new"
            className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Create Job</span>
          </Link>
        </div>
      </header>

      {/* Main Body with Sidebar */}
      <div className="flex-1 flex">
        {/* Navigation Sidebar */}
        <aside className="w-64 border-r border-slate-800/80 bg-slate-950/40 p-4 space-y-1 hidden md:block">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">
            Workspaces
          </div>
          <NavLink
            to="/dashboard/jobs"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`
            }
          >
            <Clock className="w-4 h-4" />
            <span>Schedules &amp; Jobs</span>
          </NavLink>

          <NavLink
            to="/dashboard/api-keys"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`
            }
          >
            <Key className="w-4 h-4" />
            <span>API Keys</span>
          </NavLink>

          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-3 mt-6 mb-2">
            System &amp; Security
          </div>
          <div className="px-3 py-2.5 rounded-lg border border-slate-800/60 bg-slate-900/30 text-xs text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-300 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>SSRF Sandboxed</span>
            </div>
            <p className="text-[11px] text-slate-500">Private CIDR &amp; Metadata blocking active on all workers.</p>
          </div>
        </aside>

        {/* Dynamic Route Content */}
        <main className="flex-1 p-6 sm:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
