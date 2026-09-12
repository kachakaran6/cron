import React from 'react';
import { ShieldCheck, Plus } from 'lucide-react';
import { EmptyState } from '../../components/ui/EmptyState';

export default function MonitorsListPage() {
  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Status Monitors &amp; SSL Expiry</h1>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">Monitor domain SSL certificate validity and endpoint availability.</p>
        </div>

        <button
          disabled
          className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-400 cursor-not-allowed opacity-75"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Monitor</span>
        </button>
      </div>

      <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 p-6 shadow-sm dark:shadow-none">
        <EmptyState
          icon={ShieldCheck}
          title="No status monitors configured"
          description="SSL expiry monitoring and public status checks can be configured to alert you before domain certificates expire."
        />
      </div>
    </div>
  );
}
