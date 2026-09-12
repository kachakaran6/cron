import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { fetchJobRuns } from '../services/api';

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: runs, isLoading } = useQuery({
    queryKey: ['job-runs', id],
    queryFn: () => fetchJobRuns(id!),
    enabled: !!id,
    refetchInterval: 3000,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/dashboard/jobs')}
          className="p-2 rounded-lg border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Execution History Logs</h1>
          <p className="text-xs text-slate-400 font-mono">Job ID: {id}</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-md overflow-hidden shadow-xl">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950/60 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="px-6 py-3.5">Timestamp</th>
              <th className="px-6 py-3.5">Status</th>
              <th className="px-6 py-3.5">HTTP Code</th>
              <th className="px-6 py-3.5">Duration</th>
              <th className="px-6 py-3.5">Worker</th>
              <th className="px-6 py-3.5">Response Body</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500 text-sm">
                  Loading execution runs...
                </td>
              </tr>
            )}

            {!isLoading && runs?.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500 text-sm">
                  No execution logs recorded yet.
                </td>
              </tr>
            )}

            {runs?.map((run) => (
              <tr key={run.id} className="hover:bg-slate-900/60 transition-colors">
                <td className="px-6 py-4 font-mono text-xs text-slate-300">
                  {new Date(run.startedAt).toLocaleString()}
                </td>
                <td className="px-6 py-4">
                  {run.status === 'SUCCESS' && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      SUCCESS
                    </span>
                  )}
                  {run.status === 'FAILED' && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-rose-400 font-medium bg-rose-500/10 px-2.5 py-1 rounded border border-rose-500/20">
                      <XCircle className="w-3.5 h-3.5" />
                      FAILED
                    </span>
                  )}
                  {run.status === 'BLOCKED_SSRF' && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-amber-400 font-medium bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20">
                      <Clock className="w-3.5 h-3.5" />
                      BLOCKED_SSRF
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 font-mono text-xs">
                  {run.httpStatus ? (
                    <span className={run.httpStatus >= 200 && run.httpStatus < 300 ? 'text-emerald-400' : 'text-rose-400'}>
                      {run.httpStatus}
                    </span>
                  ) : (
                    <span className="text-slate-500">N/A</span>
                  )}
                </td>
                <td className="px-6 py-4 font-mono text-xs text-slate-300">
                  {run.durationMs}ms
                </td>
                <td className="px-6 py-4 font-mono text-xs text-slate-500">
                  {run.workerId}
                </td>
                <td className="px-6 py-4 font-mono text-xs text-slate-400 max-w-xs truncate">
                  {run.responseBody || run.errorMessage || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
