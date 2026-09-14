import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, RefreshCw, Search, Eye, Filter, Code2 } from 'lucide-react';
import { fetchJobs } from '../../services/api';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import ResponsePreviewModal, { detectResponseType, ExecutionLogDetail } from '../../components/ui/ResponsePreviewModal';

export default function ExecutionsListPage() {
  const [filterText, setFilterText] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUCCESS' | 'FAILED'>('ALL');
  const [selectedLog, setSelectedLog] = useState<ExecutionLogDetail | null>(null);

  const { data: jobs, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['cron-schedules'],
    queryFn: fetchJobs,
    refetchInterval: 5000,
  });

  const allLogs = useMemo(() => {
    if (!jobs) return [];
    const extracted = jobs.flatMap((j: any) =>
      ((j.logs || j.executionLogs || []) as any[]).map((l: any) => ({
        ...l,
        jobName: j.name,
        jobUrl: j.url,
        method: j.method || 'GET',
        statusCode: l.statusCode ?? l.httpStatus ?? null,
        responseTime: l.responseTime || l.durationMs || 0,
        executedAt: l.executedAt || l.startedAt || new Date().toISOString(),
      }))
    );

    // Sort descending by execution timestamp
    return extracted.sort(
      (a: any, b: any) => new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime()
    );
  }, [jobs]);

  const filteredLogs = useMemo(() => {
    return allLogs.filter((l: any) => {
      const matchesText =
        l.jobName?.toLowerCase().includes(filterText.toLowerCase()) ||
        l.jobUrl?.toLowerCase().includes(filterText.toLowerCase()) ||
        String(l.statusCode).includes(filterText);

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'SUCCESS' && (l.status === 'SUCCESS' || (!l.status && l.statusCode < 400))) ||
        (statusFilter === 'FAILED' && (l.status === 'FAILED' || l.statusCode >= 400));

      return matchesText && matchesStatus;
    });
  }, [allLogs, filterText, statusFilter]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            Execution History
            <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              {allLogs.length} Records
            </span>
          </h1>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
            Detailed historical logs of all scheduled and manual HTTP request dispatches with smart response previewing.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-md border border-zinc-200 dark:border-zinc-800 text-xs">
            <Filter className="w-3 h-3 text-zinc-400 ml-1.5" />
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                statusFilter === 'ALL'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('SUCCESS')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                statusFilter === 'SUCCESS'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              Success
            </button>
            <button
              onClick={() => setStatusFilter('FAILED')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                statusFilter === 'FAILED'
                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              Failed
            </button>
          </div>

          {/* Search Box */}
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
            className={`p-2 rounded-md border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shadow-xs flex-shrink-0 ${
              isRefetching ? 'animate-spin text-indigo-500' : ''
            }`}
            title="Refresh History Logs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Execution Logs Table */}
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 shadow-sm dark:shadow-none overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[700px] w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-900/80 text-[11px] font-mono uppercase tracking-wider text-zinc-600 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Schedule Name</th>
                <th className="px-4 py-3">Target Endpoint</th>
                <th className="px-4 py-3">HTTP Code</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3">Format</th>
                <th className="px-4 py-3">Result</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60 font-mono text-zinc-700 dark:text-zinc-300">
              {isLoading && <TableSkeleton rows={6} cols={8} />}

              {!isLoading && filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-4">
                    <EmptyState
                      icon={Activity}
                      title="No execution records found"
                      description={
                        filterText || statusFilter !== 'ALL'
                          ? 'No execution logs match your active filter criteria. Try adjusting your search query.'
                          : 'No HTTP request executions have been recorded yet. Dispatched schedule executions will appear here automatically.'
                      }
                    />
                  </td>
                </tr>
              )}

              {!isLoading &&
                filteredLogs.map((log: any, idx: number) => {
                  const format = detectResponseType(log.responseBody || log.errorMessage || '', log.contentType);
                  const isFail = log.status === 'FAILED' || log.status === 'BLOCKED_SSRF' || log.status === 'TIMED_OUT' || (log.statusCode && log.statusCode >= 400);

                  return (
                    <tr
                      key={log.id || idx}
                      onClick={() => setSelectedLog(log)}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-900/60 transition-colors cursor-pointer group"
                    >
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                        {new Date(log.executedAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-sans font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {log.jobName}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400 truncate max-w-xs">
                        <span className="text-[10px] px-1 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 mr-1.5 font-bold">
                          {log.method || 'GET'}
                        </span>
                        {log.jobUrl}
                      </td>
                      <td className="px-4 py-3 font-bold">
                        {log.statusCode ? (
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] ${
                              isFail
                                ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800'
                                : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                            }`}
                          >
                            {log.statusCode}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[11px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-700">
                            N/A
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                        {log.responseTime}ms
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          {format}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={isFail ? 'failed' : 'success'} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(log);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-900 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-zinc-700 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-300 border border-zinc-200 dark:border-zinc-800 hover:border-indigo-300 dark:hover:border-indigo-800 text-[11px] font-sans font-medium transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Inspect Response
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Response Preview Modal */}
      {selectedLog && (
        <ResponsePreviewModal
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
        />
      )}
    </div>
  );
}

