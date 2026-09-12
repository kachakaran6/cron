import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Clock, Activity, AlertTriangle, Plus, ArrowRight } from 'lucide-react';
import { fetchJobs } from '../../services/api';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { TableSkeleton } from '../../components/ui/Skeleton';

export default function OverviewPage() {
  const { data: jobs, isLoading } = useQuery({
    queryKey: ['cron-schedules'],
    queryFn: fetchJobs,
  });

  const activeCount = jobs?.filter(j => j.enabled).length || 0;
  const totalCount = jobs?.length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
        <div>
          <h1 className="text-lg font-semibold text-zinc-100">Overview</h1>
          <p className="text-xs text-zinc-400">System metrics and active HTTP schedule performance.</p>
        </div>

        <Link
          to="/dashboard/schedules/new"
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded bg-zinc-100 text-zinc-950 hover:bg-white transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create schedule</span>
        </Link>
      </div>

      {/* Infrastructure Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 border border-zinc-800 rounded bg-zinc-950">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-mono mb-2">
            <span>ACTIVE SCHEDULES</span>
            <Clock className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="text-2xl font-bold text-zinc-100 font-mono">
            {activeCount} <span className="text-xs font-normal text-zinc-400">/ {totalCount} total</span>
          </div>
        </div>

        <div className="p-4 border border-zinc-800 rounded bg-zinc-950">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-mono mb-2">
            <span>DISPATCH PRECISION</span>
            <Activity className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="text-2xl font-bold text-zinc-100 font-mono">
            &lt; 15ms <span className="text-xs font-normal text-zinc-400">avg latency</span>
          </div>
        </div>

        <div className="p-4 border border-zinc-800 rounded bg-zinc-950">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-mono mb-2">
            <span>ERROR RATE</span>
            <AlertTriangle className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">
            0.00% <span className="text-xs font-normal text-zinc-400">last 24h</span>
          </div>
        </div>
      </div>

      {/* Schedules Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono font-semibold uppercase text-zinc-400">Configured Schedules</h2>
          <Link to="/dashboard/schedules" className="text-xs text-zinc-400 hover:text-zinc-100 flex items-center gap-1 font-mono">
            <span>View all schedules</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="border border-zinc-800 rounded bg-zinc-950 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-900/80 text-[11px] font-mono uppercase tracking-wider text-zinc-400 border-b border-zinc-800">
              <tr>
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Target</th>
                <th className="px-4 py-2.5">Schedule</th>
                <th className="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-sans text-zinc-300">
              {isLoading && <TableSkeleton rows={3} cols={4} />}

              {!isLoading && (!jobs || jobs.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-zinc-500 text-xs font-mono">
                    No schedules configured. Click "Create schedule" above to start.
                  </td>
                </tr>
              )}

              {!isLoading && jobs?.slice(0, 5).map((job) => (
                <tr key={job.id} className="hover:bg-zinc-900/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-zinc-100">
                    <Link to={`/dashboard/schedules/${job.id}`} className="hover:text-zinc-300">
                      {job.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-mono text-zinc-400 truncate max-w-xs">
                    {job.url}
                  </td>
                  <td className="px-4 py-3 font-mono text-zinc-300">
                    {job.schedule}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={job.enabled ? 'active' : 'paused'} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
