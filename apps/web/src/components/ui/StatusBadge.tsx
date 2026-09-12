import React from 'react';
import { CheckCircle2, XCircle, Clock, PauseCircle, RefreshCw, AlertTriangle, HelpCircle } from 'lucide-react';

export type JobStatusType = 'active' | 'paused' | 'running' | 'success' | 'failed' | 'retrying' | 'unknown';

interface StatusBadgeProps {
  status: JobStatusType;
  showIcon?: boolean;
}

export function StatusBadge({ status, showIcon = true }: StatusBadgeProps) {
  switch (status) {
    case 'active':
    case 'success':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
          {showIcon && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500" />}
          <span>{status === 'active' ? 'Active' : 'Successful'}</span>
        </span>
      );
    case 'paused':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400">
          {showIcon && <PauseCircle className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-500" />}
          <span>Paused</span>
        </span>
      );
    case 'running':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-600 dark:text-sky-400">
          {showIcon && <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-600 dark:text-sky-400" />}
          <span>Running</span>
        </span>
      );
    case 'failed':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
          {showIcon && <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-500" />}
          <span>Failed</span>
        </span>
      );
    case 'retrying':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
          {showIcon && <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
          <span>Retrying</span>
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400">
          {showIcon && <HelpCircle className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-500" />}
          <span>Unknown</span>
        </span>
      );
  }
}
