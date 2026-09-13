import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, ExternalLink, Clock, Activity, ShieldCheck,
  Globe, Zap, Lock, Sun, Moon, Terminal, Key, AlertTriangle,
  Play, CheckCircle2, Check
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Footer } from '../components/layout/Footer';

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
  const { isAuthenticated } = useAuth();
  const dark = theme === 'dark';

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
          <nav className="hidden md:flex items-center gap-5 text-xs">
            <a href="#features" className={`transition-colors ${dark ? 'text-zinc-400 hover:text-zinc-100' : 'text-zinc-500 hover:text-zinc-900'}`}>Features</a>
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

      {/* ── Footer ────────────────────────────────────────────────── */}
      <Footer dark={dark} />
    </div>
  );
}
