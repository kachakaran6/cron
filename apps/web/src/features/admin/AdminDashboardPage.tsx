import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldAlert,
  Activity,
  Users,
  Terminal,
  Settings,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Shield,
  Zap,
  Server,
  ChevronRight,
  Database,
  Sliders,
  Cpu,
  HardDrive,
  Trash2,
  Clock,
  AlertOctagon,
  FileText,
  BarChart3,
  Globe,
  Bell,
  Key,
  LayoutDashboard,
  PieChart,
  Layers,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import {
  fetchAdminStats,
  fetchAdminLogs,
  fetchAdminUsers,
  updateAdminUserRole,
  updateAdminUserPlan,
  fetchAdminConfig,
  updateAdminConfig,
  clearAdminLogs,
  deleteAdminUser,
} from '../../services/api';

type AdminTab = 'overview' | 'state' | 'analytics' | 'users' | 'logs' | 'config';

export default function AdminDashboardPage() {
  const queryClient = useQueryClient();
  const { tab } = useParams<{ tab?: string }>();
  const navigate = useNavigate();

  const initialTab: AdminTab = (tab && ['overview', 'state', 'analytics', 'users', 'logs', 'config'].includes(tab))
    ? (tab as AdminTab)
    : 'overview';

  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);

  useEffect(() => {
    if (tab && ['overview', 'state', 'analytics', 'users', 'logs', 'config'].includes(tab)) {
      setActiveTab(tab as AdminTab);
    } else if (!tab) {
      setActiveTab('overview');
    }
  }, [tab]);

  const handleTabChange = (newTab: AdminTab) => {
    setActiveTab(newTab);
    navigate(`/dashboard/admin/${newTab}`);
  };

  // Logs state
  const [logLevel, setLogLevel] = useState<string>('ALL');
  const [logSearch, setLogSearch] = useState<string>('');
  const [expandedLogIndex, setExpandedLogIndex] = useState<number | null>(null);
  const [logClearSuccess, setLogClearSuccess] = useState<string | null>(null);

  // User filter state
  const [userSearch, setUserSearch] = useState<string>('');
  const [userToDelete, setUserToDelete] = useState<any | null>(null);

  // Queries
  const { data: stats, isLoading: isStatsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: fetchAdminStats,
    refetchInterval: 15000,
  });

  const { data: logsData, isLoading: isLogsLoading, refetch: refetchLogs } = useQuery({
    queryKey: ['admin-logs', logLevel, logSearch],
    queryFn: () => fetchAdminLogs({ level: logLevel, search: logSearch, limit: 100 }),
    refetchInterval: 10000,
  });

  const { data: usersData, isLoading: isUsersLoading, refetch: refetchUsers } = useQuery({
    queryKey: ['admin-users'],
    queryFn: fetchAdminUsers,
  });

  const { data: configData, isLoading: isConfigLoading, refetch: refetchConfig } = useQuery({
    queryKey: ['admin-config'],
    queryFn: fetchAdminConfig,
  });

  // Local config edit state
  const [configForm, setConfigForm] = useState<any>(null);

  React.useEffect(() => {
    if (configData && !configForm) {
      setConfigForm(configData);
    }
  }, [configData]);

  // Mutations
  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: 'admin' | 'user' }) => updateAdminUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });

  const planMutation = useMutation({
    mutationFn: ({ userId, planId }: { userId: string; planId: string }) => updateAdminUserPlan(userId, planId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  const configMutation = useMutation({
    mutationFn: updateAdminConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-config'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      alert('System runtime configuration updated successfully!');
    },
  });

  const clearLogsMutation = useMutation({
    mutationFn: clearAdminLogs,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-logs'] });
      setLogClearSuccess(res.message);
      setTimeout(() => setLogClearSuccess(null), 4000);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => deleteAdminUser(userId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      setUserToDelete(null);
      alert(res.message);
    },
    onError: (err: any) => {
      alert(`Error deleting user: ${err.message}`);
    },
  });

  const toggleMaintenanceMutation = useMutation({
    mutationFn: (currentMode: boolean) => updateAdminConfig({ maintenanceMode: !currentMode }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-config'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });

  const filteredUsers = usersData?.filter(
    (u) =>
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.name && u.name.toLowerCase().includes(userSearch.toLowerCase())) ||
      (u.organization?.name && u.organization.name.toLowerCase().includes(userSearch.toLowerCase()))
  );


  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">System Admin Control Center</h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Shield className="w-3 h-3" />
              SYSTEM ADMIN
            </span>
            {stats?.overview?.maintenanceMode && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 animate-pulse">
                <AlertOctagon className="w-3 h-3" />
                MAINTENANCE ACTIVE
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
            Full platform management: live telemetry, node process health, user directory, log streams & runtime security.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleMaintenanceMutation.mutate(!!stats?.overview?.maintenanceMode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors shadow-xs ${
              stats?.overview?.maintenanceMode
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500/20'
            }`}
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>{stats?.overview?.maintenanceMode ? 'Disable Maintenance' : 'Enable Maintenance Mode'}</span>
          </button>

          <button
            onClick={() => {
              refetchStats();
              refetchLogs();
              refetchUsers();
              refetchConfig();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh All</span>
          </button>
        </div>
      </div>

      {/* Active Page View Content */}
      <div className="space-y-6">
          {/* ── PAGE 1: OVERVIEW ────────────────────────────────────────────── */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <LayoutDashboard className="w-5 h-5 text-[var(--accent)]" />
                    <span>System Overview & Key Metrics</span>
                  </h2>
                  <p className="text-xs text-zinc-500">Live platform totals, table row volume, and active status.</p>
                </div>
              </div>

              {/* Key Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xs">
                  <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                    <span>Total Registered Users</span>
                    <Users className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="text-2xl font-bold font-mono tracking-tight text-zinc-900 dark:text-zinc-100">
                    {stats?.overview?.totalUsers ?? '—'}
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    {stats?.overview?.totalOrganizations ?? 0} organizations
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xs">
                  <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                    <span>Scheduled Jobs</span>
                    <Zap className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="text-2xl font-bold font-mono tracking-tight text-zinc-900 dark:text-zinc-100">
                    {stats?.overview?.totalCronJobs ?? '—'}
                  </div>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
                    {stats?.overview?.activeCronJobs ?? 0} enabled & executing
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xs">
                  <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                    <span>Execution Success (24h)</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="text-2xl font-bold font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
                    {stats?.executions24h?.successRatePercentage ?? 100}%
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    {stats?.executions24h?.totalRuns ?? 0} total HTTP dispatches
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xs">
                  <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                    <span>Avg Target Latency</span>
                    <Activity className="w-4 h-4 text-violet-500" />
                  </div>
                  <div className="text-2xl font-bold font-mono tracking-tight text-zinc-900 dark:text-zinc-100">
                    {stats?.executions24h?.averageLatencyMs ?? 0}
                    <span className="text-xs font-normal text-zinc-500 ml-1">ms</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1">Worker HTTP execution time</p>
                </div>
              </div>

              {/* Database Table Storage Row Telemetry */}
              <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-500" />
                    <span>Database Table Row Volumes</span>
                  </h3>
                  <span className="text-xs text-zinc-500 font-mono">Drizzle ORM Storage Engine</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                  <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <div className="text-[10px] font-mono text-zinc-500 flex items-center gap-1">
                      <Users className="w-3 h-3 text-blue-500" /> users
                    </div>
                    <div className="text-lg font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-0.5">
                      {stats?.tableCounts?.users ?? 0}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <div className="text-[10px] font-mono text-zinc-500 flex items-center gap-1">
                      <Server className="w-3 h-3 text-purple-500" /> orgs
                    </div>
                    <div className="text-lg font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-0.5">
                      {stats?.tableCounts?.organizations ?? 0}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <div className="text-[10px] font-mono text-zinc-500 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-500" /> cron_jobs
                    </div>
                    <div className="text-lg font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-0.5">
                      {stats?.tableCounts?.cronJobs ?? 0}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <div className="text-[10px] font-mono text-zinc-500 flex items-center gap-1">
                      <Activity className="w-3 h-3 text-emerald-500" /> job_runs
                    </div>
                    <div className="text-lg font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-0.5">
                      {stats?.tableCounts?.cronJobRuns ?? 0}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <div className="text-[10px] font-mono text-zinc-500 flex items-center gap-1">
                      <Globe className="w-3 h-3 text-indigo-500" /> status_pages
                    </div>
                    <div className="text-lg font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-0.5">
                      {stats?.tableCounts?.statusPages ?? 0}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <div className="text-[10px] font-mono text-zinc-500 flex items-center gap-1">
                      <Key className="w-3 h-3 text-cyan-500" /> api_keys
                    </div>
                    <div className="text-lg font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-0.5">
                      {stats?.tableCounts?.apiKeys ?? 0}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <div className="text-[10px] font-mono text-zinc-500 flex items-center gap-1">
                      <Bell className="w-3 h-3 text-rose-500" /> channels
                    </div>
                    <div className="text-lg font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-0.5">
                      {stats?.tableCounts?.notificationChannels ?? 0}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions Shortcuts */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab('users')}
                  className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-[var(--accent)] transition-colors text-left group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Users className="w-5 h-5 text-blue-500" />
                    <ArrowUpRight className="w-4 h-4 text-zinc-400 group-hover:text-[var(--accent)] transition-colors" />
                  </div>
                  <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">User Directory</div>
                  <div className="text-[11px] text-zinc-500">Manage user roles and plan tier upgrades</div>
                </button>

                <button
                  onClick={() => setActiveTab('logs')}
                  className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-[var(--accent)] transition-colors text-left group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Terminal className="w-5 h-5 text-emerald-500" />
                    <ArrowUpRight className="w-4 h-4 text-zinc-400 group-hover:text-[var(--accent)] transition-colors" />
                  </div>
                  <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">System Logs</div>
                  <div className="text-[11px] text-zinc-500">Stream application logs and stack traces</div>
                </button>

                <button
                  onClick={() => setActiveTab('config')}
                  className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-[var(--accent)] transition-colors text-left group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Sliders className="w-5 h-5 text-amber-500" />
                    <ArrowUpRight className="w-4 h-4 text-zinc-400 group-hover:text-[var(--accent)] transition-colors" />
                  </div>
                  <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Runtime Config</div>
                  <div className="text-[11px] text-zinc-500">Configure worker threads and security rules</div>
                </button>
              </div>
            </div>
          )}

          {/* ── PAGE 2: STATE & SYSTEM HEALTH ───────────────────────────────── */}
          {activeTab === 'state' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Server className="w-5 h-5 text-[var(--accent)]" />
                  <span>Node Process & System Health State</span>
                </h2>
                <p className="text-xs text-zinc-500">Real-time memory allocations, uptime, and cluster status.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Node Process Memory Card */}
                <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-sky-500" />
                      <span>Node Memory Telemetry</span>
                    </h3>
                    <span className="px-2 py-0.5 text-[10px] font-bold font-mono rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      {stats?.systemHealth?.status || 'HEALTHY'}
                    </span>
                  </div>

                  <div className="space-y-4 text-xs font-mono">
                    <div>
                      <div className="flex justify-between text-zinc-600 dark:text-zinc-400 mb-1">
                        <span>Heap Memory Used</span>
                        <span>{stats?.systemHealth?.heapUsedMb ?? 0} MB / {stats?.systemHealth?.heapTotalMb ?? 0} MB</span>
                      </div>
                      <div className="w-full bg-zinc-100 dark:bg-zinc-900 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-[var(--accent)] h-full transition-all duration-500"
                          style={{
                            width: `${Math.min(
                              100,
                              ((stats?.systemHealth?.heapUsedMb || 0) /
                                (stats?.systemHealth?.heapTotalMb || 1)) *
                                100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="pt-2 space-y-2 border-t border-zinc-100 dark:border-zinc-900">
                      <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                        <span className="text-zinc-500">RSS Process Memory:</span>
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">{stats?.systemHealth?.rssMemoryMb ?? 0} MB</span>
                      </div>

                      <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                        <span className="text-zinc-500">Process Uptime:</span>
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {Math.floor((stats?.systemHealth?.uptimeSeconds || 0) / 3600)}h{' '}
                          {Math.floor(((stats?.systemHealth?.uptimeSeconds || 0) % 3600) / 60)}m
                        </span>
                      </div>

                      <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                        <span className="text-zinc-500">Node Runtime:</span>
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">{stats?.systemHealth?.nodeVersion ?? 'v24.0.0'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Worker Execution State */}
                <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <HardDrive className="w-4 h-4 text-emerald-500" />
                      <span>Worker Infrastructure State</span>
                    </h3>
                    <span className="text-xs text-zinc-500">NodeJS Cluster</span>
                  </div>

                  <div className="space-y-3 text-xs font-mono">
                    <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                      <span className="text-zinc-500">Worker Concurrency Limit:</span>
                      <span className="font-bold text-zinc-900 dark:text-zinc-100">{configData?.workerConcurrency || 50} threads</span>
                    </div>

                    <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                      <span className="text-zinc-500">Default Execution Timeout:</span>
                      <span className="font-bold text-zinc-900 dark:text-zinc-100">{configData?.defaultTimeoutMs || 10000} ms</span>
                    </div>

                    <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                      <span className="text-zinc-500">SSRF Protection:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {configData?.blockPrivateIps !== false ? 'ENABLED' : 'DISABLED'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── PAGE 3: ANALYTICS & PERFORMANCE ─────────────────────────────── */}
          {activeTab === 'analytics' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[var(--accent)]" />
                  <span>Telemetry Analytics & Performance Bottlenecks</span>
                </h2>
                <p className="text-xs text-zinc-500">HTTP status distribution, throughput trends, and latency bottlenecks.</p>
              </div>

              {/* HTTP Status Code Distribution */}
              <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    HTTP Response Status Breakdown
                  </h3>
                  <span className="text-xs text-zinc-500">Dispatched Webhook Responses</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                    <div className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold">2xx SUCCESS</div>
                    <div className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-300 mt-1">
                      {stats?.statusDistribution?.code2xx ?? 0}
                    </div>
                    <div className="text-[10px] text-emerald-600/80 mt-0.5">200 OK / 201 Created</div>
                  </div>

                  <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
                    <div className="text-xs font-mono text-blue-600 dark:text-blue-400 font-bold">3xx REDIRECT</div>
                    <div className="text-2xl font-bold font-mono text-blue-700 dark:text-blue-300 mt-1">
                      {stats?.statusDistribution?.code3xx ?? 0}
                    </div>
                    <div className="text-[10px] text-blue-600/80 mt-0.5">301 / 302 Redirects</div>
                  </div>

                  <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                    <div className="text-xs font-mono text-amber-600 dark:text-amber-400 font-bold">4xx CLIENT ERR</div>
                    <div className="text-2xl font-bold font-mono text-amber-700 dark:text-amber-300 mt-1">
                      {stats?.statusDistribution?.code4xx ?? 0}
                    </div>
                    <div className="text-[10px] text-amber-600/80 mt-0.5">400 Bad Req / 404 Not Found</div>
                  </div>

                  <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20">
                    <div className="text-xs font-mono text-rose-600 dark:text-rose-400 font-bold">5xx / TIMEOUT</div>
                    <div className="text-2xl font-bold font-mono text-rose-700 dark:text-rose-300 mt-1">
                      {stats?.statusDistribution?.code5xx ?? 0}
                    </div>
                    <div className="text-[10px] text-rose-600/80 mt-0.5">500 Server Err / Timeout</div>
                  </div>
                </div>
              </div>

              {/* Throughput Chart */}
              <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      12-Hour Request Throughput & Success Rates
                    </h3>
                    <p className="text-xs text-zinc-500">HTTP requests dispatched per hourly interval</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Success
                    </span>
                    <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> Failed
                    </span>
                  </div>
                </div>

                <div className="pt-4 h-48 flex items-end justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
                  {stats?.charts?.hourlyThroughput?.map((item: any, idx: number) => {
                    const maxTotal = Math.max(
                      ...stats.charts.hourlyThroughput.map((h: any) => h.total),
                      10
                    );
                    const heightPercent = Math.min(100, (item.total / maxTotal) * 100);
                    const successPercent = item.total > 0 ? (item.success / item.total) * 100 : 100;

                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                        <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col bg-zinc-900 text-white text-[10px] p-2 rounded shadow-lg z-20 whitespace-nowrap">
                          <span className="font-semibold">{item.hour}</span>
                          <span>Total: {item.total}</span>
                          <span className="text-emerald-400">Success: {item.success}</span>
                          <span className="text-rose-400">Failed: {item.failed}</span>
                        </div>

                        <div className="w-full bg-zinc-100 dark:bg-zinc-900 rounded-t h-36 flex items-end overflow-hidden">
                          <div
                            style={{ height: `${Math.max(8, heightPercent)}%` }}
                            className="w-full flex flex-col justify-end transition-all duration-300"
                          >
                            <div
                              style={{ height: `${successPercent}%` }}
                              className="bg-emerald-500/80 hover:bg-emerald-500 transition-colors w-full"
                            />
                            {item.failed > 0 && (
                              <div
                                style={{ height: `${100 - successPercent}%` }}
                                className="bg-rose-500 hover:bg-rose-600 transition-colors w-full"
                              />
                            )}
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-500">{item.hour}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Top Slowest Endpoints Table */}
              <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span>Top 5 Slowest Target Endpoints</span>
                  </h3>
                  <span className="text-xs text-zinc-500">Target Response Bottlenecks</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50 dark:bg-zinc-900/80 text-[11px] font-mono uppercase tracking-wider text-zinc-500 border-b border-zinc-200 dark:border-zinc-800">
                      <tr>
                        <th className="px-4 py-2.5">Schedule Name</th>
                        <th className="px-4 py-2.5">Target Endpoint URL</th>
                        <th className="px-4 py-2.5">Avg Latency</th>
                        <th className="px-4 py-2.5 text-right">Executions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-mono">
                      {!stats?.topSlowestJobs?.length ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-6 text-center text-zinc-500">
                            No target endpoint latency data recorded yet.
                          </td>
                        </tr>
                      ) : (
                        stats.topSlowestJobs.map((j: any) => (
                          <tr key={j.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/40">
                            <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">{j.name}</td>
                            <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400 max-w-md truncate">{j.url}</td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 rounded font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                {j.avgLatencyMs} ms
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right text-zinc-500">{j.runCount} runs</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── PAGE 4: USER DIRECTORY & MANAGEMENT ───────────────────────── */}
          {activeTab === 'users' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <Users className="w-5 h-5 text-[var(--accent)]" />
                    <span>User Accounts & Organization Directory</span>
                  </h2>
                  <p className="text-xs text-zinc-500">Manage user roles, plan tiers, and account permissions.</p>
                </div>

                <div className="relative flex-1 sm:max-w-xs">
                  <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search users or emails..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-md text-zinc-900 dark:text-zinc-100 focus-ring placeholder-zinc-400"
                  />
                </div>
              </div>

              <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50 dark:bg-zinc-900/80 text-[11px] font-mono uppercase tracking-wider text-zinc-500 border-b border-zinc-200 dark:border-zinc-800">
                      <tr>
                        <th className="px-4 py-3">User / Email</th>
                        <th className="px-4 py-3">Role</th>
                        <th className="px-4 py-3">Organization / Plan</th>
                        <th className="px-4 py-3">Cron Jobs</th>
                        <th className="px-4 py-3">Registered Date</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                      {isUsersLoading ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                            Loading users directory...
                          </td>
                        </tr>
                      ) : !filteredUsers?.length ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                            No users found.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((u: any) => (
                          <tr key={u.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/40">
                            <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                                  {u.email[0]}
                                </div>
                                <div>
                                  <div>{u.name || u.email.split('@')[0]}</div>
                                  <div className="text-[11px] font-mono text-zinc-500">{u.email}</div>
                                </div>
                              </div>
                            </td>

                            <td className="px-4 py-3">
                              {u.role === 'admin' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                  <Shield className="w-3 h-3" /> ADMIN
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                                  USER
                                </span>
                              )}
                            </td>

                            <td className="px-4 py-3">
                              <div className="font-medium text-zinc-800 dark:text-zinc-200">
                                {u.organization?.name || 'Personal'}
                              </div>
                              <select
                                value={u.planId}
                                onChange={(e) =>
                                  planMutation.mutate({ userId: u.id, planId: e.target.value })
                                }
                                className="mt-0.5 bg-transparent text-[11px] font-mono text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 rounded px-1.5 py-0.5"
                              >
                                <option value="free">free plan</option>
                                <option value="pro">pro plan</option>
                                <option value="enterprise">enterprise plan</option>
                              </select>
                            </td>

                            <td className="px-4 py-3 font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                              {u.jobCount} jobs
                            </td>

                            <td className="px-4 py-3 text-zinc-500 font-mono text-[11px]">
                              {new Date(u.createdAt).toLocaleDateString()}
                            </td>

                            <td className="px-4 py-3 text-right space-x-2">
                              <button
                                onClick={() => {
                                  const newRole = u.role === 'admin' ? 'user' : 'admin';
                                  if (
                                    confirm(
                                      `Are you sure you want to ${
                                        newRole === 'admin' ? 'promote' : 'demote'
                                      } ${u.email} to ${newRole.toUpperCase()}?`
                                    )
                                  ) {
                                    roleMutation.mutate({ userId: u.id, role: newRole });
                                  }
                                }}
                                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors border ${
                                  u.role === 'admin'
                                    ? 'border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                                    : 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20'
                                }`}
                              >
                                {u.role === 'admin' ? 'Demote' : 'Promote'}
                              </button>

                              {u.email !== 'kachakaran6@gmail.com' && (
                                <button
                                  onClick={() => setUserToDelete(u)}
                                  className="px-2.5 py-1 text-xs rounded-md font-medium border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition-colors"
                                >
                                  Delete
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── PAGE 5: SYSTEM LOGS STREAM & TRACES ─────────────────────────── */}
          {activeTab === 'logs' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-[var(--accent)]" />
                    <span>Real-Time System File Log Stream</span>
                  </h2>
                  <p className="text-xs text-zinc-500">Live application logs, stack traces, and severity filters.</p>
                </div>
              </div>

              {/* Controls Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Severity:</span>
                  {['ALL', 'ERROR', 'WARN', 'INFO'].map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setLogLevel(lvl)}
                      className={`px-2.5 py-1 text-xs rounded-md font-mono transition-colors ${
                        logLevel === lvl
                          ? 'bg-[var(--accent)] text-white font-bold'
                          : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 flex-1 sm:max-w-md justify-end">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search log message or stack traces..."
                      value={logSearch}
                      onChange={(e) => setLogSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-md text-zinc-900 dark:text-zinc-100 focus-ring placeholder-zinc-400"
                    />
                  </div>

                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to clear/truncate all application log files?')) {
                        clearLogsMutation.mutate();
                      }
                    }}
                    disabled={clearLogsMutation.isPending}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-rose-500/30 bg-rose-500/10 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition-colors shadow-xs shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{clearLogsMutation.isPending ? 'Truncating...' : 'Clear Log Files'}</span>
                  </button>
                </div>
              </div>

              {logClearSuccess && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{logClearSuccess}</span>
                </div>
              )}

              {/* Logs List Container */}
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-950 text-zinc-100 p-4 font-mono text-xs space-y-2 max-h-[600px] overflow-y-auto">
                {isLogsLoading ? (
                  <div className="py-12 text-center text-zinc-500">Streaming application logs from files...</div>
                ) : !logsData?.logs?.length ? (
                  <div className="py-12 text-center text-zinc-500">No log entries found matching criteria.</div>
                ) : (
                  logsData.logs.map((log: any, idx: number) => (
                    <div
                      key={idx}
                      className={`border-b border-zinc-900/80 pb-2 transition-colors ${
                        expandedLogIndex === idx ? 'bg-zinc-900/60 p-3 rounded-lg' : 'hover:bg-zinc-900/30'
                      }`}
                    >
                      <div
                        onClick={() => setExpandedLogIndex(expandedLogIndex === idx ? null : idx)}
                        className="flex items-start justify-between cursor-pointer gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                              log.level === 'ERROR'
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                : log.level === 'WARN'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            }`}
                          >
                            {log.level}
                          </span>
                          <span className="text-zinc-500 text-[11px] whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                          <span className="text-zinc-400 text-[11px] font-semibold">[{log.category || 'HTTP'}]</span>
                          <span className="text-zinc-200 truncate">{log.message}</span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 text-[11px] text-zinc-500">
                          {log.durationMs && <span>{log.durationMs}ms</span>}
                          <ChevronRight
                            className={`w-3.5 h-3.5 transition-transform ${
                              expandedLogIndex === idx ? 'rotate-90' : ''
                            }`}
                          />
                        </div>
                      </div>

                      {/* Expanded Trace Details */}
                      {expandedLogIndex === idx && (
                        <div className="mt-3 pt-3 border-t border-zinc-800 space-y-2 text-[11px] animate-in fade-in duration-150">
                          {log.userEmail && (
                            <div className="text-zinc-400">
                              <span className="text-zinc-500">User Email:</span> {log.userEmail} ({log.userId})
                            </div>
                          )}
                          {log.stack && (
                            <div className="p-3 bg-black/80 rounded text-rose-300 font-mono text-[10px] overflow-x-auto whitespace-pre">
                              {log.stack}
                            </div>
                          )}
                          <div className="text-zinc-500 text-[10px]">
                            Raw Record JSON: <code className="text-zinc-300">{JSON.stringify(log)}</code>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ── PAGE 6: RUNTIME CONFIGURATION ───────────────────────────────── */}
          {activeTab === 'config' && (
            <div className="max-w-3xl space-y-6 animate-in fade-in duration-200">
              <div>
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-[var(--accent)]" />
                  <span>Execution Worker & Security Rules Configuration</span>
                </h2>
                <p className="text-xs text-zinc-500">Configure worker concurrency, execution timeouts, and SSRF rules.</p>
              </div>

              <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xs space-y-4">
                {isConfigLoading ? (
                  <div className="py-6 text-center text-xs text-zinc-500 font-mono">Loading configuration...</div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      configMutation.mutate(configForm);
                    }}
                    className="space-y-4 text-xs"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                          Worker Concurrency Threads
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={500}
                          value={configForm?.workerConcurrency || 50}
                          onChange={(e) =>
                            setConfigForm({ ...configForm, workerConcurrency: Number(e.target.value) })
                          }
                          className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-md font-mono text-zinc-900 dark:text-zinc-100"
                        />
                      </div>

                      <div>
                        <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                          Default Execution Timeout (ms)
                        </label>
                        <input
                          type="number"
                          min={1000}
                          max={60000}
                          value={configForm?.defaultTimeoutMs || 10000}
                          onChange={(e) =>
                            setConfigForm({ ...configForm, defaultTimeoutMs: Number(e.target.value) })
                          }
                          className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-md font-mono text-zinc-900 dark:text-zinc-100"
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
                      <label className="flex items-center gap-2 font-medium text-zinc-800 dark:text-zinc-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={configForm?.blockPrivateIps !== false}
                          onChange={(e) => setConfigForm({ ...configForm, blockPrivateIps: e.target.checked })}
                          className="w-4 h-4 rounded text-[var(--accent)]"
                        />
                        <span>Enforce SSRF Private IP Blocking</span>
                      </label>

                      <label className="flex items-center gap-2 font-medium text-zinc-800 dark:text-zinc-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={configForm?.maintenanceMode === true}
                          onChange={(e) => setConfigForm({ ...configForm, maintenanceMode: e.target.checked })}
                          className="w-4 h-4 rounded text-rose-500"
                        />
                        <span className="text-rose-600 dark:text-rose-400 font-bold">System Global Maintenance Mode</span>
                      </label>
                    </div>

                    <div className="flex justify-end pt-4">
                      <button
                        type="submit"
                        disabled={configMutation.isPending}
                        className="px-4 py-2 btn-accent font-semibold rounded-md shadow-sm transition-all"
                      >
                        {configMutation.isPending ? 'Saving...' : 'Save Configuration'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>

      {/* User Deletion Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-zinc-950 border border-rose-500/30 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Delete User Account</h3>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Are you sure you want to permanently delete user <strong className="text-zinc-900 dark:text-zinc-100">{userToDelete.email}</strong>?
              This will purge all associated organizations, scheduled jobs, execution run histories, status pages, and API keys. This action cannot be undone.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setUserToDelete(null)}
                className="px-3 py-1.5 rounded-md border border-zinc-300 dark:border-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteUserMutation.mutate(userToDelete.id)}
                disabled={deleteUserMutation.isPending}
                className="px-3 py-1.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors"
              >
                {deleteUserMutation.isPending ? 'Purging User...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
