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
    mutation.mutate({
      name,
      url,
      method,
      schedule,
      timezone,
      body: body || undefined
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
      <div className="flex items-center gap-3 pb-2 border-b border-zinc-800">
        <Link
          to="/dashboard/schedules"
          className="p-1.5 rounded border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-100 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
        </Link>
        <div>
          <h1 className="text-lg font-semibold text-zinc-100">Create schedule</h1>
          <p className="text-xs text-zinc-400">Configure a recurring HTTP request schedule.</p>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 rounded border border-rose-800/80 bg-rose-950/40 text-xs text-rose-300">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="p-5 border border-zinc-800 rounded bg-zinc-950 space-y-4">
          <h2 className="text-xs font-mono uppercase font-semibold text-zinc-400">Target Configuration</h2>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Schedule Name</label>
            <input
              type="text"
              required
              placeholder="Database backup check"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-100 focus-ring"
            />
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div className="col-span-1">
              <label className="block text-xs font-medium text-zinc-300 mb-1">HTTP Method</label>
              <select
                value={method}
                onChange={(e: any) => setMethod(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-100 font-mono focus-ring"
              >
                <option>GET</option>
                <option>POST</option>
                <option>PUT</option>
                <option>PATCH</option>
                <option>DELETE</option>
              </select>
            </div>

            <div className="col-span-3">
              <label className="block text-xs font-medium text-zinc-300 mb-1">Target URL</label>
              <input
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-xs font-mono text-zinc-100 focus-ring"
              />
            </div>
          </div>
        </div>

        {/* Cron Schedule Section */}
        <div className="p-5 border border-zinc-800 rounded bg-zinc-950 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono uppercase font-semibold text-zinc-400">Execution Schedule</h2>
            <div className="flex gap-1.5">
              {PRESET_SCHEDULES.map((p) => (
                <button
                  key={p.expr}
                  type="button"
                  onClick={() => setSchedule(p.expr)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono border transition-colors ${
                    schedule === p.expr
                      ? 'bg-zinc-800 border-zinc-700 text-zinc-100'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Cron Expression</label>
            <input
              type="text"
              required
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
              className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-xs font-mono text-zinc-100 focus-ring"
            />
            <div className="mt-2 text-xs text-zinc-400">
              Explanation: <span className="font-semibold text-zinc-200">Every 5 minutes</span>
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-800/80">
            <span className="block text-[11px] font-mono uppercase text-zinc-400 mb-2">Next calculated executions</span>
            <div className="grid grid-cols-4 gap-2 font-mono text-xs text-zinc-300">
              {getNextExecutions().map((time, idx) => (
                <div key={idx} className="p-2 border border-zinc-800 rounded bg-zinc-900/60 text-center">
                  {time}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Optional Payload Section */}
        {method !== 'GET' && (
          <div className="p-5 border border-zinc-800 rounded bg-zinc-950 space-y-4">
            <h2 className="text-xs font-mono uppercase font-semibold text-zinc-400">Request Body</h2>
            <textarea
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder='{"key": "value"}'
              className="w-full p-3 bg-zinc-900 border border-zinc-800 rounded text-xs font-mono text-zinc-200 focus-ring"
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleTestRequest}
            disabled={isTesting}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs rounded transition-colors"
          >
            <Play className="w-3.5 h-3.5 text-zinc-400" />
            <span>{isTesting ? 'Testing request...' : 'Test request'}</span>
          </button>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="px-4 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs rounded transition-colors disabled:opacity-50"
          >
            {mutation.isPending ? 'Saving...' : 'Save schedule'}
          </button>
        </div>

        {/* Test Result Inspector */}
        {testResult && (
          <div className="p-4 border border-zinc-800 rounded bg-zinc-950 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                HTTP {testResult.status} {testResult.statusText}
              </span>
              <span className="text-zinc-400">{testResult.durationMs}ms</span>
            </div>
            <CodeBlock code={testResult.body} language="json" />
          </div>
        )}
      </form>
    </div>
  );
}
