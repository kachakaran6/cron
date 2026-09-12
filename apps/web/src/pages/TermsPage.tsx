import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-zinc-800">
        <Link
          to="/"
          className="p-1.5 rounded border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-100 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
        </Link>
        <h1 className="text-lg font-semibold text-zinc-100">Terms of Service</h1>
      </div>

      <div className="text-xs text-zinc-300 space-y-4 leading-relaxed font-sans">
        <p><strong>Effective Date:</strong> September 12, 2026</p>

        <h2 className="text-sm font-semibold text-zinc-100 pt-2">1. Acceptable Use</h2>
        <p>
          You agree to use Samast Cron only for lawful HTTP automation and monitoring purposes. You must not use the platform to perform Denial of Service (DoS) attacks, port scanning, unauthorized scraping, or malicious network activity.
        </p>

        <h2 className="text-sm font-semibold text-zinc-100 pt-2">2. Service Availability &amp; Limits</h2>
        <p>
          Samast Cron provides scheduled request execution. While we maintain high availability worker clusters, scheduled executions are provided without warranty. Users are responsible for ensuring target endpoints handle incoming HTTP traffic cleanly.
        </p>

        <h2 className="text-sm font-semibold text-zinc-100 pt-2">3. Termination</h2>
        <p>
          We reserve the right to suspend or terminate schedules that violate acceptable use policies or attempt to target blocked internal CIDR ranges.
        </p>
      </div>
    </div>
  );
}
