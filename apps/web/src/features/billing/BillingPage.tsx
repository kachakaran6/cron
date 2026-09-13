import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  KeyRound,
  RefreshCw,
  Sparkles,
  Zap,
  ShieldCheck,
  Clock,
  Layers,
  HelpCircle,
} from 'lucide-react';
import {
  fetchUserSubscription,
  verifyGumroadLicense,
  syncGumroadSubscription,
  fetchGumroadTiers,
} from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function BillingPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [licenseKeyInput, setLicenseKeyInput] = useState('');
  const [verifyMessage, setVerifyMessage] = useState<{
    success: boolean;
    text: string;
    detail?: string;
  } | null>(null);

  const { data: subscription, isLoading } = useQuery({
    queryKey: ['user-subscription'],
    queryFn: fetchUserSubscription,
  });

  const { data: tiersData } = useQuery({
    queryKey: ['gumroad-tiers', user?.email],
    queryFn: () => fetchGumroadTiers(user?.email),
  });

  const verifyMutation = useMutation({
    mutationFn: (key: string) => verifyGumroadLicense(key),
    onSuccess: (data) => {
      setVerifyMessage({
        success: data.success,
        text: data.message,
      });
      setLicenseKeyInput('');
      queryClient.invalidateQueries({ queryKey: ['user-subscription'] });
    },
    onError: (err: any) => {
      setVerifyMessage({
        success: false,
        text: err?.message || 'Failed to verify license key. Please check your key and try again.',
      });
    },
  });

  const syncMutation = useMutation({
    mutationFn: syncGumroadSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-subscription'] });
      setVerifyMessage({
        success: true,
        text: 'Subscription re-synced with Gumroad successfully.',
      });
    },
    onError: (err: any) => {
      setVerifyMessage({
        success: false,
        text: err?.message || 'Failed to re-sync subscription with Gumroad.',
      });
    },
  });

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseKeyInput.trim()) return;
    setVerifyMessage(null);
    verifyMutation.mutate(licenseKeyInput.trim());
  };

  const isPro = subscription?.isPro ?? false;
  const isGracePeriod = subscription?.isGracePeriod ?? false;
  const checkoutUrl = tiersData?.productPermalink || 'https://samast.gumroad.com/l/pro';

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Billing &amp; Subscription
            </h1>
            {isPro && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                <Sparkles className="w-3 h-3 text-amber-500" />
                PRO ACTIVE
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
            Manage your plan entitlement, enter Gumroad license keys, and view quota capabilities.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isPro && (
            <Link
              to="/pricing"
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-md btn-accent shadow-sm hover:opacity-90 transition-all"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Upgrade to Pro (USD &amp; INR Plans)</span>
              <ExternalLink className="w-3 h-3 opacity-80" />
            </Link>
          )}
        </div>
      </div>

      {/* Verification Feedback Banner */}
      {verifyMessage && (
        <div
          className={`p-4 rounded-xl border flex items-start justify-between gap-3 text-xs transition-all shadow-sm ${
            verifyMessage.success
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-200'
          }`}
        >
          <div className="flex items-start gap-2.5">
            {verifyMessage.success ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
            )}
            <div className="space-y-0.5">
              <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                {verifyMessage.success ? 'Action Successful' : 'License Verification Error'}
              </div>
              <p className="leading-relaxed">{verifyMessage.text}</p>
            </div>
          </div>
          <button
            onClick={() => setVerifyMessage(null)}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            &times;
          </button>
        </div>
      )}

      {/* Current Plan Overview Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 p-5 sm:p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
                Current Plan
              </span>
              <div className="flex items-center gap-3 mt-1">
                <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                  {isPro ? 'Pro Platform' : 'Free Starter'}
                </h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    isPro
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  {isGracePeriod ? 'Grace Period (Cancelled)' : subscription?.billingStatus || 'ACTIVE'}
                </span>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 max-w-md leading-relaxed">
                {isPro
                  ? 'Your account has full Pro privileges: 500 active jobs, 10-second high-precision execution intervals, and 30 days of execution logs.'
                  : 'You are currently on the Free tier. Upgrade to unlock high-frequency crons (down to 10 seconds), 500 active schedules, and smart retry policies.'}
              </p>
            </div>

            <div className="text-left sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-zinc-100 dark:border-zinc-800">
              <div className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">
                {isPro ? '$19' : '$0'}
                <span className="text-xs font-normal text-zinc-500"> / month</span>
              </div>
              {subscription?.expiresAt && (
                <div className="text-[11px] font-mono text-zinc-500 mt-1">
                  Renews/Ends: {new Date(subscription.expiresAt).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>

          {/* Key Entitlement Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-zinc-100 dark:border-zinc-800/80">
            <div className="space-y-1">
              <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" /> Max Schedules
              </span>
              <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {isPro ? '500 Jobs' : '5 Jobs'}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Min Interval
              </span>
              <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {isPro ? '10 Seconds' : '60 Seconds'}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Log Retention
              </span>
              <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {isPro ? '30 Days' : '3 Days'}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" /> Worker Queue
              </span>
              <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {isPro ? 'Priority Pool' : 'Shared Pool'}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Purchase CTA Card */}
        <div className="p-5 sm:p-6 rounded-xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-transparent dark:bg-zinc-950 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              <CreditCard className="w-4 h-4" />
              <span>Gumroad Checkout</span>
            </div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-2">
              Buy Pro via Gumroad
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed">
              Safe, seamless checkout with Credit Card, Apple Pay, Google Pay, or PayPal. Instant License Key provided on receipt.
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-indigo-500/10">
            <a
              href={checkoutUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-lg btn-accent shadow-sm hover:opacity-95 transition-all text-center"
            >
              <span>{isPro ? 'Manage on Gumroad' : 'Checkout on Gumroad'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* License Key Activation Card (Flow B) */}
      <div className="p-5 sm:p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-zinc-100">
              <KeyRound className="w-4 h-4 text-amber-500" />
              <span>Activate with Gumroad License Key</span>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
              Already purchased on Gumroad or received a license key? Enter it below to instantly link your account and unlock Pro.
            </p>
          </div>

          {subscription?.hasLicenseKey && (
            <button
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors shrink-0 disabled:opacity-50"
              title="Re-verify active license with Gumroad API"
            >
              <RefreshCw className={`w-3 h-3 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
              <span>{syncMutation.isPending ? 'Syncing...' : 'Re-sync with Gumroad'}</span>
            </button>
          )}
        </div>

        <form onSubmit={handleVerifySubmit} className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <div className="relative flex-1">
            <input
              type="text"
              required
              placeholder="e.g. XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX"
              value={licenseKeyInput}
              onChange={(e) => setLicenseKeyInput(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg text-xs font-mono text-zinc-900 dark:text-zinc-100 focus-ring shadow-xs uppercase placeholder:normal-case"
            />
          </div>
          <button
            type="submit"
            disabled={verifyMutation.isPending || !licenseKeyInput.trim()}
            className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 btn-accent text-xs font-semibold rounded-lg shadow-sm disabled:opacity-50 transition-all shrink-0"
          >
            {verifyMutation.isPending ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Verifying Key...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verify &amp; Activate</span>
              </>
            )}
          </button>
        </form>

        {/* Sandbox Test Keys for Instant Local Testing */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] font-semibold text-zinc-500">Test Sandbox Keys:</span>
          <button
            type="button"
            onClick={() => setLicenseKeyInput('TEST-CRON-PRO-MONTHLY')}
            className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/80 hover:text-indigo-600 dark:hover:text-indigo-400 border border-zinc-200 dark:border-zinc-700/80 transition-colors"
          >
            TEST-CRON-PRO-MONTHLY
          </button>
          <button
            type="button"
            onClick={() => setLicenseKeyInput('TEST-CRON-PRO-ANNUAL')}
            className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-amber-50 dark:hover:bg-amber-950/80 hover:text-amber-600 dark:hover:text-amber-400 border border-zinc-200 dark:border-zinc-700/80 transition-colors"
          >
            TEST-CRON-PRO-ANNUAL (1,000 Jobs)
          </button>
          <button
            type="button"
            onClick={() => setLicenseKeyInput('TEST-CRON-FREE')}
            className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-rose-50 dark:hover:bg-rose-950/80 hover:text-rose-600 dark:hover:text-rose-400 border border-zinc-200 dark:border-zinc-700/80 transition-colors"
          >
            TEST-CRON-FREE (Reset)
          </button>
        </div>

        {/* Linked Details if already active */}
        {subscription?.account && (
          <div className="mt-4 p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 text-xs space-y-2">
            <div className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center justify-between">
              <span>Linked Gumroad Subscription</span>
              <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 uppercase font-bold">
                ● {subscription.account.status}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-zinc-600 dark:text-zinc-400 font-mono text-[11px]">
              <div>
                <span className="text-zinc-400">License Key:</span>{' '}
                <span className="text-zinc-800 dark:text-zinc-200 font-bold">
                  {subscription.licenseKeyMasked}
                </span>
              </div>
              <div>
                <span className="text-zinc-400">Buyer Email:</span>{' '}
                <span className="text-zinc-800 dark:text-zinc-200">
                  {subscription.account.purchaseEmailMasked}
                </span>
              </div>
              <div>
                <span className="text-zinc-400">Customer Library:</span>{' '}
                <a
                  href={subscription.account.manageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[var(--accent)] underline inline-flex items-center gap-1"
                >
                  Manage on Gumroad <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Feature Comparison Table */}
      <div className="p-5 sm:p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
          Plan Comparison &amp; Capability Matrix
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-900/80 text-[11px] font-mono uppercase text-zinc-500 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="px-4 py-2.5">Feature</th>
                <th className="px-4 py-2.5">Free Starter (₹0)</th>
                <th className="px-4 py-2.5 text-indigo-600 dark:text-indigo-400 font-bold">
                  Pro Monthly (₹399/mo / $19)
                </th>
                <th className="px-4 py-2.5 text-amber-600 dark:text-amber-400 font-bold">
                  Annual Pass (₹274/mo • 4 Mo Free)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60 text-zinc-700 dark:text-zinc-300 font-sans">
              <tr>
                <td className="px-4 py-2.5 font-medium">Active Cron Schedules</td>
                <td className="px-4 py-2.5 font-mono text-zinc-500">5 jobs limit</td>
                <td className="px-4 py-2.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  500 jobs
                </td>
                <td className="px-4 py-2.5 font-mono font-bold text-amber-600 dark:text-amber-400">
                  🔥 1,000 jobs (2x)
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-medium">Minimum Execution Interval</td>
                <td className="px-4 py-2.5 font-mono text-zinc-500">60 seconds (1 min)</td>
                <td className="px-4 py-2.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  10 seconds precision
                </td>
                <td className="px-4 py-2.5 font-mono font-bold text-amber-600 dark:text-amber-400">
                  ⚡ 5 seconds (Real-Time)
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-medium">Run History &amp; Body Retention</td>
                <td className="px-4 py-2.5 font-mono text-zinc-500">3 days only</td>
                <td className="px-4 py-2.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  30 days full logs
                </td>
                <td className="px-4 py-2.5 font-mono font-bold text-amber-600 dark:text-amber-400">
                  📊 90 days full payloads (3x)
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-medium">Alert Notification Channels</td>
                <td className="px-4 py-2.5 font-mono text-zinc-500">3 channels max</td>
                <td className="px-4 py-2.5 font-mono">50 channels</td>
                <td className="px-4 py-2.5 font-bold text-amber-600 dark:text-amber-400">
                  Unlimited Channels
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-medium">Branded Status Pages</td>
                <td className="px-4 py-2.5 font-mono text-zinc-500">1 status page</td>
                <td className="px-4 py-2.5 font-mono">5 status pages</td>
                <td className="px-4 py-2.5 font-bold text-amber-600 dark:text-amber-400">
                  Unlimited Custom Domains
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-medium">Smart Retries &amp; Error Dispatch</td>
                <td className="px-4 py-2.5 font-mono text-zinc-400">Standard 1x</td>
                <td className="px-4 py-2.5 font-bold text-indigo-600 dark:text-indigo-400">
                  Exponential Backoff &amp; Jitter
                </td>
                <td className="px-4 py-2.5 font-bold text-amber-600 dark:text-amber-400">
                  Priority Retry Queue + Jitter
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-medium">Worker Concurrency &amp; Queue</td>
                <td className="px-4 py-2.5">Shared Worker Pool</td>
                <td className="px-4 py-2.5 font-bold text-indigo-600 dark:text-indigo-400">
                  Dedicated High-Priority Worker
                </td>
                <td className="px-4 py-2.5 font-bold text-amber-600 dark:text-amber-400">
                  🚀 VIP Tier 1 Dedicated Node
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-medium">Developer Support</td>
                <td className="px-4 py-2.5 text-zinc-500">Community</td>
                <td className="px-4 py-2.5 text-zinc-700 dark:text-zinc-300">Priority Email &amp; Discord</td>
                <td className="px-4 py-2.5 font-bold text-amber-600 dark:text-amber-400">
                  🤝 1-on-1 Direct VIP Support
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
