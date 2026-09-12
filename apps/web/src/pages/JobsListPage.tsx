import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Play, CheckCircle2, Clock, Plus, RefreshCw, MoreVertical, Search, Zap } from 'lucide-react';
import { fetchJobs, triggerJobExecution } from '../services/api';

export default function JobsListPage() {
  const queryClient = useQueryClient();
  const [filterText, setFilterText] = useState('');

  const { data: jobs, isLoading, refetch } = useQuery({
    queryKey: ['cron-jobs'],
    queryFn: fetchJobs,
    refetchInterval: 5000,
  });

  const triggerMutation = useMutation({
    mutationFn: triggerJobExecution,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cron-jobs'] });
    },
  });

  const filteredJobs = jobs?.filter(
    (j) =>
      j.name.toLowerCase().includes(filterText.toLowerCase()) ||
      j.url.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Zap className="w-6 h-6 text-rose-500 fill-current" />
            <span>Schedules &amp; Background Jobs</span>
          </h1>
          <p className="text-xs text-zinc-400">Inspect, monitor, and execute millisecond-accurate HTTP webhooks.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className="p-2.5 rounded-xl border border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:text-white hover:border-zinc-700 transition-all"
            title="Refresh List"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search jobs or URLs..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-rose-500 w-64"
            />
          </div>

          <Link
            to="/dashboard/jobs/new"
            className="glow-button flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl text-white shadow-lg"
          >
            <Plus className="w-4 h-4" />
            <span>New Job</span>
          </Link>
        </div>
      </div>

      {/* Structured Modern Table */}
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/60 backdrop-blur-xl overflow-hidden shadow-2xl">
        <table className="w-full text-left text-xs text-zinc-300">
          <thead className="bg-zinc-900/60 text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-800">
            <tr>
              <th className="px-6 py-4">Name &amp; Target Webhook</th>
              <th className="px-6 py-4">Cron Expression</th>
              <th className="px-6 py-4">Last Run</th>
              <th className="px-6 py-4">Next Execution</th>
              <th className="px-6 py-4">State</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 font-sans">
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-zinc-500 text-xs">
                  Loading cron schedules...
                </td>
              </tr>
            )}

            {!isLoading && filteredJobs?.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center space-y-3">
                  <Clock className="w-10 h-10 text-rose-500/60 mx-auto animate-pulse" />
                  <p className="text-zinc-300 font-semibold text-sm">No scheduled jobs found.</p>
                  <Link
                    to="/dashboard/jobs/new"
                    className="inline-flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 font-bold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create your first scheduled cron job</span>
                  </Link>
                </td>
              </tr>
            )}

            {filteredJobs?.map((job) => (
              <tr key={job.id} className="hover:bg-zinc-900/60 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                        job.method === 'GET'
                          ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {job.method}
                    </span>
                    <div>
                      <Link
                        to={`/dashboard/jobs/${job.id}`}
                        className="font-bold text-white group-hover:text-rose-400 transition-colors text-sm"
                      >
                        {job.name}
                      </Link>
                      <div className="text-xs text-zinc-500 font-mono truncate max-w-xs mt-0.5">{job.url}</div>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 text-xs font-mono text-rose-300 border border-zinc-800">
                    <Clock className="w-3.5 h-3.5 text-rose-400" />
                    <span>{job.schedule}</span>
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-1 font-mono">{job.timezone}</div>
                </td>

                <td className="px-6 py-4">
                  {job.lastRunAt ? (
                    <div className="flex items-center gap-1.5 text-emerald-400 text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span className="text-zinc-400 font-mono">{new Date(job.lastRunAt).toLocaleTimeString()}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-zinc-500 font-mono">Never executed</span>
                  )}
                </td>

                <td className="px-6 py-4">
                  <span className="text-xs font-mono text-zinc-300 bg-zinc-900 px-2.5 py-1 rounded-md border border-zinc-800">
                    {new Date(job.nextRunAt).toLocaleTimeString()}
                  </span>
                </td>

                <td className="px-6 py-4">
                  {job.enabled ? (
                    <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs text-zinc-500 font-medium">
                      <span className="w-2 h-2 rounded-full bg-zinc-600" />
                      Paused
                    </span>
                  )}
                </td>

                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => triggerMutation.mutate(job.id)}
                      disabled={triggerMutation.isPending}
                      title="Run Now"
                      className="p-2 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-all disabled:opacity-50"
                    >
                      <Play className="w-3.5 h-3.5 fill-current text-rose-400" />
                    </button>
                    <Link
                      to={`/dashboard/jobs/${job.id}`}
                      className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
