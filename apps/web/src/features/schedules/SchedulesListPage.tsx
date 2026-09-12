import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, RefreshCw, Search, Play, MoreVertical, Clock } from 'lucide-react';
import { fetchJobs, triggerJobExecution } from '../../services/api';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';

export default function SchedulesListPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: jobs, isLoading, isError, refetch } = useQuery({
    queryKey: ['cron-schedules'],
    queryFn: fetchJobs,
    refetchInterval: 10000,
  });

  const triggerMutation = useMutation({
    mutationFn: triggerJobExecution,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cron-schedules'] });
    },
  });

  const filteredJobs = jobs?.filter(
    (j) =>
      j.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-800">
        <div>
          <h1 className="text-lg font-semibold text-zinc-100">Schedules</h1>
          <p className="text-xs text-zinc-400">Manage scheduled HTTP requests and monitor their execution.</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search schedules or URLs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-200 focus-ring w-60 placeholder-zinc-500"
            />
          </div>

          <button
            onClick={() => refetch()}
            className="p-1.5 rounded border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <Link
            to="/dashboard/schedules/new"
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded bg-zinc-100 text-zinc-950 hover:bg-white transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create schedule</span>
          </Link>
        </div>
      </div>

      {/* Main Data Table */}
      <div className="border border-zinc-800 rounded bg-zinc-950 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-900/80 text-[11px] font-mono uppercase tracking-wider text-zinc-400 border-b border-zinc-800">
            <tr>
              <th className="px-4 py-2.5">Name</th>
              <th className="px-4 py-2.5">Target</th>
              <th className="px-4 py-2.5">Schedule</th>
              <th className="px-4 py-2.5">Last execution</th>
              <th className="px-4 py-2.5">Next execution</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 font-sans text-zinc-300">
            {isLoading && <TableSkeleton rows={5} cols={7} />}

            {!isLoading && isError && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-rose-400 text-xs">
                  Failed to load schedules. Please click Refresh to try again.
                </td>
              </tr>
            )}

            {!isLoading && !isError && filteredJobs?.length === 0 && (
              <tr>
                <td colSpan={7}>
                  <EmptyState
                    icon={Clock}
                    title="No scheduled requests"
                    description="You don't have any scheduled requests yet. Create your first schedule to automatically call an HTTP endpoint on a recurring schedule."
                    action={{
                      label: "Create schedule",
                      href: "/dashboard/schedules/new"
                    }}
                  />
                </td>
              </tr>
            )}

            {!isLoading && filteredJobs?.map((job) => (
              <tr key={job.id} className="hover:bg-zinc-900/50 transition-colors">
                <td className="px-4 py-3 font-medium text-zinc-100">
                  <Link to={`/dashboard/schedules/${job.id}`} className="hover:text-zinc-300">
                    {job.name}
                  </Link>
                </td>

                <td className="px-4 py-3 font-mono text-zinc-400 truncate max-w-xs">
                  <span className="text-[10px] px-1 py-0.5 rounded bg-zinc-800 text-zinc-300 mr-1.5 font-sans uppercase">
                    {job.method}
                  </span>
                  {job.url}
                </td>

                <td className="px-4 py-3 font-mono text-zinc-300">
                  {job.schedule}
                </td>

                <td className="px-4 py-3 font-mono text-zinc-400">
                  {job.lastRunAt ? new Date(job.lastRunAt).toLocaleTimeString() : '—'}
                </td>

                <td className="px-4 py-3 font-mono text-zinc-400">
                  {new Date(job.nextRunAt).toLocaleTimeString()}
                </td>

                <td className="px-4 py-3">
                  <StatusBadge status={job.enabled ? 'active' : 'paused'} />
                </td>

                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => triggerMutation.mutate(job.id)}
                      disabled={triggerMutation.isPending}
                      title="Run now"
                      className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
                    >
                      <Play className="w-3.5 h-3.5" />
                    </button>
                    <Link
                      to={`/dashboard/schedules/${job.id}`}
                      className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
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
