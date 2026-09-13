import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  Plus,
  Trash2,
  Mail,
  Webhook,
  MessageSquare,
  Smartphone,
  Check,
  X,
  Send,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  MessageCircle,
  Globe,
} from 'lucide-react';
import { CustomSelect, SelectOption } from '../../components/ui/CustomSelect';
import {
  fetchNotificationChannels,
  createNotificationChannel,
  toggleNotificationChannel,
  deleteNotificationChannel,
  testNotificationChannel,
  NotificationChannelDTO,
} from '../../services/api';
import { EmptyState } from '../../components/ui/EmptyState';
import { TableSkeleton } from '../../components/ui/Skeleton';

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<'email' | 'webhook' | 'slack' | 'discord' | 'pushover'>('email');
  const [target, setTarget] = useState('');
  const [pushoverAppToken, setPushoverAppToken] = useState('');

  const [testingId, setTestingId] = useState<string | null>(null);
  const [testFeedback, setTestFeedback] = useState<{
    channelName: string;
    type: string;
    destination: string;
    success: boolean;
    message: string;
    detail?: string;
  } | null>(null);

  const { data: channels, isLoading } = useQuery({
    queryKey: ['notification-channels'],
    queryFn: fetchNotificationChannels,
  });

  const createMutation = useMutation({
    mutationFn: createNotificationChannel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-channels'] });
      setShowAddModal(false);
      setName('');
      setTarget('');
      setPushoverAppToken('');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => toggleNotificationChannel(id, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-channels'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNotificationChannel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-channels'] });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !target.trim()) return;

    const config: Record<string, any> = { target: target.trim() };
    if (type === 'pushover') {
      config.userKey = target.trim();
      if (pushoverAppToken.trim()) {
        config.apiToken = pushoverAppToken.trim();
      }
    }

    createMutation.mutate({
      name: name.trim(),
      type,
      config,
      enabled: true,
    });
  };

  const handleTest = async (id: string, ch: NotificationChannelDTO) => {
    setTestingId(id);
    setTestFeedback(null);
    try {
      const res = await testNotificationChannel(id);
      setTestFeedback({
        channelName: ch.name,
        type: ch.type,
        destination: ch.config?.target || '',
        success: res.success,
        message: res.message,
        detail: res.detail,
      });
    } catch (err: any) {
      setTestFeedback({
        channelName: ch.name,
        type: ch.type,
        destination: ch.config?.target || '',
        success: false,
        message: err?.message || 'Failed to send test notification',
      });
    } finally {
      setTestingId(null);
    }
  };

  const getChannelIcon = (t: string) => {
    switch (t?.toLowerCase()) {
      case 'email':
        return <Mail className="w-4 h-4 text-sky-500" />;
      case 'pushover':
        return <Smartphone className="w-4 h-4 text-amber-500" />;
      case 'slack':
      case 'discord':
        return <MessageSquare className="w-4 h-4 text-emerald-500" />;
      default:
        return <Webhook className="w-4 h-4 text-purple-500" />;
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Failure &amp; Recovery Notifications
          </h1>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
            Configure alert channels to receive instant notifications when scheduled HTTP calls fail or recover.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-md btn-accent shadow-sm transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Channel</span>
        </button>
      </div>

      {/* Test Alert Feedback Banner */}
      {testFeedback && (
        <div
          className={`p-4 rounded-xl border flex items-start justify-between gap-3 text-xs transition-all shadow-sm ${
            testFeedback.success
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-200'
          }`}
        >
          <div className="flex items-start gap-2.5">
            {testFeedback.success ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
            )}
            <div className="space-y-1">
              <div className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <span>{testFeedback.success ? 'Test Notification Dispatched' : 'Notification Failed'}</span>
                <span className="font-mono text-[10px] uppercase px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                  {testFeedback.type}
                </span>
                <span className="font-mono text-[11px] text-zinc-500">({testFeedback.destination})</span>
              </div>
              <p className="text-zinc-700 dark:text-zinc-300 font-sans leading-relaxed">
                {testFeedback.message}
              </p>
              {testFeedback.detail && (
                <p className="font-mono text-[11px] opacity-80 pt-1 text-zinc-500 dark:text-zinc-400">
                  {testFeedback.detail}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => setTestFeedback(null)}
            className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 shrink-0"
            title="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 shadow-sm dark:shadow-none overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[620px] w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-900/80 text-[11px] font-mono uppercase tracking-wider text-zinc-600 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="px-4 py-3">Channel Name</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Destination</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60 text-zinc-700 dark:text-zinc-300">
              {isLoading && <TableSkeleton rows={2} cols={5} />}

              {!isLoading && (!channels || channels.length === 0) && (
                <tr>
                  <td colSpan={5} className="p-4">
                    <EmptyState
                      icon={Bell}
                      title="No alert channels configured"
                      description="Add email addresses, Slack webhooks, or Discord channels to receive alerts when jobs fail or TLS certificates expire."
                      action={{
                        label: 'Add Channel',
                        onClick: () => setShowAddModal(true),
                      }}
                    />
                  </td>
                </tr>
              )}

              {!isLoading &&
                channels?.map((ch) => (
                  <tr key={ch.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      {getChannelIcon(ch.type)}
                      <span>{ch.name}</span>
                    </td>
                    <td className="px-4 py-3 font-mono uppercase text-[11px] text-zinc-500">{ch.type}</td>
                    <td className="px-4 py-3 font-mono text-zinc-600 dark:text-zinc-400 truncate max-w-xs">
                      {ch.config?.target || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleMutation.mutate({ id: ch.id, enabled: !ch.enabled })}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          ch.enabled
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                        }`}
                      >
                        {ch.enabled ? 'Enabled' : 'Disabled'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleTest(ch.id, ch)}
                          disabled={testingId === ch.id}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-all shadow-xs disabled:opacity-50"
                          title="Send a test notification alert to this destination"
                        >
                          {testingId === ch.id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-[var(--accent)]" />
                          ) : (
                            <Send className="w-3.5 h-3.5 text-[var(--accent)]" />
                          )}
                          <span>{testingId === ch.id ? 'Sending...' : 'Test Notification'}</span>
                        </button>

                        <button
                          onClick={() => {
                            if (confirm(`Delete channel "${ch.name}"?`)) {
                              deleteMutation.mutate(ch.id);
                            }
                          }}
                          className="p-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 transition-colors"
                          title="Delete channel"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Channel Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 sm:p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Add Notification Channel</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Channel Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SRE Alerts Slack"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-md text-xs text-zinc-900 dark:text-zinc-100 focus-ring shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Channel Type
                </label>
                <CustomSelect
                  value={type}
                  onChange={(val) => {
                    setType(val as any);
                    setTarget('');
                    setPushoverAppToken('');
                  }}
                  options={[
                    { value: 'email', label: 'Email Address', icon: <Mail className="w-4 h-4 text-emerald-500" />, description: 'Direct email inbox notifications' },
                    { value: 'pushover', label: 'Pushover (Mobile / Desktop Push)', icon: <Smartphone className="w-4 h-4 text-indigo-500" />, description: 'Real-time mobile & desktop push alerts' },
                    { value: 'slack', label: 'Slack Webhook', icon: <MessageSquare className="w-4 h-4 text-emerald-500" />, description: 'Slack channel webhooks' },
                    { value: 'discord', label: 'Discord Webhook', icon: <MessageCircle className="w-4 h-4 text-indigo-500" />, description: 'Discord server webhooks' },
                    { value: 'webhook', label: 'Custom HTTP Webhook', icon: <Globe className="w-4 h-4 text-sky-500" />, description: 'HTTP POST JSON webhooks to your server' },
                  ]}
                />
              </div>

              {type === 'pushover' ? (
                <>
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      Pushover User Key <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. uQiRzpo4DXghDmr9QzzfQu27cmVRsG"
                      value={target}
                      onChange={(e) => setTarget(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-md text-xs font-mono text-zinc-900 dark:text-zinc-100 focus-ring shadow-xs"
                    />
                    <p className="text-[11px] text-zinc-500 mt-1">
                      Your 30-character User Key from your{' '}
                      <a
                        href="https://pushover.net"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[var(--accent)] underline hover:opacity-80"
                      >
                        Pushover Dashboard
                      </a>.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      Pushover Application API Token{' '}
                      <span className="text-zinc-400 font-normal">(Optional if set in server env)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. azGDORePK8gMaC0QOYAMyEEuzJnyUi"
                      value={pushoverAppToken}
                      onChange={(e) => setPushoverAppToken(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-md text-xs font-mono text-zinc-900 dark:text-zinc-100 focus-ring shadow-xs"
                    />
                    <p className="text-[11px] text-zinc-500 mt-1">
                      Create an API token at{' '}
                      <a
                        href="https://pushover.net/apps/build"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[var(--accent)] underline hover:opacity-80"
                      >
                        pushover.net/apps/build
                      </a>{' '}
                      or configure <code>PUSHOVER_API_TOKEN</code> on server.
                    </p>
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    {type === 'email' ? 'Recipient Email' : 'Webhook URL'}
                  </label>
                  <input
                    type={type === 'email' ? 'email' : 'url'}
                    required
                    placeholder={
                      type === 'email'
                        ? 'alerts@yourcompany.com'
                        : 'https://hooks.slack.com/services/...'
                    }
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-md text-xs font-mono text-zinc-900 dark:text-zinc-100 focus-ring shadow-xs"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2 btn-accent font-semibold text-xs rounded-md shadow-sm transition-all disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Saving...' : 'Add Channel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
