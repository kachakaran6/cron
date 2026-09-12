import React from 'react';

export function TableSkeleton({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rIdx) => (
        <tr key={rIdx} className="border-b border-zinc-200 dark:border-zinc-800/60 animate-pulse">
          {Array.from({ length: cols }).map((_, cIdx) => (
            <td key={cIdx} className="px-4 py-3">
              <div className="h-4 bg-zinc-200 dark:bg-zinc-800/80 rounded w-3/4" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
