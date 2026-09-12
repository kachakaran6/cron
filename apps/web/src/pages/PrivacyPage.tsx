import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-zinc-800">
        <Link
          to="/"
          className="p-1.5 rounded border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-100 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
        </Link>
        <h1 className="text-lg font-semibold text-zinc-100">Privacy Policy</h1>
      </div>

      <div className="text-xs text-zinc-300 space-y-4 leading-relaxed font-sans">
        <p><strong>Effective Date:</strong> September 12, 2026</p>

        <h2 className="text-sm font-semibold text-zinc-100 pt-2">1. Information We Collect</h2>
        <p>
          Samast Cron collects minimal technical information required to execute scheduled HTTP requests, including target URLs, configured headers, request payloads, cron schedule expressions, and execution response logs.
        </p>

        <h2 className="text-sm font-semibold text-zinc-100 pt-2">2. How Information is Used</h2>
        <p>
          Configured schedule information is used strictly to trigger HTTP requests to your designated target endpoints according to your specified cron schedule. Execution logs (status code, duration, response body) are stored temporarily for your inspection and debugging.
        </p>

        <h2 className="text-sm font-semibold text-zinc-100 pt-2">3. Data Security &amp; Isolation</h2>
        <p>
          Worker threads execute requests in isolated network sandboxes. Private local CIDR blocks and cloud metadata endpoints are strictly blocked to prevent Server-Side Request Forgery (SSRF).
        </p>

        <h2 className="text-sm font-semibold text-zinc-100 pt-2">4. Contact Information</h2>
        <p>
          For privacy inquiries or data removal requests, contact us at <a href="mailto:support@samast.pro" className="text-zinc-100 underline">support@samast.pro</a>.
        </p>
      </div>
    </div>
  );
}
