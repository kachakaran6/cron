import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, ExternalLink, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { CodeBlock } from '../components/ui/CodeBlock';

export default function DocsPage() {
  const { theme, toggleTheme } = useTheme();
  const dark = theme === 'dark';

  return (
    <div className={`min-h-screen font-sans transition-colors ${
      dark ? 'bg-zinc-950 text-zinc-100' : 'bg-slate-50 text-zinc-900'
    }`}>
      {/* Header Bar */}
      <header className={`border-b px-4 sm:px-8 py-3.5 sticky top-0 z-40 backdrop-blur ${
        dark ? 'border-zinc-800 bg-zinc-950/95' : 'border-zinc-200 bg-white/95'
      }`}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard/schedules"
              className={`p-1.5 rounded-md border transition-colors ${
                dark ? 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-100' : 'border-zinc-300 bg-white text-zinc-600 hover:text-zinc-900'
              }`}
              title="Return to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[var(--accent)]" />
                <span>Samast Cron Documentation</span>
              </h1>
              <p className={`text-xs ${dark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                Technical reference for cron expressions, REST APIs, and worker security architecture.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Light / Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-md border transition-colors ${
                dark ? 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white' : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100'
              }`}
              title={dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {dark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-700" />}
            </button>

            <a
              href="/api/docs"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-md btn-accent shadow-sm transition-all"
            >
              <span>OpenAPI Specs</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </header>

      {/* Docs Body Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-6">
        {/* Section 1: Cron Syntax */}
        <div className={`p-6 border rounded-lg shadow-sm space-y-4 ${
          dark ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-200 bg-white'
        }`}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-bold tracking-tight flex items-center gap-2">
              <span className="w-6 h-6 rounded flex items-center justify-center font-mono text-xs font-bold btn-accent">1</span>
              <span>Cron Expression Syntax</span>
            </h2>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800 text-zinc-500">
              5-Field UNIX Format
            </span>
          </div>
          <p className={`text-xs leading-relaxed ${dark ? 'text-zinc-300' : 'text-zinc-600'}`}>
            Samast Cron evaluates standard 5-part cron syntax with per-second dispatch precision and strict timezone mapping:
          </p>
          <div className={`p-4 rounded-lg font-mono text-xs overflow-x-auto border leading-relaxed ${
            dark ? 'bg-zinc-950 border-zinc-800 text-zinc-300' : 'bg-zinc-50 border-zinc-200 text-zinc-800'
          }`}>
            * * * * *<br />
            │ │ │ │ │<br />
            │ │ │ │ └─── Day of week (0 - 6) (Sunday to Saturday)<br />
            │ │ │ └────── Month (1 - 12)<br />
            │ │ └───────── Day of month (1 - 31)<br />
            │ └──────────── Hour (0 - 23)<br />
            └────────────── Minute (0 - 59)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 text-xs font-mono">
            <div className={`p-2.5 rounded border ${dark ? 'border-zinc-800 bg-zinc-950/60' : 'border-zinc-200 bg-zinc-50'}`}>
              <div className="font-semibold text-[var(--accent)]">* * * * *</div>
              <div className={`text-[11px] ${dark ? 'text-zinc-400' : 'text-zinc-500'}`}>Every minute</div>
            </div>
            <div className={`p-2.5 rounded border ${dark ? 'border-zinc-800 bg-zinc-950/60' : 'border-zinc-200 bg-zinc-50'}`}>
              <div className="font-semibold text-[var(--accent)]">*/5 * * * *</div>
              <div className={`text-[11px] ${dark ? 'text-zinc-400' : 'text-zinc-500'}`}>Every 5 minutes</div>
            </div>
            <div className={`p-2.5 rounded border ${dark ? 'border-zinc-800 bg-zinc-950/60' : 'border-zinc-200 bg-zinc-50'}`}>
              <div className="font-semibold text-[var(--accent)]">0 0 * * *</div>
              <div className={`text-[11px] ${dark ? 'text-zinc-400' : 'text-zinc-500'}`}>Daily at midnight</div>
            </div>
          </div>
        </div>

        {/* Section 2: Worker Security */}
        <div className={`p-6 border rounded-lg shadow-sm space-y-4 ${
          dark ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-200 bg-white'
        }`}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-bold tracking-tight flex items-center gap-2">
              <span className="w-6 h-6 rounded flex items-center justify-center font-mono text-xs font-bold btn-accent">2</span>
              <span>Worker Security &amp; Anti-SSRF Protection</span>
            </h2>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-800/80 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-semibold">
              Strict Isolation
            </span>
          </div>
          <p className={`text-xs leading-relaxed ${dark ? 'text-zinc-300' : 'text-zinc-600'}`}>
            Worker dispatchers execute requests in isolated network namespaces. The following internal IP ranges and link-local endpoints are strictly blocked to prevent server-side request forgery:
          </p>
          <ul className={`list-disc list-inside font-mono text-xs space-y-1.5 p-3 rounded-lg border ${
            dark ? 'bg-zinc-950 border-zinc-800 text-zinc-400' : 'bg-zinc-50 border-zinc-200 text-zinc-700'
          }`}>
            <li><span className="font-semibold text-rose-600 dark:text-rose-400">127.0.0.0/8</span> — Loopback localhost interfaces</li>
            <li><span className="font-semibold text-rose-600 dark:text-rose-400">10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16</span> — Private IPv4 ranges</li>
            <li><span className="font-semibold text-rose-600 dark:text-rose-400">169.254.169.254</span> — Cloud Instance Metadata Services (AWS/GCP/Azure IMDS)</li>
          </ul>
        </div>

        {/* Section 3: REST API */}
        <div className={`p-6 border rounded-lg shadow-sm space-y-4 ${
          dark ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-200 bg-white'
        }`}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-bold tracking-tight flex items-center gap-2">
              <span className="w-6 h-6 rounded flex items-center justify-center font-mono text-xs font-bold btn-accent">3</span>
              <span>Programmatic REST API &amp; Webhooks</span>
            </h2>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800 text-zinc-500">
              Bearer Token Auth
            </span>
          </div>
          <p className={`text-xs leading-relaxed ${dark ? 'text-zinc-300' : 'text-zinc-600'}`}>
            Generate scoped API keys from the API Keys tab in your dashboard and pass them in the Authorization header:
          </p>
          <CodeBlock
            code={`# Create a new scheduled webhook
curl -X POST "https://cron.samast.pro/api/v1/jobs" \\
  -H "Authorization: Bearer cr_live_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Check Payment Gateway Health",
    "schedule": "*/15 * * * *",
    "url": "https://api.yourdomain.com/health",
    "method": "GET",
    "timezone": "UTC",
    "timeoutMs": 10000
  }'`}
            language="bash"
          />
        </div>
      </main>
    </div>
  );
}
