import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Plus, Trash2, Mail, Webhook, MessageSquare, Check, X } from 'lucide-react';
import {
  fetchNotificationChannels,
  createNotificationChannel,
  toggleNotificationChannel,
  deleteNotificationChannel,
  NotificationChannelDTO,
} from '../../services/api';
import { EmptyState } from '../../components/ui/EmptyState';
import { TableSkeleton } from '../../components/ui/Skeleton';

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<'email' | 'webhook' | 'slack' | 'discord'>('email');
  const [target, setTarget] = useState('');

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

    createMutation.mutate({
      name: name.trim(),
      type,
      config: { target: target.trim() },
      enabled: true,
    });
  };

  const getChannelIcon = (t: string) => {
    switch (t) {
      case 'email':
        return <Mail className="w-4 h-4 text-sky-500" />;
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

      <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 shadow-sm dark:shadow-none overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[550px] w-full text-left text-xs">
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
                <select
                  value={type}
                  onChange={(e: any) => setType(e.target.value)}
                  className="w-full px-2.5 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-md text-xs text-zinc-900 dark:text-zinc-100 focus-ring shadow-xs"
                >
                  <option value="email">Email Address</option>
                  <option value="slack">Slack Webhook</option>
                  <option value="discord">Discord Webhook</option>
                  <option value="webhook">Custom HTTP Webhook</option>
                </select>
              </div>

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
