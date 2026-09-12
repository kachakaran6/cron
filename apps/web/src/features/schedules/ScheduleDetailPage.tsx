import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Play } from 'lucide-react';
import { fetchJobById, triggerJobExecution } from '../../services/api';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { CodeBlock } from '../../components/ui/CodeBlock';

export default function ScheduleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'executions' | 'request'>('overview');
  const [selectedExecution, setSelectedExecution] = useState<any>(null);

  const { data: job, isLoading } = useQuery({
    queryKey: ['schedule-detail', id],
    queryFn: () => fetchJobById(id!),
    enabled: !!id,
  });

  const triggerMutation = useMutation({
    mutationFn: () => triggerJobExecution(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule-detail', id] });
    },
  });

  if (isLoading) {
    return <div className="py-12 text-center text-xs text-zinc-500 font-mono">Loading schedule metadata...</div>;
  }

  if (!job) {
    return <div className="py-12 text-center text-xs text-zinc-400">Schedule not found.</div>;
  }

  const logs = (job as any).logs || (job as any).executionLogs || [];

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard/schedules"
            className="p-1.5 rounded border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-zinc-100">{job.name}</h1>
              <StatusBadge status={job.enabled ? 'active' : 'paused'} />
            </div>
            <p className="text-xs font-mono text-zinc-400 mt-0.5">{job.url}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => triggerMutation.mutate()}
            disabled={triggerMutation.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs transition-colors disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{triggerMutation.isPending ? 'Executing...' : 'Run now'}</span>
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-zinc-800 text-xs font-medium">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 border-b-2 transition-colors ${
            activeTab === 'overview'
              ? 'border-zinc-100 text-zinc-100 font-semibold'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('executions')}
          className={`px-4 py-2 border-b-2 transition-colors ${
            activeTab === 'executions'
              ? 'border-zinc-100 text-zinc-100 font-semibold'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Executions ({logs.length})
        </button>
        <button
          onClick={() => setActiveTab('request')}
          className={`px-4 py-2 border-b-2 transition-colors ${
            activeTab === 'request'
              ? 'border-zinc-100 text-zinc-100 font-semibold'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Request Config
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border border-zinc-800 rounded bg-zinc-950">
            <div className="text-[11px] font-mono uppercase text-zinc-400 mb-1">Target Endpoint</div>
            <div className="font-mono text-xs text-zinc-100 truncate">{job.url}</div>
          </div>

          <div className="p-4 border border-zinc-800 rounded bg-zinc-950">
            <div className="text-[11px] font-mono uppercase text-zinc-400 mb-1">Schedule &amp; Timezone</div>
            <div className="font-mono text-xs text-zinc-100">{job.schedule} ({job.timezone || 'UTC'})</div>
          </div>

          <div className="p-4 border border-zinc-800 rounded bg-zinc-950">
            <div className="text-[11px] font-mono uppercase text-zinc-400 mb-1">Next Execution</div>
            <div className="font-mono text-xs text-zinc-100">{new Date(job.nextRunAt).toLocaleString()}</div>
          </div>
        </div>
      )}

      {/* Tab 2: Executions List */}
      {activeTab === 'executions' && (
        <div className="border border-zinc-800 rounded bg-zinc-950 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-900/80 text-[11px] font-mono uppercase text-zinc-400 border-b border-zinc-800">
              <tr>
                <th className="px-4 py-2.5">Time</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">HTTP Status</th>
                <th className="px-4 py-2.5">Duration</th>
                <th className="px-4 py-2.5 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-mono text-zinc-300">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-zinc-500 text-xs">
                    No execution logs recorded yet.
                  </td>
                </tr>
              ) : (
                logs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-zinc-900/50 transition-colors">
                    <td className="px-4 py-2.5 text-zinc-400">
                      {new Date(log.executedAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={log.status === 'SUCCESS' ? 'success' : 'failed'} />
                    </td>
                    <td className="px-4 py-2.5 font-semibold text-zinc-200">
                      {log.statusCode || '—'}
                    </td>
                    <td className="px-4 py-2.5 text-zinc-400">
                      {log.responseTime ? `${log.responseTime}ms` : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        onClick={() => setSelectedExecution(log)}
                        className="text-xs text-zinc-400 hover:text-zinc-100 underline"
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
      )}

      {/* Tab 3: Request Config */}
      {activeTab === 'request' && (
        <div className="space-y-4">
          <div className="p-4 border border-zinc-800 rounded bg-zinc-950 space-y-2">
            <h3 className="text-xs font-mono uppercase text-zinc-400 font-semibold">HTTP Method &amp; URL</h3>
            <div className="font-mono text-xs text-zinc-200">{job.method} {job.url}</div>
          </div>

          {job.body && (
            <div className="p-4 border border-zinc-800 rounded bg-zinc-950 space-y-2">
              <h3 className="text-xs font-mono uppercase text-zinc-400 font-semibold">Configured Payload</h3>
              <CodeBlock code={job.body} language="json" />
            </div>
          )}
        </div>
      )}

      {/* Detailed Execution Inspector Drawer */}
      {selectedExecution && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-end z-50">
          <div className="w-full max-w-xl bg-zinc-950 border-l border-zinc-800 p-6 space-y-5 overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h2 className="text-sm font-semibold text-zinc-100">Execution Technical Inspector</h2>
              <button
                onClick={() => setSelectedExecution(null)}
                className="text-xs text-zinc-400 hover:text-zinc-100 font-mono"
              >
                [ Close ]
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 border border-zinc-800 rounded bg-zinc-900">
                <span className="text-zinc-500 block text-[10px]">HTTP STATUS</span>
                <span className="font-bold text-zinc-100">{selectedExecution.statusCode || 200}</span>
              </div>
              <div className="p-3 border border-zinc-800 rounded bg-zinc-900">
                <span className="text-zinc-500 block text-[10px]">DURATION</span>
                <span className="font-bold text-zinc-100">{selectedExecution.responseTime || 15}ms</span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-mono text-zinc-400 font-semibold uppercase">Response Body</span>
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
