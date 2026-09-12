import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Key, Plus, Trash2, ShieldCheck, Copy, Check } from 'lucide-react';
import { fetchApiKeys, createApiKey, revokeApiKey } from '../services/api';

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
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Key className="w-6 h-6 text-rose-500" />
          <span>Programmatic API Keys</span>
        </h1>
        <p className="text-xs text-zinc-400">
          Manage Bearer tokens for programmatic job creation and triggering via cURL, Python, or SDKs.
        </p>
      </div>

      {/* New Key Alert Modal */}
      {newKey && (
        <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 space-y-2.5 shadow-2xl">
          <div className="flex items-center gap-2 font-bold text-sm">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>API Key Generated Successfully</span>
          </div>
          <p className="text-xs text-zinc-300">
            Copy this key now. For security reasons, it will never be displayed again.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <code className="px-3.5 py-2 rounded-xl bg-zinc-950 font-mono text-xs text-emerald-400 border border-zinc-800 flex-1">
              {newKey}
            </code>
            <button
              onClick={() => copyToClipboard(newKey)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied' : 'Copy Key'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Create Form */}
      <form onSubmit={handleCreate} className="p-6 rounded-2xl border border-zinc-800/80 bg-zinc-950/60 backdrop-blur-xl flex items-end gap-4 shadow-2xl">
        <div className="flex-1">
          <label className="block text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider mb-2">
            Key Description / Service Label
          </label>
          <input
            type="text"
            required
            placeholder="e.g. GitHub Actions CI/CD Production Pipeline"
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-rose-500 font-medium"
          />
        </div>
        <button
          type="submit"
          disabled={createMutation.isPending}
          className="glow-button px-5 py-2.5 rounded-xl text-white font-bold text-xs flex items-center gap-1.5 shadow-lg disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          <span>{createMutation.isPending ? 'Generating...' : 'Generate Key'}</span>
        </button>
      </form>

      {/* Keys List */}
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/60 backdrop-blur-xl overflow-hidden shadow-2xl">
        <table className="w-full text-left text-xs text-zinc-300">
          <thead className="bg-zinc-900/60 text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-800">
            <tr>
              <th className="px-6 py-4">Key Label</th>
              <th className="px-6 py-4">Prefix</th>
              <th className="px-6 py-4">Created Date</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 font-sans">
            {isLoading && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-zinc-500 text-xs">
                  Loading API keys...
                </td>
              </tr>
            )}

            {!isLoading && apiKeysList?.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-zinc-500 text-xs font-mono">
                  No active API keys found.
                </td>
              </tr>
            )}

            {apiKeysList?.map((key) => (
              <tr key={key.id} className="hover:bg-zinc-900/60 transition-colors">
                <td className="px-6 py-4 font-bold text-white flex items-center gap-2">
                  <Key className="w-4 h-4 text-rose-400" />
                  <span>{key.name}</span>
                </td>
                <td className="px-6 py-4 font-mono text-xs text-rose-300">
                  {key.keyPrefix}...
                </td>
                <td className="px-6 py-4 text-xs text-zinc-400 font-mono">
                  {new Date(key.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => revokeMutation.mutate(key.id)}
                    className="p-2 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-rose-500/10 hover:border-rose-500/30 text-zinc-400 hover:text-rose-400 transition-all"
                    title="Revoke Key"
                  >
                    <Trash2 className="w-4 h-4" />
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
