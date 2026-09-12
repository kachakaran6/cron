import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Play, CheckCircle2, XCircle, Clock, Plus, RefreshCw, MoreVertical } from 'lucide-react';
import { fetchJobs, triggerJobExecution } from '../services/api';

export default function JobsListPage() {
  const queryClient = useQueryClient();
  const [filterText, setFilterText] = useState('');

  const { data: jobs, isLoading, isError, refetch } = useQuery({
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
          <h1 className="text-2xl font-bold tracking-tight text-white">Cron Jobs &amp; Schedules</h1>
          <p className="text-sm text-slate-400">Manage, inspect, and monitor distributed HTTP schedules.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className="p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200 transition-all"
            title="Refresh List"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <input
            type="text"
            placeholder="Filter jobs or URLs..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-64"
          />
          <Link
            to="/dashboard/jobs/new"
            className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Job</span>
          </Link>
        </div>
      </div>

      {/* Structured Modern Table */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-md overflow-hidden shadow-xl">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950/60 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="px-6 py-3.5">Name &amp; Target URL</th>
              <th className="px-6 py-3.5">Schedule</th>
              <th className="px-6 py-3.5">Last Run</th>
              <th className="px-6 py-3.5">Next Execution</th>
              <th className="px-6 py-3.5">Status</th>
              <th className="px-6 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500 text-sm">
                  Loading scheduled jobs...
                </td>
              </tr>
            )}

            {!isLoading && filteredJobs?.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center space-y-3">
                  <Clock className="w-8 h-8 text-slate-600 mx-auto animate-pulse" />
                  <p className="text-slate-400 font-medium">No cron jobs configured yet.</p>
                  <Link
                    to="/dashboard/jobs/new"
                    className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:underline font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create your first scheduled cron job</span>
                  </Link>
                </td>
              </tr>
            )}

            {filteredJobs?.map((job) => (
              <tr key={job.id} className="hover:bg-slate-900/60 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
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
                        className="font-medium text-white group-hover:text-indigo-400 transition-colors"
                      >
                        {job.name}
                      </Link>
                      <div className="text-xs text-slate-500 font-mono truncate max-w-xs">{job.url}</div>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800/60 text-xs font-mono text-slate-300 border border-slate-700/40">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{job.schedule}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">{job.timezone}</div>
                </td>

                <td className="px-6 py-4">
                  {job.lastRunAt ? (
                    <div className="flex items-center gap-1.5 text-emerald-400 text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span className="text-slate-400 font-mono">{new Date(job.lastRunAt).toLocaleTimeString()}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500">Never executed</span>
                  )}
                </td>

                <td className="px-6 py-4">
                  <span className="text-xs font-mono text-slate-300 bg-slate-800/40 px-2 py-1 rounded">
                    {new Date(job.nextRunAt).toLocaleTimeString()}
                  </span>
                </td>

                <td className="px-6 py-4">
                  {job.enabled ? (
                    <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                      <span className="w-2 h-2 rounded-full bg-slate-600" />
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
                      className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-all disabled:opacity-50"
                    >
                      <Play className="w-3.5 h-3.5" />
                    </button>
                    <Link
                      to={`/dashboard/jobs/${job.id}`}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200"
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
