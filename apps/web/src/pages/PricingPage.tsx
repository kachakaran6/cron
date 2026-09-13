import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Check,
  Zap,
  Shield,
  Clock,
  Sparkles,
  ExternalLink,
  HelpCircle,
  Layers,
  ArrowRight,
  Building2,
  Mail,
  X,
  Copy,
  CheckCheck,
} from 'lucide-react';
import { fetchGumroadTiers } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Footer from '../components/layout/Footer';
import { SEOHead } from '../components/seo/SEOHead';

export default function PricingPage() {
  const { user } = useAuth();
  const [isYearly, setIsYearly] = useState(false);
  const [currency, setCurrency] = useState<'USD' | 'INR'>('INR');
  const [isEnterpriseModalOpen, setIsEnterpriseModalOpen] = useState(false);
  const [copiedTemplate, setCopiedTemplate] = useState(false);

  const { data } = useQuery({
    queryKey: ['public-pricing-tiers', user?.email],
    queryFn: () => fetchGumroadTiers(user?.email),
  });

  const p = data?.pricing;
  const plans = data?.plans;
  const usdMonthly = p?.usdMonthly ?? 35;
  const usdAnnual = p?.usdAnnual ?? 350;
  const inrMonthly = p?.inrMonthly ?? 399;
  const inrAnnual = p?.inrAnnual ?? 2999;
  const inrMonthlyBase = p?.inrMonthlyBase ?? 338;
  const discountTagUsd = p?.discountTagUsd || 'Save 17%';
  const discountTagInr = p?.discountTagInr || 'Save 37%';

  const freeJobs = plans?.free?.quotas?.maxJobs ?? 5;
  const proJobs = plans?.pro?.quotas?.maxJobs ?? 500;
  const annualJobs = plans?.annual?.quotas?.maxJobs ?? 1000;
  const freeMinInterval = plans?.free?.quotas?.minIntervalSeconds ?? 60;
  const proMinInterval = plans?.pro?.quotas?.minIntervalSeconds ?? 10;
  const annualMinInterval = plans?.annual?.quotas?.minIntervalSeconds ?? 5;
  const freeRetention = plans?.free?.quotas?.historyRetentionDays ?? 3;
  const proRetention = plans?.pro?.quotas?.historyRetentionDays ?? 30;
  const annualRetention = plans?.annual?.quotas?.historyRetentionDays ?? 90;
  const freeEmails = plans?.free?.quotas?.maxMonthlyEmails ?? 50;
  const proEmails = plans?.pro?.quotas?.maxMonthlyEmails ?? 10000;
  const annualEmails = plans?.annual?.quotas?.maxMonthlyEmails ?? 100000;

  const getCheckoutUrl = () => {
    if (currency === 'INR') {
      return isYearly
        ? p?.permalinks?.inrAnnual || data?.productPermalinkInAnnual || 'https://samastcron.gumroad.com/l/cron-ultra-in-annual'
        : p?.permalinks?.inrMonthly || data?.productPermalinkInMonthly || 'https://samastcron.gumroad.com/l/cron-ultra-in-monthly';
    }
    return isYearly
      ? p?.permalinks?.usdAnnual || data?.productPermalinkAnnual || 'https://samastcron.gumroad.com/l/cron-ultra-annual'
      : p?.permalinks?.usdMonthly || data?.productPermalink || 'https://samastcron.gumroad.com/l/cron-ultra';
  };

  const checkoutUrl = getCheckoutUrl();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col">
      <SEOHead
        title="Pricing & Plans — Samast Cron | High-Frequency Cron Job Platform"
        description="Simple, developer-friendly pricing for Samast Cron. Free Starter plan with 500 active jobs, or unlock sub-second 1s execution intervals and enterprise SLA."
        canonicalUrl="https://cron.samast.pro/pricing"
      />
      {/* Navigation Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold tracking-tight text-base">
            <span className="text-zinc-900 dark:text-zinc-100 font-extrabold tracking-tight">Samast Cron</span>
          </Link>

          <div className="flex items-center gap-4 text-xs font-medium">
            <Link to="/docs" className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
              Documentation
            </Link>
            {user ? (
              <Link
                to="/dashboard"
                className="px-3.5 py-1.5 rounded-md btn-accent font-semibold shadow-xs"
              >
                Go to Dashboard
              </Link>
            ) : (
              <Link
                to="/login"
                className="px-3.5 py-1.5 rounded-md btn-accent font-semibold shadow-xs"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Header */}
      <main className="flex-1 py-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Transparent, Developer-First Pricing</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            Predictable Plans for Scheduled Infrastructure
          </h1>

          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Start for free with reliable minute-level schedules, or upgrade to Pro for 10-second precision execution, 500 active jobs, and smart retry policies.
          </p>

          {/* Controls: Currency + Billing Cycle Toggles */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-6">
            {/* Currency Selector */}
            <div className="inline-flex items-center p-1 rounded-xl bg-zinc-200/80 dark:bg-zinc-800/80 border border-zinc-300 dark:border-zinc-700/60 text-xs font-medium">
              <button
                type="button"
                onClick={() => setCurrency('USD')}
                className={`px-3.5 py-1.5 rounded-lg transition-all font-semibold ${
                  currency === 'USD'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                USD ($)
              </button>
              <button
                type="button"
                onClick={() => setCurrency('INR')}
                className={`px-3.5 py-1.5 rounded-lg transition-all font-semibold ${
                  currency === 'INR'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                INR (₹)
              </button>
            </div>

            {/* Billing Cycle Toggle */}
            <div className="flex items-center gap-3">
              <span className={`text-xs font-medium cursor-pointer ${!isYearly ? 'text-zinc-900 dark:text-white font-bold' : 'text-zinc-500'}`} onClick={() => setIsYearly(false)}>
                Monthly
              </span>
              <button
                onClick={() => setIsYearly(!isYearly)}
                className="w-12 h-6 rounded-full bg-zinc-200 dark:bg-zinc-800 p-0.5 transition-colors relative cursor-pointer"
                aria-label="Toggle annual billing"
              >
                <div
                  className={`w-5 h-5 rounded-full bg-[var(--accent)] transition-transform ${
                    isYearly ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className={`text-xs font-medium flex items-center gap-1.5 cursor-pointer ${isYearly ? 'text-zinc-900 dark:text-white font-bold' : 'text-zinc-500'}`} onClick={() => setIsYearly(true)}>
                <span>Annual</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  {currency === 'INR' ? discountTagInr : discountTagUsd}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch mt-12">
          {/* Free Tier */}
          <div className="p-7 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Free Starter</h3>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Everything you need for personal pet projects and side-hustle automations.
              </p>

              <div className="pt-2">
                <div className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-zinc-100">
                  {currency === 'INR' ? '₹0' : '$0'}
                  <span className="text-sm font-normal text-zinc-500"> / forever</span>
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">No credit card required. Free tier forever.</p>
              </div>

              <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
                <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  Included Features:
                </div>
                <ul className="space-y-2.5 text-xs text-zinc-600 dark:text-zinc-300">
                  {[
                    `${freeJobs} Active Scheduled Jobs`,
                    `${freeMinInterval}-second minimum execution interval`,
                    `${freeRetention} days of run history & response bodies`,
                    '3 Alert channels (Email, Slack, Discord)',
                    `${freeEmails} Email notifications / month`,
                    '1 Public or Private Status Page',
                    'Shared worker execution pool',
                    'Community Discord & Documentation',
                  ].map((feat, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-8">
              <Link
                to={user ? '/dashboard' : '/register'}
                className="w-full inline-flex items-center justify-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 transition-colors text-center"
              >
                <span>{user ? 'Current Free Plan' : 'Get Started Free'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Pro Tier (Gumroad Monetized) */}
          <div className="p-7 rounded-2xl border-2 border-[var(--accent)] bg-white dark:bg-zinc-900 shadow-xl relative flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <span>Pro Platform</span>
                  <Sparkles className="w-4 h-4 text-amber-500" />
                </h3>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                For production applications, SaaS platforms, and high-frequency backend jobs.
              </p>

              <div className="pt-2">
                <div className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-zinc-100">
                  {currency === 'INR'
                    ? (isYearly ? `₹${inrAnnual.toLocaleString()}` : `₹${inrMonthly.toLocaleString()}`)
                    : (isYearly ? `$${usdAnnual}` : `$${usdMonthly}`)}
                  <span className="text-sm font-normal text-zinc-500">
                    {' '}/ {isYearly
                      ? (currency === 'INR' ? `year (~₹${Math.round(inrAnnual / 12)}/mo)` : `year (~$${Math.round(usdAnnual / 12)}/mo)`)
                      : 'month'}
                  </span>
                </div>
                {currency === 'INR' ? (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 font-medium">
                    {isYearly
                      ? `Annual Power Pass: ₹${inrAnnual.toLocaleString()}/yr (${discountTagInr})`
                      : `₹${inrMonthlyBase} base + 18% GST = ₹${inrMonthly} all-inclusive total`}
                  </p>
                ) : (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
                    {isYearly ? `Billed annually ($${usdAnnual}/yr). ${discountTagUsd}` : 'Billed monthly. Cancel anytime.'}
                  </p>
                )}
              </div>

              <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
                <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  <span>{isYearly ? 'Everything in Pro, plus Annual benefits:' : 'All Free features, plus:'}</span>
                </div>
                <ul className="space-y-2.5 text-xs text-zinc-700 dark:text-zinc-200 font-medium">
                  {(isYearly
                    ? [
                        `${annualJobs.toLocaleString()} Active Scheduled Jobs (2x Double Capacity)`,
                        `${annualMinInterval}-Second Real-Time Execution Precision`,
                        `${annualRetention} Days Full Logs & Payloads (3x Retention)`,
                        'Smart Exponential Retries with Jitter',
                        'VIP Tier 1 Dedicated Worker Queue',
                        'Unlimited Push & Webhook Alert Channels',
                        'Unlimited Custom Status Pages & Domains',
                        `${annualEmails.toLocaleString()} Email Alerts / month`,
                        '1-on-1 Direct Developer VIP Support',
                      ]
                    : [
                        `${proJobs.toLocaleString()} Active Scheduled Jobs`,
                        `${proMinInterval}-Second High-Precision Cron Intervals`,
                        `${proRetention} Days Full Execution Logs & Response Payloads`,
                        'Smart Auto-Retries with Exponential Backoff',
                        'Instant License Key activation for accounts',
                        'Dedicated High-Priority Worker Execution Queue',
                        'Unlimited Push, Webhook & Alert Channels',
                        `${proEmails.toLocaleString()} Email Alerts / month`,
                        'Priority Email & Discord Support',
                      ]
                  ).map((feat, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <Check className={`w-3.5 h-3.5 shrink-0 font-bold ${isYearly ? 'text-amber-500' : 'text-indigo-500'}`} />
                      <span className={isYearly && idx < 3 ? 'font-bold text-zinc-900 dark:text-white' : ''}>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-8 space-y-2">
              <a
                href={checkoutUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl btn-accent shadow-md hover:opacity-95 transition-all text-center"
              >
                <span>
                  {currency === 'INR'
                    ? `Upgrade via Gumroad (${isYearly ? `₹${inrAnnual.toLocaleString()}/yr` : `₹${inrMonthly.toLocaleString()}/mo Total`})`
                    : `Upgrade via Gumroad (${isYearly ? `$${usdAnnual}/yr` : `$${usdMonthly}/mo`})`}
                </span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <p className="text-[10px] text-center text-zinc-500">
                Instant License Key delivered • Cancel anytime • Tax Invoice included
              </p>
            </div>
          </div>

          {/* Enterprise Tier */}
          <div className="p-7 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-500" />
                  <span>Enterprise</span>
                </h3>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Dedicated isolated infrastructure, custom SLAs, VPC peering, and enterprise compliance.
              </p>

              <div className="pt-2">
                <div className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-zinc-100">
                  Custom
                  <span className="text-xs font-normal text-zinc-500"> / tailored scale</span>
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">Billed annually or quarterly with Purchase Orders (PO) &amp; Net 30.</p>
              </div>

              <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
                <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  Enterprise Capabilities:
                </div>
                <ul className="space-y-2.5 text-xs text-zinc-600 dark:text-zinc-300">
                  {[
                    'Unlimited Active Scheduled Jobs',
                    '1-Second Sub-Second Precision Execution',
                    '365 Days Logs Retention + S3 Export',
                    'Dedicated Isolated Worker Pool & Static Egress IPs',
                    'AWS / GCP / Azure VPC Peering & Private Endpoints',
                    'Custom SIEM Integration (Datadog, Splunk, Elastic)',
                    '99.99% Financially Backed Uptime SLA',
                    'Custom PO, Invoicing, Net 30 & GST ITC Invoices',
                    'Dedicated Solutions Architect & 1h Slack SLA',
                    'SOC2 Type II, HIPAA & Security Assessments',
                  ].map((feat, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-8 space-y-2">
              <button
                type="button"
                onClick={() => setIsEnterpriseModalOpen(true)}
                className="w-full inline-flex items-center justify-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white/90 transition-all text-center shadow-sm cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Contact Enterprise Sales</span>
              </button>
              <p className="text-[10px] text-center text-zinc-500">
                Guaranteed reply within 2 business hours
              </p>
            </div>
          </div>
        </div>

        {/* Feature Capability Comparison Matrix */}
        <div className="max-w-6xl mx-auto mt-20 pt-12 border-t border-zinc-200 dark:border-zinc-800 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="text-[11px] font-mono uppercase tracking-widest text-zinc-500 mb-1">
                Capability Matrix
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                Detailed Plan Feature Matrix
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                Comparing specifications for {currency} ({isYearly ? 'Annual billing' : 'Monthly billing'}).
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => setCurrency(currency === 'INR' ? 'USD' : 'INR')}
                className="px-2.5 py-1 rounded-md text-[11px] font-semibold border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 cursor-pointer"
              >
                Currency: {currency}
              </button>
              <button
                type="button"
                onClick={() => setIsYearly(!isYearly)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-colors cursor-pointer ${
                  isYearly
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                Cycle: {isYearly ? 'Annual (VIP)' : 'Monthly'}
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-[11px] uppercase font-mono tracking-wider text-zinc-600 dark:text-zinc-400">
                    <th className="py-3.5 px-6 w-2/5">Capabilities &amp; Infrastructure</th>
                    <th className="py-3.5 px-4 w-1/5">Free Starter</th>
                    <th className="py-3.5 px-4 w-1/5 bg-[var(--accent-light-bg)] dark:bg-[var(--accent-muted)] text-[var(--accent-light-text)] dark:text-[var(--accent-text)] font-bold">
                      Pro Platform
                    </th>
                    <th className="py-3.5 px-4 w-1/5">Enterprise</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 text-zinc-700 dark:text-zinc-300">
                  <tr className="font-mono text-[10px] uppercase font-bold tracking-wider bg-zinc-50 dark:bg-zinc-900/50 text-zinc-500">
                    <td colSpan={4} className="py-2 px-6">Pricing &amp; Terms</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-6 font-medium">Subscription Price</td>
                    <td className="py-3 px-4 font-mono">{currency === 'INR' ? '₹0' : '$0'} / forever</td>
                    <td className="py-3 px-4 font-mono font-bold text-[var(--accent)]">
                      {currency === 'INR'
                        ? (isYearly ? `₹${inrAnnual.toLocaleString()}/yr (~₹${Math.round(inrAnnual / 12)}/mo)` : `₹${inrMonthly}/mo all-incl.`)
                        : (isYearly ? `$${usdAnnual}/yr (~$${(usdAnnual / 12).toFixed(1)}/mo)` : `$${usdMonthly}/mo`)}
                    </td>
                    <td className="py-3 px-4 font-mono">Custom tailored</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-6 font-medium">Active Scheduled Jobs</td>
                    <td className="py-3 px-4 font-mono">5 jobs</td>
                    <td className="py-3 px-4 font-mono font-bold text-[var(--accent)]">
                      {isYearly ? '1,000 jobs (2x VIP)' : '500 jobs'}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-emerald-600 dark:text-emerald-400">Unlimited</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-6 font-medium">Minimum Execution Interval</td>
                    <td className="py-3 px-4 font-mono">60 seconds</td>
                    <td className="py-3 px-4 font-mono font-bold text-[var(--accent)]">
                      {isYearly ? '5 seconds (VIP)' : '10 seconds'}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-emerald-600 dark:text-emerald-400">1 second (Sub-second)</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-6 font-medium">Log &amp; Response Retention</td>
                    <td className="py-3 px-4 font-mono">3 days</td>
                    <td className="py-3 px-4 font-mono font-bold text-[var(--accent)]">
                      {isYearly ? '90 days (3x Retention)' : '30 days'}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold">365 days + S3 export</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-6 font-medium">Alert Channels &amp; Destinations</td>
                    <td className="py-3 px-4">3 channels (Email/Slack/Discord)</td>
                    <td className="py-3 px-4 font-semibold text-emerald-600 dark:text-emerald-400">Unlimited channels</td>
                    <td className="py-3 px-4 font-semibold text-indigo-500">Unlimited + SIEM Integration</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-6 font-medium">Worker Infrastructure</td>
                    <td className="py-3 px-4">Shared multi-tenant pool</td>
                    <td className="py-3 px-4 font-semibold text-[var(--accent)]">VIP Tier-1 Priority Queue</td>
                    <td className="py-3 px-4 font-semibold text-indigo-500">Dedicated Isolated VPC Cluster</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-6 font-medium">B2B Tax Invoice &amp; GST ITC</td>
                    <td className="py-3 px-4 text-zinc-400">—</td>
                    <td className="py-3 px-4">Gumroad GST Invoice</td>
                    <td className="py-3 px-4 font-semibold text-indigo-500">Official GSTIN ITC Invoice + PO</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-6 font-medium">Service Level Agreement (SLA)</td>
                    <td className="py-3 px-4">Best Effort</td>
                    <td className="py-3 px-4 font-semibold">99.9% Production SLA</td>
                    <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">99.99% Financially Backed</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto mt-20 space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              Frequently Asked Questions
            </h2>
            <p className="text-xs text-zinc-500">Everything you need to know about our billing.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-left">
            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 space-y-1.5">
              <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                How does license activation work?
              </div>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                When you purchase on Gumroad, your receipt contains a License Key. Simply enter this key on your Billing page to immediately unlock Pro capabilities.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 space-y-1.5">
              <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                What happens if I cancel my subscription?
              </div>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                You retain full Pro access until the end of your current billing period (grace period). You will never be billed again unless you reactivate.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 space-y-1.5">
              <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                What payment methods are supported?
              </div>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Gumroad handles payments securely and accepts all major Credit/Debit Cards, Apple Pay, Google Pay, and PayPal.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 space-y-1.5">
              <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                Can I get GST Input Tax Credit (ITC) for business?
              </div>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Yes! Both Pro (via Gumroad tax invoices) and Enterprise plans (via direct B2B tax invoice with GSTIN verification) support corporate tax compliance.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* ── Enterprise Contact Modal ────────────────────────────── */}
      {isEnterpriseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border p-6 sm:p-7 shadow-2xl relative bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100">
            {/* Close Button */}
            <button
              onClick={() => setIsEnterpriseModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Contact Enterprise Sales</h3>
                  <p className="text-xs text-zinc-500">Dedicated clusters, custom SLAs, and GST invoicing</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border text-xs space-y-2 bg-zinc-50 dark:bg-zinc-950/80 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300">
                <div className="font-semibold text-zinc-900 dark:text-white flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Direct Solutions Desk: enterprise@samast.pro</span>
                </div>
                <p className="text-[11px] leading-relaxed text-zinc-500">
                  Our infrastructure architects will review your job throughput requirements, SLA needs, and network configuration within 2 hours.
                </p>
              </div>

              {/* Inquiry Template Preview */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                  Inquiry Template:
                </label>
                <div className="p-3 rounded-lg border font-mono text-[11px] leading-relaxed select-all bg-zinc-100 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400">
                  <p><strong>To:</strong> enterprise@samast.pro</p>
                  <p><strong>Subject:</strong> Enterprise Plan Inquiry - Samast Cron</p>
                  <p className="mt-1">Organization, Job Volume, VPC/SLA &amp; Compliance Requirements</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <a
                  href="mailto:enterprise@samast.pro?subject=Enterprise%20Plan%20Inquiry%20-%20Samast%20Cron&body=Hello%20Samast%20Cron%20Enterprise%20Team%2C%0A%0AWe%20would%20like%20to%20inquire%20about%20an%20Enterprise%20subscription%20and%20dedicated%20worker%20cluster.%0A%0AOrganization%20Name%3A%20%0AWork%20Email%3A%20%0AEstimated%20Active%20Jobs%20Volume%3A%20%0AExecution%20Frequency%20(e.g.%201s%20or%205s)%3A%20%0AInfrastructure%20Requirements%20(Dedicated%20VPC%2C%20Static%20IPs%2C%20SLA)%3A%20%0ACompliance%20Requirements%20(GST%20ITC%2C%20SOC2%2C%20Custom%20PO)%3A%20%0A%0AThank%20you!"
                  className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl btn-accent text-center shadow-sm"
                >
                  <Mail className="w-4 h-4" />
                  <span>Open Email Client</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    const template = `Hello Samast Cron Enterprise Team,

We would like to inquire about an Enterprise subscription and dedicated worker cluster.

Organization Name: [Your Company]
Work Email: [Your Email]
Estimated Active Jobs Volume: [e.g. 5,000+ jobs]
Execution Frequency: [e.g. 1s / 5s sub-minute]
Infrastructure Requirements: [Dedicated VPC, Static Egress IPs, 99.99% SLA]
Compliance Requirements: [GST Input Tax Credit (ITC), SOC2, Custom PO / Net 30]

Thank you!`;
                    navigator.clipboard.writeText(template);
                    setCopiedTemplate(true);
                    setTimeout(() => setCopiedTemplate(false), 2500);
                  }}
                  className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl border transition-colors cursor-pointer ${
                    copiedTemplate
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  {copiedTemplate ? <CheckCheck className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedTemplate ? 'Copied to Clipboard!' : 'Copy Template'}</span>
                </button>
              </div>

              <p className="text-[10px] text-center text-zinc-500">
                Prefer a direct call or custom MSA? Mention it in your email and we will schedule an engineer immediately.
              </p>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
