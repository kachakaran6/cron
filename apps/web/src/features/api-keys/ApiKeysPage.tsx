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
    if (!keyName) return;
    createMutation.mutate(keyName);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="pb-2 border-b border-zinc-800">
        <h1 className="text-lg font-semibold text-zinc-100">API Keys</h1>
        <p className="text-xs text-zinc-400">
          Manage Bearer tokens for programmatically creating and triggering cron schedules via the REST API.
        </p>
      </div>

      {newKey && (
        <div className="p-4 rounded border border-emerald-800/80 bg-emerald-950/30 text-emerald-300 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-xs text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span>API Key Generated</span>
          </div>
          <p className="text-xs text-zinc-300">
            Copy this key now. For security reasons, it will not be displayed again.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <code className="px-3 py-1.5 rounded bg-zinc-950 font-mono text-xs text-emerald-400 border border-zinc-800 flex-1">
              {newKey}
            </code>
            <button
              onClick={() => copyToClipboard(newKey)}
              className="px-3 py-1.5 rounded bg-zinc-100 text-zinc-950 text-xs font-semibold hover:bg-white flex items-center gap-1"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Create Key Form */}
      <form onSubmit={handleCreate} className="p-4 border border-zinc-800 rounded bg-zinc-950 flex items-end gap-3">
        <div className="flex-1">
          <label className="block text-xs font-medium text-zinc-300 mb-1">Key Description / Service Label</label>
          <input
            type="text"
            required
            placeholder="GitHub Actions CI/CD Pipeline"
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
            className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-100 focus-ring placeholder-zinc-500"
          />
        </div>
        <button
          type="submit"
          disabled={createMutation.isPending}
          className="px-3.5 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs rounded transition-colors flex items-center gap-1.5 disabled:opacity-50"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{createMutation.isPending ? 'Generating...' : 'Create key'}</span>
        </button>
      </form>

      {/* Keys Data Table */}
      <div className="border border-zinc-800 rounded bg-zinc-950 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-900/80 text-[11px] font-mono uppercase tracking-wider text-zinc-400 border-b border-zinc-800">
            <tr>
              <th className="px-4 py-2.5">Key Name</th>
              <th className="px-4 py-2.5">Prefix</th>
              <th className="px-4 py-2.5">Created Date</th>
              <th className="px-4 py-2.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 font-sans text-zinc-300">
            {isLoading && <TableSkeleton rows={3} cols={4} />}

            {!isLoading && apiKeysList?.length === 0 && (
              <tr>
                <td colSpan={4}>
                  <EmptyState
                    icon={Key}
                    title="No API keys"
                    description="Generate an API key to access Samast Cron programmatically via cURL or SDKs."
                  />
                </td>
              </tr>
            )}

            {!isLoading && apiKeysList?.map((key) => (
              <tr key={key.id} className="hover:bg-zinc-900/50 transition-colors">
                <td className="px-4 py-3 font-medium text-zinc-100 flex items-center gap-2">
                  <Key className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{key.name}</span>
                </td>
                <td className="px-4 py-3 font-mono text-zinc-400">
                  {key.keyPrefix}...
                </td>
                <td className="px-4 py-3 text-zinc-400 font-mono">
                  {new Date(key.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => revokeMutation.mutate(key.id)}
                    className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-rose-400 transition-colors"
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
  );
}
