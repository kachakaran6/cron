import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight, ExternalLink, Clock, Activity, ShieldCheck,
  Globe, Zap, Lock, Sun, Moon, Terminal, Key, AlertTriangle,
  Play, CheckCircle2, Check, Sparkles, Building2, HelpCircle,
  Mail, Phone, Layers, X, Copy, CheckCheck, ChevronDown,
  ChevronUp, Shield, Server, FileText
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Footer } from '../components/layout/Footer';
import { fetchGumroadTiers } from '../services/api';

const CURL_SNIPPET = `curl -X POST https://cron.samast.pro/api/v1/jobs \\
  -H "X-API-Key: cr_live_••••••••••••••••••••••••" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Invoice Sync",
    "url": "https://api.acme.com/sync-invoices",
    "method": "POST",
    "schedule": "0 2 * * *",
    "timezone": "Asia/Kolkata"
  }'`;

const RESPONSE_SNIPPET = `{
  "id": "cj_01hwz3k9m2",
  "name": "Invoice Sync",
  "schedule": "0 2 * * *",
  "nextRunAt": "2026-09-13T20:30:00.000Z",
  "enabled": true
}`;

interface StatItemProps { label: string; value: string; dark: boolean; }
function StatItem({ label, value, dark }: StatItemProps) {
  return (
    <div className="flex flex-col gap-1 p-2 sm:p-3 rounded-lg border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 transition-colors">
      <span className={`text-3xl sm:text-4xl font-extrabold tracking-tight font-mono ${
        dark ? 'text-zinc-100' : 'text-zinc-900'
      }`}>
        {value}
      </span>
      <span className={`text-xs font-medium ${
        dark ? 'text-zinc-400' : 'text-zinc-600'
      }`}>
        {label}
      </span>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
  badge?: string;
  theme: 'dark' | 'light';
}
function FeatureCard({ icon, title, desc, badge, theme }: FeatureCardProps) {
  return (
    <div className={`group p-5 border rounded-lg flex flex-col gap-3 transition-colors ${
      theme === 'dark'
        ? 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
        : 'border-zinc-200 bg-white hover:border-zinc-300'
    }`}>
      <div className="flex items-center justify-between">
        <div className={`w-8 h-8 rounded flex items-center justify-center ${
          theme === 'dark' ? 'bg-zinc-900 text-zinc-400' : 'bg-zinc-100 text-zinc-500'
        }`}>
          {icon}
        </div>
        {badge && (
          <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${
            theme === 'dark'
              ? 'bg-zinc-800 text-zinc-300 border border-zinc-700'
              : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
          }`}>
            {badge}
          </span>
        )}
      </div>
      <div>
        <h3 className={`text-sm font-semibold mb-1 ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-900'}`}>{title}</h3>
        <p className={`text-xs leading-relaxed ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>{desc}</p>
      </div>
    </div>
  );
}

/**
 * Interactive Cron Engine Animation Visualizer
 */
function CronSchedulerVisualizer({ dark }: { dark: boolean }) {
  const [selectedPreset, setSelectedPreset] = useState('*/5 * * * *');
  const [progress, setProgress] = useState(45);
  const [pulseActive, setPulseActive] = useState(false);
  const [dispatchedCount, setDispatchedCount] = useState(1482);
  const [timeString, setTimeString] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(now.toTimeString().split(' ')[0] + ' UTC');
    };
    updateTime();
    const clockTimer = setInterval(updateTime, 1000);
    return () => clearInterval(clockTimer);
  }, []);

  useEffect(() => {
    const ticker = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setPulseActive(true);
          setDispatchedCount((c) => c + 1);
          setTimeout(() => setPulseActive(false), 900);
          return 0;
        }
        return prev + 4;
      });
    }, 250);

    return () => clearInterval(ticker);
  }, []);

  return (
    <div className={`w-full max-w-3xl mx-auto mt-2 rounded-xl border p-3 sm:p-4 shadow-2xl transition-all font-mono text-xs ${
      dark ? 'border-zinc-800 bg-zinc-950/90' : 'border-zinc-300 bg-white/95'
    }`}>
      {/* Visualizer Terminal Top Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800 text-[11px]">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <span className="font-semibold text-zinc-700 dark:text-zinc-300 ml-2">
            CRON ENGINE KERNEL: ACTIVE
          </span>
        </div>

        <div className="flex items-center gap-2 text-zinc-500">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          <span>{timeString || 'LIVE'}</span>
        </div>
      </div>

      {/* Preset Expression Selector */}
      <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-[11px] text-zinc-500">SELECT CRON PATTERN:</div>
        <div className="flex flex-wrap gap-1.5">
          {[
            { label: 'Every 1m', expr: '* * * * *' },
            { label: 'Every 5m', expr: '*/5 * * * *' },
            { label: 'Hourly', expr: '0 * * * *' },
            { label: 'Nightly', expr: '0 0 * * *' },
          ].map((p) => (
            <button
              key={p.expr}
              onClick={() => setSelectedPreset(p.expr)}
              className={`px-2.5 py-1 rounded text-[11px] border transition-colors ${
                selectedPreset === p.expr
                  ? 'border-[var(--accent)] bg-[var(--accent-light-bg)] dark:bg-[var(--accent-muted)] text-[var(--accent-light-text)] dark:text-[var(--accent-text)] font-semibold'
                  : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 text-zinc-600 dark:text-zinc-400'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Live Dispatch Countdown Progress Meter */}
      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-zinc-600 dark:text-zinc-400">
            Active Schedule: <span className="font-bold text-zinc-900 dark:text-zinc-100">{selectedPreset}</span>
          </span>
          <span className="text-zinc-500">
            Next Dispatch: <span className="font-bold text-zinc-900 dark:text-zinc-200">{Math.max(0, 100 - progress)}%</span>
          </span>
        </div>

        <div className="w-full h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden relative">
          <div
            className="h-full rounded-full transition-all duration-200 ease-out"
            style={{
              width: `${progress}%`,
              backgroundColor: 'var(--accent)',
            }}
          />
        </div>
      </div>

      {/* Live Dispatch Event Box */}
      <div className={`mt-4 p-3.5 rounded-lg border transition-all duration-300 ${
        pulseActive
          ? 'border-emerald-500 bg-emerald-500/10 dark:bg-emerald-950/40 shadow-lg'
          : dark
          ? 'border-zinc-800 bg-zinc-900/60'
          : 'border-zinc-200 bg-zinc-50'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${pulseActive ? 'bg-emerald-500 animate-ping' : 'bg-emerald-500'}`} />
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              POST https://api.acme.com/webhooks/database-sync
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold">
              HTTP 200 OK
            </span>
            <span className="text-zinc-500 font-semibold">14ms latency</span>
          </div>
        </div>

        <div className="mt-2 text-[11px] text-zinc-500 flex flex-wrap items-center gap-3">
          <span>Worker: node-us-east-1</span>
          <span>•</span>
          <span>SSRF: Protected</span>
          <span>•</span>
          <span>Total Dispatched: <strong className="text-zinc-700 dark:text-zinc-300">{dispatchedCount}</strong></span>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, user } = useAuth();
  const dark = theme === 'dark';

  const [isYearly, setIsYearly] = useState(false);
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');
  const [isEnterpriseModalOpen, setIsEnterpriseModalOpen] = useState(false);
  const [copiedTemplate, setCopiedTemplate] = useState(false);

  const { data: gumroadData } = useQuery({
    queryKey: ['public-pricing-tiers', user?.email],
    queryFn: () => fetchGumroadTiers(user?.email),
  });

  const p = gumroadData?.pricing;
  const plans = gumroadData?.plans;
  const usdMonthly = p?.usdMonthly ?? 19;
  const usdAnnual = p?.usdAnnual ?? 190;
  const inrMonthly = p?.inrMonthly ?? 399;
  const inrAnnual = p?.inrAnnual ?? 3295;
  const inrMonthlyBase = p?.inrMonthlyBase ?? 349;
  const discountTagUsd = p?.discountTagUsd || 'Save 17%';
  const discountTagInr = p?.discountTagInr || 'Save ~31%';

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
        ? p?.permalinks?.inrAnnual || gumroadData?.productPermalinkInAnnual || 'https://samastcron.gumroad.com/l/cron-ultra-in-annual'
        : p?.permalinks?.inrMonthly || gumroadData?.productPermalinkInMonthly || 'https://samastcron.gumroad.com/l/cron-ultra-in-monthly';
    }
    return isYearly
      ? p?.permalinks?.usdAnnual || gumroadData?.productPermalinkAnnual || 'https://samastcron.gumroad.com/l/cron-ultra-annual'
      : p?.permalinks?.usdMonthly || gumroadData?.productPermalink || 'https://samastcron.gumroad.com/l/cron-ultra';
  };

  const checkoutUrl = getCheckoutUrl();

  const enterpriseMailto = `mailto:enterprise@samast.pro?subject=Enterprise%20Plan%20Inquiry%20-%20Samast%20Cron&body=Hello%20Samast%20Cron%20Enterprise%20Team%2C%0A%0AWe%20would%20like%20to%20inquire%20about%20an%20Enterprise%20subscription%20and%20dedicated%20worker%20cluster.%0A%0AOrganization%20Name%3A%20%0AWork%20Email%3A%20%0AEstimated%20Active%20Jobs%20Volume%3A%20%0AExecution%20Frequency%20(e.g.%201s%20or%205s)%3A%20%0AInfrastructure%20Requirements%20(Dedicated%20VPC%2C%20Static%20IPs%2C%20SLA)%3A%20%0ACompliance%20Requirements%20(GST%20ITC%2C%20SOC2%2C%20Custom%20PO)%3A%20%0A%0AThank%20you!`;

  const copyEnterpriseTemplate = () => {
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
  };

  return (
    <div className={`min-h-screen font-sans flex flex-col transition-colors ${dark ? 'bg-zinc-950 text-zinc-100' : 'bg-white text-zinc-900'}`}>

      {/* ── Nav ─────────────────────────────────────────────────── */}
      <header className={`h-14 border-b px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 ${
        dark ? 'border-zinc-800 bg-zinc-950/95 backdrop-blur-sm' : 'border-zinc-200 bg-white/95 backdrop-blur-sm'
      }`}>
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2.5">
            <div 
              style={{ backgroundColor: 'var(--accent)' }}
              className="w-6 h-6 rounded flex items-center justify-center font-mono font-bold text-xs text-white shadow-sm"
            >
              SC
            </div>
            <span className="font-semibold text-sm tracking-tight text-zinc-900 dark:text-zinc-100">
              Samast Cron
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-5 text-xs font-medium">
            <a href="#features" className={`transition-colors ${dark ? 'text-zinc-400 hover:text-zinc-100' : 'text-zinc-500 hover:text-zinc-900'}`}>Features</a>
            <a href="#pricing" className={`transition-colors ${dark ? 'text-zinc-300 hover:text-white font-semibold' : 'text-zinc-700 hover:text-zinc-900 font-semibold'}`}>Pricing</a>
            <a href="#api" className={`transition-colors ${dark ? 'text-zinc-400 hover:text-zinc-100' : 'text-zinc-500 hover:text-zinc-900'}`}>API</a>
            <Link to="/docs" className={`transition-colors ${dark ? 'text-zinc-400 hover:text-zinc-100' : 'text-zinc-500 hover:text-zinc-900'}`}>Docs</Link>
            <a href="/api/docs" target="_blank" rel="noreferrer" className={`flex items-center gap-1 transition-colors ${dark ? 'text-zinc-400 hover:text-zinc-100' : 'text-zinc-500 hover:text-zinc-900'}`}>
              OpenAPI <ExternalLink className="w-3 h-3" />
            </a>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className={`p-1.5 rounded border transition-colors ${dark ? 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-100' : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100'}`}
            title="Toggle theme"
          >
            {dark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
          {!isAuthenticated && (
            <Link to="/login" className={`text-xs px-3 py-1.5 rounded transition-colors ${dark ? 'text-zinc-400 hover:text-zinc-100' : 'text-zinc-600 hover:text-zinc-900'}`}>
              Sign in
            </Link>
          )}
          <Link
            to={isAuthenticated ? '/dashboard' : '/register'}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded transition-colors btn-accent"
          >
            {isAuthenticated ? 'Open Console' : 'Get Started'}
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <main className="flex-1">
        <section className="px-4 sm:px-6 pt-6 sm:pt-8 pb-10 max-w-5xl mx-auto">
          <div className="flex flex-col items-center text-center">
            {/* Release tag */}
            <div className={`inline-flex items-center gap-2 px-3 py-0.5 rounded-full border text-[11px] font-mono mb-3 ${
              dark ? 'border-zinc-800 bg-zinc-900/90 text-zinc-400' : 'border-zinc-200 bg-zinc-50 text-zinc-600'
            }`}>
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">v1.4.2</span>
              <span>·</span>
              <span>Production HTTP Scheduling Engine</span>
            </div>

            <h1 className={`text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight max-w-3xl mb-2.5 ${
              dark ? 'text-zinc-50' : 'text-zinc-900'
            }`}>
              Scheduled HTTP&nbsp;jobs,{' '}
              <span className={dark ? 'text-zinc-400' : 'text-zinc-500'}>done right.</span>
            </h1>

            <p className={`text-xs sm:text-sm max-w-xl leading-relaxed mb-4 ${dark ? 'text-zinc-400' : 'text-zinc-600'}`}>
              Samast Cron is a production-grade cron scheduling platform. Define schedules with cron expressions,
              inspect every execution, configure headers and timeouts, and receive alerts when jobs fail.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto justify-center mb-4">
              <Link
                to={isAuthenticated ? '/dashboard' : '/register'}
                className="w-full sm:w-auto flex items-center justify-center gap-2 text-xs font-semibold px-4 py-2 rounded transition-all btn-accent shadow-sm"
              >
                {isAuthenticated ? 'Open Dashboard' : 'Create free account'}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <a
                href="/api/docs"
                target="_blank"
                rel="noreferrer"
                className={`w-full sm:w-auto flex items-center justify-center gap-1.5 text-xs font-medium px-4 py-2 rounded border transition-colors ${
                  dark ? 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white hover:border-zinc-700' : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                View API reference
              </a>
            </div>

            {/* Above-The-Fold Stats Ribbon */}
            <div className="w-full max-w-3xl grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              <div className={`p-2 rounded-lg border text-center font-mono ${dark ? 'bg-zinc-900/60 border-zinc-800/80' : 'bg-zinc-50 border-zinc-200'}`}>
                <div className="text-base sm:text-lg font-black tracking-tight text-zinc-900 dark:text-zinc-100">500</div>
                <div className="text-[10px] text-zinc-500 font-sans">Max jobs / account</div>
              </div>
              <div className={`p-2 rounded-lg border text-center font-mono ${dark ? 'bg-zinc-900/60 border-zinc-800/80' : 'bg-zinc-50 border-zinc-200'}`}>
                <div className="text-base sm:text-lg font-black tracking-tight text-zinc-900 dark:text-zinc-100">60s</div>
                <div className="text-[10px] text-zinc-500 font-sans">Min interval</div>
              </div>
              <div className={`p-2 rounded-lg border text-center font-mono ${dark ? 'bg-zinc-900/60 border-zinc-800/80' : 'bg-zinc-50 border-zinc-200'}`}>
                <div className="text-base sm:text-lg font-black tracking-tight text-zinc-900 dark:text-zinc-100">30d</div>
                <div className="text-[10px] text-zinc-500 font-sans">Log retention</div>
              </div>
              <div className={`p-2 rounded-lg border text-center font-mono ${dark ? 'bg-zinc-900/60 border-zinc-800/80' : 'bg-zinc-50 border-zinc-200'}`}>
                <div className="text-base sm:text-lg font-black tracking-tight text-emerald-600 dark:text-emerald-400">99.9%</div>
                <div className="text-[10px] text-zinc-500 font-sans">Uptime SLA</div>
              </div>
            </div>

            {/* Cron Animation Visualizer */}
            <CronSchedulerVisualizer dark={dark} />
          </div>
        </section>

        {/* ── Features Grid ────────────────────────────────────────── */}
        <section id="features" className={`py-16 px-4 sm:px-6 border-t ${dark ? 'border-zinc-800/60' : 'border-zinc-100'}`}>
          <div className="max-w-5xl mx-auto">
            <div className="mb-10">
              <p className={`text-[11px] font-mono uppercase tracking-widest mb-2 ${dark ? 'text-zinc-500' : 'text-zinc-400'}`}>Platform features</p>
              <h2 className={`text-2xl font-bold tracking-tight ${dark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                Everything you need, nothing you don't.
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <FeatureCard theme={theme} icon={<Clock className="w-4 h-4" />} title="Cron Expression Scheduling" badge="STANDARD" desc="Full 5-field cron syntax support with per-timezone scheduling. Preview next N run times before saving." />
              <FeatureCard theme={theme} icon={<Activity className="w-4 h-4" />} title="Execution History" desc="Every HTTP invocation is logged: status code, latency, response body, error trace. 30-day retention." />
              <FeatureCard theme={theme} icon={<Key className="w-4 h-4" />} title="Programmatic API Keys" badge="cr_live_..." desc="Create scoped API keys (cr_live_...) for CI pipelines, Terraform, or your own tooling." />
              <FeatureCard theme={theme} icon={<Globe className="w-4 h-4" />} title="Custom Headers & Body" desc="Send Authorization tokens, custom user-agents, and arbitrary JSON bodies with each invocation." />
              <FeatureCard theme={theme} icon={<ShieldCheck className="w-4 h-4" />} title="SSRF-Protected Workers" badge="SECURE" desc="Execution workers block private IP ranges and metadata endpoints. Configurable per-job timeouts up to 30s." />
              <FeatureCard theme={theme} icon={<AlertTriangle className="w-4 h-4" />} title="Failure Alerting" desc="Receive webhook or email alerts when a job fails consecutively. Configurable failure thresholds." />
              <FeatureCard theme={theme} icon={<Zap className="w-4 h-4" />} title="Manual Trigger" desc="Trigger any cron job immediately from the dashboard or API without waiting for the next scheduled run." />
              <FeatureCard theme={theme} icon={<Lock className="w-4 h-4" />} title="Dashboard Auth" desc="Secure email + password accounts with JWT sessions. Full light and dark mode support." />
              <FeatureCard theme={theme} icon={<Terminal className="w-4 h-4" />} title="OpenAPI / Swagger" desc="Full REST API with Swagger documentation. Integrate Samast Cron into any existing infrastructure stack." />
            </div>
          </div>
        </section>

        {/* ── Pricing Section ──────────────────────────────────────── */}
        <section id="pricing" className={`py-20 px-4 sm:px-6 border-t ${dark ? 'border-zinc-800/60 bg-zinc-950/60' : 'border-zinc-200/80 bg-zinc-50/50'}`}>
          <div className="max-w-6xl mx-auto space-y-12">
            
            {/* Header & Badges */}
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Transparent, Developer-First Pricing</span>
              </div>

              <h2 className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${dark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                Predictable plans for every stage of infrastructure.
              </h2>

              <p className={`text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed ${dark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                Start for free with reliable minute-level schedules. Upgrade to Pro for high-throughput 5-second precision and 1,000 active jobs, or choose Enterprise for dedicated VPC clusters and bespoke SLAs.
              </p>

              {/* Controls: Currency + Billing Cycle Toggles */}
              <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pt-6">
                
                {/* Currency Selector */}
                <div className="inline-flex items-center p-1 rounded-xl bg-zinc-200/80 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => setCurrency('USD')}
                    className={`px-3.5 py-1.5 rounded-lg transition-all font-semibold ${
                      currency === 'USD'
                        ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
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
                        ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                        : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                    }`}
                  >
                    INR (₹)
                  </button>
                </div>

                {/* Billing Cycle Toggle */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsYearly(false)}
                    className={`text-xs transition-colors cursor-pointer ${!isYearly ? (dark ? 'text-white font-bold' : 'text-zinc-900 font-bold') : 'text-zinc-500'}`}
                  >
                    Monthly
                  </button>
                  
                  <button
                    type="button"
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

                  <button
                    type="button"
                    onClick={() => setIsYearly(true)}
                    className={`text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${isYearly ? (dark ? 'text-white font-bold' : 'text-zinc-900 font-bold') : 'text-zinc-500'}`}
                  >
                    <span>Annually</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      {currency === 'INR' ? discountTagInr : discountTagUsd}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* 3 Pricing Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch">
              
              {/* Card 1: Free Starter */}
              <div className={`p-6 sm:p-7 rounded-2xl border flex flex-col justify-between transition-all ${
                dark ? 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700' : 'border-zinc-200 bg-white hover:border-zinc-300 shadow-sm'
              }`}>
                <div className="space-y-4">
                  <div>
                    <h3 className={`text-lg font-bold ${dark ? 'text-zinc-100' : 'text-zinc-900'}`}>Free Starter</h3>
                  </div>
                  <p className={`text-xs leading-relaxed ${dark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    Everything you need for personal pet projects, hobby experiments, and side-hustle automations.
                  </p>

                  <div className="pt-2">
                    <div className={`text-3xl sm:text-4xl font-extrabold ${dark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                      {currency === 'INR' ? '₹0' : '$0'}
                      <span className="text-xs font-normal text-zinc-500"> / forever</span>
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-1">No credit card required. Always free.</p>
                  </div>

                  <div className={`pt-5 border-t space-y-2.5 ${dark ? 'border-zinc-800/80' : 'border-zinc-100'}`}>
                    <div className={`text-xs font-semibold ${dark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                      What's Included:
                    </div>
                    <ul className="space-y-2.5 text-xs">
                      {[
                        `${freeJobs} Active Scheduled Jobs`,
                        `${freeMinInterval}-second minimum execution interval`,
                        `${freeRetention} days run history & response payloads`,
                        '3 Alert Notification Channels',
                        `${freeEmails} Email notifications / month`,
                        '1 Public or Private Status Page',
                        'Multi-tenant shared worker cluster',
                        'Community Discord & Documentation',
                      ].map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span className={dark ? 'text-zinc-300' : 'text-zinc-600'}>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-6">
                  <Link
                    to={isAuthenticated ? '/dashboard' : '/register'}
                    className={`w-full inline-flex items-center justify-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl border transition-colors text-center ${
                      dark
                        ? 'border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
                        : 'border-zinc-300 bg-zinc-100 text-zinc-800 hover:bg-zinc-200'
                    }`}
                  >
                    <span>{isAuthenticated ? 'Open Dashboard' : 'Get Started Free'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Card 2: Pro Platform (Ultra) */}
              <div className="p-6 sm:p-7 rounded-2xl border-2 border-[var(--accent)] bg-white dark:bg-zinc-900 shadow-xl relative flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className={`text-lg font-bold flex items-center gap-2 ${dark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                      <span>Pro Platform</span>
                      <Sparkles className="w-4 h-4 text-amber-500" />
                    </h3>
                  </div>
                  <p className={`text-xs leading-relaxed ${dark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    For production applications, SaaS platforms, high-frequency webhooks, and critical backend infrastructure.
                  </p>

                  <div className="pt-2">
                    <div className={`text-3xl sm:text-4xl font-extrabold ${dark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                      {currency === 'INR'
                        ? (isYearly ? `₹${inrAnnual.toLocaleString()}` : `₹${inrMonthly.toLocaleString()}`)
                        : (isYearly ? `$${usdAnnual}` : `$${usdMonthly}`)}
                      <span className="text-xs font-normal text-zinc-500">
                        {' '}/ {isYearly
                          ? (currency === 'INR' ? `year (~₹${Math.round(inrAnnual / 12)}/mo)` : `year (~$${Math.round(usdAnnual / 12)}/mo)`)
                          : 'month'}
                      </span>
                    </div>
                    {currency === 'INR' ? (
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 font-medium">
                        {isYearly
                          ? `Annual Pass: ₹${inrAnnual.toLocaleString()}/yr (${discountTagInr})`
                          : `₹${inrMonthlyBase} base + 18% GST = ₹${inrMonthly} all-inclusive total`}
                      </p>
                    ) : (
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
                        {isYearly ? `Billed annually ($${usdAnnual}/yr). ${discountTagUsd}` : 'Billed monthly. Cancel anytime.'}
                      </p>
                    )}
                  </div>

                  <div className={`pt-5 border-t space-y-2.5 ${dark ? 'border-zinc-800' : 'border-zinc-100'}`}>
                    <div className={`text-xs font-semibold ${dark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                      <span>{isYearly ? 'Everything in Pro, plus Annual benefits:' : 'All Free features, plus:'}</span>
                    </div>
                    <ul className="space-y-2.5 text-xs font-medium">
                      {(isYearly
                        ? [
                            `${annualJobs.toLocaleString()} Active Scheduled Jobs (2x Double Capacity)`,
                            `${annualMinInterval}-Second Real-Time Execution Precision`,
                            `${annualRetention} Days Full Logs & Payloads (3x Retention)`,
                            'Smart Exponential Retries with Jitter',
                            'VIP Tier 1 High-Priority Dedicated Queue',
                            'Unlimited Push, Webhook, Slack & Discord Channels',
                            `${annualEmails.toLocaleString()} Email Alerts / month`,
                            '10 Custom Domain Status Pages',
                            '4-Hour Priority Email & Discord Developer Support',
                          ]
                        : [
                            `${proJobs.toLocaleString()} Active Scheduled Jobs`,
                            `${proMinInterval}-Second High-Precision Cron Intervals`,
                            `${proRetention} Days Full Execution Logs & Response Payloads`,
                            'Smart Auto-Retries with Exponential Backoff',
                            'High-Priority VIP Worker Execution Queue',
                            'Unlimited Push, Webhook, Slack & Discord Channels',
                            `${proEmails.toLocaleString()} Email Alerts / month`,
                            '10 Custom Domain Status Pages',
                            '4-Hour Priority Email & Discord Developer Support',
                          ]
                      ).map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isYearly ? 'text-amber-500 font-bold' : 'text-[var(--accent)] font-bold'}`} />
                          <span className={isYearly && idx < 3 ? (dark ? 'font-bold text-white' : 'font-bold text-zinc-900') : (dark ? 'text-zinc-200' : 'text-zinc-700')}>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-6 space-y-2">
                  <a
                    href={checkoutUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl btn-accent shadow-md hover:opacity-95 transition-all text-center"
                  >
                    <span>
                      {currency === 'INR'
                        ? `Upgrade via Gumroad (${isYearly ? `₹${inrAnnual.toLocaleString()}/yr` : `₹${inrMonthly}/mo Total`})`
                        : `Upgrade via Gumroad (${isYearly ? `$${usdAnnual}/yr` : `$${usdMonthly}/mo`})`}
                    </span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <p className="text-[10px] text-center text-zinc-500">
                    Instant License Key delivered • Cancel anytime • Tax Invoice included
                  </p>
                </div>
              </div>

              {/* Card 3: Enterprise */}
              <div className={`p-6 sm:p-7 rounded-2xl border flex flex-col justify-between transition-all ${
                dark ? 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700' : 'border-zinc-200 bg-white hover:border-zinc-300 shadow-sm'
              }`}>
                <div className="space-y-4">
                  <div>
                    <h3 className={`text-lg font-bold flex items-center gap-2 ${dark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                      <Building2 className="w-4 h-4 text-indigo-500" />
                      <span>Enterprise</span>
                    </h3>
                  </div>
                  <p className={`text-xs leading-relaxed ${dark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    Tailored architecture for enterprises requiring dedicated VPC worker clusters, custom compliance, and bespoke SLAs.
                  </p>

                  <div className="pt-2">
                    <div className={`text-3xl sm:text-4xl font-extrabold ${dark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                      Custom
                      <span className="text-xs font-normal text-zinc-500"> / tailored scale</span>
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-1">Billed annually or quarterly with Purchase Orders (PO) &amp; Net 30.</p>
                  </div>

                  <div className={`pt-5 border-t space-y-2.5 ${dark ? 'border-zinc-800/80' : 'border-zinc-100'}`}>
                    <div className={`text-xs font-semibold ${dark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                      Enterprise Capabilities:
                    </div>
                    <ul className="space-y-2.5 text-xs">
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
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                          <span className={dark ? 'text-zinc-300' : 'text-zinc-600'}>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-6 space-y-2">
                  <button
                    type="button"
                    onClick={() => setIsEnterpriseModalOpen(true)}
                    className="w-full inline-flex items-center justify-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white/90 transition-all text-center shadow-sm cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Contact Enterprise Sales</span>
                  </button>
                  <p className="text-[10px] text-center text-zinc-500">
                    Fast response guaranteed within 2 business hours
                  </p>
                </div>
              </div>

            </div>

            {/* Feature Capability Comparison Matrix */}
            <div className={`mt-16 pt-12 border-t ${dark ? 'border-zinc-800' : 'border-zinc-200'}`}>
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-widest text-zinc-500 mb-1">
                    Feature Breakdown
                  </div>
                  <h3 className={`text-xl sm:text-2xl font-bold tracking-tight ${dark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                    Compare All Plan Capabilities
                  </h3>
                  <p className={`text-xs mt-1 ${dark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    Dynamic specifications reflect your selected currency ({currency}) and billing cycle ({isYearly ? 'Annual' : 'Monthly'}).
                  </p>
                </div>

                {/* Quick Toggle Controls within Matrix */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-[11px] text-zinc-500 hidden sm:inline">Active View:</span>
                  <button
                    type="button"
                    onClick={() => setCurrency(currency === 'INR' ? 'USD' : 'INR')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-colors cursor-pointer ${
                      dark ? 'border-zinc-800 bg-zinc-900 hover:border-zinc-700 text-zinc-300' : 'border-zinc-300 bg-white hover:border-zinc-400 text-zinc-700'
                    }`}
                  >
                    Currency: {currency}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsYearly(!isYearly)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-colors cursor-pointer ${
                      isYearly
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : dark ? 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700' : 'border-zinc-300 bg-white text-zinc-600'
                    }`}
                  >
                    Cycle: {isYearly ? 'Annual (VIP)' : 'Monthly'}
                  </button>
                </div>
              </div>

              {/* Matrix Table */}
              <div className={`rounded-2xl border overflow-hidden shadow-sm ${dark ? 'border-zinc-800 bg-zinc-950/80' : 'border-zinc-200 bg-white'}`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className={`border-b text-[11px] uppercase font-mono tracking-wider ${
                        dark ? 'border-zinc-800 bg-zinc-900/90 text-zinc-400' : 'border-zinc-200 bg-zinc-50 text-zinc-600'
                      }`}>
                        <th className="py-3.5 px-4 sm:px-6 w-2/5">Capabilities &amp; Infrastructure</th>
                        <th className="py-3.5 px-3 sm:px-4 w-1/5">Free Starter</th>
                        <th className="py-3.5 px-3 sm:px-4 w-1/5 bg-[var(--accent-light-bg)] dark:bg-[var(--accent-muted)] text-[var(--accent-light-text)] dark:text-[var(--accent-text)] font-bold">
                          Pro Platform
                        </th>
                        <th className="py-3.5 px-3 sm:px-4 w-1/5">Enterprise</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${dark ? 'divide-zinc-800/80 text-zinc-300' : 'divide-zinc-100 text-zinc-700'}`}>
                      
                      {/* Section: Pricing & Terms */}
                      <tr className={`font-mono text-[10px] uppercase font-bold tracking-wider ${dark ? 'bg-zinc-900/50 text-zinc-500' : 'bg-zinc-50 text-zinc-400'}`}>
                        <td colSpan={4} className="py-2 px-4 sm:px-6">Pricing &amp; Terms</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 sm:px-6 font-medium">Subscription Price</td>
                        <td className="py-3 px-3 sm:px-4 font-mono">{currency === 'INR' ? '₹0' : '$0'} / forever</td>
                        <td className="py-3 px-3 sm:px-4 font-mono font-bold text-[var(--accent)]">
                          {currency === 'INR'
                            ? (isYearly ? '₹3,295/yr (~₹274/mo)' : '₹399/mo all-incl.')
                            : (isYearly ? '$190/yr (~$15.8/mo)' : '$19/mo')}
                        </td>
                        <td className="py-3 px-3 sm:px-4 font-mono">Custom tailored</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 sm:px-6 font-medium">Billing Cycles Available</td>
                        <td className="py-3 px-3 sm:px-4">Free forever</td>
                        <td className="py-3 px-3 sm:px-4 font-semibold">
                          Monthly or Annual ({currency === 'INR' ? '4 Mo Free' : '2 Mo Free'})
                        </td>
                        <td className="py-3 px-3 sm:px-4">Annual or Multi-Year PO</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 sm:px-6 font-medium">B2B Tax Invoicing &amp; GST ITC</td>
                        <td className="py-3 px-3 sm:px-4 text-zinc-400">—</td>
                        <td className="py-3 px-3 sm:px-4">Gumroad GST Invoice</td>
                        <td className="py-3 px-3 sm:px-4 font-semibold text-indigo-500">Official GSTIN ITC Invoice + PO</td>
                      </tr>

                      {/* Section: Core Scheduling */}
                      <tr className={`font-mono text-[10px] uppercase font-bold tracking-wider ${dark ? 'bg-zinc-900/50 text-zinc-500' : 'bg-zinc-50 text-zinc-400'}`}>
                        <td colSpan={4} className="py-2 px-4 sm:px-6">Core Scheduling &amp; Capacity</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 sm:px-6 font-medium">Active Scheduled Jobs</td>
                        <td className="py-3 px-3 sm:px-4 font-mono">5 jobs</td>
                        <td className="py-3 px-3 sm:px-4 font-mono font-bold text-[var(--accent)]">
                          {isYearly ? '1,000 jobs (2x VIP Bonus)' : '500 jobs'}
                        </td>
                        <td className="py-3 px-3 sm:px-4 font-mono font-semibold text-emerald-600 dark:text-emerald-400">Unlimited</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 sm:px-6 font-medium">Minimum Execution Interval</td>
                        <td className="py-3 px-3 sm:px-4 font-mono">60 seconds</td>
                        <td className="py-3 px-3 sm:px-4 font-mono font-bold text-[var(--accent)]">
                          {isYearly ? '5 seconds (VIP)' : '10 seconds'}
                        </td>
                        <td className="py-3 px-3 sm:px-4 font-mono font-semibold text-emerald-600 dark:text-emerald-400">1 second (Sub-second)</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 sm:px-6 font-medium">Cron Expression Syntax</td>
                        <td className="py-3 px-3 sm:px-4">Standard 5-field</td>
                        <td className="py-3 px-3 sm:px-4">5-field + sub-minute intervals</td>
                        <td className="py-3 px-3 sm:px-4">Custom cron &amp; second-precision</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 sm:px-6 font-medium">Timezone Precision Handling</td>
                        <td className="py-3 px-3 sm:px-4">All IANA Timezones</td>
                        <td className="py-3 px-3 sm:px-4">All IANA Timezones</td>
                        <td className="py-3 px-3 sm:px-4">All IANA + Custom clock drift sync</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 sm:px-6 font-medium">Manual Trigger on Demand</td>
                        <td className="py-3 px-3 sm:px-4"><Check className="w-4 h-4 text-emerald-500" /></td>
                        <td className="py-3 px-3 sm:px-4"><Check className="w-4 h-4 text-emerald-500" /></td>
                        <td className="py-3 px-3 sm:px-4"><Check className="w-4 h-4 text-emerald-500" /></td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 sm:px-6 font-medium">Custom Headers &amp; JSON Payload</td>
                        <td className="py-3 px-3 sm:px-4">Up to 10 KB</td>
                        <td className="py-3 px-3 sm:px-4">Up to 100 KB</td>
                        <td className="py-3 px-3 sm:px-4 font-semibold">Up to 10 MB (Streaming)</td>
                      </tr>

                      {/* Section: Reliability & Engine */}
                      <tr className={`font-mono text-[10px] uppercase font-bold tracking-wider ${dark ? 'bg-zinc-900/50 text-zinc-500' : 'bg-zinc-50 text-zinc-400'}`}>
                        <td colSpan={4} className="py-2 px-4 sm:px-6">Execution Engine &amp; Reliability</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 sm:px-6 font-medium">Execution Log &amp; Response Retention</td>
                        <td className="py-3 px-3 sm:px-4 font-mono">3 days</td>
                        <td className="py-3 px-3 sm:px-4 font-mono font-bold text-[var(--accent)]">
                          {isYearly ? '90 days (3x Retention)' : '30 days'}
                        </td>
                        <td className="py-3 px-3 sm:px-4 font-mono font-semibold">365 days + S3 export</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 sm:px-6 font-medium">HTTP Request Timeout</td>
                        <td className="py-3 px-3 sm:px-4 font-mono">15 seconds</td>
                        <td className="py-3 px-3 sm:px-4 font-mono">30 seconds</td>
                        <td className="py-3 px-3 sm:px-4 font-mono font-semibold">Up to 300 seconds</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 sm:px-6 font-medium">Intelligent Auto-Retry with Jitter</td>
                        <td className="py-3 px-3 sm:px-4 text-zinc-400">—</td>
                        <td className="py-3 px-3 sm:px-4 font-semibold text-emerald-600 dark:text-emerald-400">
                          Exponential Backoff
                        </td>
                        <td className="py-3 px-3 sm:px-4 font-semibold text-emerald-600 dark:text-emerald-400">
                          Custom Policies &amp; Dead-Letter
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 sm:px-6 font-medium">Worker Infrastructure Queue</td>
                        <td className="py-3 px-3 sm:px-4">Shared multi-tenant pool</td>
                        <td className="py-3 px-3 sm:px-4 font-semibold text-[var(--accent)]">
                          VIP Tier-1 Priority Queue
                        </td>
                        <td className="py-3 px-3 sm:px-4 font-semibold text-indigo-500">
                          Dedicated Isolated VPC Cluster
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 sm:px-6 font-medium">SSRF &amp; Private IP Shielding</td>
                        <td className="py-3 px-3 sm:px-4">RFC 1918 Block</td>
                        <td className="py-3 px-3 sm:px-4">Enhanced Multi-Layer Guard</td>
                        <td className="py-3 px-3 sm:px-4 font-semibold">Dedicated Static IPs &amp; Peering</td>
                      </tr>

                      {/* Section: Alerting & Status */}
                      <tr className={`font-mono text-[10px] uppercase font-bold tracking-wider ${dark ? 'bg-zinc-900/50 text-zinc-500' : 'bg-zinc-50 text-zinc-400'}`}>
                        <td colSpan={4} className="py-2 px-4 sm:px-6">Alerting &amp; Status Pages</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 sm:px-6 font-medium">Alert Channels Limit</td>
                        <td className="py-3 px-3 sm:px-4 font-mono">3 channels</td>
                        <td className="py-3 px-3 sm:px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">Unlimited</td>
                        <td className="py-3 px-3 sm:px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">Unlimited + SIEM</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 sm:px-6 font-medium">Supported Channels</td>
                        <td className="py-3 px-3 sm:px-4">Email, Slack, Discord</td>
                        <td className="py-3 px-3 sm:px-4 font-semibold">Email, Slack, Discord, Pushover, Webhooks</td>
                        <td className="py-3 px-3 sm:px-4 font-semibold text-indigo-500">All + PagerDuty, OpsGenie, Datadog</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 sm:px-6 font-medium">Email Alert Quota</td>
                        <td className="py-3 px-3 sm:px-4 font-mono">50 emails / month</td>
                        <td className="py-3 px-3 sm:px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">Unlimited</td>
                        <td className="py-3 px-3 sm:px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">Unlimited + Custom SMTP</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 sm:px-6 font-medium">Hosted Status Pages</td>
                        <td className="py-3 px-3 sm:px-4">1 Hosted Page</td>
                        <td className="py-3 px-3 sm:px-4 font-semibold">10 Custom Domain Pages</td>
                        <td className="py-3 px-3 sm:px-4 font-semibold text-indigo-500">Unlimited White-Label + SSO</td>
                      </tr>

                      {/* Section: Security, API & Governance */}
                      <tr className={`font-mono text-[10px] uppercase font-bold tracking-wider ${dark ? 'bg-zinc-900/50 text-zinc-500' : 'bg-zinc-50 text-zinc-400'}`}>
                        <td colSpan={4} className="py-2 px-4 sm:px-6">Security, API &amp; Governance</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 sm:px-6 font-medium">REST API &amp; OpenAPI Spec</td>
                        <td className="py-3 px-3 sm:px-4"><Check className="w-4 h-4 text-emerald-500" /></td>
                        <td className="py-3 px-3 sm:px-4"><Check className="w-4 h-4 text-emerald-500" /></td>
                        <td className="py-3 px-3 sm:px-4"><Check className="w-4 h-4 text-emerald-500" /></td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 sm:px-6 font-medium">Programmatic API Keys</td>
                        <td className="py-3 px-3 sm:px-4 font-mono">1 API Key</td>
                        <td className="py-3 px-3 sm:px-4 font-semibold text-emerald-600 dark:text-emerald-400">Unlimited Scoped Keys</td>
                        <td className="py-3 px-3 sm:px-4 font-semibold text-emerald-600 dark:text-emerald-400">Granular RBAC Scoped Keys</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 sm:px-6 font-medium">Team Collaborators</td>
                        <td className="py-3 px-3 sm:px-4 font-mono">1 user</td>
                        <td className="py-3 px-3 sm:px-4 font-semibold text-emerald-600 dark:text-emerald-400">Unlimited Team Members</td>
                        <td className="py-3 px-3 sm:px-4 font-semibold text-indigo-500">Unlimited + SAML / Okta SSO</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 sm:px-6 font-medium">Audit Trail Logs</td>
                        <td className="py-3 px-3 sm:px-4 text-zinc-400">—</td>
                        <td className="py-3 px-3 sm:px-4">Standard Activity Logs</td>
                        <td className="py-3 px-3 sm:px-4 font-semibold text-indigo-500">Tamper-Proof Audit Export</td>
                      </tr>

                      {/* Section: Support & SLA */}
                      <tr className={`font-mono text-[10px] uppercase font-bold tracking-wider ${dark ? 'bg-zinc-900/50 text-zinc-500' : 'bg-zinc-50 text-zinc-400'}`}>
                        <td colSpan={4} className="py-2 px-4 sm:px-6">Support &amp; SLA</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 sm:px-6 font-medium">Service Level Agreement (SLA)</td>
                        <td className="py-3 px-3 sm:px-4">Best Effort</td>
                        <td className="py-3 px-3 sm:px-4 font-semibold">99.9% Production SLA</td>
                        <td className="py-3 px-3 sm:px-4 font-bold text-emerald-600 dark:text-emerald-400">99.99% Financially Backed</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 sm:px-6 font-medium">Support Channel &amp; Response</td>
                        <td className="py-3 px-3 sm:px-4">Community Discord &amp; Docs</td>
                        <td className="py-3 px-3 sm:px-4 font-semibold">4-Hour Priority Email &amp; Discord</td>
                        <td className="py-3 px-3 sm:px-4 font-semibold text-indigo-500">1-Hour 24/7 Dedicated Slack &amp; Phone</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 sm:px-6 font-medium">Dedicated Solutions Engineer</td>
                        <td className="py-3 px-3 sm:px-4 text-zinc-400">—</td>
                        <td className="py-3 px-3 sm:px-4 text-zinc-400">—</td>
                        <td className="py-3 px-3 sm:px-4 font-semibold text-emerald-600 dark:text-emerald-400"><Check className="w-4 h-4 text-emerald-500" /></td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 sm:px-6 font-medium">Security &amp; Vendor Compliance Review</td>
                        <td className="py-3 px-3 sm:px-4 text-zinc-400">—</td>
                        <td className="py-3 px-3 sm:px-4 text-zinc-400">—</td>
                        <td className="py-3 px-3 sm:px-4 font-semibold text-emerald-600 dark:text-emerald-400"><Check className="w-4 h-4 text-emerald-500" /></td>
                      </tr>

                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ── Code Block ────────────────────────────────────────────── */}
        <section id="api" className={`py-16 px-4 sm:px-6 border-t ${dark ? 'border-zinc-800/60' : 'border-zinc-100'}`}>
          <div className="max-w-5xl mx-auto">
            <div className="mb-10">
              <p className={`text-[11px] font-mono uppercase tracking-widest mb-2 ${dark ? 'text-zinc-500' : 'text-zinc-400'}`}>REST API</p>
              <h2 className={`text-2xl font-bold tracking-tight ${dark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                Fully programmable.
              </h2>
              <p className={`mt-2 text-sm ${dark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                Manage all jobs via REST. Use API Keys for CI/CD integrations.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Request */}
              <div className={`rounded-lg border overflow-hidden ${dark ? 'border-zinc-800' : 'border-zinc-200'}`}>
                <div className={`flex items-center justify-between px-4 py-2.5 border-b text-[11px] font-mono ${
                  dark ? 'border-zinc-800 bg-zinc-900 text-zinc-400' : 'border-zinc-200 bg-zinc-50 text-zinc-500'
                }`}>
                  <span>POST /api/v1/jobs</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${dark ? 'bg-emerald-900/40 text-emerald-400' : 'bg-emerald-50 text-emerald-700'}`}>
                    REQUEST
                  </span>
                </div>
                <pre className={`p-4 text-[11px] font-mono leading-relaxed overflow-x-auto ${dark ? 'bg-zinc-950 text-zinc-300' : 'bg-white text-zinc-700'}`}>
                  {CURL_SNIPPET}
                </pre>
              </div>

              {/* Response */}
              <div className={`rounded-lg border overflow-hidden ${dark ? 'border-zinc-800' : 'border-zinc-200'}`}>
                <div className={`flex items-center justify-between px-4 py-2.5 border-b text-[11px] font-mono ${
                  dark ? 'border-zinc-800 bg-zinc-900 text-zinc-400' : 'border-zinc-200 bg-zinc-50 text-zinc-500'
                }`}>
                  <span>201 Created</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${dark ? 'bg-blue-900/40 text-blue-400' : 'bg-blue-50 text-blue-700'}`}>
                    RESPONSE
                  </span>
                </div>
                <pre className={`p-4 text-[11px] font-mono leading-relaxed overflow-x-auto ${dark ? 'bg-zinc-950 text-zinc-300' : 'bg-white text-zinc-700'}`}>
                  {RESPONSE_SNIPPET}
                </pre>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-4">
              <a
                href="/api/docs"
                target="_blank"
                rel="noreferrer"
                className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${dark ? 'text-zinc-400 hover:text-zinc-100' : 'text-zinc-500 hover:text-zinc-900'}`}
              >
                Full API reference <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────────── */}
        <section className={`py-20 px-4 sm:px-6 border-t ${dark ? 'border-zinc-800/60' : 'border-zinc-100'}`}>
          <div className="max-w-2xl mx-auto text-center">
            <h2 className={`text-2xl font-bold tracking-tight mb-4 ${dark ? 'text-zinc-100' : 'text-zinc-900'}`}>
              Start scheduling in minutes.
            </h2>
            <p className={`text-sm mb-8 ${dark ? 'text-zinc-400' : 'text-zinc-500'}`}>
              Free to use. No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
              <Link
                to={isAuthenticated ? '/dashboard' : '/register'}
                className="w-full sm:w-auto flex items-center justify-center gap-2 text-sm font-semibold px-5 py-2.5 rounded transition-colors btn-accent"
              >
                {isAuthenticated ? 'Go to Dashboard' : 'Create account'}
                <ArrowRight className="w-4 h-4" />
              </Link>
              {!isAuthenticated && (
                <Link
                  to="/login"
                  className={`w-full sm:w-auto flex items-center justify-center text-sm font-medium px-5 py-2.5 rounded border transition-colors ${dark ? 'border-zinc-800 text-zinc-400 hover:text-zinc-100' : 'border-zinc-200 text-zinc-600 hover:text-zinc-900'}`}
                >
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* ── Enterprise Contact Modal ────────────────────────────── */}
      {isEnterpriseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className={`w-full max-w-lg rounded-2xl border p-6 sm:p-7 shadow-2xl relative ${
              dark ? 'bg-zinc-900 border-zinc-700 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
            }`}
          >
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

              <div className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                dark ? 'bg-zinc-950/80 border-zinc-800 text-zinc-300' : 'bg-zinc-50 border-zinc-200 text-zinc-700'
              }`}>
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
                <div className={`p-3 rounded-lg border font-mono text-[11px] leading-relaxed select-all ${
                  dark ? 'bg-zinc-950 border-zinc-800 text-zinc-400' : 'bg-zinc-100 border-zinc-200 text-zinc-600'
                }`}>
                  <p><strong>To:</strong> enterprise@samast.pro</p>
                  <p><strong>Subject:</strong> Enterprise Plan Inquiry - Samast Cron</p>
                  <p className="mt-1">Organization, Job Volume, VPC/SLA &amp; Compliance Requirements</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <a
                  href={enterpriseMailto}
                  className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl btn-accent text-center shadow-sm"
                >
                  <Mail className="w-4 h-4" />
                  <span>Open Email Client</span>
                </a>
                <button
                  type="button"
                  onClick={copyEnterpriseTemplate}
                  className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl border transition-colors cursor-pointer ${
                    copiedTemplate
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : dark ? 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'border-zinc-300 bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
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

      {/* ── Footer ────────────────────────────────────────────────── */}
      <Footer dark={dark} />
    </div>
  );
}
