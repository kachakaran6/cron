import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="py-16 px-6 text-center border border-zinc-800/80 rounded-lg bg-zinc-900/30 my-4">
      <div className="w-10 h-10 rounded-md bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center mx-auto mb-4 text-zinc-400">
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="text-sm font-semibold text-zinc-100 mb-1">{title}</h3>
      <p className="text-xs text-zinc-400 max-w-sm mx-auto mb-6 leading-relaxed">{description}</p>

      {action && (
        action.href ? (
          <a
            href={action.href}
            className="inline-flex items-center justify-center px-3.5 py-2 rounded-md bg-zinc-100 text-zinc-950 font-medium text-xs hover:bg-white transition-colors"
          >
            {action.label}
          </a>
        ) : (
          <button
            onClick={action.onClick}
            className="inline-flex items-center justify-center px-3.5 py-2 rounded-md bg-zinc-100 text-zinc-950 font-medium text-xs hover:bg-white transition-colors"
          >
            {action.label}
          </button>
        )
      )}
    </div>
  );
}
