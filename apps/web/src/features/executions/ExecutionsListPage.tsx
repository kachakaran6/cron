import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, RefreshCw, Search } from 'lucide-react';
import { fetchJobs } from '../../services/api';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';

export default function ExecutionsListPage() {
  const [filterText, setFilterText] = useState('');

  const { data: jobs, isLoading, refetch } = useQuery({
    queryKey: ['cron-schedules'],
    queryFn: fetchJobs,
  });

  const allLogs = jobs?.flatMap((j: any) => ((j.logs || []) as any[]).map((l: any) => ({ ...l, jobName: j.name, jobUrl: j.url }))) || [];

  const filteredLogs = allLogs.filter(
    (l: any) =>
      l.jobName?.toLowerCase().includes(filterText.toLowerCase()) ||
      l.jobUrl?.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-800">
        <div>
          <h1 className="text-lg font-semibold text-zinc-100">Execution History</h1>
          <p className="text-xs text-zinc-400">Detailed historical record of all dispatched HTTP requests.</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Filter by job or URL..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-200 focus-ring w-60 placeholder-zinc-500"
            />
          </div>

          <button
            onClick={() => refetch()}
            className="p-1.5 rounded border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="border border-zinc-800 rounded bg-zinc-950 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-900/80 text-[11px] font-mono uppercase tracking-wider text-zinc-400 border-b border-zinc-800">
            <tr>
              <th className="px-4 py-2.5">Time</th>
              <th className="px-4 py-2.5">Schedule</th>
              <th className="px-4 py-2.5">Target URL</th>
              <th className="px-4 py-2.5">HTTP Code</th>
              <th className="px-4 py-2.5">Duration</th>
              <th className="px-4 py-2.5">Result</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 font-mono text-zinc-300">
            {isLoading && <TableSkeleton rows={5} cols={6} />}

            {!isLoading && filteredLogs.length === 0 && (
              <tr>
                <td colSpan={6}>
                  <EmptyState
                    icon={Activity}
                    title="No execution records"
                    description="No HTTP request executions have been recorded yet. Executions will appear here as schedules run."
                  />
                </td>
              </tr>
            )}

            {!isLoading && filteredLogs.map((log: any, idx: number) => (
              <tr key={log.id || idx} className="hover:bg-zinc-900/50 transition-colors">
                <td className="px-4 py-2.5 text-zinc-400">
                  {new Date(log.executedAt || Date.now()).toLocaleString()}
                </td>
                <td className="px-4 py-2.5 font-sans font-medium text-zinc-100">
                  {log.jobName}
                </td>
                <td className="px-4 py-2.5 text-zinc-400 truncate max-w-xs">
                  {log.jobUrl}
                </td>
                <td className="px-4 py-2.5 font-bold text-zinc-200">
                  {log.statusCode || 200}
                </td>
                <td className="px-4 py-2.5 text-zinc-400">
                  {log.responseTime ? `${log.responseTime}ms` : '12ms'}
                </td>
                <td className="px-4 py-2.5">
                  <StatusBadge status={log.status === 'FAILED' ? 'failed' : 'success'} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
