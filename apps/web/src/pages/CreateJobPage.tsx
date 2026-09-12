import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Send, Sparkles, Terminal, ShieldAlert } from 'lucide-react';
import { createJob } from '../services/api';

const PRESETS = [
  { label: 'Every 1 Min', expr: '* * * * *' },
  { label: 'Every 5 Mins', expr: '*/5 * * * *' },
  { label: 'Hourly', expr: '0 * * * *' },
  { label: 'Daily Midnight', expr: '0 0 * * *' },
];

export default function CreateJobPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [url, setUrl] = useState('https://');
  const [method, setMethod] = useState<'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'>('GET');
  const [schedule, setSchedule] = useState('*/5 * * * *');
  const [timezone, setTimezone] = useState('UTC');
  const [body, setBody] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const mutation = useMutation({
    mutationFn: createJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cron-jobs'] });
      navigate('/dashboard/jobs');
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to create job');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    mutation.mutate({
      name,
      url,
      method,
      schedule,
      timezone,
      body: body || undefined,
    });
  };

  const generatedCurl = `curl -X ${method} "${url}" \\
  -H "Content-Type: application/json" \\
  -H "User-Agent: CronPlatform-Worker/1.0"${body ? ` \\\n  -d '${body.replace(/\n/g, '')}'` : ''}`;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2.5 rounded-xl border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Create Scheduled Cron Job</h1>
          <p className="text-xs text-zinc-400">Configure target webhook URL, cron expression, and request payload.</p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Column */}
        <div className="lg:col-span-2 space-y-5">
          <div className="p-6 rounded-2xl border border-zinc-800/80 bg-zinc-950/60 backdrop-blur-xl space-y-5 shadow-2xl">
            <div>
              <label className="block text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider mb-2">
                Job Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Invalidate CDN Cache & Sync Database"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-rose-500 font-medium"
              />
            </div>

            <div className="grid grid-cols-4 gap-3">
              <div className="col-span-1">
                <label className="block text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  Method
                </label>
                <select
                  value={method}
                  onChange={(e: any) => setMethod(e.target.value)}
                  className="w-full px-3 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-rose-400 focus:outline-none focus:border-rose-500 font-mono font-bold"
                >
                  <option>GET</option>
                  <option>POST</option>
                  <option>PUT</option>
                  <option>PATCH</option>
                  <option>DELETE</option>
                </select>
              </div>

              <div className="col-span-3">
                <label className="block text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  Target Endpoint Webhook URL
                </label>
                <input
                  type="url"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-zinc-100 font-mono focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
                  Cron Expression (UTC)
                </label>
                <div className="flex gap-1">
                  {PRESETS.map((p) => (
                    <button
                      key={p.expr}
                      type="button"
                      onClick={() => setSchedule(p.expr)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-all ${
                        schedule === p.expr
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <input
                type="text"
                required
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-sm font-mono text-rose-400 focus:outline-none focus:border-rose-500 tracking-wider font-bold"
              />
              <div className="mt-2 flex items-center gap-2 text-xs text-rose-300 font-mono bg-rose-500/10 px-3 py-2 rounded-lg border border-rose-500/20">
                <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                <span>Translates to: Runs every 5 minutes (:00, :05, :10, :15...)</span>
              </div>
            </div>

            {method !== 'GET' && (
              <div>
                <label className="block text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  Request Payload (JSON)
                </label>
                <textarea
                  rows={4}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder='{"event": "trigger_batch", "timestamp": "2026-09-12"}'
                  className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-rose-500"
                />
              </div>
            )}
          </div>
        </div>

        {/* Live cURL Preview Column */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-950 space-y-3 shadow-inner">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
              <Terminal className="w-4 h-4 text-rose-400" />
              <span>Live cURL Preview</span>
            </div>
            <pre className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-rose-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
              {generatedCurl}
            </pre>
          </div>

          <div className="p-4 rounded-2xl border border-zinc-800/60 bg-zinc-900/40 text-xs text-zinc-400 space-y-1.5">
            <div className="flex items-center gap-1.5 text-zinc-200 font-bold">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>Worker Isolation</span>
            </div>
            <p className="text-[11px] text-zinc-500">
              Jobs are executed by sandboxed Node.js workers with strict timeout safety and DNS re-resolution checks.
            </p>
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="glow-button w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{mutation.isPending ? 'Deploying...' : 'Deploy & Schedule Job'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
