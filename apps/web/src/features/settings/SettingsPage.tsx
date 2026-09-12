import React from 'react';
import { Settings, ShieldCheck, Globe } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div className="pb-2 border-b border-zinc-800">
        <h1 className="text-lg font-semibold text-zinc-100">Settings &amp; Preferences</h1>
        <p className="text-xs text-zinc-400">Configure workspace timezones and default HTTP worker parameters.</p>
      </div>

      <div className="p-5 border border-zinc-800 rounded bg-zinc-950 space-y-4">
        <h2 className="text-xs font-mono uppercase font-semibold text-zinc-400 flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5" />
          <span>Default Schedule Timezone</span>
        </h2>
        <div>
          <select
            defaultValue="UTC"
            className="w-full sm:w-64 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-100 font-mono focus-ring"
          >
            <option value="UTC">Coordinated Universal Time (UTC)</option>
            <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
            <option value="America/New_York">America/New_York (EST -5:00)</option>
            <option value="Europe/London">Europe/London (GMT +0:00)</option>
          </select>
        </div>
      </div>

      <div className="p-5 border border-zinc-800 rounded bg-zinc-950 space-y-4">
        <h2 className="text-xs font-mono uppercase font-semibold text-zinc-400 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Infrastructure Worker Security</span>
        </h2>
        <div className="text-xs text-zinc-300 space-y-2">
          <div className="flex items-center justify-between p-2.5 border border-zinc-800 rounded bg-zinc-900/60 font-mono">
            <span>SSRF Protection Mode</span>
            <span className="text-emerald-400 font-semibold">Strict (Private CIDR Blocked)</span>
          </div>
          <div className="flex items-center justify-between p-2.5 border border-zinc-800 rounded bg-zinc-900/60 font-mono">
            <span>Max Request Timeout</span>
            <span className="text-zinc-300 font-semibold">30 seconds</span>
          </div>
          <div className="flex items-center justify-between p-2.5 border border-zinc-800 rounded bg-zinc-900/60 font-mono">
            <span>Worker Concurrency Limit</span>
            <span className="text-zinc-300 font-semibold">50 threads</span>
          </div>
        </div>
      </div>
    </div>
  );
}
