import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Search,
  Code,
  ShieldCheck,
  Terminal,
  Copy,
  Check,
  ExternalLink,
  ArrowLeft,
  Sun,
  Moon,
  Zap,
  Server,
  Clock,
  Database,
  CreditCard,
  ShoppingBag,
  Activity,
  Cpu,
  CheckCircle2,
  Layers,
  Sparkles,
  ChevronRight,
  AlertTriangle,
  Bell,
  Globe,
  Lock,
  RefreshCw,
  Sliders,
  FileCode,
  ShieldAlert,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { CodeBlock } from '../components/ui/CodeBlock';

interface ConceptTopic {
  id: string;
  category: 'beginner' | 'intermediate' | 'advanced' | 'industry' | 'security' | 'api';
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Enterprise';
  levelColor: string;
  title: string;
  subtitle: string;
  icon: any;
  summary: string;
  details: string[];
  codeExample?: {
    language: string;
    code: string;
    caption?: string;
  };
  industryContext?: string;
}

const DOCUMENTATION_TOPICS: ConceptTopic[] = [
  // ── LEVEL 1: BEGINNER ────────────────────────────────────────────────────────
  {
    id: 'what-is-cron',
    category: 'beginner',
    level: 'Beginner',
    levelColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    title: '1. What is Scheduled HTTP Automation?',
    subtitle: 'Understanding background cron jobs, webhooks, and automated API triggering.',
    icon: Clock,
    summary:
      'Scheduled HTTP automation allows you to execute HTTP endpoints (webhooks, microservice endpoints, cloud functions) at predefined time intervals without maintaining background daemon processes on your application servers.',
    details: [
      'Eliminates the need for traditional server-side crontabs (which silently fail if your server restarts).',
      'Executes HTTP GET, POST, PUT, PATCH, and DELETE requests with precise time accuracy.',
      'Captures full HTTP response statuses, headers, response duration in milliseconds, and error payloads.',
      'Supports automated retries and consecutive failure alerting across Email, Slack, Discord, and Webhooks.',
    ],
    codeExample: {
      language: 'bash',
      caption: 'Example: Simple GET health check request triggered every minute',
      code: `# Samast Cron worker sends an outbound HTTP GET request
GET https://api.yourcompany.com/v1/healthz
Host: api.yourcompany.com
User-Agent: SamastCron-Worker/1.0 (+https://cron.samast.pro/bot)
Accept: application/json`,
    },
    industryContext:
      'Used by developers to keep serverless containers (AWS Lambda, Vercel, Railway, Supabase) warm and verify API uptime 24/7.',
  },
  {
    id: 'cron-expression-syntax',
    category: 'beginner',
    level: 'Beginner',
    levelColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    title: '2. Master Cron Syntax & Timezone Handling',
    subtitle: 'Understanding 5-field UNIX expressions, step intervals, and DST-safe timezones.',
    icon: CalendarIcon,
    summary:
      'Cron expressions consist of 5 space-delimited fields representing Minute, Hour, Day of Month, Month, and Day of Week.',
    details: [
      'Minute (0-59): Defines which minute(s) the job executes.',
      'Hour (0-23): 24-hour UTC or localized hour selection.',
      'Day of Month (1-31): Specific calendar days.',
      'Month (1-12): January (1) through December (12).',
      'Day of Week (0-6): Sunday (0) to Saturday (6).',
      'Timezone Isolation: Always specify explicit timezones (e.g. UTC, Asia/Kolkata, America/New_York) to prevent Daylight Saving Time (DST) schedule shifts.',
    ],
    codeExample: {
      language: 'plaintext',
      caption: 'Cron Anatomy Cheatsheet',
      code: `┌───────────── minute (0 - 59)
│ ┌───────────── hour (0 - 23)
│ │ ┌───────────── day of month (1 - 31)
│ │ │ ┌───────────── month (1 - 12)
│ │ │ │ ┌───────────── day of week (0 - 6) (Sunday to Saturday)
│ │ │ │ │
* * * * *

Common Examples:
* * * * *      -> Every 1 minute
*/5 * * * *    -> Every 5 minutes
0 * * * *      -> Every hour at minute 0
0 0 * * *      -> Every day at midnight UTC (00:00)
0 9 * * 1-5    -> Every weekday (Mon-Fri) at 09:00 AM
0 0 1 * *      -> First day of every month at midnight`,
    },
    industryContext:
      'Enterprise teams standardize all automated cronjobs in UTC to prevent discrepancies during international timezone switches.',
  },

  // ── LEVEL 2: INTERMEDIATE ──────────────────────────────────────────────────
  {
    id: 'http-methods-headers',
    category: 'intermediate',
    level: 'Intermediate',
    levelColor: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
    title: '3. Custom HTTP Headers, JSON Payloads & Auth',
    subtitle: 'Configuring HTTP Bearer Tokens, Basic Auth, and custom request body structures.',
    icon: Terminal,
    summary:
      'Send authenticated POST/PUT payloads to secure backend endpoints, API gateways, or internal microservices using custom HTTP headers.',
    details: [
      'HTTP Methods Supported: GET, POST, PUT, PATCH, DELETE, HEAD, and OPTIONS.',
      'HTTP Basic Authentication: Automatic RFC 7617 base64 header encoding (`Authorization: Basic ...`).',
      'Custom Headers: Pass Bearer tokens, API Keys (`X-API-Key`), or custom signature headers.',
      'JSON Body Payloads: Send structured JSON payloads for batch processes or status updates.',
    ],
    codeExample: {
      language: 'json',
      caption: 'Example POST Payload sent to a Payment Sync Endpoint',
      code: `POST /api/v1/subscriptions/renew-expired HTTP/1.1
Host: billing.yourdomain.com
Authorization: Bearer sec_live_99f82d114d
Content-Type: application/json
User-Agent: SamastCron-Worker/1.0

{
  "trigger": "scheduled_cron",
  "batchSize": 100,
  "dryRun": false,
  "source": "samast_cron_scheduler"
}`,
    },
    industryContext:
      'SaaS applications rely on custom authentication headers to ensure cron webhooks are originating strictly from authorized dispatchers.',
  },
  {
    id: 'alerting-thresholds',
    category: 'intermediate',
    level: 'Intermediate',
    levelColor: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
    title: '4. Failure Thresholds, Retries & Recovery Routing',
    subtitle: 'Eliminating false alarms and routing alerts to Slack, Email, and Webhooks.',
    icon: Bell,
    summary:
      'Configure smart alerting rules that only notify your engineering team when an endpoint is genuinely failing, preventing alert fatigue.',
    details: [
      'Consecutive Failure Threshold: Set `failureThreshold = 3` so transient network blips do not trigger emails or Slack pings.',
      'Auto-Disable Protection: Automatically pauses jobs after 10 consecutive failures to prevent server overload.',
      'Recovery Alerts: Receive an instant notification when a previously failing service recovers (`HTTP 200 OK`).',
      'Per-Job Channel Selection: Direct high-priority production alerts to `#oncall-slack` and low-priority alerts to Email.',
    ],
    codeExample: {
      language: 'yaml',
      caption: 'Alert Threshold Mechanics',
      code: `Execution #1: HTTP 500 (Fail #1) -> Threshold is 3 -> Suppress alert
Execution #2: HTTP 500 (Fail #2) -> Threshold is 3 -> Suppress alert
Execution #3: HTTP 500 (Fail #3) -> Threshold hit! -> 🚨 Dispatch Alert to Slack & Email
Execution #4: HTTP 200 (Success)  -> State Transition -> ✅ Dispatch Recovery Alert!`,
    },
    industryContext:
      'DevOps teams reduce middle-of-the-night false alarms by 85% by enforcing a 2 or 3 failure threshold policy on scheduled health checks.',
  },

  // ── LEVEL 3: INDUSTRY USE CASES ───────────────────────────────────────────
  {
    id: 'use-case-database-backups',
    category: 'industry',
    level: 'Advanced',
    levelColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    title: '5. Industry Case 1: Automated Nightly Database & S3 Storage Backups',
    subtitle: 'Triggering PostgreSQL, MySQL, and MongoDB snapshot backups automatically.',
    icon: Database,
    summary:
      'Schedule automated nightly database dumps and S3 cold storage syncs without running cron daemons on application nodes.',
    details: [
      'Schedule: `0 2 * * *` (Runs every night at 02:00 AM UTC during lowest traffic window).',
      'Target: Secure internal backup API (`https://api.yourdomain.com/internal/backups/trigger`).',
      'Security: Authenticate using a high-entropy secret token passed via HTTP header.',
      'Verification: Asserts HTTP 200 response with duration and payload size logging.',
    ],
    codeExample: {
      language: 'typescript',
      caption: 'Next.js / Node.js API Route for Backup Trigger',
      code: `// pages/api/internal/backups/trigger.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { exec } from 'child_process';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authToken = req.headers['x-cron-secret'];
  if (authToken !== process.env.CRON_BACKUP_SECRET) {
    return res.status(401).json({ error: 'Unauthorized cron request' });
  }

  // Trigger pg_dump or AWS S3 upload task
  exec('pg_dump $DATABASE_URL | gzip | aws s3 cp - s3://my-backups/db-$(date +%F).sql.gz', (err) => {
    if (err) return res.status(500).json({ status: 'FAILED', error: err.message });
    return res.status(200).json({ status: 'SUCCESS', message: 'Backup created successfully' });
  });
}`,
    },
    industryContext:
      'Fintech and healthcare platforms rely on this pattern to satisfy compliance requirements for 24-hour point-in-time recovery.',
  },
  {
    id: 'use-case-saas-billing',
    category: 'industry',
    level: 'Advanced',
    levelColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    title: '6. Industry Case 2: SaaS Subscription Renewals & Dunning Workflows',
    subtitle: 'Automating monthly subscription billing, invoice generation, and trial expiry.',
    icon: CreditCard,
    summary:
      'SaaS platforms need recurring scheduled jobs to scan for expiring trial accounts, charge saved cards via Stripe/Gumroad, and send dunning emails.',
    details: [
      'Schedule: `0 0 * * *` (Daily at Midnight UTC).',
      'Target: `/api/v1/billing/process-renewals`.',
      'Function: Queries active subscriptions whose billing period ends today and executes charges.',
      'Failure Alerting: Sends immediate alert to finance team if payment gateway API returns repeated 5xx errors.',
    ],
    codeExample: {
      language: 'javascript',
      caption: 'Express.js Subscription Renewal Processing Endpoint',
      code: `app.post('/api/v1/billing/process-renewals', async (req, res) => {
  const secret = req.headers['authorization'];
  if (secret !== \`Bearer \${process.env.BILLING_CRON_KEY}\`) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const expiredTrials = await db.users.findMany({ where: { trialEnded: true, plan: 'FREE' } });
  let processed = 0;
  for (const user of expiredTrials) {
    await sendUpgradeReminderEmail(user.email);
    processed++;
  }

  res.json({ success: true, processedUsers: processed });
});`,
    },
    industryContext:
      'Used by subscription businesses to prevent revenue leakage and automate dunning sequences for failed credit card charges.',
  },
  {
    id: 'use-case-ecommerce-sync',
    category: 'industry',
    level: 'Advanced',
    levelColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    title: '7. Industry Case 3: E-Commerce Inventory & Order Syncing',
    subtitle: 'Synchronizing multi-channel inventory between Shopify, WooCommerce, and ERPs.',
    icon: ShoppingBag,
    summary:
      'High-volume e-commerce brands use 5-minute cron schedules to sync warehouse stock quantities across Shopify, Amazon, and ERP software.',
    details: [
      'Schedule: `*/5 * * * *` (Every 5 minutes).',
      'Target: `/api/inventory/sync-multi-channel`.',
      'Prevents overselling inventory during flash sales or high-volume promotions.',
    ],
    codeExample: {
      language: 'python',
      caption: 'Python FastAPI Multi-Channel Inventory Sync Handler',
      code: `from fastapi import FastAPI, Header, HTTPException
import os

app = FastAPI()

@app.post("/api/inventory/sync")
def sync_inventory(x_cron_auth: str = Header(None)):
    if x_cron_auth != os.getenv("CRON_SECRET"):
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    # Query ERP inventory and update Shopify GraphQL API
    updated_items = sync_warehouse_to_shopify()
    return {"status": "SUCCESS", "syncedCount": updated_items}`,
    },
    industryContext:
      'Ensures real-time stock alignment across international fulfillment centers, reducing inventory variance.',
  },

  // ── LEVEL 4: SECURITY & INFRASTRUCTURE ────────────────────────────────────
  {
    id: 'anti-ssrf-isolation',
    category: 'security',
    level: 'Enterprise',
    levelColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    title: '8. Anti-SSRF Network Security & Isolated Execution Workers',
    subtitle: 'Preventing Server-Side Request Forgery and protecting internal cloud metadata.',
    icon: ShieldAlert,
    summary:
      'Samast Cron runs an isolated HTTP client engine built with Undici that validates and sanitizes all destination IP addresses prior to dispatch.',
    details: [
      'Blocked Localhost Ranges: `127.0.0.0/8`, `::1`',
      'Blocked Private RFC 1918 IPv4 Ranges: `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`',
      'Blocked Cloud Metadata Endpoints: `169.254.169.254` (AWS IMDSv1/v2, GCP Metadata, Azure Metadata)',
      'DNS Rebinding Mitigation: Resolves DNS pre-flight and verifies resolved IP address against security policy before making socket connections.',
    ],
    codeExample: {
      language: 'typescript',
      caption: 'Safe Dispatcher IP Validation Check',
      code: `// Worker Anti-SSRF Safety Module
export async function validateSafeUrl(urlStr: string): Promise<void> {
  const parsed = new URL(urlStr);
  const addresses = await dns.promises.lookup(parsed.hostname, { all: true });

  for (const addr of addresses) {
    if (isPrivateIp(addr.address) || isCloudMetadataIp(addr.address)) {
      throw new SecuritySSRFException(
        \`Blocked connection to internal/private IP \${addr.address} for security\`
      );
    }
  }
}`,
    },
    industryContext:
      'Required by SOC2 Type II and ISO 27001 compliance standards to guarantee third-party HTTP schedulers cannot exploit internal networks.',
  },
  {
    id: 'tls-expiry-monitoring',
    category: 'security',
    level: 'Enterprise',
    levelColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    title: '9. Proactive TLS/SSL Certificate Expiry Monitoring',
    subtitle: 'Automated 30-day proactive certificate expiration alerts.',
    icon: Lock,
    summary:
      'Prevent catastrophic website outages caused by expired Let’s Encrypt or SSL certificates. Samast Cron automatically inspects SSL handshake certificates on every cron run.',
    details: [
      'Inspects X.509 validity dates during TLS handshake.',
      'Triggers proactive warning notifications 30 days, 14 days, and 3 days before certificate expiry.',
      'Prevents customer-facing SSL browser warnings (`NET::ERR_CERT_DATE_INVALID`).',
    ],
    codeExample: {
      language: 'plaintext',
      caption: 'TLS Expiry Alert Payload',
      code: `🚨 [Samast Cron TLS Alert] SSL Certificate Expiring Soon!
Job Name: Primary Payment Gateway Health
Target URL: https://api.payments.yourcompany.com/v1/status
Certificate Issuer: Let's Encrypt Authority X3
Days Remaining: 14 Days (Expires on 2026-09-28)
Action Required: Please renew your SSL certificate or check certbot auto-renew status.`,
    },
    industryContext:
      'Saves engineering teams from unexpected domain outages caused by silent ACME certbot renewal failures.',
  },

  // ── LEVEL 5: PROGRAMMATIC REST API ────────────────────────────────────────
  {
    id: 'rest-api-automation',
    category: 'api',
    level: 'Enterprise',
    levelColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    title: '10. Programmatic REST API & SDK Integration',
    subtitle: 'Automating cronjob creation, editing, and execution querying via API.',
    icon: Code,
    summary:
      'Manage all cron schedules programmatically via our REST API. Generate scoped API Keys from your dashboard to integrate with CI/CD pipelines, Terraform, or internal admin tools.',
    details: [
      'Authentication: Pass `Authorization: Bearer cr_live_...` header.',
      'Endpoints: `/api/v1/jobs` (CRUD), `/api/v1/jobs/:id/execute` (Instant trigger), `/api/v1/jobs/overview-stats` (Telemetry).',
      'JSON Responses: Returns standard structured JSON payloads with precise timestamps and execution status.',
    ],
    codeExample: {
      language: 'bash',
      caption: 'cURL Example: Programmatically create a cron schedule',
      code: `curl -X POST "https://cron.samast.pro/api/v1/jobs" \\
  -H "Authorization: Bearer cr_live_78ab22c9a1" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Sync Stripe Invoices",
    "schedule": "0 0 * * *",
    "url": "https://api.yourdomain.com/v1/stripe/sync",
    "method": "POST",
    "timezone": "UTC",
    "timeoutMs": 15000,
    "notifyOnFailure": true,
    "failureThreshold": 2,
    "headers": {
      "X-Custom-Auth": "secret_token_123"
    }
  }'`,
    },
    industryContext:
      'DevOps teams automate cron schedule provisioning inside GitHub Actions deployment scripts so new microservices automatically register their health checks.',
  },
];

function CalendarIcon(props: any) {
  return <Clock {...props} />;
}

export default function DocsPage() {
  const { theme, toggleTheme } = useTheme();
  const dark = theme === 'dark';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(DOCUMENTATION_TOPICS[0].id);

  const filteredTopics = DOCUMENTATION_TOPICS.filter((topic) => {
    const matchesCategory = selectedCategory === 'all' || topic.category === selectedCategory;
    const matchesSearch =
      topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const activeTopic = DOCUMENTATION_TOPICS.find((t) => t.id === selectedTopicId) || filteredTopics[0] || DOCUMENTATION_TOPICS[0];

  return (
    <div
      className={`min-h-screen font-sans transition-colors ${
        dark ? 'bg-zinc-950 text-zinc-100' : 'bg-slate-50 text-zinc-900'
      }`}
    >
      {/* Top Header Bar */}
      <header
        className={`border-b px-4 sm:px-8 py-3.5 sticky top-0 z-40 backdrop-blur ${
          dark ? 'border-zinc-800 bg-zinc-950/95' : 'border-zinc-200 bg-white/95'
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard/schedules"
              className={`p-1.5 rounded-md border transition-colors ${
                dark
                  ? 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-100'
                  : 'border-zinc-300 bg-white text-zinc-600 hover:text-zinc-900'
              }`}
              title="Return to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight flex items-center gap-2">
                <BookOpen className="w-4.5 h-4.5 text-[var(--accent)]" />
                <span>Samast Cron Documentation &amp; Master Guide</span>
              </h1>
              <p className={`text-xs ${dark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                From basic cron concepts to production-grade industry implementations.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-md border transition-colors ${
                dark
                  ? 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white'
                  : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100'
              }`}
              title={dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {dark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-700" />}
            </button>

            <Link
              to="/dashboard/schedules/new"
              className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-md btn-accent shadow-sm transition-all"
            >
              <Zap className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Create Cronjob</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Documentation Shell */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-6">
        {/* Search & Category Filter Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-xs">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search concepts, cron syntax, HTTP auth, or industry use cases..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[var(--accent)] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs">
            {[
              { id: 'all', label: 'All Topics' },
              { id: 'beginner', label: '1. Beginner' },
              { id: 'intermediate', label: '2. Intermediate' },
              { id: 'industry', label: '3. Industry Cases' },
              { id: 'security', label: '4. Security' },
              { id: 'api', label: '5. REST API' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? 'bg-[var(--accent)] text-white shadow-xs'
                    : dark
                    ? 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200'
                    : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2-Column Master Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Left Navigation Topic Index Sidebar */}
          <div className="md:col-span-4 lg:col-span-3 space-y-2 sticky top-20">
            <div className="text-[11px] font-mono uppercase text-zinc-500 font-semibold px-2">
              Topic Index ({filteredTopics.length})
            </div>
            <div className="space-y-1 max-h-[calc(100vh-160px)] overflow-y-auto pr-1">
              {filteredTopics.map((topic) => {
                const IconComp = topic.icon;
                const isSelected = activeTopic?.id === topic.id;
                return (
                  <button
                    key={topic.id}
                    onClick={() => setSelectedTopicId(topic.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-all flex items-start gap-2.5 group ${
                      isSelected
                        ? 'border-[var(--accent)] bg-[var(--accent)]/10 dark:bg-[var(--accent)]/15 text-zinc-900 dark:text-zinc-100 shadow-xs'
                        : dark
                        ? 'border-zinc-800/80 bg-zinc-900/40 text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
                        : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                    }`}
                  >
                    <IconComp className={`w-4 h-4 shrink-0 mt-0.5 ${isSelected ? 'text-[var(--accent)]' : 'text-zinc-400'}`} />
                    <div className="space-y-0.5 min-w-0">
                      <div className="text-xs font-semibold truncate leading-tight">{topic.title}</div>
                      <div className="flex items-center gap-1.5">
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono border ${topic.levelColor}`}>
                          {topic.level}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Topic Detail Reader */}
          <div className="md:col-span-8 lg:col-span-9 space-y-6">
            {activeTopic && (
              <div
                className={`p-6 sm:p-8 border rounded-xl shadow-sm space-y-6 ${
                  dark ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-200 bg-white'
                }`}
              >
                {/* Topic Header */}
                <div className="space-y-2 border-b pb-5 border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-mono border font-semibold ${activeTopic.levelColor}`}>
                      Level: {activeTopic.level}
                    </span>
                    <span className="text-xs text-zinc-400 font-mono">ID: #{activeTopic.id}</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                    {activeTopic.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-medium">
                    {activeTopic.subtitle}
                  </p>
                </div>

                {/* Concept Overview Summary Box */}
                <div className={`p-4 rounded-lg border text-xs leading-relaxed ${
                  dark ? 'bg-zinc-950/80 border-zinc-800 text-zinc-300' : 'bg-zinc-50 border-zinc-200 text-zinc-800'
                }`}>
                  <strong className="text-zinc-900 dark:text-zinc-100 font-semibold block mb-1">Concept Summary:</strong>
                  {activeTopic.summary}
                </div>

                {/* Core Specifications / Details List */}
                <div className="space-y-3">
                  <h3 className="text-xs font-mono uppercase font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[var(--accent)]" />
                    <span>Technical Breakdown &amp; Specifications</span>
                  </h3>
                  <ul className="space-y-2">
                    {activeTopic.details.map((detail, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Code / Configuration Snippet */}
                {activeTopic.codeExample && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-mono uppercase font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                      <Code className="w-4 h-4 text-[var(--accent)]" />
                      <span>Code &amp; Configuration Example</span>
                    </h3>
                    {activeTopic.codeExample.caption && (
                      <p className="text-xs text-zinc-500 italic">{activeTopic.codeExample.caption}</p>
                    )}
                    <CodeBlock code={activeTopic.codeExample.code} language={activeTopic.codeExample.language} />
                  </div>
                )}

                {/* Industry Production Context Callout */}
                {activeTopic.industryContext && (
                  <div className="p-4 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200 text-xs space-y-1">
                    <div className="font-bold flex items-center gap-2 text-amber-800 dark:text-amber-300">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>Real-World Industry Production Standard</span>
                    </div>
                    <p className="leading-relaxed opacity-95">{activeTopic.industryContext}</p>
                  </div>
                )}

                {/* Quick Next Action Footer */}
                <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <span className="text-zinc-500">Need live assistance configuring your schedule?</span>
                  <Link
                    to="/dashboard/schedules/new"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md btn-accent font-semibold shadow-xs transition-all w-fit"
                  >
                    <span>Configure in Schedule Builder</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
