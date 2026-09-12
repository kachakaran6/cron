import React from 'react';
import { Bell, Plus } from 'lucide-react';
import { EmptyState } from '../../components/ui/EmptyState';

export default function NotificationsPage() {
  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-800">
        <div>
          <h1 className="text-lg font-semibold text-zinc-100">Failure &amp; Recovery Notifications</h1>
          <p className="text-xs text-zinc-400">Configure alert channels to receive notifications when scheduled HTTP calls fail.</p>
        </div>

        <button
          disabled
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded bg-zinc-800 text-zinc-400 cursor-not-allowed opacity-75"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Channel</span>
        </button>
      </div>

      <div className="border border-zinc-800 rounded bg-zinc-950 p-6">
        <EmptyState
          icon={Bell}
          title="No alert channels configured"
          description="Add email addresses or webhook URLs to automatically receive instant alerts when a scheduled job returns a non-2xx HTTP code."
        />
      </div>
    </div>
  );
}
