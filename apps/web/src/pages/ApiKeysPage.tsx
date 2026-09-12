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
        <h1 className="text-2xl font-bold text-white tracking-tight">Programmatic API Keys</h1>
        <p className="text-sm text-slate-400">
          Manage Bearer API keys for programmatic job scheduling via cURL, Python, or SDKs.
        </p>
      </div>

      {/* New Key Alert Modal */}
      {newKey && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>API Key Generated Successfully</span>
          </div>
          <p className="text-xs text-slate-300">
            Copy this key now. For security reasons, it will never be displayed again.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <code className="px-3 py-1.5 rounded bg-slate-950 font-mono text-xs text-emerald-400 border border-slate-800 flex-1">
              {newKey}
            </code>
            <button
              onClick={() => copyToClipboard(newKey)}
              className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Key'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Create Form */}
      <form onSubmit={handleCreate} className="p-6 rounded-xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-md flex items-end gap-4">
        <div className="flex-1">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Key Label / Description
          </label>
          <input
            type="text"
            required
            placeholder="e.g. GitHub Actions Deployment Pipeline"
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
            className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <button
          type="submit"
          disabled={createMutation.isPending}
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          <span>{createMutation.isPending ? 'Generating...' : 'Generate API Key'}</span>
        </button>
      </form>

      {/* Keys List */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-md overflow-hidden shadow-xl">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950/60 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="px-6 py-3.5">Name</th>
              <th className="px-6 py-3.5">Prefix</th>
              <th className="px-6 py-3.5">Created</th>
              <th className="px-6 py-3.5 text-right">Revoke</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {isLoading && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-500 text-sm">
                  Loading API keys...
                </td>
              </tr>
            )}

            {!isLoading && apiKeysList?.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-500 text-sm">
                  No active API keys found.
                </td>
              </tr>
            )}

            {apiKeysList?.map((key) => (
              <tr key={key.id} className="hover:bg-slate-900/60 transition-colors">
                <td className="px-6 py-4 font-medium text-white flex items-center gap-2">
                  <Key className="w-4 h-4 text-indigo-400" />
                  <span>{key.name}</span>
                </td>
                <td className="px-6 py-4 font-mono text-xs text-slate-400">
                  {key.keyPrefix}...
                </td>
                <td className="px-6 py-4 text-xs text-slate-500">
                  {new Date(key.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => revokeMutation.mutate(key.id)}
                    className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-rose-500/10 hover:border-rose-500/30 text-slate-400 hover:text-rose-400 transition-all"
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
