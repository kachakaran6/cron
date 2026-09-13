import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Sparkles,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  Layers,
  Settings2,
  Mail,
  Clock,
  HardDrive,
  Radio,
  Globe,
  Shield,
  Key,
  Users,
  Percent,
  Link as LinkIcon,
  ChevronRight,
  Zap,
  Check,
  X,
  Sliders,
  DollarSign,
  HelpCircle,
} from 'lucide-react';
import {
  fetchAdminPlansPricing,
  updateAdminPlansPricing,
  resetAdminPlansPricing,
  PlansAndPricingSettingsDTO,
  PlanDefinitionDTO,
  PlanQuotasDTO,
  PlanFeaturesDTO,
} from '../../services/api';

type PlanTab = 'free' | 'pro' | 'annual' | 'enterprise';

const FEATURE_METADATA: {
  key: keyof PlanFeaturesDTO;
  label: string;
  description: string;
  category: 'core' | 'infra' | 'enterprise';
}[] = [
  {
    key: 'customHeaders',
    label: 'Custom HTTP Headers & Payload',
    description: 'Allow custom authorization headers, Bearer tokens, and JSON/form payloads.',
    category: 'core',
  },
  {
    key: 'webhookAlerts',
    label: 'Webhook Alerting Dispatcher',
    description: 'Dispatch real-time failure & recovery alerts to Slack, Discord, Pushover & Webhooks.',
    category: 'core',
  },
  {
    key: 'priorityQueue',
    label: 'Priority Worker Queue',
    description: 'Bypass standard queues into high-speed isolated BullMQ priority workers.',
    category: 'infra',
  },
  {
    key: 'autoRetries',
    label: 'Smart Auto-Retries & Backoff',
    description: 'Exponential backoff retries with jitter when target endpoint returns 5xx errors.',
    category: 'core',
  },
  {
    key: 'exportLogs',
    label: 'Export Logs (CSV / JSON)',
    description: 'Download detailed execution logs, headers, and response payloads.',
    category: 'core',
  },
  {
    key: 'customDomainStatus',
    label: 'Custom Domain Status Pages',
    description: 'Attach custom CNAME hostnames with automatic Let\'s Encrypt SSL certificates.',
    category: 'infra',
  },
  {
    key: 'dedicatedWorker',
    label: 'Dedicated VPC Worker Nodes',
    description: 'Isolated container runner nodes allocated exclusively for organization jobs.',
    category: 'infra',
  },
  {
    key: 'siemIntegration',
    label: 'SIEM & Datadog Streaming',
    description: 'Forward audit and execution events directly to Datadog, Splunk, or cloud syslog.',
    category: 'enterprise',
  },
  {
    key: 'slaGuarantee',
    label: '99.99% Uptime SLA Contract',
    description: 'Legally backed high-availability SLA with financial credit guarantees.',
    category: 'enterprise',
  },
  {
    key: 'apiAccess',
    label: 'REST API & CLI Access',
    description: 'Programmatic job creation, manual triggering, and health status over REST API.',
    category: 'core',
  },
  {
    key: 'customSmtp',
    label: 'Custom SMTP Server Relay',
    description: 'Use your own branded company SMTP server credentials to relay alert emails.',
    category: 'infra',
  },
  {
    key: 'taxInvoicing',
    label: 'B2B Tax Invoicing & Net-30',
    description: 'GST invoice generation with Indian Tax Credit (ITC) and Net-30 PO processing.',
    category: 'enterprise',
  },
];

export default function AdminPlansPricingHub() {
  const queryClient = useQueryClient();
  const [activePlanTab, setActivePlanTab] = useState<PlanTab>('pro');
  const [formData, setFormData] = useState<PlansAndPricingSettingsDTO | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const { data: settingsData, isLoading, refetch } = useQuery({
    queryKey: ['admin-plans-pricing'],
    queryFn: fetchAdminPlansPricing,
  });

  useEffect(() => {
    if (settingsData) {
      setFormData(JSON.parse(JSON.stringify(settingsData)));
      setIsDirty(false);
    }
  }, [settingsData]);

  const updateMutation = useMutation({
    mutationFn: updateAdminPlansPricing,
    onSuccess: (res) => {
      queryClient.setQueryData(['admin-plans-pricing'], res.settings);
      setFormData(JSON.parse(JSON.stringify(res.settings)));
      setIsDirty(false);
      setSaveSuccessMsg(res.message || 'Plans and pricing settings updated successfully!');
      setTimeout(() => setSaveSuccessMsg(null), 4000);
      // Invalidate public tiers cache as well
      queryClient.invalidateQueries({ queryKey: ['gumroad-tiers'] });
    },
  });

  const resetMutation = useMutation({
    mutationFn: resetAdminPlansPricing,
    onSuccess: (res) => {
      queryClient.setQueryData(['admin-plans-pricing'], res.settings);
      setFormData(JSON.parse(JSON.stringify(res.settings)));
      setIsDirty(false);
      setShowResetConfirm(false);
      setSaveSuccessMsg('Settings reset to system factory defaults!');
      setTimeout(() => setSaveSuccessMsg(null), 4000);
      queryClient.invalidateQueries({ queryKey: ['gumroad-tiers'] });
    },
  });

  if (isLoading || !formData) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3 text-zinc-500">
          <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-mono">Loading Plans &amp; Pricing Studio...</p>
        </div>
      </div>
    );
  }

  const currentPlan = formData.plans[activePlanTab];

  const handlePlanQuotaChange = (key: keyof PlanQuotasDTO, val: number) => {
    setFormData((prev) => {
      if (!prev) return prev;
      const copy = { ...prev };
      copy.plans[activePlanTab].quotas[key] = val;
      return copy;
    });
    setIsDirty(true);
  };

  const handlePlanFeatureToggle = (key: keyof PlanFeaturesDTO) => {
    setFormData((prev) => {
      if (!prev) return prev;
      const copy = { ...prev };
      const current = copy.plans[activePlanTab].features[key];
      copy.plans[activePlanTab].features[key] = !current;
      return copy;
    });
    setIsDirty(true);
  };

  const handlePlanMetadataChange = (field: 'name' | 'description', val: string) => {
    setFormData((prev) => {
      if (!prev) return prev;
      const copy = { ...prev };
      copy.plans[activePlanTab][field] = val;
      return copy;
    });
    setIsDirty(true);
  };

  const handlePlanEnabledToggle = () => {
    setFormData((prev) => {
      if (!prev) return prev;
      const copy = { ...prev };
      copy.plans[activePlanTab].enabled = !copy.plans[activePlanTab].enabled;
      return copy;
    });
    setIsDirty(true);
  };

  const handlePricingChange = (field: keyof typeof formData.pricing, val: any) => {
    setFormData((prev) => {
      if (!prev) return prev;
      const copy = { ...prev };
      (copy.pricing as any)[field] = val;
      return copy;
    });
    setIsDirty(true);
  };

  const handlePermalinkChange = (field: keyof typeof formData.pricing.permalinks, val: string) => {
    setFormData((prev) => {
      if (!prev) return prev;
      const copy = { ...prev };
      copy.pricing.permalinks[field] = val;
      return copy;
    });
    setIsDirty(true);
  };

  const handleSave = () => {
    if (!formData) return;
    updateMutation.mutate(formData);
  };

  const calculatedInrGstTotal = Math.round(
    formData.pricing.inrMonthlyBase * (1 + formData.pricing.gstRatePercent / 100)
  );

  return (
    <div className="space-y-8 pb-16">
      {/* Top Banner & Title */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)]">
              <Sliders className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Plans, Quotas &amp; Pricing Studio
            </h2>
            {isDirty && (
              <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-full">
                Unsaved Changes
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500 mt-1 max-w-2xl">
            Fully customize subscription tiers, resource quotas (mail limits, jobs, retention), feature toggles per plan, and real-time USD/INR checkout prices.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowResetConfirm(true)}
            disabled={resetMutation.isPending || updateMutation.isPending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 border border-zinc-200 dark:border-zinc-800 rounded-md transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            onClick={handleSave}
            disabled={!isDirty || updateMutation.isPending}
            className={`inline-flex items-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-md shadow-xs transition-all ${
              isDirty
                ? 'bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white cursor-pointer shadow-indigo-500/20'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed border border-zinc-200 dark:border-zinc-700'
            }`}
          >
            {updateMutation.isPending ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>{updateMutation.isPending ? 'Saving Studio...' : 'Save All Settings'}</span>
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {saveSuccessMsg && (
        <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{saveSuccessMsg}</span>
          </div>
          <button onClick={() => setSaveSuccessMsg(null)} className="hover:opacity-75">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* SECTION 1: GLOBAL PRICING & CURRENCY CONTROLS */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 space-y-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-900">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Live Currency &amp; Pricing Management
            </h3>
          </div>
          <span className="text-[11px] text-zinc-400 font-mono">Real-time public landing &amp; billing sync</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* USD Monthly */}
          <div className="p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30">
            <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1">
              USD Monthly Price ($)
            </label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-2.5 text-zinc-400 text-xs font-mono">$</span>
              <input
                type="number"
                min="0"
                step="1"
                value={formData.pricing.usdMonthly}
                onChange={(e) => handlePricingChange('usdMonthly', Number(e.target.value))}
                className="w-full pl-7 pr-3 py-1.5 text-sm font-semibold rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>
            <p className="text-[10px] text-zinc-400 mt-1">Charged monthly via Gumroad USD</p>
          </div>

          {/* USD Annual */}
          <div className="p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30">
            <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1">
              USD Annual Price ($)
            </label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-2.5 text-zinc-400 text-xs font-mono">$</span>
              <input
                type="number"
                min="0"
                step="1"
                value={formData.pricing.usdAnnual}
                onChange={(e) => handlePricingChange('usdAnnual', Number(e.target.value))}
                className="w-full pl-7 pr-3 py-1.5 text-sm font-semibold rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>
            <p className="text-[10px] text-zinc-400 mt-1">Billed annually (${Math.round(formData.pricing.usdAnnual / 12)}/mo)</p>
          </div>

          {/* INR Monthly Total */}
          <div className="p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1">
                INR Monthly Total (₹)
              </label>
              <span className="text-[10px] font-bold text-indigo-500">Incl. GST</span>
            </div>
            <div className="relative mt-1">
              <span className="absolute left-3 top-2.5 text-zinc-400 text-xs font-mono">₹</span>
              <input
                type="number"
                min="0"
                step="1"
                value={formData.pricing.inrMonthly}
                onChange={(e) => handlePricingChange('inrMonthly', Number(e.target.value))}
                className="w-full pl-7 pr-3 py-1.5 text-sm font-semibold rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>
            <p className="text-[10px] text-zinc-400 mt-1">Exact customer checkout price (e.g. ₹399)</p>
          </div>

          {/* INR Annual Total */}
          <div className="p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1">
                INR Annual Total (₹)
              </label>
              <span className="text-[10px] font-bold text-emerald-500">Max Savings</span>
            </div>
            <div className="relative mt-1">
              <span className="absolute left-3 top-2.5 text-zinc-400 text-xs font-mono">₹</span>
              <input
                type="number"
                min="0"
                step="1"
                value={formData.pricing.inrAnnual}
                onChange={(e) => handlePricingChange('inrAnnual', Number(e.target.value))}
                className="w-full pl-7 pr-3 py-1.5 text-sm font-semibold rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>
            <p className="text-[10px] text-zinc-400 mt-1">Billed annually (₹{Math.round(formData.pricing.inrAnnual / 12)}/mo)</p>
          </div>
        </div>

        {/* GST & Invoicing Sub-Bar */}
        <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
              Base Price Before Tax (₹)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-zinc-400 text-xs">₹</span>
              <input
                type="number"
                min="0"
                value={formData.pricing.inrMonthlyBase}
                onChange={(e) => handlePricingChange('inrMonthlyBase', Number(e.target.value))}
                className="w-full pl-7 pr-3 py-1 text-xs rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
              />
            </div>
            <p className="text-[10px] text-zinc-400 mt-0.5">Base net price (e.g. ₹349)</p>
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
              GST Tax Rate (%)
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                value={formData.pricing.gstRatePercent}
                onChange={(e) => handlePricingChange('gstRatePercent', Number(e.target.value))}
                className="w-full px-3 py-1 text-xs rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
              />
              <span className="absolute right-3 top-2 text-zinc-400 text-xs">%</span>
            </div>
            <p className="text-[10px] text-zinc-400 mt-0.5">Standard Indian GST (18%)</p>
          </div>

          <div className="flex flex-col justify-center">
            <span className="text-[11px] font-medium text-zinc-500">Calculated Gross Total:</span>
            <div className="text-base font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5">
              ₹{calculatedInrGstTotal}{' '}
              <span className="text-[11px] font-normal text-zinc-400">
                (Base: ₹{formData.pricing.inrMonthlyBase} + 18% GST: ₹{Math.round(formData.pricing.inrMonthlyBase * 0.18)})
              </span>
            </div>
          </div>
        </div>

        {/* Badges & Permalinks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
              USD Annual Discount Badge
            </label>
            <input
              type="text"
              value={formData.pricing.discountTagUsd}
              onChange={(e) => handlePricingChange('discountTagUsd', e.target.value)}
              placeholder="e.g. Save 17%"
              className="w-full px-3 py-1.5 text-xs rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
              INR Annual Discount Badge
            </label>
            <input
              type="text"
              value={formData.pricing.discountTagInr}
              onChange={(e) => handlePricingChange('discountTagInr', e.target.value)}
              placeholder="e.g. Save ~31%"
              className="w-full px-3 py-1.5 text-xs rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
              USD Monthly Gumroad Checkout URL
            </label>
            <input
              type="text"
              value={formData.pricing.permalinks.usdMonthly}
              onChange={(e) => handlePermalinkChange('usdMonthly', e.target.value)}
              className="w-full px-3 py-1.5 text-xs font-mono rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
              USD Annual Gumroad Checkout URL
            </label>
            <input
              type="text"
              value={formData.pricing.permalinks.usdAnnual}
              onChange={(e) => handlePermalinkChange('usdAnnual', e.target.value)}
              className="w-full px-3 py-1.5 text-xs font-mono rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
              INR Monthly Gumroad Checkout URL
            </label>
            <input
              type="text"
              value={formData.pricing.permalinks.inrMonthly}
              onChange={(e) => handlePermalinkChange('inrMonthly', e.target.value)}
              className="w-full px-3 py-1.5 text-xs font-mono rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
              INR Annual Gumroad Checkout URL
            </label>
            <input
              type="text"
              value={formData.pricing.permalinks.inrAnnual}
              onChange={(e) => handlePermalinkChange('inrAnnual', e.target.value)}
              className="w-full px-3 py-1.5 text-xs font-mono rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: PLAN SELECTOR TABS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-500" />
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Per-Plan Quotas &amp; Feature Matrix
            </h3>
          </div>
          <span className="text-xs text-zinc-400">Select a tier below to customize quotas and toggles</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {(['free', 'pro', 'annual', 'enterprise'] as PlanTab[]).map((tabKey) => {
            const plan = formData.plans[tabKey];
            const isSelected = activePlanTab === tabKey;
            return (
              <button
                key={tabKey}
                onClick={() => setActivePlanTab(tabKey)}
                className={`p-3.5 text-left rounded-xl border transition-all relative ${
                  isSelected
                    ? 'border-[var(--accent)] bg-[var(--accent)]/5 dark:bg-[var(--accent)]/10 shadow-xs ring-1 ring-[var(--accent)]'
                    : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                    {tabKey}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {plan.enabled ? (
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-zinc-400" />
                    )}
                  </div>
                </div>
                <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                  {plan.name}
                </div>
                <div className="text-[11px] text-zinc-500 mt-0.5 truncate">
                  {plan.quotas.maxJobs.toLocaleString()} jobs &bull; {plan.quotas.minIntervalSeconds}s min
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: ACTIVE PLAN EDITOR */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 space-y-6 shadow-xs">
        {/* Plan Header Info */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-900">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                {currentPlan.id}
              </span>
              <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                {currentPlan.name} Settings
              </h4>
            </div>
            <p className="text-xs text-zinc-500">{currentPlan.description}</p>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Plan Status:
            </label>
            <button
              onClick={handlePlanEnabledToggle}
              className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md border transition-colors ${
                currentPlan.enabled
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-zinc-300 dark:border-zinc-700'
              }`}
            >
              {currentPlan.enabled ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
              <span>{currentPlan.enabled ? 'Plan Enabled' : 'Plan Disabled'}</span>
            </button>
          </div>
        </div>

        {/* Plan Metadata Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
              Public Display Name
            </label>
            <input
              type="text"
              value={currentPlan.name}
              onChange={(e) => handlePlanMetadataChange('name', e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
              Public Description
            </label>
            <input
              type="text"
              value={currentPlan.description}
              onChange={(e) => handlePlanMetadataChange('description', e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>
        </div>

        {/* Quotas Grid */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <h5 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
              Resource Quotas &amp; Numeric Limits
            </h5>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {/* Max Jobs */}
            <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-indigo-500" />
                  Active Scheduled Jobs
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">maxJobs</span>
              </div>
              <input
                type="number"
                min="1"
                value={currentPlan.quotas.maxJobs}
                onChange={(e) => handlePlanQuotaChange('maxJobs', Number(e.target.value))}
                className="w-full px-2.5 py-1 text-xs font-mono font-semibold rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
              />
              <p className="text-[10px] text-zinc-400 mt-1">Total simultaneous active cron schedules</p>
            </div>

            {/* Min Interval */}
            <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  Min Interval (seconds)
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">minInterval</span>
              </div>
              <input
                type="number"
                min="1"
                value={currentPlan.quotas.minIntervalSeconds}
                onChange={(e) => handlePlanQuotaChange('minIntervalSeconds', Number(e.target.value))}
                className="w-full px-2.5 py-1 text-xs font-mono font-semibold rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
              />
              <p className="text-[10px] text-zinc-400 mt-1">Minimum execution period (e.g. 60s, 10s, 5s)</p>
            </div>

            {/* Monthly Emails */}
            <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-rose-500" />
                  Monthly Email Quota
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">maxEmails</span>
              </div>
              <input
                type="number"
                min="0"
                value={currentPlan.quotas.maxMonthlyEmails}
                onChange={(e) => handlePlanQuotaChange('maxMonthlyEmails', Number(e.target.value))}
                className="w-full px-2.5 py-1 text-xs font-mono font-semibold rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
              />
              <p className="text-[10px] text-zinc-400 mt-1">Maximum email alerts allowed per month</p>
            </div>

            {/* Retention Days */}
            <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-emerald-500" />
                  Log Retention (Days)
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">retention</span>
              </div>
              <input
                type="number"
                min="1"
                value={currentPlan.quotas.historyRetentionDays}
                onChange={(e) => handlePlanQuotaChange('historyRetentionDays', Number(e.target.value))}
                className="w-full px-2.5 py-1 text-xs font-mono font-semibold rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
              />
              <p className="text-[10px] text-zinc-400 mt-1">Days to store run history and response bodies</p>
            </div>

            {/* Notification Channels */}
            <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-purple-500" />
                  Alert Channels Limit
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">channels</span>
              </div>
              <input
                type="number"
                min="1"
                value={currentPlan.quotas.maxNotificationChannels}
                onChange={(e) => handlePlanQuotaChange('maxNotificationChannels', Number(e.target.value))}
                className="w-full px-2.5 py-1 text-xs font-mono font-semibold rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
              />
              <p className="text-[10px] text-zinc-400 mt-1">Slack, Discord, Email, Webhooks targets</p>
            </div>

            {/* Status Pages */}
            <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-cyan-500" />
                  Public Status Pages
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">statusPages</span>
              </div>
              <input
                type="number"
                min="0"
                value={currentPlan.quotas.maxStatusPages}
                onChange={(e) => handlePlanQuotaChange('maxStatusPages', Number(e.target.value))}
                className="w-full px-2.5 py-1 text-xs font-mono font-semibold rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
              />
              <p className="text-[10px] text-zinc-400 mt-1">Maximum branded status dashboards</p>
            </div>

            {/* Execution Timeout */}
            <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-500" />
                  Timeout (ms)
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">timeoutMs</span>
              </div>
              <input
                type="number"
                min="1000"
                step="1000"
                value={currentPlan.quotas.timeoutMs}
                onChange={(e) => handlePlanQuotaChange('timeoutMs', Number(e.target.value))}
                className="w-full px-2.5 py-1 text-xs font-mono font-semibold rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
              />
              <p className="text-[10px] text-zinc-400 mt-1">HTTP request timeout ({Math.round(currentPlan.quotas.timeoutMs / 1000)}s)</p>
            </div>

            {/* API Keys */}
            <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-orange-500" />
                  API Keys Count
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">apiKeys</span>
              </div>
              <input
                type="number"
                min="0"
                value={currentPlan.quotas.maxApiKeys}
                onChange={(e) => handlePlanQuotaChange('maxApiKeys', Number(e.target.value))}
                className="w-full px-2.5 py-1 text-xs font-mono font-semibold rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
              />
              <p className="text-[10px] text-zinc-400 mt-1">Allowed active programmatic API tokens</p>
            </div>

            {/* Team Members */}
            <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-emerald-500" />
                  Team Seats / Members
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">teamSeats</span>
              </div>
              <input
                type="number"
                min="1"
                value={currentPlan.quotas.maxTeamMembers}
                onChange={(e) => handlePlanQuotaChange('maxTeamMembers', Number(e.target.value))}
                className="w-full px-2.5 py-1 text-xs font-mono font-semibold rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
              />
              <p className="text-[10px] text-zinc-400 mt-1">Maximum invited workspace collaborators</p>
            </div>
          </div>
        </div>

        {/* Feature Enable/Disable Matrix */}
        <div className="space-y-3 pt-4 border-t border-zinc-100 dark:border-zinc-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-500" />
              <h5 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                Feature Toggles (Enable / Disable for {currentPlan.name})
              </h5>
            </div>
            <span className="text-[11px] text-zinc-400">Click any switch to grant or restrict access</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {FEATURE_METADATA.map((feat) => {
              const isEnabled = currentPlan.features[feat.key];
              return (
                <div
                  key={feat.key}
                  onClick={() => handlePlanFeatureToggle(feat.key)}
                  className={`p-3 rounded-lg border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                    isEnabled
                      ? 'border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20'
                      : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        {feat.label}
                      </span>
                      <span
                        className={`px-1.5 py-0.2 text-[9px] font-bold rounded-sm uppercase tracking-wider ${
                          isEnabled
                            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                            : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-500'
                        }`}
                      >
                        {isEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500">{feat.description}</p>
                  </div>

                  {/* Toggle Switch */}
                  <div
                    className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors shrink-0 mt-0.5 ${
                      isEnabled ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform ${
                        isEnabled ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* SECTION 4: LIVE COMPARISON MATRIX (SIDE-BY-SIDE) */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 space-y-4 shadow-xs overflow-x-auto">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-900">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-500" />
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Live Plan Comparison Matrix (All 4 Plans)
            </h3>
          </div>
          <span className="text-xs text-zinc-400 font-mono">Overview of live capabilities</span>
        </div>

        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase text-[10px] tracking-wider">
              <th className="py-2.5 px-3 font-semibold">Capability / Resource</th>
              <th className="py-2.5 px-3 font-semibold text-zinc-700 dark:text-zinc-300">Free Starter</th>
              <th className="py-2.5 px-3 font-semibold text-indigo-600 dark:text-indigo-400">Pro Platform</th>
              <th className="py-2.5 px-3 font-semibold text-purple-600 dark:text-purple-400">Annual Pass</th>
              <th className="py-2.5 px-3 font-semibold text-amber-600 dark:text-amber-400">Enterprise</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900 font-mono">
            <tr>
              <td className="py-2 px-3 font-sans font-medium text-zinc-700 dark:text-zinc-300">Active Jobs Limit</td>
              <td className="py-2 px-3">{formData.plans.free.quotas.maxJobs}</td>
              <td className="py-2 px-3 font-bold text-indigo-600 dark:text-indigo-400">{formData.plans.pro.quotas.maxJobs}</td>
              <td className="py-2 px-3 font-bold text-purple-600 dark:text-purple-400">{formData.plans.annual.quotas.maxJobs}</td>
              <td className="py-2 px-3">{formData.plans.enterprise.quotas.maxJobs.toLocaleString()}</td>
            </tr>
            <tr>
              <td className="py-2 px-3 font-sans font-medium text-zinc-700 dark:text-zinc-300">Minimum Interval</td>
              <td className="py-2 px-3">{formData.plans.free.quotas.minIntervalSeconds}s</td>
              <td className="py-2 px-3 font-bold text-indigo-600 dark:text-indigo-400">{formData.plans.pro.quotas.minIntervalSeconds}s</td>
              <td className="py-2 px-3 font-bold text-purple-600 dark:text-purple-400">{formData.plans.annual.quotas.minIntervalSeconds}s</td>
              <td className="py-2 px-3 font-bold text-amber-600 dark:text-amber-400">{formData.plans.enterprise.quotas.minIntervalSeconds}s</td>
            </tr>
            <tr>
              <td className="py-2 px-3 font-sans font-medium text-zinc-700 dark:text-zinc-300">Monthly Email Limit</td>
              <td className="py-2 px-3">{formData.plans.free.quotas.maxMonthlyEmails}</td>
              <td className="py-2 px-3">{formData.plans.pro.quotas.maxMonthlyEmails.toLocaleString()}</td>
              <td className="py-2 px-3">{formData.plans.annual.quotas.maxMonthlyEmails.toLocaleString()}</td>
              <td className="py-2 px-3">Unlimited</td>
            </tr>
            <tr>
              <td className="py-2 px-3 font-sans font-medium text-zinc-700 dark:text-zinc-300">Log Retention</td>
              <td className="py-2 px-3">{formData.plans.free.quotas.historyRetentionDays} days</td>
              <td className="py-2 px-3 font-bold text-indigo-600 dark:text-indigo-400">{formData.plans.pro.quotas.historyRetentionDays} days</td>
              <td className="py-2 px-3 font-bold text-purple-600 dark:text-purple-400">{formData.plans.annual.quotas.historyRetentionDays} days</td>
              <td className="py-2 px-3 font-bold text-amber-600 dark:text-amber-400">{formData.plans.enterprise.quotas.historyRetentionDays} days</td>
            </tr>
            <tr>
              <td className="py-2 px-3 font-sans font-medium text-zinc-700 dark:text-zinc-300">Alert Channels</td>
              <td className="py-2 px-3">{formData.plans.free.quotas.maxNotificationChannels}</td>
              <td className="py-2 px-3">{formData.plans.pro.quotas.maxNotificationChannels}</td>
              <td className="py-2 px-3">Unlimited</td>
              <td className="py-2 px-3">Unlimited</td>
            </tr>
            {FEATURE_METADATA.slice(0, 6).map((feat) => (
              <tr key={feat.key}>
                <td className="py-2 px-3 font-sans font-medium text-zinc-700 dark:text-zinc-300">{feat.label}</td>
                <td className="py-2 px-3">
                  {formData.plans.free.features[feat.key] ? (
                    <Check className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <span className="text-zinc-400">&mdash;</span>
                  )}
                </td>
                <td className="py-2 px-3">
                  {formData.plans.pro.features[feat.key] ? (
                    <Check className="w-4 h-4 text-indigo-500" />
                  ) : (
                    <span className="text-zinc-400">&mdash;</span>
                  )}
                </td>
                <td className="py-2 px-3">
                  {formData.plans.annual.features[feat.key] ? (
                    <Check className="w-4 h-4 text-purple-500" />
                  ) : (
                    <span className="text-zinc-400">&mdash;</span>
                  )}
                </td>
                <td className="py-2 px-3">
                  {formData.plans.enterprise.features[feat.key] ? (
                    <Check className="w-4 h-4 text-amber-500" />
                  ) : (
                    <span className="text-zinc-400">&mdash;</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Confirmation Reset Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-950/50">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Reset Plans &amp; Pricing to Factory Defaults?
              </h3>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed">
              This will overwrite all custom quota limits, feature toggles, and customized pricing values with the default system settings. Active subscriber entitlements will instantly update.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-3.5 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md border border-zinc-200 dark:border-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => resetMutation.mutate()}
                disabled={resetMutation.isPending}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors shadow-xs"
              >
                {resetMutation.isPending && (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                <span>Confirm Reset</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
