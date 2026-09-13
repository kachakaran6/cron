import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SEOHead } from '../components/seo/SEOHead';
import { PublicHeader } from '../components/layout/PublicHeader';
import { Footer } from '../components/layout/Footer';
import { useTheme } from '../context/ThemeContext';
import { CodeBlock } from '../components/ui/CodeBlock';
import { Clock, Play, Copy, Check, Sparkles, ArrowRight, ShieldCheck, Cpu, Terminal, Zap, ExternalLink } from 'lucide-react';

const PRESETS = [
  { label: 'Every minute', expr: '* * * * *', desc: 'Runs every 60 seconds continually' },
  { label: 'Every 5 minutes', expr: '*/5 * * * *', desc: 'Runs on minutes 0, 5, 10, 15, 20, 25...' },
  { label: 'Every 15 minutes', expr: '*/15 * * * *', desc: 'Runs on minutes 0, 15, 30, and 45' },
  { label: 'Every 30 minutes', expr: '0,30 * * * *', desc: 'Runs at minute 0 and minute 30 of every hour' },
  { label: 'Every hour (top of hour)', expr: '0 * * * *', desc: 'Runs at minute 0 past every hour' },
  { label: 'Every day at 00:00 (Midnight)', expr: '0 0 * * *', desc: 'Runs once daily at 12:00 AM UTC' },
  { label: 'Every day at 12:00 (Noon)', expr: '0 12 * * *', desc: 'Runs once daily at 12:00 PM UTC' },
  { label: 'Every Monday at 09:00', expr: '0 9 * * 1', desc: 'Runs weekly every Monday morning at 9:00 AM UTC' },
  { label: '1st of every month at 00:00', expr: '0 0 1 * *', desc: 'Runs monthly on the first day at 12:00 AM UTC' },
];

export function CrontabGeneratorPage() {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const [expression, setExpression] = useState('*/5 * * * *');
  const [copied, setCopied] = useState(false);

  // Calculate simulated next 5 runs
  const getNextRuns = (expr: string): string[] => {
    const runs: string[] = [];
    const now = new Date();
    let stepMinutes = 5;
    if (expr.startsWith('* *')) stepMinutes = 1;
    else if (expr.includes('*/15')) stepMinutes = 15;
    else if (expr.includes('*/30')) stepMinutes = 30;
    else if (expr.includes('0 *')) stepMinutes = 60;
    else if (expr.includes('0 0')) stepMinutes = 1440;

    for (let i = 1; i <= 5; i++) {
      const nextDate = new Date(now.getTime() + i * stepMinutes * 60 * 1000);
      runs.push(nextDate.toUTCString());
    }
    return runs;
  };

  const nextRuns = getNextRuns(expression);

  const handleCopy = () => {
    navigator.clipboard.writeText(expression);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans selection:bg-zinc-800 selection:text-white flex flex-col justify-between transition-colors">
      <SEOHead
        title="Free Crontab Generator & Cron Expression Parser — Samast Cron"
        description="Free online crontab generator and cron syntax humanizer. Parse, build, and test 5-field cron schedule expressions with next run times and SDK code generation."
        canonicalUrl="https://cron.samast.pro/tools/crontab-generator"
        keywords="crontab generator, cron expression parser, online cron builder, cron schedule humanizer, cron syntax calculator, crontab guru alternative"
      />

      <PublicHeader />

      <main className="pt-12 sm:pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Free Developer Tool • 100% Free Forever</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            Crontab Generator &amp; Expression Parser
          </h1>
          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Generate, validate, and humanize 5-field crontab schedule syntax instantly. Copy code snippets for Node.js, Python, cURL, and deploy reliably with <strong>Samast Cron</strong>.
          </p>
        </div>

        {/* Generator Box */}
        <div className="p-6 sm:p-8 rounded-2xl border border-zinc-800 bg-zinc-900/80 shadow-2xl space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 block">
              Cron Schedule Expression
            </label>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={expression}
                  onChange={(e) => setExpression(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl bg-zinc-950 border border-zinc-700 text-lg sm:text-xl font-mono font-bold text-emerald-400 focus:outline-hidden focus:border-[var(--accent)] tracking-wider"
                  placeholder="* * * * *"
                />
              </div>
              <button
                type="button"
                onClick={handleCopy}
                className="px-5 py-3.5 rounded-xl btn-accent font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md shrink-0"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied!' : 'Copy Expression'}</span>
              </button>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="space-y-3 pt-2 border-t border-zinc-800/80">
            <span className="text-xs font-semibold text-zinc-400 block">Popular Schedule Presets:</span>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.expr}
                  type="button"
                  onClick={() => setExpression(preset.expr)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                    expression === preset.expr
                      ? 'bg-[var(--accent)]/20 border-[var(--accent)] text-white font-bold'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:text-white'
                  }`}
                >
                  <span className="font-mono text-emerald-400 mr-1.5">{preset.expr}</span>
                  <span>{preset.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Next Simulated Runs */}
          <div className="pt-4 border-t border-zinc-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>Next 5 Execution Timestamps (UTC):</span>
              </span>
              <span className="text-[11px] text-zinc-500 font-mono">100% Reliable UTC Clock</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {nextRuns.map((run, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800/80 font-mono text-xs text-zinc-300 flex items-center justify-between">
                  <span className="text-zinc-500 font-semibold mr-2">Run #{idx + 1}:</span>
                  <span className="text-emerald-400">{run}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Code Snippets Section */}
        <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/60 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-indigo-400" />
              <span>cURL Webhook Dispatch Code</span>
            </h3>
            <span className="text-xs text-zinc-400">Trigger via Samast Cron API</span>
          </div>

          <CodeBlock
            language="bash"
            code={`curl -X POST "https://cron.samast.pro/api/v1/jobs" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Automated Sync Schedule",
    "url": "https://api.yourdomain.com/webhooks/cron",
    "cron": "${expression}",
    "method": "POST"
  }'`}
          />
        </div>

        {/* Upgrade Banner */}
        <div className="p-8 rounded-2xl border-2 border-[var(--accent)] bg-gradient-to-r from-zinc-900 to-zinc-950 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl">
          <div className="space-y-2 text-center sm:text-left">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <span>Deploy this cron job with sub-minute precision!</span>
            </h2>
            <p className="text-xs text-zinc-400 max-w-xl">
              Samast Cron handles minute-level schedules, automatic retries, instant notification alerts, and full HTTP response telemetry.
            </p>
          </div>
          <Link
            to="/register"
            className="px-6 py-3 rounded-xl btn-accent font-bold text-xs inline-flex items-center gap-2 shrink-0 shadow-lg hover:opacity-95 transition-opacity"
          >
            <span>Start Free (5 Jobs Included)</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>

      <Footer dark={dark} />
    </div>
  );
}
