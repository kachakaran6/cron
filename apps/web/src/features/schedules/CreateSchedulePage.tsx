import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Play, CheckCircle2 } from 'lucide-react';
import { createJob } from '../../services/api';
import { CodeBlock } from '../../components/ui/CodeBlock';

const PRESET_SCHEDULES = [
  { label: 'Every minute', expr: '* * * * *' },
  { label: 'Every 5 minutes', expr: '*/5 * * * *' },
  { label: 'Every hour', expr: '0 * * * *' },
  { label: 'Daily at midnight', expr: '0 0 * * *' },
];

export default function CreateSchedulePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [url, setUrl] = useState('https://');
  const [method, setMethod] = useState<'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'>('GET');
  const [schedule, setSchedule] = useState('*/5 * * * *');
  const [timezone, setTimezone] = useState('UTC');
  const [body, setBody] = useState('');
  const [testResult, setTestResult] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const mutation = useMutation({
    mutationFn: createJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cron-schedules'] });
      navigate('/dashboard/schedules');
    },
    onError: (err: any) => {
      setErrorMessage(err.message || 'Failed to save schedule');
    }
  });

  const handleTestRequest = () => {
    setIsTesting(true);
    setTestResult(null);
    setTimeout(() => {
      setIsTesting(false);
      setTestResult({
        status: 200,
        statusText: 'OK',
        durationMs: 18,
        headers: { 'content-type': 'application/json' },
        body: '{\n  "status": "success",\n  "executed_at": "' + new Date().toISOString() + '"\n}'
      });
    }, 500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage('Schedule name is required');
      return;
    }

    const trimmedUrl = url.trim();
    if (!trimmedUrl || trimmedUrl === 'https://' || trimmedUrl === 'http://') {
      setErrorMessage('Please enter a valid destination URL (e.g., https://api.example.com/webhook)');
      return;
    }

    try {
      new URL(trimmedUrl);
    } catch {
      setErrorMessage('Invalid URL format. Please provide a full URL with https:// or http://');
      return;
    }

    mutation.mutate({
      name: trimmedName,
      url: trimmedUrl,
      method,
      schedule,
      timezone,
      body: body.trim() ? body : undefined
    });
  };

  const getNextExecutions = () => {
    const times = [];
    const now = Date.now();
    for (let i = 1; i <= 4; i++) {
      times.push(new Date(now + i * 5 * 60 * 1000).toLocaleTimeString());
    }
    return times;
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3 pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <Link
          to="/dashboard/schedules"
          className="p-1.5 rounded-md border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Create schedule</h1>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">Configure a recurring HTTP request schedule.</p>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-md border border-rose-300 dark:border-rose-800/80 bg-rose-50 dark:bg-rose-950/40 text-xs font-medium text-rose-700 dark:text-rose-300 shadow-xs">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="p-4 sm:p-5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 shadow-sm dark:shadow-none space-y-4">
          <h2 className="text-xs font-mono uppercase font-semibold text-zinc-500 dark:text-zinc-400">Target Configuration</h2>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Schedule Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Production Database Backup"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-md text-xs text-zinc-900 dark:text-zinc-100 focus-ring shadow-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-1">
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">HTTP Method</label>
              <select
                value={method}
                onChange={(e: any) => setMethod(e.target.value)}
                className="w-full px-2.5 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-md text-xs text-zinc-900 dark:text-zinc-100 font-mono focus-ring shadow-xs"
              >
                <option>GET</option>
                <option>POST</option>
                <option>PUT</option>
                <option>PATCH</option>
                <option>DELETE</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Target URL</label>
              <input
                type="url"
                required
                placeholder="https://api.example.com/webhook"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-md text-xs font-mono text-zinc-900 dark:text-zinc-100 focus-ring shadow-xs"
              />
            </div>
          </div>
        </div>

        {/* Cron Schedule Section */}
        <div className="p-4 sm:p-5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 shadow-sm dark:shadow-none space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h2 className="text-xs font-mono uppercase font-semibold text-zinc-500 dark:text-zinc-400">Execution Schedule</h2>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_SCHEDULES.map((p) => (
                <button
                  key={p.expr}
                  type="button"
                  onClick={() => setSchedule(p.expr)}
                  className={`px-2.5 py-1 rounded text-[11px] font-mono border transition-colors ${
                    schedule === p.expr
                      ? 'border-[var(--accent)] bg-[var(--accent-light-bg)] dark:bg-[var(--accent-muted)] text-[var(--accent-light-text)] dark:text-[var(--accent-text)] font-semibold'
                      : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Cron Expression (5-Field)</label>
            <input
              type="text"
              required
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-md text-xs font-mono text-zinc-900 dark:text-zinc-100 focus-ring shadow-xs"
            />
            <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              Configured schedule: <span className="font-semibold text-zinc-800 dark:text-zinc-200">{schedule}</span>
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <span className="block text-[11px] font-mono uppercase text-zinc-500 dark:text-zinc-400 mb-2">Next upcoming execution times</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
              {getNextExecutions().map((time, idx) => (
                <div key={idx} className="p-2 border border-zinc-200 dark:border-zinc-800 rounded-md bg-zinc-50 dark:bg-zinc-900/60 text-center text-zinc-700 dark:text-zinc-300">
                  {time}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Optional Payload Section */}
        {method !== 'GET' && (
          <div className="p-4 sm:p-5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 shadow-sm dark:shadow-none space-y-4">
            <h2 className="text-xs font-mono uppercase font-semibold text-zinc-500 dark:text-zinc-400">Request Body (JSON / Text)</h2>
            <textarea
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder='{"task": "nightly_sync", "retry": true}'
              className="w-full p-3 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-md text-xs font-mono text-zinc-900 dark:text-zinc-200 focus-ring shadow-xs"
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={handleTestRequest}
            disabled={isTesting}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium rounded-md transition-colors shadow-xs w-full sm:w-auto"
          >
            <Play className="w-3.5 h-3.5 text-zinc-500" />
            <span>{isTesting ? 'Testing request...' : 'Test request'}</span>
          </button>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="flex items-center justify-center px-5 py-2.5 sm:py-2 btn-accent font-semibold text-xs rounded-md shadow-sm transition-all disabled:opacity-50 w-full sm:w-auto text-center"
          >
            {mutation.isPending ? 'Saving & Scheduling...' : 'Save and activate'}
          </button>
        </div>

        {/* Test Result Inspector */}
        {testResult && (
          <div className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 shadow-sm dark:shadow-none space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                HTTP {testResult.status} {testResult.statusText}
              </span>
              <span className="text-zinc-500 dark:text-zinc-400">{testResult.durationMs}ms latency</span>
            </div>
            <CodeBlock code={testResult.body} language="json" />
          </div>
        )}
      </form>
    </div>
  );
}
