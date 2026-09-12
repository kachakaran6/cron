import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Key, Plus, Trash2, ShieldCheck, Copy, Check } from 'lucide-react';
import { fetchApiKeys, createApiKey, revokeApiKey } from '../../services/api';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';

export default function ApiKeysPage() {
  const queryClient = useQueryClient();
  const [keyName, setKeyName] = useState('');
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: apiKeysList, isLoading } = useQuery({
    queryKey: ['api-keys'],
    queryFn: fetchApiKeys,
  });

  const createMutation = useMutation({
    mutationFn: createApiKey,
    onSuccess: (data) => {
      setNewKey(data.apiKey);
      setKeyName('');
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: revokeApiKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) return;
    createMutation.mutate(keyName.trim());
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full space-y-6">
      <div className="pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">API Keys</h1>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
          Manage Bearer tokens for programmatically creating and triggering cron schedules via the REST API.
        </p>
      </div>

      {newKey && (
        <div className="p-4 rounded-lg border border-emerald-300 dark:border-emerald-800/80 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 space-y-2 shadow-sm">
          <div className="flex items-center gap-2 font-semibold text-xs text-emerald-700 dark:text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span>API Key Generated</span>
          </div>
          <p className="text-xs text-emerald-700 dark:text-zinc-300">
            Copy this key now. For security reasons, it will not be displayed again.
          </p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
            <code className="px-3 py-2 rounded bg-white dark:bg-zinc-950 font-mono text-xs text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-zinc-800 flex-1 break-all">
              {newKey}
            </code>
            <button
              onClick={() => copyToClipboard(newKey)}
              className="px-3.5 py-2 rounded-md btn-accent text-xs font-semibold flex items-center justify-center gap-1 shadow-sm"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Key'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Create Key Form */}
      <form onSubmit={handleCreate} className="p-4 sm:p-5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 flex flex-col sm:flex-row items-stretch sm:items-end gap-3 shadow-sm dark:shadow-none">
        <div className="flex-1">
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Key Description / Service Label</label>
          <input
            type="text"
            required
            placeholder="e.g. GitHub Actions CI/CD Pipeline"
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-md text-xs text-zinc-900 dark:text-zinc-100 focus-ring placeholder-zinc-400 dark:placeholder-zinc-500 shadow-xs"
          />
        </div>
        <button
          type="submit"
          disabled={createMutation.isPending}
          className="px-4 py-2.5 sm:py-2 btn-accent font-semibold text-xs rounded-md shadow-sm transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{createMutation.isPending ? 'Generating...' : 'Create key'}</span>
        </button>
      </form>

      {/* Keys Data Table */}
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 shadow-sm dark:shadow-none overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[480px] w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-900/80 text-[11px] font-mono uppercase tracking-wider text-zinc-600 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="px-4 py-3">Key Name</th>
                <th className="px-4 py-3">Prefix</th>
                <th className="px-4 py-3">Created Date</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60 font-sans text-zinc-700 dark:text-zinc-300">
              {isLoading && <TableSkeleton rows={3} cols={4} />}

              {!isLoading && apiKeysList?.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-4">
                    <EmptyState
                      icon={Key}
                      title="No API keys"
                      description="Generate an API key to access Samast Cron programmatically via cURL or SDKs."
                    />
                  </td>
                </tr>
              )}

              {!isLoading && apiKeysList?.map((key) => (
                <tr key={key.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <Key className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                    <span className="truncate">{key.name}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-zinc-600 dark:text-zinc-400">
                    {key.keyPrefix}...
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400 font-mono">
                    {new Date(key.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => revokeMutation.mutate(key.id)}
                      className="p-1.5 rounded hover:bg-rose-50 dark:hover:bg-zinc-800 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                      title="Revoke Key"
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
    </div>
  );
}
