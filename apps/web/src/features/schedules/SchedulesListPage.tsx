import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, RefreshCw, Search, Play, MoreVertical, Clock, Edit3, Trash2, Eye, ExternalLink, AlertTriangle, Sparkles } from 'lucide-react';
import { fetchJobs, triggerJobExecution, deleteJob, fetchUserSubscription } from '../../services/api';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';

export default function SchedulesListPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);
  const [jobToDelete, setJobToDelete] = useState<any>(null);

  useEffect(() => {
    const handleClose = () => {
      setOpenMenuId(null);
      setMenuPos(null);
    };
    window.addEventListener('click', handleClose);
    window.addEventListener('scroll', handleClose, true);
    window.addEventListener('resize', handleClose);
    return () => {
      window.removeEventListener('click', handleClose);
      window.removeEventListener('scroll', handleClose, true);
      window.removeEventListener('resize', handleClose);
    };
  }, []);

  const { data: jobs, isLoading, isError, refetch } = useQuery({
    queryKey: ['cron-schedules'],
    queryFn: fetchJobs,
    refetchInterval: 10000,
  });

  const { data: subscription } = useQuery({
    queryKey: ['user-subscription'],
    queryFn: fetchUserSubscription,
  });

  const isPro = subscription?.isPro ?? false;
  const planName = subscription?.planName || (isPro ? 'Pro Platform' : 'Free Starter');
  const maxJobs = subscription?.capabilities?.maxJobs ?? (isPro ? 500 : 5);
  const currentJobsCount = jobs?.length || 0;
  const isAtLimit = !isPro && currentJobsCount >= maxJobs;

  const triggerMutation = useMutation({
    mutationFn: triggerJobExecution,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cron-schedules'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteJob(id),
    onSuccess: () => {
      setJobToDelete(null);
      queryClient.invalidateQueries({ queryKey: ['cron-schedules'] });
    },
    onError: (err: any) => {
      alert(err?.message || 'Failed to delete cronjob');
    },
  });

  const filteredJobs = jobs?.filter(
    (j) =>
      j.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Plan Limit Warning Banner */}
      {isAtLimit && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200 text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              <strong>Free Starter Limit Reached ({currentJobsCount}/{maxJobs} jobs):</strong> You've used all 5 complimentary cron jobs. Upgrade to Pro to unlock 500 jobs, 10s intervals, and 30-day logs.
            </span>
          </div>
          <Link
            to="/dashboard/billing"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-700 text-white font-semibold transition-colors shrink-0 text-center"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Upgrade to Pro</span>
          </Link>
        </div>
      )}

      {/* Top Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Schedules</h1>
            <span
              className={`text-[11px] font-mono px-2 py-0.5 rounded-full border ${
                isPro
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-semibold'
                  : isAtLimit
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-semibold'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
              }`}
            >
              {currentJobsCount} / {maxJobs.toLocaleString()} jobs used ({planName})
            </span>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">Manage scheduled HTTP requests and monitor their execution.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search schedules or URLs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-md text-xs text-zinc-900 dark:text-zinc-100 focus-ring placeholder-zinc-400 dark:placeholder-zinc-500 shadow-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              className="p-2 rounded-md border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shadow-xs"
              title="Refresh"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            <Link
              to="/dashboard/schedules/new"
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-md btn-accent shadow-sm transition-all text-center"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create schedule</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Data Table */}
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 shadow-sm dark:shadow-none min-h-[350px]">
        <div className="overflow-x-auto">
          <table className="min-w-[720px] w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-900/80 text-[11px] font-mono uppercase tracking-wider text-zinc-600 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Target</th>
                <th className="px-4 py-3">Schedule</th>
                <th className="px-4 py-3">Last execution</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8">
                    <TableSkeleton rows={5} cols={6} />
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-zinc-600 dark:text-zinc-400">
                    Failed to load scheduled jobs. Please check network connection.
                  </td>
                </tr>
              ) : !filteredJobs || filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12">
                    <EmptyState
                      icon={Clock}
                      title="No cron jobs found"
                      description={searchQuery ? 'No schedules match your search query.' : 'Create your first scheduled HTTP endpoint request.'}
                      action={searchQuery ? undefined : { label: 'Create schedule', href: '/dashboard/schedules/new' }}
                    />
                  </td>
                </tr>
              ) : (
                filteredJobs.map((job) => {
                  const lastRun = job.logs?.[0] || job.executionLogs?.[0];

                  return (
                    <tr
                      key={job.id}
                      className={`hover:bg-zinc-50/80 dark:hover:bg-zinc-900/40 transition-colors ${
                        openMenuId === job.id ? 'bg-zinc-50 dark:bg-zinc-900/60' : ''
                      }`}
                    >
                      <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">
                        <Link to={`/dashboard/schedules/${job.id}`} className="hover:underline flex items-center gap-2">
                          <span>{job.name}</span>
                          <span className="font-mono text-[10px] text-zinc-500 font-normal">[{job.method}]</span>
                        </Link>
                      </td>

                      <td className="px-4 py-3 font-mono text-[11px] text-zinc-600 dark:text-zinc-400 truncate max-w-[220px]" title={job.url}>
                        {job.url}
                      </td>

                      <td className="px-4 py-3 font-mono text-zinc-700 dark:text-zinc-300">
                        <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px]">
                          {job.schedule}
                        </span>
                      </td>

                      <td className="px-4 py-3 font-mono text-[11px] text-zinc-600 dark:text-zinc-400">
                        {lastRun ? (
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                lastRun.statusCode >= 200 && lastRun.statusCode < 300
                                  ? 'bg-emerald-500'
                                  : 'bg-rose-500'
                              }`}
                            />
                            <span>HTTP {lastRun.statusCode || 200}</span>
                            <span className="text-zinc-500">({lastRun.responseTime || lastRun.durationMs || 0}ms)</span>
                          </div>
                        ) : (
                          <span className="text-zinc-400 italic">No executions yet</span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <StatusBadge status={job.enabled ? 'active' : 'paused'} />
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => triggerMutation.mutate(job.id)}
                            disabled={triggerMutation.isPending}
                            title="Run now"
                            className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                          >
                            <Play className="w-3.5 h-3.5" />
                          </button>

                          <Link
                            to={`/dashboard/schedules/${job.id}/edit`}
                            title="Edit cronjob"
                            className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </Link>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (openMenuId === job.id) {
                                setOpenMenuId(null);
                                setMenuPos(null);
                              } else {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const dropdownHeight = 175;
                                const spaceBelow = window.innerHeight - rect.bottom;
                                let top = rect.bottom + 4;
                                if (spaceBelow < dropdownHeight && rect.top > dropdownHeight) {
                                  top = rect.top - dropdownHeight - 4;
                                }
                                setMenuPos({
                                  top,
                                  right: Math.max(16, window.innerWidth - rect.right),
                                });
                                setOpenMenuId(job.id);
                              }
                            }}
                            title="More options"
                            className={`p-1.5 rounded transition-colors ${
                              openMenuId === job.id
                                ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100'
                                : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                            }`}
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>

                          {/* Floating Fixed Position Dropdown Menu */}
                          {openMenuId === job.id && menuPos && (
                            <div
                              style={{
                                position: 'fixed',
                                top: `${menuPos.top}px`,
                                right: `${menuPos.right}px`,
                                zIndex: 9999,
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="w-48 rounded-lg shadow-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 py-1.5 text-xs text-left animate-in fade-in zoom-in-95 duration-100"
                            >
                              <Link
                                to={`/dashboard/schedules/${job.id}`}
                                onClick={() => {
                                  setOpenMenuId(null);
                                  setMenuPos(null);
                                }}
                                className="flex items-center gap-2 px-3 py-2 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5 text-zinc-500" />
                                <span>View details</span>
                              </Link>

                              <Link
                                to={`/dashboard/schedules/${job.id}/edit`}
                                onClick={() => {
                                  setOpenMenuId(null);
                                  setMenuPos(null);
                                }}
                                className="flex items-center gap-2 px-3 py-2 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors font-medium"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-zinc-500" />
                                <span>Edit cronjob</span>
                              </Link>

                              <button
                                type="button"
                                onClick={() => {
                                  triggerMutation.mutate(job.id);
                                  setOpenMenuId(null);
                                  setMenuPos(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-left"
                              >
                                <Play className="w-3.5 h-3.5 text-zinc-500" />
                                <span>Run now</span>
                              </button>

                              <div className="my-1 border-t border-zinc-200 dark:border-zinc-800" />

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuId(null);
                                  setMenuPos(null);
                                  setJobToDelete(job);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-left font-semibold"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete cronjob</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Custom Delete Confirmation Modal */}
      {jobToDelete && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="p-2 rounded-full bg-rose-500/10 border border-rose-500/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Delete Cronjob</h3>
                <p className="text-xs text-zinc-500">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
              Are you sure you want to delete <strong className="text-zinc-900 dark:text-zinc-100 font-semibold">{jobToDelete.name}</strong>? All associated execution logs and automated triggers will be permanently removed.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-900">
              <button
                type="button"
                onClick={() => setJobToDelete(null)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md border border-zinc-300 dark:border-zinc-800 transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => deleteMutation.mutate(jobToDelete.id)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-md transition-all shadow-xs flex items-center gap-2"
              >
                {deleteMutation.isPending ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete Cronjob</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
