import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, AlertTriangle, XCircle, Clock, ExternalLink, Activity, ShieldCheck, ArrowLeft } from 'lucide-react';
import { fetchPublicStatusPage } from '../services/api';
import { Footer } from '../components/layout/Footer';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export default function PublicStatusPage() {
  const { slug } = useParams<{ slug: string }>();
  const { theme, toggleTheme } = useTheme();
  const dark = theme === 'dark';

  const { data, isLoading, isError } = useQuery({
    queryKey: ['public-status-page', slug],
    queryFn: () => fetchPublicStatusPage(slug!),
    enabled: !!slug,
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center font-mono text-xs text-zinc-500">
        Loading system status...
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4 text-center">
        <XCircle className="w-10 h-10 text-rose-500 mb-3" />
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Status Page Not Found</h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm">
          The requested status page is private or does not exist.
        </p>
        <Link
          to="/"
          className="mt-4 px-4 py-2 rounded-md btn-accent text-xs font-semibold shadow-xs"
        >
          Return to Samast Cron
        </Link>
      </div>
    );
  }

  const isAllOperational = data.systemStatus === 'All Systems Operational';
  const incidents = Array.isArray(data.incidents) ? data.incidents : [];
  const activeIncidents = incidents.filter((i: any) => i.status !== 'RESOLVED');
  const pastIncidents = incidents.filter((i: any) => i.status === 'RESOLVED');
  const monitors = Array.isArray(data.monitors) ? data.monitors : [];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 antialiased selection:bg-[var(--accent)] selection:text-white pb-16">
      {/* Top Navigation */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {data.logoUrl ? (
              <img src={data.logoUrl} alt={data.title} className="h-8 max-w-[140px] object-contain rounded" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center text-white font-bold text-sm shadow-sm">
                {data.title.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-100">{data.title}</h1>
              <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Status
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
              title="Toggle Theme"
            >
              {dark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 hidden sm:inline">
              Updated {new Date(data.updatedAt).toLocaleTimeString()}
            </span>
            <Link
              to="/dashboard"
              className="text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              Dashboard &rarr;
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        {/* Big Overall Status Banner */}
        <div
          className={`p-5 rounded-xl border flex items-center justify-between shadow-xs transition-all ${
            isAllOperational
              ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200'
              : 'border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200'
          }`}
        >
          <div className="flex items-center gap-3.5">
            {isAllOperational ? (
              <CheckCircle2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-7 h-7 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            )}
            <div>
              <h2 className="text-base font-bold">{data.systemStatus}</h2>
              <p className="text-xs opacity-80 mt-0.5">
                {isAllOperational
                  ? 'All monitored endpoints and scheduled jobs are responding with 100% healthy signals.'
                  : 'One or more systems are experiencing degraded availability or active maintenance.'}
              </p>
            </div>
          </div>
        </div>

        {/* Active Incidents (if any) */}
        {activeIncidents.length > 0 && (
          <section className="space-y-3">
            <h3 className="text-xs font-mono uppercase font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> Active Incidents
            </h3>
            <div className="space-y-3">
              {activeIncidents.map((incident: any) => (
                <div
                  key={incident.id}
                  className="p-4 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-white dark:bg-zinc-900 shadow-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{incident.title}</h4>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded font-semibold bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300">
                      {incident.status}
                    </span>
                  </div>
                  {incident.message && (
                    <p className="text-xs text-zinc-600 dark:text-zinc-300">{incident.message}</p>
                  )}
                  <div className="text-[11px] font-mono text-zinc-400">
                    Started: {new Date(incident.startDate).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Monitored Services */}
        <section className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800">
            <h3 className="text-xs font-mono uppercase font-semibold text-zinc-500 dark:text-zinc-400">
              Monitored Systems &amp; Services Performance
            </h3>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
              {monitors.length} Service{monitors.length === 1 ? '' : 's'}
            </span>
          </div>

          {monitors.length === 0 ? (
            <div className="p-8 text-center border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-xs text-zinc-500">
              No status monitors attached to this page yet.
            </div>
          ) : (
            <div className="space-y-3">
              {monitors.map((monitor: any) => {
                const config = data.config || {};
                const customColors = config.customColors || {};

                return (
                  <div
                    key={monitor.id}
                    className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 shadow-xs space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {config.showServiceHealthScores !== false && monitor.healthRank && (
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                              #{monitor.healthRank}
                            </span>
                          )}
                          <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{monitor.name}</h4>

                          {config.showServiceHealthScores !== false && monitor.healthGrade && (
                            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                              monitor.healthGrade === 'A+' || monitor.healthGrade === 'A'
                                ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                                : monitor.healthGrade === 'B'
                                ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                                : 'bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                            }`}>
                              Grade: {monitor.healthGrade}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                          <span>Uptime: <strong className="text-zinc-800 dark:text-zinc-200">{monitor.uptime}</strong></span>
                          {config.showLatencyMetrics !== false && monitor.avgLatency && (
                            <span>Avg Latency: <strong className="text-zinc-800 dark:text-zinc-200">{monitor.avgLatency}</strong></span>
                          )}
                          {config.showLatencyMetrics !== false && monitor.p95Latency && (
                            <span>p95: <strong className="text-zinc-800 dark:text-zinc-200">{monitor.p95Latency}</strong></span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {config.showResponseCodes !== false && monitor.lastStatusCode && (
                          <span
                            className="px-2 py-0.5 rounded text-[11px] font-mono font-bold text-white shadow-2xs"
                            style={{
                              backgroundColor:
                                monitor.lastStatusCode >= 200 && monitor.lastStatusCode < 300
                                  ? customColors.successColor || '#10b981'
                                  : monitor.lastStatusCode >= 300 && monitor.lastStatusCode < 400
                                  ? customColors.redirectColor || '#3b82f6'
                                  : monitor.lastStatusCode >= 400 && monitor.lastStatusCode < 500
                                  ? customColors.clientErrorColor || '#f59e0b'
                                  : customColors.serverErrorColor || '#ef4444',
                            }}
                          >
                            HTTP {monitor.lastStatusCode}
                          </span>
                        )}

                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded ${
                            monitor.status === 'Operational'
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                              : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {monitor.status}
                        </span>
                      </div>
                    </div>

                    {/* Pro Options: Headers and Payload Details Viewers */}
                    {(config.showHeaders || config.showPayload) && (
                      <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 space-y-2">
                        {config.showHeaders && monitor.lastResponseHeaders && (
                          <details className="text-xs font-mono group">
                            <summary className="cursor-pointer text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 text-[11px] font-semibold">
                              ▶ View Captured Response Headers
                            </summary>
                            <pre className="mt-1.5 p-3 rounded bg-zinc-950 text-zinc-200 overflow-x-auto text-[11px] whitespace-pre-wrap break-all border border-zinc-800">
                              {monitor.lastResponseHeaders}
                            </pre>
                          </details>
                        )}

                        {config.showPayload && monitor.lastResponseBody && (
                          <details className="text-xs font-mono group">
                            <summary className="cursor-pointer text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 text-[11px] font-semibold">
                              ▶ View Response Body Payload Snippet
                            </summary>
                            <pre className="mt-1.5 p-3 rounded bg-zinc-950 text-zinc-200 overflow-x-auto text-[11px] whitespace-pre-wrap break-all border border-zinc-800">
                              {monitor.lastResponseBody}
                            </pre>
                          </details>
                        )}
                      </div>
                    )}

                    {/* Health Bars History Indicator */}
                    {config.showUptimeBarChart !== false && (
                      <div className="space-y-1 pt-1">
                        <div className="flex items-center gap-1 h-6">
                          {Array.from({ length: 30 }).map((_, i) => {
                            const run = monitor.recentRuns?.[29 - i];
                            const isSuccess = !run || run.status === 'SUCCESS';
                            return (
                              <div
                                key={i}
                                className={`flex-1 h-5 rounded-[2px] transition-all hover:scale-y-125 ${
                                  isSuccess
                                    ? 'bg-emerald-500 hover:bg-emerald-400'
                                    : 'bg-rose-500 hover:bg-rose-400'
                                }`}
                                title={
                                  run
                                    ? `${new Date(run.startedAt).toLocaleString()}: ${run.status} (${run.durationMs}ms)`
                                    : '100% Operational signal'
                                }
                              />
                            );
                          })}
                        </div>
                        <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                          <span>30 runs ago</span>
                          <span>Today</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Past Incidents */}
        <section className="space-y-3 pt-4">
          <h3 className="text-xs font-mono uppercase font-semibold text-zinc-500 dark:text-zinc-400">
            Past Incidents &amp; Maintenance
          </h3>

          {pastIncidents.length === 0 ? (
            <div className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-xs text-zinc-500 dark:text-zinc-400 text-center">
              No incidents reported in the last 90 days.
            </div>
          ) : (
            <div className="space-y-3">
              {pastIncidents.map((incident: any) => (
                <div
                  key={incident.id}
                  className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{incident.title}</h4>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-semibold">
                      Resolved
                    </span>
                  </div>
                  {incident.message && (
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">{incident.message}</p>
                  )}
                  <div className="text-[10px] font-mono text-zinc-400">
                    {new Date(incident.startDate).toLocaleDateString()} — Resolved
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Full Width Footer */}
      <div className="mt-16 border-t border-zinc-200 dark:border-zinc-800/80">
        <Footer dark={dark} />
      </div>
    </div>
  );
}
