import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, ExternalLink, Clock, Activity, ShieldCheck,
  Globe, Zap, Lock, Sun, Moon, Terminal, Key, AlertTriangle,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

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

interface StatItemProps { label: string; value: string; }
function StatItem({ label, value }: StatItemProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-2xl font-bold tracking-tight text-zinc-100">{value}</span>
      <span className="text-xs text-zinc-500">{label}</span>
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
            theme === 'dark' ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-800/60' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }`}>
            {badge}
          </span>
        )}
      </div>
      <div>
        <h3 className={`text-sm font-semibold mb-1 ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-900'}`}>{title}</h3>
        <p className="text-xs leading-relaxed text-zinc-500">{desc}</p>
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
      <header className={`h-14 border-b px-6 flex items-center justify-between sticky top-0 z-40 ${
        dark ? 'border-zinc-800 bg-zinc-950/95 backdrop-blur-sm' : 'border-zinc-200 bg-white/95 backdrop-blur-sm'
      }`}>
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2.5">
            <div className={`w-6 h-6 rounded flex items-center justify-center font-mono font-bold text-xs ${dark ? 'bg-zinc-100 text-zinc-950' : 'bg-zinc-900 text-white'}`}>
              SC
            </div>
            <span className="font-semibold text-sm tracking-tight">Samast Cron</span>
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
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded transition-colors ${dark ? 'bg-zinc-100 text-zinc-950 hover:bg-white' : 'bg-zinc-900 text-white hover:bg-zinc-800'}`}
          >
            {isAuthenticated ? 'Open Console' : 'Get Started'}
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <main className="flex-1">
        <section className="px-6 pt-24 pb-20 max-w-5xl mx-auto">
          <div className="flex flex-col items-center text-center">
            {/* Status pill */}
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-mono mb-8 ${
              dark ? 'border-zinc-800 bg-zinc-900 text-zinc-400' : 'border-zinc-200 bg-zinc-50 text-zinc-600'
            }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              All systems operational
            </div>

            <h1 className={`text-[2.75rem] sm:text-6xl font-bold tracking-tight leading-tight max-w-3xl mb-6 ${
              dark ? 'text-zinc-50' : 'text-zinc-900'
            }`}>
              Scheduled HTTP&nbsp;jobs,{' '}
              <span className={dark ? 'text-zinc-400' : 'text-zinc-500'}>done right.</span>
            </h1>

            <p className={`text-sm sm:text-base max-w-2xl leading-relaxed mb-10 ${dark ? 'text-zinc-400' : 'text-zinc-500'}`}>
              Samast Cron is a production-grade cron scheduling platform. Define schedules with cron expressions,
              inspect every execution, configure headers and timeouts, and receive alerts when jobs fail.
            </p>

            <div className="flex items-center gap-3">
              <Link
                to={isAuthenticated ? '/dashboard' : '/register'}
                className={`flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded transition-colors ${dark ? 'bg-zinc-100 text-zinc-950 hover:bg-white' : 'bg-zinc-900 text-white hover:bg-zinc-800'}`}
              >
                {isAuthenticated ? 'Open Dashboard' : 'Create free account'}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="/api/docs"
                target="_blank"
                rel="noreferrer"
                className={`flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded border transition-colors ${
                  dark ? 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white hover:border-zinc-700' : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                View API reference
              </a>
            </div>
          </div>

          {/* Stats Row */}
          <div className={`mt-20 grid grid-cols-2 sm:grid-cols-4 gap-8 pt-10 border-t ${dark ? 'border-zinc-800/60' : 'border-zinc-200'}`}>
            <StatItem value="500" label="Max cron jobs / account" />
            <StatItem value="60s" label="Minimum interval" />
            <StatItem value="30d" label="Execution history" />
            <StatItem value="99.9%" label="Infrastructure uptime" />
          </div>
        </section>

        {/* ── Features Grid ────────────────────────────────────────── */}
        <section id="features" className={`py-16 px-6 border-t ${dark ? 'border-zinc-800/60' : 'border-zinc-100'}`}>
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
        <section id="api" className={`py-16 px-6 border-t ${dark ? 'border-zinc-800/60' : 'border-zinc-100'}`}>
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
        <section className={`py-20 px-6 border-t ${dark ? 'border-zinc-800/60' : 'border-zinc-100'}`}>
          <div className="max-w-2xl mx-auto text-center">
            <h2 className={`text-2xl font-bold tracking-tight mb-4 ${dark ? 'text-zinc-100' : 'text-zinc-900'}`}>
              Start scheduling in minutes.
            </h2>
            <p className={`text-sm mb-8 ${dark ? 'text-zinc-400' : 'text-zinc-500'}`}>
              Free to use. No credit card required.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link
                to={isAuthenticated ? '/dashboard' : '/register'}
                className={`flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded transition-colors ${dark ? 'bg-zinc-100 text-zinc-950 hover:bg-white' : 'bg-zinc-900 text-white hover:bg-zinc-800'}`}
              >
                {isAuthenticated ? 'Go to Dashboard' : 'Create account'}
                <ArrowRight className="w-4 h-4" />
              </Link>
              {!isAuthenticated && (
                <Link
                  to="/login"
                  className={`text-sm font-medium px-5 py-2.5 rounded border transition-colors ${dark ? 'border-zinc-800 text-zinc-400 hover:text-zinc-100' : 'border-zinc-200 text-zinc-600 hover:text-zinc-900'}`}
                >
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer className={`border-t py-8 px-6 text-xs ${dark ? 'border-zinc-800 bg-zinc-950 text-zinc-500' : 'border-zinc-100 bg-zinc-50 text-zinc-400'}`}>
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-5 h-5 rounded flex items-center justify-center font-mono font-bold text-[10px] ${dark ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-200 text-zinc-700'}`}>
              SC
            </div>
            <span>Samast Cron — Scheduled HTTP Infrastructure</span>
          </div>
          <div className="flex items-center gap-5">
            <Link to="/docs" className="hover:text-zinc-300 transition-colors">Documentation</Link>
            <a href="/api/docs" target="_blank" rel="noreferrer" className="hover:text-zinc-300 transition-colors">OpenAPI</a>
            <Link to="/privacy" className="hover:text-zinc-300 transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-zinc-300 transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
