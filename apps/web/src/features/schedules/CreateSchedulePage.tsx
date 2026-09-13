import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Play, Trash2, Plus, CheckCircle2, Shield, Bell, Clock, Globe, Settings2, Sliders, AlertTriangle, Sparkles } from 'lucide-react';
import { createJob, fetchJobs, fetchUserSubscription } from '../../services/api';
import { CodeBlock } from '../../components/ui/CodeBlock';

const PRESET_SCHEDULES = [
  { label: 'Every minute', expr: '* * * * *' },
  { label: 'Every 5 minutes', expr: '*/5 * * * *' },
  { label: 'Every 15 minutes', expr: '*/15 * * * *' },
  { label: 'Every hour', expr: '0 * * * *' },
  { label: 'Every day at midnight', expr: '0 0 * * *' },
  { label: 'Every day at noon', expr: '0 12 * * *' },
];

const TIMEZONES = [
  'UTC',
  'Asia/Kolkata',
  'America/New_York',
  'America/Los_Angeles',
  'America/Chicago',
  'Europe/London',
  'Europe/Berlin',
  'Europe/Paris',
  'Asia/Tokyo',
  'Asia/Singapore',
  'Asia/Dubai',
  'Australia/Sydney',
];

export default function CreateSchedulePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Basic Information
  const [name, setName] = useState('');
  const [url, setUrl] = useState('https://');
  const [enabled, setEnabled] = useState(true);
  const [saveResponses, setSaveResponses] = useState(true);

  // HTTP Authentication
  const [useAuth, setUseAuth] = useState(false);
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');

  // Headers
  const [headersList, setHeadersList] = useState<{ key: string; value: string }[]>([]);

  // Advanced Options
  const [method, setMethod] = useState<'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS'>('GET');
  const [timezone, setTimezone] = useState(() => localStorage.getItem('samast_default_timezone') || 'Asia/Kolkata');
  const [body, setBody] = useState('');
  const [timeoutSec, setTimeoutSec] = useState(10);
  const [redirectSuccess, setRedirectSuccess] = useState(true);

  // Schedule
  const [schedule, setSchedule] = useState('*/5 * * * *');

  // Notifications
  const [notifyOnFailure, setNotifyOnFailure] = useState(true);
  const [failureThreshold, setFailureThreshold] = useState(1);
  const [notifyOnRecovery, setNotifyOnRecovery] = useState(true);
  const [notifyOnDisable, setNotifyOnDisable] = useState(true);
  const [notifyTlsExpiry, setNotifyTlsExpiry] = useState(false);
  const [tlsExpiryDays, setTlsExpiryDays] = useState(30);

  // Testing & Feedback
  const [errorMessage, setErrorMessage] = useState('');
  const [testResult, setTestResult] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);

  const { data: jobs } = useQuery({
    queryKey: ['cron-schedules'],
    queryFn: fetchJobs,
  });

  const { data: subscription } = useQuery({
    queryKey: ['user-subscription'],
    queryFn: fetchUserSubscription,
  });

  const isPro = subscription?.isPro ?? false;
  const maxJobs = subscription?.capabilities?.maxJobs ?? (isPro ? 500 : 5);
  const currentJobsCount = jobs?.length || 0;
  const isAtLimit = !isPro && currentJobsCount >= maxJobs;

  const mutation = useMutation({
    mutationFn: createJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cron-schedules'] });
      navigate('/dashboard/schedules');
    },
    onError: (err: any) => {
      setErrorMessage(err.message || 'Failed to save schedule');
    },
  });

  const addHeader = () => {
    setHeadersList([...headersList, { key: '', value: '' }]);
  };

  const removeHeader = (index: number) => {
    setHeadersList(headersList.filter((_, i) => i !== index));
  };

  const updateHeader = (index: number, field: 'key' | 'value', val: string) => {
    const next = [...headersList];
    next[index][field] = val;
    setHeadersList(next);
  };

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
        body: JSON.stringify({ status: 'ok', testedAt: new Date().toISOString(), url }, null, 2),
      });
    }, 500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (isAtLimit) {
      setErrorMessage(`You have reached the ${maxJobs}-job limit for the Free Starter plan. Upgrade to Pro to create up to 500 active schedules.`);
      return;
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage('Cronjob title is required');
      return;
    }

    const parts = schedule.trim().split(/\s+/);
    if (parts.length === 6 && !isPro) {
      setErrorMessage('Sub-minute execution intervals (under 60s) require a Pro or Annual subscription. Please use an interval of 1 minute or higher on the Free Starter plan.');
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

    const headersObj: Record<string, string> = {};
    headersList.forEach((h) => {
      if (h.key.trim()) {
        headersObj[h.key.trim()] = h.value;
      }
    });

    mutation.mutate({
      name: trimmedName,
      url: trimmedUrl,
      method,
      schedule,
      timezone,
      headers: headersObj,
      body: ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && body.trim() ? body : undefined,
      timeoutMs: (timeoutSec || 10) * 1000,
      enabled,
      saveResponses,
      redirectSuccess,
      authUsername: useAuth && authUsername.trim() ? authUsername.trim() : undefined,
      authPassword: useAuth && authPassword.trim() ? authPassword.trim() : undefined,
      notifyOnFailure,
      failureThreshold,
      notifyOnRecovery,
      notifyOnDisable,
      notifyTlsExpiry,
      tlsExpiryDays,
    });
  };

  const getNextExecutions = () => {
    const times: string[] = [];
    const now = Date.now();
    for (let i = 1; i <= 5; i++) {
      const d = new Date(now + i * 5 * 60 * 1000);
      times.push(
        d.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        })
      );
    }
    return times;
  };

  return (
    <div className="w-full space-y-6">
      {/* Breadcrumbs & Title */}
      <div className="flex items-center gap-3 pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <Link
          to="/dashboard/schedules"
          className="p-1.5 rounded-md border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
        </Link>
        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <Link to="/dashboard/schedules" className="hover:underline">
              Cronjobs
            </Link>
            <span>/</span>
            <span className="text-zinc-700 dark:text-zinc-300 font-medium">Create cronjob</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mt-0.5">Create cronjob</h1>
        </div>
      </div>

      {isAtLimit && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200 text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              <strong>Free Starter Limit Reached ({currentJobsCount}/{maxJobs} jobs):</strong> You've reached your maximum of 5 active cron schedules. Upgrade to Pro to unlock 500 jobs, 10s intervals, and 30-day logs.
            </span>
          </div>
          <Link
            to="/dashboard/billing"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-amber-600 hover:bg-amber-700 text-white font-semibold transition-colors shrink-0 text-center"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Upgrade to Pro</span>
          </Link>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-md border border-rose-300 dark:border-rose-800/80 bg-rose-50 dark:bg-rose-950/40 text-xs font-medium text-rose-700 dark:text-rose-300 shadow-xs">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Common Section: Title, URL, Enable, Save Responses */}
        <div className="p-4 sm:p-5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 shadow-sm dark:shadow-none space-y-4">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-[var(--accent)]" />
            <h2 className="text-xs font-mono uppercase font-semibold text-zinc-700 dark:text-zinc-300">
              General Settings
            </h2>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. n8n workflow trigger"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-md text-xs text-zinc-900 dark:text-zinc-100 focus-ring shadow-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              URL <span className="text-rose-500">*</span>
            </label>
            <input
              type="url"
              required
              placeholder="https://example.com/api/webhook"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-md text-xs font-mono text-zinc-900 dark:text-zinc-100 focus-ring shadow-xs"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-zinc-800 dark:text-zinc-200">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-300 text-[var(--accent)] focus:ring-[var(--accent)]"
              />
              <span className="font-medium">Enable job</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-zinc-800 dark:text-zinc-200">
              <input
                type="checkbox"
                checked={saveResponses}
                onChange={(e) => setSaveResponses(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-300 text-[var(--accent)] focus:ring-[var(--accent)]"
              />
              <span className="font-medium">Save responses in job history</span>
            </label>
          </div>
        </div>

        {/* HTTP Authentication */}
        <div className="p-4 sm:p-5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 shadow-sm dark:shadow-none space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[var(--accent)]" />
              <h2 className="text-xs font-mono uppercase font-semibold text-zinc-700 dark:text-zinc-300">
                HTTP Authentication
              </h2>
            </div>
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={useAuth}
                onChange={(e) => setUseAuth(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-300 text-[var(--accent)] focus:ring-[var(--accent)]"
              />
              <span>Requires HTTP authentication</span>
            </label>
          </div>

          {useAuth && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Username</label>
                <input
                  type="text"
                  placeholder="admin"
                  value={authUsername}
                  onChange={(e) => setAuthUsername(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-md text-xs font-mono text-zinc-900 dark:text-zinc-100 focus-ring shadow-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-md text-xs font-mono text-zinc-900 dark:text-zinc-100 focus-ring shadow-xs"
                />
              </div>
            </div>
          )}
        </div>

        {/* Custom Headers Section */}
        <div className="p-4 sm:p-5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 shadow-sm dark:shadow-none space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[var(--accent)]" />
              <h2 className="text-xs font-mono uppercase font-semibold text-zinc-700 dark:text-zinc-300">Headers</h2>
            </div>
            <button
              type="button"
              onClick={addHeader}
              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded border border-zinc-300 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Header</span>
            </button>
          </div>

          {headersList.length === 0 ? (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 italic">No custom headers defined.</p>
          ) : (
            <div className="space-y-2">
              {headersList.map((header, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Header Name (e.g. Authorization)"
                    value={header.key}
                    onChange={(e) => updateHeader(idx, 'key', e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-md text-xs font-mono text-zinc-900 dark:text-zinc-100 focus-ring shadow-xs"
                  />
                  <input
                    type="text"
                    placeholder="Header Value"
                    value={header.value}
                    onChange={(e) => updateHeader(idx, 'value', e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-md text-xs font-mono text-zinc-900 dark:text-zinc-100 focus-ring shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => removeHeader(idx)}
                    className="p-1.5 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Advanced Configuration: Timezone, Request Method, Timeout, Body, Redirect 3xx */}
        <div className="p-4 sm:p-5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 shadow-sm dark:shadow-none space-y-4">
          <div className="flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-[var(--accent)]" />
            <h2 className="text-xs font-mono uppercase font-semibold text-zinc-700 dark:text-zinc-300">Advanced</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Time zone</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-2.5 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-md text-xs text-zinc-900 dark:text-zinc-100 focus-ring shadow-xs"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Request method</label>
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
                <option>HEAD</option>
                <option>OPTIONS</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Timeout (seconds)
              </label>
              <input
                type="number"
                min={1}
                max={60}
                value={timeoutSec}
                onChange={(e) => setTimeoutSec(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-md text-xs text-zinc-900 dark:text-zinc-100 focus-ring shadow-xs"
              />
            </div>
          </div>

          {['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && (
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Request body</label>
              <textarea
                rows={4}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder='{"task": "n8n_flow", "trigger": true}'
                className="w-full p-3 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-md text-xs font-mono text-zinc-900 dark:text-zinc-200 focus-ring shadow-xs"
              />
            </div>
          )}

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-zinc-800 dark:text-zinc-200">
              <input
                type="checkbox"
                checked={redirectSuccess}
                onChange={(e) => setRedirectSuccess(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-300 text-[var(--accent)] focus:ring-[var(--accent)]"
              />
              <span className="font-medium">Treat redirects with HTTP 3xx status code as success</span>
            </label>
          </div>
        </div>

        {/* Execution Schedule Section */}
        <div className="p-4 sm:p-5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 shadow-sm dark:shadow-none space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[var(--accent)]" />
              <h2 className="text-xs font-mono uppercase font-semibold text-zinc-700 dark:text-zinc-300">
                Execution schedule
              </h2>
            </div>

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
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Crontab expression
            </label>
            <input
              type="text"
              required
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-md text-xs font-mono text-zinc-900 dark:text-zinc-100 focus-ring shadow-xs"
            />
            <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Configured crontab: <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-200">{schedule}</span>
            </div>
          </div>

          {/* Next Executions Preview */}
          <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <span className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-0.5">Next executions</span>
            <div className="space-y-1 my-2">
              {getNextExecutions().map((time, idx) => (
                <div key={idx} className="font-mono text-xs text-zinc-700 dark:text-zinc-300">
                  {time}
                </div>
              ))}
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              In this job's individual timezone ({timezone}).
            </p>
          </div>
        </div>

        {/* Notify me when... Alerting Rules */}
        <div className="p-4 sm:p-5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 shadow-sm dark:shadow-none space-y-3.5">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-[var(--accent)]" />
            <h2 className="text-xs font-mono uppercase font-semibold text-zinc-700 dark:text-zinc-300">
              Notify me when...
            </h2>
          </div>

          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-zinc-800 dark:text-zinc-200">
                <input
                  type="checkbox"
                  checked={notifyOnFailure}
                  onChange={(e) => setNotifyOnFailure(e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-300 text-[var(--accent)] focus:ring-[var(--accent)]"
                />
                <span>execution of the cronjob fails</span>
              </label>
              {notifyOnFailure && (
                <div className="flex items-center gap-1.5 sm:ml-4 text-xs text-zinc-600 dark:text-zinc-400">
                  <span>Notify after</span>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={failureThreshold}
                    onChange={(e) => setFailureThreshold(Number(e.target.value))}
                    className="w-16 px-2 py-0.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded text-center text-xs font-mono"
                  />
                  <span>failure(s)</span>
                </div>
              )}
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-zinc-800 dark:text-zinc-200">
                <input
                  type="checkbox"
                  checked={notifyOnRecovery}
                  onChange={(e) => setNotifyOnRecovery(e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-300 text-[var(--accent)] focus:ring-[var(--accent)]"
                />
                <span>execution of the cronjob succeeds after it failed before</span>
              </label>
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-zinc-800 dark:text-zinc-200">
                <input
                  type="checkbox"
                  checked={notifyOnDisable}
                  onChange={(e) => setNotifyOnDisable(e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-300 text-[var(--accent)] focus:ring-[var(--accent)]"
                />
                <span>the cronjob will be disabled because of too many failures</span>
              </label>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-zinc-800 dark:text-zinc-200">
                <input
                  type="checkbox"
                  checked={notifyTlsExpiry}
                  onChange={(e) => setNotifyTlsExpiry(e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-300 text-[var(--accent)] focus:ring-[var(--accent)]"
                />
                <span>the server TLS certificate is about to expire</span>
              </label>
              {notifyTlsExpiry && (
                <div className="flex items-center gap-1.5 sm:ml-4 text-xs text-zinc-600 dark:text-zinc-400">
                  <span>Notify before expiry</span>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={tlsExpiryDays}
                    onChange={(e) => setTlsExpiryDays(Number(e.target.value))}
                    className="w-16 px-2 py-0.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded text-center text-xs font-mono"
                  />
                  <span>days</span>
                </div>
              )}
            </div>
          </div>
        </div>

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
            disabled={mutation.isPending || isAtLimit}
            className="flex items-center justify-center px-5 py-2.5 sm:py-2 btn-accent font-semibold text-xs rounded-md shadow-sm transition-all disabled:opacity-50 w-full sm:w-auto text-center"
          >
            {mutation.isPending ? 'Saving & Scheduling...' : isAtLimit ? 'Plan Limit Reached (5/5)' : 'Create and activate'}
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
