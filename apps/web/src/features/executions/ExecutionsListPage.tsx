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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Execution History</h1>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">Detailed historical record of all dispatched HTTP requests.</p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Filter by job or URL..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-md text-xs text-zinc-900 dark:text-zinc-100 focus-ring placeholder-zinc-400 dark:placeholder-zinc-500 shadow-xs"
            />
          </div>

          <button
            onClick={() => refetch()}
            className="p-2 rounded-md border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shadow-xs flex-shrink-0"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 shadow-sm dark:shadow-none overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[620px] w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-900/80 text-[11px] font-mono uppercase tracking-wider text-zinc-600 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Schedule</th>
                <th className="px-4 py-3">Target URL</th>
                <th className="px-4 py-3">HTTP Code</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60 font-mono text-zinc-700 dark:text-zinc-300">
              {isLoading && <TableSkeleton rows={5} cols={6} />}

              {!isLoading && filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-4">
                    <EmptyState
                      icon={Activity}
                      title="No execution records"
                      description="No HTTP request executions have been recorded yet. Executions will appear here as schedules run."
                    />
                  </td>
                </tr>
              )}

              {!isLoading && filteredLogs.map((log: any, idx: number) => (
                <tr key={log.id || idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {new Date(log.executedAt || Date.now()).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-sans font-semibold text-zinc-900 dark:text-zinc-100">
                    {log.jobName}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400 truncate max-w-xs">
                    {log.jobUrl}
                  </td>
                  <td className="px-4 py-3 font-bold text-zinc-900 dark:text-zinc-100">
                    {log.statusCode || 200}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {log.responseTime ? `${log.responseTime}ms` : '12ms'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={log.status === 'FAILED' ? 'failed' : 'success'} />
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
