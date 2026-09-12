import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, ExternalLink } from 'lucide-react';
import { CodeBlock } from '../components/ui/CodeBlock';

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="p-1.5 rounded border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-zinc-400" />
              <span>Samast Cron Documentation</span>
            </h1>
            <p className="text-xs text-zinc-400">Technical guide for cron syntax, REST API, and worker execution.</p>
          </div>
        </div>

        <a
          href="/api/docs"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded bg-zinc-100 text-zinc-950 hover:bg-white transition-colors"
        >
          <span>OpenAPI Specs</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      <div className="space-y-6 text-xs text-zinc-300">
        {/* Section 1: Cron Syntax */}
        <div className="p-5 border border-zinc-800 rounded bg-zinc-950 space-y-3">
          <h2 className="text-sm font-semibold text-zinc-100">1. Cron Expression Syntax</h2>
          <p className="leading-relaxed">
            Samast Cron evaluates standard 5-part cron syntax:
          </p>
          <div className="p-3 bg-zinc-900 border border-zinc-800 rounded font-mono text-xs text-zinc-300">
            * * * * *<br />
            │ │ │ │ │<br />
            │ │ │ │ └─── Day of week (0 - 6) (Sunday to Saturday)<br />
            │ │ │ └────── Month (1 - 12)<br />
            │ │ └───────── Day of month (1 - 31)<br />
            │ └──────────── Hour (0 - 23)<br />
            └────────────── Minute (0 - 59)
          </div>
        </div>

        {/* Section 2: Worker Security */}
        <div className="p-5 border border-zinc-800 rounded bg-zinc-950 space-y-3">
          <h2 className="text-sm font-semibold text-zinc-100">2. Worker Security &amp; SSRF Protection</h2>
          <p className="leading-relaxed">
            Worker nodes execute HTTP requests in isolated network namespaces. The following IP ranges are strictly blocked to prevent internal network scanning:
          </p>
          <ul className="list-disc list-inside font-mono text-[11px] text-zinc-400 space-y-1">
            <li>127.0.0.0/8 (Loopback)</li>
            <li>10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16 (Private IPv4)</li>
            <li>169.254.169.254 (Cloud Metadata Service)</li>
          </ul>
        </div>

        {/* Section 3: REST API */}
        <div className="p-5 border border-zinc-800 rounded bg-zinc-950 space-y-3">
          <h2 className="text-sm font-semibold text-zinc-100">3. Programmatic API Integration</h2>
          <p className="leading-relaxed">
            Create API keys under the API Keys tab in the console and include them as Bearer tokens:
          </p>
          <CodeBlock
            code={`curl -X POST "https://cron.samast.pro/api/v1/jobs" \\
  -H "Authorization: Bearer cron_key_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Check Payment Gateway",
    "schedule": "*/15 * * * *",
    "url": "https://api.yourdomain.com/health",
    "method": "GET"
  }'`}
            language="bash"
          />
        </div>
      </div>
    </div>
  );
}
