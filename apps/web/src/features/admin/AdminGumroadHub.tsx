import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CreditCard,
  DollarSign,
  Users,
  ShieldAlert,
  CheckCircle2,
  Clock,
  RefreshCw,
  ExternalLink,
  Settings,
  Save,
  Key,
  Database,
} from 'lucide-react';
import { fetchAdminGumroad, updateAdminGumroadConfig } from '../../services/api';

export default function AdminGumroadHub() {
  const queryClient = useQueryClient();
  const [productId, setProductId] = useState('');
  const [productPermalink, setProductPermalink] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-gumroad'],
    queryFn: async () => {
      const res = await fetchAdminGumroad();
      if (res?.config) {
        setProductId(res.config.productId !== 'Not set (optional)' ? res.config.productId : '');
        setProductPermalink(res.config.productPermalink || '');
      }
      return res;
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateAdminGumroadConfig,
    onSuccess: () => {
      setSaveSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['admin-gumroad'] });
      setTimeout(() => setSaveSuccess(false), 3000);
    },
  });

  const handleConfigSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      productId: productId.trim(),
      productPermalink: productPermalink.trim(),
      webhookSecret: webhookSecret.trim() || undefined,
    });
  };

  const metrics = data?.metrics;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[var(--accent)]" />
            <span>Gumroad Monetization &amp; Subscriptions Hub</span>
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Real-time subscriber telemetry, MRR calculation, webhook audit logs, and integration settings.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 text-xs">
            <span>Estimated MRR</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 mt-1">
            ${metrics?.estimatedMrr ?? 0}
            <span className="text-xs font-normal text-zinc-500"> / mo</span>
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">$19/mo per active Pro subscriber</div>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 text-xs">
            <span>Active Pro Users</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
            {metrics?.activePro ?? 0}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">Paying subscriber organizations</div>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 text-xs">
            <span>Grace Period (Cancelled)</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
            {metrics?.cancelledGracePeriod ?? 0}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">Active until billing period ends</div>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 text-xs">
            <span>Expired / Churned</span>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 mt-1">
            {metrics?.expired ?? 0}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">Downgraded to Free tier</div>
        </div>
      </div>

      {/* Integration Configuration Form */}
      <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-zinc-100">
            <Settings className="w-4 h-4 text-[var(--accent)]" />
            <span>Gumroad Integration Settings</span>
          </div>
          {saveSuccess && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Settings Saved!
            </span>
          )}
        </div>

        <form onSubmit={handleConfigSave} className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Product Permalink URL
            </label>
            <input
              type="text"
              placeholder="https://samast.gumroad.com/l/pro"
              value={productPermalink}
              onChange={(e) => setProductPermalink(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-md text-xs font-mono text-zinc-900 dark:text-zinc-100 focus-ring shadow-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Product ID (Optional verification lock)
            </label>
            <input
              type="text"
              placeholder="e.g. your_gumroad_product_id"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-md text-xs font-mono text-zinc-900 dark:text-zinc-100 focus-ring shadow-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Webhook Secret (Optional HMAC verification)
            </label>
            <input
              type="password"
              placeholder={data?.config?.webhookSecretConfigured ? '••••••••••••' : 'Enter webhook secret'}
              value={webhookSecret}
              onChange={(e) => setWebhookSecret(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-md text-xs font-mono text-zinc-900 dark:text-zinc-100 focus-ring shadow-xs"
            />
          </div>

          <div className="md:col-span-3 flex justify-between items-center pt-2">
            <div className="text-[11px] text-zinc-500 font-mono">
              Webhook URL: <span className="text-[var(--accent)] select-all">https://cron.samast.pro/api/v1/webhooks/gumroad</span>
            </div>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="inline-flex items-center gap-1.5 px-4 py-2 btn-accent text-xs font-semibold rounded-md shadow-xs disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{updateMutation.isPending ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Linked Gumroad Accounts */}
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950 shadow-xs overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="font-bold text-xs text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Key className="w-3.5 h-3.5 text-amber-500" />
            <span>Recent Linked Gumroad Accounts ({data?.recentAccounts?.length ?? 0})</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-900/80 text-[11px] font-mono uppercase text-zinc-500 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="px-4 py-2.5">Buyer Email</th>
                <th className="px-4 py-2.5">Customer Name</th>
                <th className="px-4 py-2.5">License Key</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Purchase Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60 text-zinc-700 dark:text-zinc-300 font-sans">
              {data?.recentAccounts?.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-zinc-500 text-xs">
                    No linked Gumroad accounts found yet.
                  </td>
                </tr>
              )}
              {data?.recentAccounts?.map((acc: any) => (
                <tr key={acc.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40">
                  <td className="px-4 py-2.5 font-mono text-[11px] text-zinc-900 dark:text-zinc-100">
                    {acc.purchaseEmail}
                  </td>
                  <td className="px-4 py-2.5">{acc.customerName || '—'}</td>
                  <td className="px-4 py-2.5 font-mono text-[11px] text-zinc-500">
                    {acc.licenseKey}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        acc.status === 'ACTIVE'
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                          : acc.status === 'CANCELLED'
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                          : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                      }`}
                    >
                      {acc.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[11px] text-zinc-500">
                    {acc.purchaseDate ? new Date(acc.purchaseDate).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950 shadow-xs overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="font-bold text-xs text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-indigo-500" />
            <span>Gumroad Audit &amp; Webhook Synchronization Trail</span>
          </div>
          <span className="text-[11px] text-zinc-500 font-mono">Last 50 Events</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-900/80 text-[11px] font-mono uppercase text-zinc-500 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="px-4 py-2.5">Timestamp</th>
                <th className="px-4 py-2.5">Event Type</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">License / Sub ID</th>
                <th className="px-4 py-2.5">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60 text-zinc-700 dark:text-zinc-300 font-sans">
              {data?.recentLogs?.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-zinc-500 text-xs">
                    No sync logs recorded yet.
                  </td>
                </tr>
              )}
              {data?.recentLogs?.map((log: any) => (
                <tr key={log.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40">
                  <td className="px-4 py-2.5 font-mono text-[11px] text-zinc-500 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 font-mono font-semibold text-[11px] uppercase text-zinc-800 dark:text-zinc-200">
                    {log.eventType}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        log.status === 'SUCCESS'
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                          : log.status === 'IGNORED'
                          ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                          : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[11px] text-zinc-500">
                    {log.licenseKey || log.gumroadSubscriptionId || '—'}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[11px] text-zinc-600 dark:text-zinc-400 truncate max-w-xs">
                    {JSON.stringify(log.details || log.errorMessage || {})}
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
