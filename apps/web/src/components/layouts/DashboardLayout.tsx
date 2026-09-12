import React from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import { Clock, Key, ShieldCheck, Plus, ExternalLink, LayoutDashboard, Home } from 'lucide-react';

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-[#070709] text-zinc-100 flex flex-col font-sans selection:bg-rose-500 selection:text-white">
      {/* Top Global Header Bar */}
      <header className="h-16 border-b border-zinc-800/80 bg-[#070709]/80 backdrop-blur-xl sticky top-0 z-40 px-6 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2.5 font-bold tracking-tight text-white group">
            <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center text-white shadow-lg shadow-rose-600/30 group-hover:scale-105 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">
              CRON<span className="text-rose-500">.</span>
            </span>
          </Link>

          {/* Cluster Status Health Indicator */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-xs text-emerald-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Engine: Operational (&lt; 12ms)</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700"
          >
            <Home className="w-3.5 h-3.5 text-rose-400" />
            <span>Landing Page</span>
          </Link>

          <a
            href="/api/docs"
            target="_blank"
            rel="noreferrer"
            className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700"
          >
            <ExternalLink className="w-3.5 h-3.5 text-rose-400" />
            <span>Swagger API Docs</span>
          </a>

          <Link
            to="/dashboard/jobs/new"
            className="glow-button flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl text-white shadow-lg active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Job</span>
          </Link>
        </div>
      </header>

      {/* Main Body with Sidebar */}
      <div className="flex-1 flex">
        {/* Navigation Sidebar */}
        <aside className="w-64 border-r border-zinc-800/80 bg-[#0a0a0d]/60 p-4 space-y-1 hidden md:block">
          <div className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest px-3 mb-2">
            Control Center
          </div>
          <NavLink
            to="/dashboard/jobs"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30 shadow-md shadow-rose-500/10'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
              }`
            }
          >
            <LayoutDashboard className="w-4 h-4 text-rose-400" />
            <span>Schedules &amp; Jobs</span>
          </NavLink>

          <NavLink
            to="/dashboard/api-keys"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30 shadow-md shadow-rose-500/10'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
              }`
            }
          >
            <Key className="w-4 h-4 text-rose-400" />
            <span>API Keys</span>
          </NavLink>

          <div className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest px-3 mt-8 mb-2">
            Security &amp; Worker Health
          </div>
          <div className="px-3.5 py-3 rounded-xl border border-zinc-800/80 bg-zinc-950/60 text-xs text-zinc-400 space-y-1.5">
            <div className="flex items-center gap-1.5 text-zinc-200 font-semibold text-[11px]">
              <ShieldCheck className="w-4 h-4 text-rose-400" />
              <span>SSRF Sandboxed Workers</span>
            </div>
            <p className="text-[10px] text-zinc-500 leading-normal">
              Private CIDR and cloud metadata endpoint protection active on all 50 execution threads.
            </p>
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
