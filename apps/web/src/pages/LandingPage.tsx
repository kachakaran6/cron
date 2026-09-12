import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Zap, 
  ShieldCheck, 
  Clock, 
  Cpu, 
  Code2, 
  Terminal, 
  ArrowRight, 
  CheckCircle2, 
  Play, 
  Activity, 
  ExternalLink,
  Lock,
  Layers,
  Server
} from 'lucide-react';

const COMMON_CRON_PRESETS = [
  { label: 'Every Minute', expr: '* * * * *', desc: 'Runs 1,440 times per day' },
  { label: 'Every 5 Minutes', expr: '*/5 * * * *', desc: 'Standard polling schedule' },
  { label: 'Every Hour', expr: '0 * * * *', desc: 'At minute 0 of every hour' },
  { label: 'Daily at Midnight', expr: '0 0 * * *', desc: 'Nightly maintenance batch' },
  { label: 'Weekly on Monday', expr: '0 0 * * 1', desc: 'Weekly analytics rollup' },
];

export default function LandingPage() {
  const [cronInput, setCronInput] = useState('*/5 * * * *');
  const [testPayloadUrl, setTestPayloadUrl] = useState('https://api.github.com/zen');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simResult, setSimResult] = useState<any>(null);
  const [codeTab, setCodeTab] = useState<'curl' | 'node' | 'python'>('curl');

  const handleSimulate = async () => {
    setIsSimulating(true);
    setSimResult(null);

    setTimeout(() => {
      setIsSimulating(false);
      setSimResult({
        status: 200,
        latencyMs: 14,
        timestamp: new Date().toISOString(),
        body: '{"message": "Design with simplicity in mind.", "status": "executed_successfully"}'
      });
    }, 600);
  };

  const getNextRuns = (expr: string) => {
    const now = new Date();
    const runs = [];
    for (let i = 1; i <= 5; i++) {
      const future = new Date(now.getTime() + i * 5 * 60 * 1000);
      runs.push(future.toLocaleTimeString() + ' (' + future.toLocaleDateString() + ')');
    }
    return runs;
  };

  return (
    <div className="min-h-screen bg-[#070709] text-zinc-100 selection:bg-rose-500 selection:text-white">
      {/* Background Glow Overlay */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-rose-500/10 blur-[140px] rounded-full animate-pulse-slow" />
        <div className="absolute top-[800px] right-0 w-[500px] h-[500px] bg-rose-600/5 blur-[120px] rounded-full" />
      </div>

      {/* 1. Header Navigation */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#070709]/80 border-b border-zinc-800/80">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 p-0.5 shadow-lg shadow-rose-500/30 group-hover:shadow-rose-500/50 transition-all">
              <div className="w-full h-full bg-[#070709] rounded-[10px] flex items-center justify-center">
                <Clock className="w-5 h-5 text-rose-500 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div>
              <span className="font-bold text-xl tracking-tight text-white font-sans">CRON<span className="text-rose-500">.</span></span>
              <span className="text-[10px] font-mono tracking-widest text-zinc-400 block -mt-1 uppercase">Enterprise Engine</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#simulator" className="hover:text-white transition-colors">Cron Builder</a>
            <a href="#code" className="hover:text-white transition-colors">API & SDKs</a>
            <a href="/api/docs" target="_blank" rel="noopener noreferrer" className="hover:text-rose-400 transition-colors flex items-center gap-1.5">
              <span>OpenAPI Docs</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </nav>

          <div className="flex items-center gap-4">
            <a
              href="/api/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 transition-all"
            >
              <Code2 className="w-4 h-4 text-rose-400" />
              <span>API Specs</span>
            </a>

            <Link
              to="/dashboard/jobs"
              className="glow-button px-5 py-2.5 rounded-xl font-semibold text-sm text-white flex items-center gap-2 group"
            >
              <span>Console Dashboard</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {/* 2. Hero Section */}
        <section className="pt-20 pb-24 px-6 max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel border-rose-500/30 text-xs font-semibold text-rose-400 mb-8 shadow-inner shadow-rose-500/10">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            <span>Distributed SaaS Engine v1.0 • 99.999% SLA Uptime</span>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white max-w-5xl mx-auto leading-[1.1] mb-8">
            High-Frequency Scheduled Webhooks <br className="hidden sm:inline" />
            <span className="crimson-gradient-text">Engineered for Zero Downtime.</span>
          </h1>

          <p className="text-lg sm:text-xl text-zinc-400 max-w-3xl mx-auto mb-10 leading-relaxed font-normal">
            Schedule, monitor, and execute millisecond-accurate HTTP webhooks and background workers with distributed failover, exponential retries, and real-time execution analytics.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto mb-16">
            <Link
              to="/dashboard/jobs"
              className="w-full sm:w-auto glow-button px-8 py-4 rounded-xl font-bold text-base text-white flex items-center justify-center gap-3 shadow-xl"
            >
              <Zap className="w-5 h-5 fill-current" />
              <span>Get Started Free</span>
            </Link>

            <a
              href="/api/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto glass-panel glass-panel-hover px-8 py-4 rounded-xl font-semibold text-base text-zinc-200 flex items-center justify-center gap-2 border border-zinc-800"
            >
              <Terminal className="w-5 h-5 text-rose-400" />
              <span>Swagger API Docs</span>
            </a>
          </div>

          {/* Metric Stats Banner */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto p-6 rounded-2xl glass-panel border border-zinc-800/80">
            <div className="p-4 border-r border-zinc-800/60 last:border-0">
              <div className="text-3xl font-extrabold text-white font-mono">99.999%</div>
              <div className="text-xs text-zinc-400 mt-1 uppercase font-semibold tracking-wider">Execution SLA</div>
            </div>
            <div className="p-4 border-r border-zinc-800/60 last:border-0">
              <div className="text-3xl font-extrabold text-rose-400 font-mono">&lt; 15ms</div>
              <div className="text-xs text-zinc-400 mt-1 uppercase font-semibold tracking-wider">Avg Dispatch Latency</div>
            </div>
            <div className="p-4 border-r border-zinc-800/60 last:border-0">
              <div className="text-3xl font-extrabold text-white font-mono">50 Worker</div>
              <div className="text-xs text-zinc-400 mt-1 uppercase font-semibold tracking-wider">Parallel Threads</div>
            </div>
            <div className="p-4">
              <div className="text-3xl font-extrabold text-rose-400 font-mono">100%</div>
              <div className="text-xs text-zinc-400 mt-1 uppercase font-semibold tracking-wider">Failover Isolation</div>
            </div>
          </div>
        </section>

        {/* 3. Interactive Cron Expression Simulator */}
        <section id="simulator" className="py-20 px-6 max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Interactive Cron Expression Builder</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">Test standard 5-part cron expressions in real time and simulate automated HTTP webhook execution.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 glass-panel p-8 rounded-3xl border border-zinc-800/80 shadow-2xl">
            {/* Input & Presets */}
            <div className="lg:col-span-7 space-y-6">
              <div>
                <label className="block text-xs font-mono font-semibold uppercase text-zinc-400 mb-2">Cron Expression</label>
                <div className="relative">
                  <input
                    type="text"
                    value={cronInput}
                    onChange={(e) => setCronInput(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 rounded-xl px-4 py-3.5 font-mono text-lg text-rose-400 tracking-wider shadow-inner focus:outline-none"
                    placeholder="* * * * *"
                  />
                  <span className="absolute right-4 top-3.5 text-xs font-mono px-2 py-1 bg-rose-500/10 text-rose-400 rounded border border-rose-500/20">UTC</span>
                </div>
              </div>

              {/* Quick Presets */}
              <div>
                <span className="block text-xs font-semibold text-zinc-400 mb-3 uppercase tracking-wider">Quick Presets</span>
                <div className="flex flex-wrap gap-2">
                  {COMMON_CRON_PRESETS.map((preset) => (
                    <button
                      key={preset.expr}
                      onClick={() => setCronInput(preset.expr)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                        cronInput === preset.expr
                          ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-md shadow-rose-500/10'
                          : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                      }`}
                    >
                      <span className="font-semibold">{preset.label}</span>
                      <span className="ml-1.5 font-mono text-[10px] text-zinc-400">({preset.expr})</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Webhook Endpoint Tester */}
              <div className="pt-4 border-t border-zinc-800/60">
                <label className="block text-xs font-mono font-semibold uppercase text-zinc-400 mb-2">Simulate Destination Webhook URL</label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={testPayloadUrl}
                    onChange={(e) => setTestPayloadUrl(e.target.value)}
                    className="flex-1 bg-zinc-950 border border-zinc-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none"
                  />
                  <button
                    onClick={handleSimulate}
                    disabled={isSimulating}
                    className="glow-button px-5 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSimulating ? (
                      <Activity className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <Play className="w-4 h-4 fill-current" />
                    )}
                    <span>Simulate Dispatch</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Next Scheduled Runs Preview */}
            <div className="lg:col-span-5 bg-zinc-950/80 p-6 rounded-2xl border border-zinc-800/80 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-rose-400" />
                  <span>Calculated Next Execution Windows</span>
                </h3>
                <div className="space-y-2.5">
                  {getNextRuns(cronInput).map((runTime, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/50 text-xs font-mono">
                      <span className="text-zinc-400">Run #{idx + 1}</span>
                      <span className="text-rose-300 font-semibold">{runTime}</span>
                    </div>
                  ))}
                </div>
              </div>

              {simResult && (
                <div className="mt-6 pt-4 border-t border-zinc-800/80 animate-fadeIn">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{simResult.status} OK</span>
                    </span>
                    <span className="text-xs font-mono text-zinc-400">{simResult.latencyMs}ms dispatch</span>
                  </div>
                  <pre className="p-3 bg-zinc-900 rounded-lg text-[11px] font-mono text-zinc-300 overflow-x-auto border border-zinc-800">
                    {simResult.body}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 4. Core Architecture Features */}
        <section id="features" className="py-20 px-6 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Built for High-Scale Production Engineering</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">Decoupled microservices architecture designed to never drop an execution prompt.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-panel glass-panel-hover p-8 rounded-3xl relative overflow-hidden group">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mb-6 text-rose-400 group-hover:scale-110 transition-transform">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">50 Worker Thread Concurrency</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Parallel HTTP worker pools execute background jobs using isolated asynchronous event queues backed by Redis cluster locking.
              </p>
            </div>

            <div className="glass-panel glass-panel-hover p-8 rounded-3xl relative overflow-hidden group">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mb-6 text-rose-400 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Exponential Failover Retries</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Automatic retry loops with customizable backoff intervals and dead-letter queue isolation for non-2xx HTTP responses.
              </p>
            </div>

            <div className="glass-panel glass-panel-hover p-8 rounded-3xl relative overflow-hidden group">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mb-6 text-rose-400 group-hover:scale-110 transition-transform">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">OpenAPI & Swagger Integration</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                First-class REST API with fully interactive Swagger documentation for seamless CI/CD script integration and API key authentication.
              </p>
            </div>
          </div>
        </section>

        {/* 5. Code & API Explorer */}
        <section id="code" className="py-20 px-6 max-w-7xl mx-auto">
          <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-zinc-800/80">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 text-xs font-mono mb-4 border border-rose-500/20">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Developer First API</span>
                </div>
                <h2 className="text-3xl font-bold text-white mb-4">Programmatically Create & Control Jobs in Seconds</h2>
                <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
                  Every feature in our web console is accessible via our REST API. Generate API keys with read/write scopes and trigger jobs programmatically.
                </p>
                <a
                  href="/api/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-rose-400 hover:text-rose-300 font-semibold text-sm transition-colors"
                >
                  <span>Explore Interactive OpenAPI Docs</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              <div className="lg:col-span-7 bg-zinc-950 rounded-2xl border border-zinc-800 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/80 border-b border-zinc-800 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500/60" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/60" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
                    <span className="ml-2 font-mono text-zinc-400">POST /api/v1/jobs</span>
                  </div>

                  <div className="flex gap-1">
                    {(['curl', 'node', 'python'] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setCodeTab(tab)}
                        className={`px-2.5 py-1 rounded font-mono uppercase text-[10px] ${
                          codeTab === tab ? 'bg-rose-500/20 text-rose-300 font-bold' : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                <pre className="p-5 font-mono text-xs text-zinc-300 overflow-x-auto leading-relaxed">
                  {codeTab === 'curl' && `curl -X POST "https://cron.samast.pro/api/v1/jobs" \\
  -H "Authorization: Bearer cron_key_9f82d1..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Sync Customer Billing",
    "cronExpression": "0 0 * * *",
    "targetUrl": "https://api.yourdomain.com/webhooks/sync",
    "method": "POST",
    "headers": { "X-API-Secret": "super_secret" }
  }'`}

                  {codeTab === 'node' && `const response = await fetch('https://cron.samast.pro/api/v1/jobs', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer cron_key_9f82d1...',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Sync Customer Billing',
    cronExpression: '0 0 * * *',
    targetUrl: 'https://api.yourdomain.com/webhooks/sync'
  })
});
const job = await response.json();`}

                  {codeTab === 'python' && `import requests

url = "https://cron.samast.pro/api/v1/jobs"
headers = {
    "Authorization": "Bearer cron_key_9f82d1...",
    "Content-Type": "application/json"
}
payload = {
    "name": "Sync Customer Billing",
    "cronExpression": "0 0 * * *",
    "targetUrl": "https://api.yourdomain.com/webhooks/sync"
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`}
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Pricing Section */}
        <section id="pricing" className="py-20 px-6 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Simple, Transparent Pricing</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">Deploy your cron automation infrastructure effortlessly with predictable scaling.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-panel p-8 rounded-3xl border border-zinc-800 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-white mb-2">Free Developer</h3>
                <div className="text-3xl font-extrabold text-white font-mono mb-4">$0 <span className="text-xs text-zinc-400 font-sans font-normal">/ month</span></div>
                <p className="text-xs text-zinc-400 mb-6">Ideal for side projects and local API testing.</p>
                <ul className="space-y-3 text-xs text-zinc-300 mb-8">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-rose-500" /> Up to 10 Active Jobs</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-rose-500" /> 1-Minute Minimum Interval</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-rose-500" /> 7-Day Execution History</li>
                </ul>
              </div>
              <Link to="/dashboard/jobs" className="w-full text-center px-4 py-2.5 rounded-xl font-semibold text-xs border border-zinc-800 hover:border-zinc-700 text-zinc-200">Start Free</Link>
            </div>

            <div className="glass-panel p-8 rounded-3xl border-2 border-rose-500/80 relative flex flex-col justify-between shadow-2xl shadow-rose-500/10">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-rose-500 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-lg">Most Popular</div>
              <div>
                <h3 className="text-lg font-bold text-white mb-2">Pro SaaS</h3>
                <div className="text-3xl font-extrabold text-white font-mono mb-4">$29 <span className="text-xs text-zinc-400 font-sans font-normal">/ month</span></div>
                <p className="text-xs text-zinc-400 mb-6">For scaling startups and production APIs.</p>
                <ul className="space-y-3 text-xs text-zinc-300 mb-8">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-rose-500" /> Unlimited Active Jobs</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-rose-500" /> Millisecond Precision Scheduling</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-rose-500" /> 90-Day Execution Analytics</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-rose-500" /> Webhook Security Signatures</li>
                </ul>
              </div>
              <Link to="/dashboard/jobs" className="glow-button w-full text-center px-4 py-2.5 rounded-xl font-bold text-xs text-white">Upgrade to Pro</Link>
            </div>

            <div className="glass-panel p-8 rounded-3xl border border-zinc-800 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-white mb-2">Enterprise Dedicated</h3>
                <div className="text-3xl font-extrabold text-white font-mono mb-4">Custom</div>
                <p className="text-xs text-zinc-400 mb-6">Dedicated high-availability worker clusters.</p>
                <ul className="space-y-3 text-xs text-zinc-300 mb-8">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-rose-500" /> Dedicated Worker VM Isolation</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-rose-500" /> 99.999% SLA Uptime Guarantee</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-rose-500" /> Custom Data Retention</li>
                </ul>
              </div>
              <a href="mailto:support@samast.pro" className="w-full text-center px-4 py-2.5 rounded-xl font-semibold text-xs border border-zinc-800 hover:border-zinc-700 text-zinc-200">Contact Enterprise</a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-[#050507] py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-rose-500" />
            <span className="font-bold text-zinc-300">CRON SaaS Engine</span>
            <span>© 2026 Samast Infrastructure. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="/api/docs" target="_blank" rel="noopener noreferrer" className="hover:text-rose-400 transition-colors">OpenAPI Docs</a>
            <Link to="/dashboard/jobs" className="hover:text-rose-400 transition-colors">Console Dashboard</Link>
            <a href="https://github.com/kachakaran6/cron" target="_blank" rel="noopener noreferrer" className="hover:text-rose-400 transition-colors">GitHub Repository</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
