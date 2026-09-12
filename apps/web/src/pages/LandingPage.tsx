import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Code, ExternalLink, ShieldCheck, Clock, Terminal, Activity } from 'lucide-react';

export default function LandingPage() {
  const [codeTab, setCodeTab] = useState<'curl' | 'node' | 'python'>('curl');

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-zinc-800 selection:text-white flex flex-col">
      {/* Header Bar */}
      <header className="h-14 border-b border-zinc-800 bg-zinc-950 px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded bg-zinc-100 text-zinc-950 flex items-center justify-center font-mono font-bold text-xs">
            SC
          </div>
          <span className="font-semibold text-sm text-zinc-100 tracking-tight">
            Samast Cron
          </span>
        </div>

        <nav className="flex items-center gap-6 text-xs text-zinc-400">
          <a href="#features" className="hover:text-zinc-100 transition-colors">Features</a>
          <a href="#code" className="hover:text-zinc-100 transition-colors">API</a>
          <Link to="/docs" className="hover:text-zinc-100 transition-colors">Documentation</Link>
          <a href="/api/docs" target="_blank" rel="noreferrer" className="hover:text-zinc-100 transition-colors flex items-center gap-1">
            <span>OpenAPI</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </nav>

        <Link
          to="/dashboard/schedules"
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded bg-zinc-100 text-zinc-950 hover:bg-white transition-colors"
        >
          <span>Open Console</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 px-6 max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded border border-zinc-800 bg-zinc-900 text-xs font-mono text-zinc-400 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Infrastructure Status: 100% Operational</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-zinc-100 max-w-3xl mx-auto leading-tight mb-4">
            Reliable scheduled HTTP requests.
          </h1>

          <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto mb-8 leading-relaxed">
            Create cron schedules that call your URLs automatically. Monitor every execution, inspect headers and payloads, and receive alerts when an endpoint fails.
          </p>

          <div className="flex items-center justify-center gap-3">
            <Link
              to="/dashboard/schedules"
              className="px-4 py-2 rounded bg-zinc-100 text-zinc-950 font-semibold text-xs hover:bg-white transition-colors flex items-center gap-1.5"
            >
              <span>Manage Schedules</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <a
              href="/api/docs"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded border border-zinc-800 bg-zinc-900 text-zinc-300 font-semibold text-xs hover:text-zinc-100 hover:bg-zinc-800 transition-colors flex items-center gap-1.5"
            >
              <Terminal className="w-3.5 h-3.5 text-zinc-400" />
              <span>Swagger API Specs</span>
            </a>
          </div>
        </section>

        {/* Product Interface Preview Section */}
        <section className="py-12 px-6 max-w-5xl mx-auto">
          <div className="border border-zinc-800 rounded-lg bg-zinc-950 overflow-hidden shadow-2xl">
            <div className="px-4 py-3 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between text-xs text-zinc-400 font-mono">
              <span>Schedules — Console Overview</span>
              <span className="text-emerald-400">● 2 Active Schedules</span>
            </div>
            
            <div className="p-4 space-y-3 font-sans text-xs">
              <table className="w-full text-left">
                <thead className="text-[11px] font-mono uppercase text-zinc-500 border-b border-zinc-800">
                  <tr>
                    <th className="py-2">Name</th>
                    <th className="py-2">Target</th>
                    <th className="py-2">Schedule</th>
                    <th className="py-2">Last Run</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-mono text-zinc-300">
                  <tr>
                    <td className="py-2.5 font-sans font-medium text-zinc-100">Database Backup Sync</td>
                    <td className="py-2.5 text-zinc-400">api.example.com/backup</td>
                    <td className="py-2.5">0 2 * * *</td>
                    <td className="py-2.5 text-zinc-400">2 min ago</td>
                    <td className="py-2.5 text-emerald-400 font-sans text-xs">✓ Active</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-sans font-medium text-zinc-100">System Health Monitor</td>
                    <td className="py-2.5 text-zinc-400">example.com/health</td>
                    <td className="py-2.5">*/5 * * * *</td>
                    <td className="py-2.5 text-zinc-400">1 min ago</td>
                    <td className="py-2.5 text-emerald-400 font-sans text-xs">✓ Active</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section id="features" className="py-16 px-6 max-w-5xl mx-auto border-t border-zinc-900">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 border border-zinc-800 rounded bg-zinc-950 space-y-2">
              <Clock className="w-5 h-5 text-zinc-400" />
              <h3 className="text-sm font-semibold text-zinc-100">Cron Expressions</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Supports standard 5-part cron syntax with real-time schedule translation and execution window previews.
              </p>
            </div>

            <div className="p-5 border border-zinc-800 rounded bg-zinc-950 space-y-2">
              <Activity className="w-5 h-5 text-zinc-400" />
              <h3 className="text-sm font-semibold text-zinc-100">Execution History</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Inspect every HTTP request status code, response time, request body, headers, and failure traces.
              </p>
            </div>

            <div className="p-5 border border-zinc-800 rounded bg-zinc-950 space-y-2">
              <ShieldCheck className="w-5 h-5 text-zinc-400" />
              <h3 className="text-sm font-semibold text-zinc-100">Worker Sandboxing</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                SSRF protected worker pools enforce metadata blocking and strict timeouts on all HTTP calls.
              </p>
            </div>
          </div>
        </section>

        {/* Code & API Section */}
        <section id="code" className="py-16 px-6 max-w-5xl mx-auto border-t border-zinc-900">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-zinc-100">REST API Integration</h2>
                <p className="text-xs text-zinc-400">Programmatically create and query schedules via Bearer API keys.</p>
              </div>

              <div className="flex gap-1 font-mono text-xs">
                {(['curl', 'node', 'python'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setCodeTab(tab)}
                    className={`px-2.5 py-1 rounded ${
                      codeTab === tab ? 'bg-zinc-800 text-zinc-100 font-semibold' : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="border border-zinc-800 rounded bg-zinc-950 overflow-hidden font-mono text-xs p-4 text-zinc-300">
              <pre className="overflow-x-auto leading-relaxed">
                {codeTab === 'curl' && `curl -X POST "https://cron.samast.pro/api/v1/jobs" \\
  -H "Authorization: Bearer cron_key_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Database Backup",
    "schedule": "0 2 * * *",
    "url": "https://api.example.com/backup",
    "method": "POST"
  }'`}

                {codeTab === 'node' && `const res = await fetch('https://cron.samast.pro/api/v1/jobs', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer cron_key_...',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Database Backup',
    schedule: '0 2 * * *',
    url: 'https://api.example.com/backup'
  })
});
const data = await res.json();`}

                {codeTab === 'python' && `import requests

res = requests.post(
    "https://cron.samast.pro/api/v1/jobs",
    headers={"Authorization": "Bearer cron_key_..."},
    json={
        "name": "Database Backup",
        "schedule": "0 2 * * *",
        "url": "https://api.example.com/backup"
    }
)
print(res.json())`}
              </pre>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 bg-zinc-950 py-8 px-6 text-xs text-zinc-500">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="font-semibold text-zinc-300">Samast Cron</span> — Scheduled HTTP Infrastructure.
          </div>

          <div className="flex items-center gap-6">
            <Link to="/docs" className="hover:text-zinc-300 transition-colors">Documentation</Link>
            <a href="/api/docs" target="_blank" rel="noreferrer" className="hover:text-zinc-300 transition-colors">OpenAPI Docs</a>
            <Link to="/privacy" className="hover:text-zinc-300 transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-zinc-300 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
