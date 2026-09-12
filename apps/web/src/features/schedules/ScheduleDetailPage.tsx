import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Play, Edit3, Trash2, Shield, Bell, CheckCircle2, Clock, Globe } from 'lucide-react';
import { fetchJobById, triggerJobExecution, deleteJob } from '../../services/api';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { CodeBlock } from '../../components/ui/CodeBlock';

export default function ScheduleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'executions' | 'request'>('overview');
  const [selectedExecution, setSelectedExecution] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { data: job, isLoading } = useQuery({
    queryKey: ['schedule-detail', id],
    queryFn: () => fetchJobById(id!),
    enabled: !!id,
  });

  const triggerMutation = useMutation({
    mutationFn: () => triggerJobExecution(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['cron-schedules'] });
      setActiveTab('executions');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteJob(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cron-schedules'] });
      navigate('/dashboard/schedules');
    },
  });

  if (isLoading) {
    return <div className="py-12 text-center text-xs text-zinc-500 font-mono">Loading schedule metadata...</div>;
  }

  if (!job) {
    return <div className="py-12 text-center text-xs text-zinc-600 dark:text-zinc-400">Schedule not found.</div>;
  }

  const logs = (job as any).logs || (job as any).executionLogs || [];
  const headers = (job.headers && typeof job.headers === 'object') ? Object.entries(job.headers) : [];

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-start sm:items-center gap-3">
          <Link
            to="/dashboard/schedules"
            className="p-1.5 rounded-md border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors shadow-xs flex-shrink-0 mt-0.5 sm:mt-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 mb-0.5">
              <Link to="/dashboard/schedules" className="hover:underline">
                Cronjobs
              </Link>
              <span>/</span>
              <span className="text-zinc-700 dark:text-zinc-300 font-medium truncate">{job.name}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 truncate">{job.name}</h1>
              <StatusBadge status={job.enabled ? 'active' : 'paused'} />
            </div>
            <p className="text-xs font-mono text-zinc-600 dark:text-zinc-400 mt-0.5 break-all sm:break-normal">{job.url}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <Link
            to={`/dashboard/schedules/${job.id}/edit`}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-medium transition-colors shadow-xs"
          >
            <Edit3 className="w-3.5 h-3.5 text-zinc-500" />
            <span>Edit</span>
          </Link>

          <button
            onClick={() => setShowDeleteModal(true)}
            disabled={deleteMutation.isPending}
            className="p-2 rounded-md border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 transition-colors"
            title="Delete cronjob"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => triggerMutation.mutate()}
            disabled={triggerMutation.isPending}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-md btn-accent font-semibold text-xs shadow-sm transition-all disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{triggerMutation.isPending ? 'Executing...' : 'Run now'}</span>
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="p-2 rounded-full bg-rose-500/10 border border-rose-500/20">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Delete Cronjob</h3>
                <p className="text-xs text-zinc-500">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
              Are you sure you want to delete <strong className="text-zinc-900 dark:text-zinc-100 font-semibold">{job.name}</strong>? All associated execution logs and automated triggers will be permanently removed.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-900">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md border border-zinc-300 dark:border-zinc-800 transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-md transition-all shadow-xs"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete Cronjob'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs Bar */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 text-xs font-medium overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-[var(--accent)] text-[var(--accent)] font-semibold'
              : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('executions')}
          className={`px-4 py-2.5 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'executions'
              ? 'border-[var(--accent)] text-[var(--accent)] font-semibold'
              : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          Executions ({logs.length})
        </button>
        <button
          onClick={() => setActiveTab('request')}
          className={`px-4 py-2.5 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'request'
              ? 'border-[var(--accent)] text-[var(--accent)] font-semibold'
              : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          Request Config
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            <div className="p-4 sm:p-5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 shadow-sm dark:shadow-none">
              <div className="text-[11px] font-mono uppercase text-zinc-500 dark:text-zinc-400 mb-1 font-semibold">Target Endpoint</div>
              <div className="font-mono text-xs text-zinc-900 dark:text-zinc-100 break-all">{job.url}</div>
            </div>

            <div className="p-4 sm:p-5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 shadow-sm dark:shadow-none">
              <div className="text-[11px] font-mono uppercase text-zinc-500 dark:text-zinc-400 mb-1 font-semibold">Schedule &amp; Timezone</div>
              <div className="font-mono text-xs text-zinc-900 dark:text-zinc-100">{job.schedule} ({job.timezone || 'UTC'})</div>
            </div>

            <div className="p-4 sm:p-5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 shadow-sm dark:shadow-none">
              <div className="text-[11px] font-mono uppercase text-zinc-500 dark:text-zinc-400 mb-1 font-semibold">Next Execution</div>
              <div className="font-mono text-xs text-zinc-900 dark:text-zinc-100">{new Date(job.nextRunAt).toLocaleString()}</div>
            </div>
          </div>

          {/* Alerting Rules Summary */}
          <div className="p-4 sm:p-5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 shadow-sm dark:shadow-none space-y-3">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-[var(--accent)]" />
              <h3 className="text-xs font-mono uppercase text-zinc-700 dark:text-zinc-300 font-semibold">Configured Alert Rules</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                <span className={`w-2 h-2 rounded-full ${job.notifyOnFailure !== false ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
                <span>Notify on failure (after {job.failureThreshold || 1} failure(s))</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                <span className={`w-2 h-2 rounded-full ${job.notifyOnRecovery !== false ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
                <span>Notify on recovery after failure</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                <span className={`w-2 h-2 rounded-full ${job.notifyOnDisable !== false ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
                <span>Notify if disabled due to failures</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                <span className={`w-2 h-2 rounded-full ${job.notifyTlsExpiry ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
                <span>Notify before TLS expiry ({job.tlsExpiryDays || 30} days)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Executions List */}
      {activeTab === 'executions' && (
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 shadow-sm dark:shadow-none overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-[580px] w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-900/80 text-[11px] font-mono uppercase tracking-wider text-zinc-600 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">HTTP Status</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60 font-mono text-zinc-700 dark:text-zinc-300">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-zinc-500 text-xs">
                      No execution logs recorded yet.
                    </td>
                  </tr>
                ) : (
                  logs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                        {new Date(log.executedAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={log.status === 'SUCCESS' ? 'success' : 'failed'} />
                      </td>
                      <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-200">
                        {log.statusCode || '—'}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                        {log.responseTime ? `${log.responseTime}ms` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setSelectedExecution(log)}
                          className="text-xs text-[var(--accent)] font-semibold hover:underline"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Request Config */}
      {activeTab === 'request' && (
        <div className="space-y-4">
          <div className="p-4 sm:p-5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 shadow-sm dark:shadow-none space-y-3">
            <h3 className="text-xs font-mono uppercase text-zinc-500 dark:text-zinc-400 font-semibold">HTTP Target</h3>
            <div className="font-mono text-xs text-zinc-900 dark:text-zinc-200 font-semibold break-all">
              <span className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 mr-2 uppercase">
                {job.method}
              </span>
              {job.url}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
              <div>
                <span className="text-zinc-500 block text-[11px]">Timeout</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">{Math.round((job.timeoutMs || 10000) / 1000)} seconds</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[11px]">3xx Redirects</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {job.redirectSuccess !== false ? 'Treated as success' : 'Followed strictly'}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[11px]">Response History</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {job.saveResponses !== false ? 'Saved in history' : 'Omitted'}
                </span>
              </div>
            </div>
          </div>

          {/* HTTP Auth */}
          {job.authUsername && (
            <div className="p-4 sm:p-5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 shadow-sm dark:shadow-none space-y-2">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[var(--accent)]" />
                <h3 className="text-xs font-mono uppercase text-zinc-700 dark:text-zinc-300 font-semibold">HTTP Authentication</h3>
              </div>
              <div className="text-xs font-mono text-zinc-700 dark:text-zinc-300">
                Username: <span className="font-semibold text-zinc-900 dark:text-zinc-100">{job.authUsername}</span> (Basic Auth active)
              </div>
            </div>
          )}

          {/* Custom Headers */}
          {headers.length > 0 && (
            <div className="p-4 sm:p-5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 shadow-sm dark:shadow-none space-y-2">
              <h3 className="text-xs font-mono uppercase text-zinc-500 dark:text-zinc-400 font-semibold">Custom Headers</h3>
              <div className="space-y-1 font-mono text-xs">
                {headers.map(([k, v]) => (
                  <div key={k} className="flex gap-2">
                    <span className="text-zinc-500 font-semibold">{k}:</span>
                    <span className="text-zinc-900 dark:text-zinc-200">{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {job.body && (
            <div className="p-4 sm:p-5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 shadow-sm dark:shadow-none space-y-2">
              <h3 className="text-xs font-mono uppercase text-zinc-500 dark:text-zinc-400 font-semibold">Configured Payload</h3>
              <CodeBlock code={job.body} language="json" />
            </div>
          )}
        </div>
      )}

      {/* Detailed Execution Inspector Drawer */}
      {selectedExecution && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-end z-50">
          <div className="w-full max-w-xl bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 p-4 sm:p-6 space-y-5 overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Execution Technical Inspector</h2>
              <button
                onClick={() => setSelectedExecution(null)}
                className="text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 font-mono px-2 py-1 rounded border border-zinc-300 dark:border-zinc-700"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3.5 border border-zinc-200 dark:border-zinc-800 rounded-md bg-zinc-50 dark:bg-zinc-900">
                <span className="text-zinc-500 block text-[10px] uppercase font-semibold">HTTP STATUS</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">{selectedExecution.statusCode || 200}</span>
              </div>
              <div className="p-3.5 border border-zinc-200 dark:border-zinc-800 rounded-md bg-zinc-50 dark:bg-zinc-900">
                <span className="text-zinc-500 block text-[10px] uppercase font-semibold">DURATION</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">{selectedExecution.responseTime || 15}ms</span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-mono text-zinc-700 dark:text-zinc-300 font-semibold uppercase">Response Body</span>
              <CodeBlock
                code={selectedExecution.responseBody || '{"status": "ok", "message": "Endpoint invoked successfully"}'}
                language="json"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
