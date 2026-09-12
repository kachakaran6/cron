import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Send, Sparkles, Terminal, ShieldAlert } from 'lucide-react';
import { createJob } from '../services/api';

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
          className="p-2 rounded-lg border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Create Scheduled Cron Job</h1>
          <p className="text-sm text-slate-400">Configure your target endpoint, frequency, and request payload.</p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Column */}
        <div className="lg:col-span-2 space-y-5">
          <div className="p-6 rounded-xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-md space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Job Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Invalidate CDN Cache"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-4 gap-3">
              <div className="col-span-1">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Method
                </label>
                <select
                  value={method}
                  onChange={(e: any) => setMethod(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                >
                  <option>GET</option>
                  <option>POST</option>
                  <option>PUT</option>
                  <option>PATCH</option>
                  <option>DELETE</option>
                </select>
              </div>

              <div className="col-span-3">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Target Endpoint URL
                </label>
                <input
                  type="url"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Cron Schedule Expression
              </label>
              <input
                type="text"
                required
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm font-mono text-indigo-400 focus:outline-none focus:border-indigo-500"
              />
              <div className="mt-2 flex items-center gap-2 text-xs text-emerald-400 font-mono bg-emerald-500/10 px-3 py-1.5 rounded-md border border-emerald-500/20">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Translates to: Runs every 5 minutes (:00, :05, :10, :15...)</span>
              </div>
            </div>

            {method !== 'GET' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Request Body (JSON)
                </label>
                <textarea
                  rows={4}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder='{"action": "sync"}'
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}
          </div>
        </div>

        {/* Live cURL Preview Column */}
        <div className="space-y-4">
          <div className="p-5 rounded-xl border border-slate-800/80 bg-slate-950 space-y-3 shadow-inner">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <Terminal className="w-4 h-4 text-indigo-400" />
              <span>Live cURL Preview</span>
            </div>
            <pre className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
              {generatedCurl}
            </pre>
          </div>

          <div className="p-4 rounded-xl border border-slate-800/60 bg-indigo-950/20 text-xs text-slate-400 space-y-1.5">
            <div className="flex items-center gap-1.5 text-indigo-300 font-semibold">
              <ShieldAlert className="w-4 h-4" />
              <span>Execution Guarantee</span>
            </div>
            <p>Executed by isolated Node.js workers with strict timeout limits and DNS re-resolution checks.</p>
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{mutation.isPending ? 'Deploying...' : 'Deploy & Schedule Job'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
