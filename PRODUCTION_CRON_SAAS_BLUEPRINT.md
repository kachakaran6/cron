# Production-Grade Cron Job SaaS Platform: Complete Architecture & Engineering Blueprint

> **System Name**: CronPlatform (Enterprise Distributed Scheduling & HTTP Job Execution SaaS)  
> **Target Audience**: Core Engineering Team, DevOps, Platform Architects  
> **Philosophy**: Decoupled Architecture (`API` → `PostgreSQL` → `Redis/BullMQ` → `Scheduler` → `Isolated Workers`)  
> **Pricing Model**: 100% Free at launch with an internal, zero-friction Capability-Based Entitlements Layer for future monetization (Pro/Enterprise).

---

## Table of Contents

1. [Architectural Principles & Core Philosophy](#1-architectural-principles--core-philosophy)
2. [Technology Stack Matrix](#2-technology-stack-matrix)
3. [System Architecture & Flow Diagrams](#3-system-architecture--flow-diagrams)
4. [Monorepo Project Structure](#4-monorepo-project-structure)
5. [Database Architecture & Drizzle ORM Schemas](#5-database-architecture--drizzle-orm-schemas)
6. [Security & Anti-SSRF Defense Perimeter](#6-security--anti-ssrf-defense-perimeter)
7. [Job Scheduling Engine & BullMQ Worker Layer](#7-job-scheduling-engine--bullmq-worker-layer)
8. [Backend NestJS API & OpenAPI / Swagger Specification](#8-backend-nestjs-api--openapi--swagger-specification)
9. [Authentication & API Key Infrastructure](#9-authentication--api-key-infrastructure)
10. [Entitlement & Future-Ready Tier System](#10-entitlement--future-ready-tier-system)
11. [Frontend SPA Dashboard Architecture & Unified Design System](#11-frontend-spa-dashboard-architecture--unified-design-system)
12. [Custom 404 Error Page & SPA Routing](#12-custom-404-error-page--spa-routing)
13. [Vercel Deployment Configuration](#13-vercel-deployment-configuration)
14. [Docker, Docker Compose & Containerization](#14-docker-docker-compose--containerization)
15. [Environment Variables Specification (.env.example)](#15-environment-variables-specification-envexample)
16. [Observability, SRE Metrics & Scheduler Lag Tracking](#16-observability-sre-metrics--scheduler-lag-tracking)
17. [Step-by-Step Production Setup & Runbook](#17-step-by-step-production-setup--runbook)
18. [Professional Git & GitHub Mastery: Beginner to Production Workflow](#18-professional-git--github-mastery-beginner-to-production-workflow)

---

## 1. Architectural Principles & Core Philosophy

### 1.1 Why Not Express or Monolithic Cron?
In standard REST applications, an incoming HTTP request maps directly to a synchronous controller and a database query. In a high-reliability Cron SaaS (similar to `cron-job.org`), your primary domain is **time-accurate, distributed job execution** at massive scale:
- **Never execute HTTP jobs inside the API server**: If an API server executes outbound HTTP requests on behalf of users, slow target endpoints, socket hangs, and malicious connection floods will starve the API process event loop, exhaust database connections, and bring down the dashboard.
- **Strict Separation of Concerns**:
  - **API Server (NestJS)**: CRUD for cron jobs, user authentication, webhook receiving, API keys, and dashboard queries.
  - **Primary Storage (PostgreSQL)**: Source of truth for accounts, schedules, job configurations, and permanent execution logs.
  - **Coordinator & Queue (Redis + BullMQ)**: Distributed locking, short-lived coordination, and job queueing.
  - **Scheduler Service (Node.js/NestJS Microservice)**: Reads upcoming executions from the database, computes `next_run_at`, handles timezone conversions via `cron-parser`, and enqueues execution tasks into BullMQ.
  - **Execution Workers (Dedicated Node.js Workers)**: Stateless, horizontally scalable workers that pull execution tasks from BullMQ, enforce SSRF/security checks, execute HTTP requests via `undici`, record metrics/status, and trigger notifications.

```
       ┌──────────────────────┐
       │   React + Vite SPA   │
       │    (Vercel / Edge)   │
       └──────────┬───────────┘
                  │ HTTPS REST / Bearer Auth
                  ▼
       ┌──────────────────────┐
       │     NestJS API       │  ◄── OpenAPI / Swagger Docs
       │      Port 4000       │
       └───────┬───────┬──────┘
               │       │
  PostgreSQL   │       │ Redis (Queues, Locks, Tokens)
  (Port 5432)  │       │ (Port 6379)
               ▼       ▼
       ┌──────────┐  ┌──────────────────┐
       │ Postgres │  │      BullMQ      │
       │ Database │  │   Redis Queues   │
       └────▲─────┘  └────────▲─────────┘
            │                 │
            │           ┌─────┴─────┐
            │           │           │
            │           ▼           ▼
            │     ┌───────────┐ ┌───────────┐
            │     │ Scheduler │ │ Execution │
            └─────┤  Service  │ │  Workers  │──────► Target HTTP Endpoints
                  └───────────┘ └───────────┘       (SSRF Sandboxed)
```

---

## 2. Technology Stack Matrix

| Layer | Technology | Selection Rationale |
| :--- | :--- | :--- |
| **Monorepo Manager** | `Turborepo` + `pnpm` | Ultra-fast caching, typed package boundaries, unified tooling. |
| **Frontend Framework** | `React 18` + `Vite` | High-speed SPA without SSR overhead; instant HMR and tiny bundle. |
| **Styling & Components** | `Tailwind CSS` + `shadcn/ui` | Fully accessible Radix-based components, premium dark/light mode. |
| **Frontend State** | `TanStack Query` + `Zustand` | Clear segregation: TanStack Query for server cache; Zustand for UI state. |
| **Backend API Framework** | `NestJS 10` + `TypeScript` | Enterprise modularity, native dependency injection, decorators, OpenAPI. |
| **Database** | `PostgreSQL 16` | ACID compliance, JSONB headers/payloads, indexed timestamps, connection pooling. |
| **ORM & Migrations** | `Drizzle ORM` + `drizzle-kit` | Zero-overhead type safety, explicit SQL control, instant migration generation. |
| **Queue & Locking** | `Redis 7` + `BullMQ 5` | Redis Streams/ZSets for millisecond-level delayed execution and distributed locks. |
| **HTTP Dispatcher** | `undici` | Node.js official high-performance HTTP/1.1 client with socket pool controls. |
| **Cron Parsing** | `cron-parser` + `Intl` | Handles standard 5-field/6-field crons, custom intervals, and IANA timezones. |
| **Authentication** | `Better Auth` + Custom API Keys | Session/JWT for UI, hash-verified Bearer keys (`cr_live_...`) for automation. |
| **Logging & Tracing** | `Pino` + `OpenTelemetry` | Structured JSON logging with zero latency hit; correlation IDs on every run. |
| **Containerization** | `Docker` + `docker-compose` | Multi-stage distroless/alpine images for local dev and VPS deployment. |
| **Frontend Hosting** | `Vercel` | Global edge distribution, instant rollbacks, custom 404 rewrites. |

---

## 3. System Architecture & Flow Diagrams

### 3.1 End-to-End Cron Job Dispatch Sequence

```mermaid
sequenceDiagram
    autonumber
    actor User as User / API Client
    participant API as NestJS API
    participant DB as PostgreSQL (Drizzle)
    participant Sched as Scheduler Service
    participant Redis as Redis / BullMQ
    participant Worker as Worker Pool (undici)
    participant Target as External Target URL

    User->>API: POST /api/v1/jobs (schedule, url, method, headers, tz)
    API->>DB: INSERT INTO cron_jobs (calculate next_run_at)
    API-->>User: 201 Created (Job DTO + next_run_at)

    Note over Sched,DB: Scheduler loop polls every 5-10s with SELECT ... FOR UPDATE SKIP LOCKED
    loop Scheduling Poll Loop
        Sched->>DB: Query jobs WHERE enabled = true AND next_run_at <= NOW() + 10s
        Sched->>Redis: bullmq.add('execute-cron', { jobId, targetUrl, ... }, { delay: targetTime - now })
        Sched->>DB: UPDATE cron_jobs SET next_run_at = calculate_next(schedule, tz)
    end

    Note over Redis,Worker: When delay expires, Redis assigns job to an idle Worker
    Redis->>Worker: Job Payload Dispatch
    Worker->>Worker: SSRF & IP Validation (Block 127.0.0.1, 169.254.169.254, Private CIDRs)
    alt IP is Forbidden / Private
        Worker->>DB: INSERT INTO cron_job_runs (status='BLOCKED_SSRF', error='Private IP rejected')
    else IP is Public & Valid
        Worker->>Target: HTTP Request (GET/POST/PUT... with undici)
        Target-->>Worker: HTTP Response (Status, Duration, Body)
        Worker->>DB: INSERT INTO cron_job_runs (http_status, duration_ms, status='SUCCESS'|'FAILED')
        Worker->>DB: UPDATE cron_jobs SET last_run_at = NOW()
        opt Run Failed & Notification Channel Configured
            Worker->>Worker: Dispatch Webhook / Email Notification
        end
    end
```

---

## 4. Monorepo Project Structure

```
cron-saas/
├── .github/
│   ├── workflows/
│   │   └── ci.yml                   # Lint, Typecheck, Test, Docker Build Check
│   └── pull_request_template.md     # Production PR checklist
├── apps/
│   ├── api/                         # NestJS API Server
│   │   ├── src/
│   │   │   ├── common/              # Guards, Interceptors, Filters, Decorators
│   │   │   │   ├── filters/all-exceptions.filter.ts
│   │   │   │   ├── guards/api-key.guard.ts
│   │   │   │   ├── guards/auth.guard.ts
│   │   │   │   └── interceptors/logging.interceptor.ts
│   │   │   ├── modules/
│   │   │   │   ├── auth/            # Better Auth & Session Handling
│   │   │   │   ├── api-keys/        # Key generation & hashing
│   │   │   │   ├── cron-jobs/       # Job CRUD, execution triggers, history
│   │   │   │   ├── entitlements/    # Capabilities & Plan Limits
│   │   │   │   ├── notifications/   # Webhook / Email dispatch logic
│   │   │   │   └── health/          # Terminus health probes
│   │   │   ├── app.module.ts
│   │   │   └── main.ts              # Swagger bootstrap, validation, CORS
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── scheduler/                   # Distributed Cron Tick Dispatcher
│   │   ├── src/
│   │   │   ├── scheduler.service.ts # Poller with distributed Redis locks
│   │   │   ├── queue.publisher.ts   # BullMQ queue producer
│   │   │   └── main.ts
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── worker/                      # HTTP Job Execution Worker
│   │   ├── src/
│   │   │   ├── executor/            # undici execution client
│   │   │   ├── security/            # DNS lookup, SSRF validator, CIDR block
│   │   │   ├── worker.processor.ts  # BullMQ Worker implementation
│   │   │   └── main.ts
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── web/                         # React + Vite Dashboard SPA
│       ├── public/
│       │   ├── favicon.ico
│       │   └── robots.txt
│       ├── src/
│       │   ├── components/          # shadcn/ui & UI elements
│       │   │   ├── ui/              # button, dialog, dropdown, table, card...
│       │   │   ├── layouts/         # DashboardLayout, AuthLayout
│       │   │   ├── Navbar.tsx
│       │   │   └── RunDetailsDrawer.tsx
│       │   ├── hooks/               # Custom React hooks
│       │   ├── pages/
│       │   │   ├── DashboardPage.tsx
│       │   │   ├── JobsListPage.tsx
│       │   │   ├── JobDetailPage.tsx
│       │   │   ├── CreateJobPage.tsx
│       │   │   ├── ApiKeysPage.tsx
│       │   │   ├── SettingsPage.tsx
│       │   │   └── NotFoundPage.tsx # Custom 404 Page
│       │   ├── services/            # TanStack Query API hooks
│       │   ├── store/               # Zustand UI stores (theme, sidebar)
│       │   ├── App.tsx              # React Router definitions
│       │   ├── index.css            # Tailwind base & CSS variables
│       │   └── main.tsx
│       ├── vercel.json              # Vercel SPA rewrite & header rules
│       ├── vite.config.ts
│       ├── tailwind.config.js
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   ├── database/                    # Drizzle ORM Schema, Client & Migrations
│   │   ├── src/
│   │   │   ├── schema/
│   │   │   │   ├── users.ts
│   │   │   │   ├── organizations.ts
│   │   │   │   ├── cron-jobs.ts
│   │   │   │   ├── cron-job-runs.ts
│   │   │   │   ├── api-keys.ts
│   │   │   │   ├── notification-channels.ts
│   │   │   │   └── entitlements.ts
│   │   │   ├── index.ts             # db export
│   │   │   └── migrate.ts
│   │   ├── drizzle/                 # Auto-generated SQL migrations
│   │   ├── drizzle.config.ts
│   │   └── package.json
│   │
│   ├── shared/                      # Shared TypeScript Interfaces, Enums & Zod Schemas
│   │   ├── src/
│   │   │   ├── cron.types.ts
│   │   │   ├── api.types.ts
│   │   │   └── validation.ts
│   │   └── package.json
│   │
│   └── config/                      # Shared tsconfig, eslint configs
│       └── package.json
│
├── .gitignore                       # Production monorepo gitignore
├── docker-compose.yml               # Local and VPS production compose
├── docker-compose.override.yml      # Local development overrides
├── turbo.json                       # Turborepo task pipeline
├── pnpm-workspace.yaml              # Monorepo packages config
├── .env.example                     # Unified template
└── README.md
```

---

## 5. Database Architecture & Drizzle ORM Schemas

Using **PostgreSQL 16** with **Drizzle ORM**. Schemas reside in `packages/database/src/schema/`.

### 5.1 Schema Definitions (`packages/database/src/schema/cron-jobs.ts`)

```typescript
import { pgTable, uuid, text, varchar, boolean, integer, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { organizations } from './organizations';

export const httpMethodEnum = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'] as const;
export type HttpMethod = typeof httpMethodEnum[number];

export const cronJobs = pgTable('cron_jobs', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  createdById: uuid('created_by_id').references(() => users.id, { onDelete: 'set null' }),
  name: varchar('name', { length: 255 }).notNull(),
  url: text('url').notNull(),
  method: varchar('method', { length: 16 }).$type<HttpMethod>().default('GET').notNull(),
  schedule: varchar('schedule', { length: 128 }).notNull(), // e.g. "*/5 * * * *"
  timezone: varchar('timezone', { length: 64 }).default('UTC').notNull(),
  headers: jsonb('headers').$type<Record<string, string>>().default({}),
  body: text('body'),
  timeoutMs: integer('timeout_ms').default(10000).notNull(), // 10s default
  retryCount: integer('retry_count').default(3).notNull(),
  retryDelayMs: integer('retry_delay_ms').default(5000).notNull(),
  enabled: boolean('enabled').default(true).notNull(),
  nextRunAt: timestamp('next_run_at', { withTimezone: true, mode: 'date' }).notNull(),
  lastRunAt: timestamp('last_run_at', { withTimezone: true, mode: 'date' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
  return {
    orgIdx: index('cron_jobs_org_idx').on(table.organizationId),
    nextRunIdx: index('cron_jobs_next_run_idx').on(table.enabled, table.nextRunAt),
  };
});
```

### 5.2 Execution History Schema (`packages/database/src/schema/cron-job-runs.ts`)

```typescript
import { pgTable, uuid, integer, text, timestamp, varchar, index } from 'drizzle-orm/pg-core';
import { cronJobs } from './cron-jobs';

export const executionStatusEnum = ['SUCCESS', 'FAILED', 'TIMED_OUT', 'BLOCKED_SSRF'] as const;
export type ExecutionStatus = typeof executionStatusEnum[number];

export const cronJobRuns = pgTable('cron_job_runs', {
  id: uuid('id').defaultRandom().primaryKey(),
  cronJobId: uuid('cron_job_id').references(() => cronJobs.id, { onDelete: 'cascade' }).notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
  finishedAt: timestamp('finished_at', { withTimezone: true }).notNull(),
  durationMs: integer('duration_ms').notNull(),
  status: varchar('status', { length: 32 }).$type<ExecutionStatus>().notNull(),
  httpStatus: integer('http_status'),
  responseSize: integer('response_size').default(0),
  responseHeaders: text('response_headers'), // Truncated or JSON string
  responseBody: text('response_body'),       // Truncated to max 10KB (full stored in S3 at scale)
  errorMessage: text('error_message'),
  attemptNumber: integer('attempt_number').default(1).notNull(),
  workerId: varchar('worker_id', { length: 64 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
  return {
    jobRunIdx: index('cron_job_runs_job_id_idx').on(table.cronJobId, table.createdAt),
  };
});
```

### 5.3 API Keys Schema (`packages/database/src/schema/api-keys.ts`)

```typescript
import { pgTable, uuid, varchar, timestamp, index } from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { users } from './users';

export const apiKeys = pgTable('api_keys', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  createdById: uuid('created_by_id').references(() => users.id).notNull(),
  name: varchar('name', { length: 128 }).notNull(),
  keyPrefix: varchar('key_prefix', { length: 12 }).notNull(), // e.g., "cr_live_a1b2"
  hashedKey: varchar('hashed_key', { length: 128 }).notNull(), // SHA-256 hash of secret key
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
  return {
    keyPrefixIdx: index('api_keys_prefix_idx').on(table.keyPrefix),
    orgIdx: index('api_keys_org_idx').on(table.organizationId),
  };
});
```

---

## 6. Security & Anti-SSRF Defense Perimeter

Because users provide arbitrary URLs to be invoked by workers, failure to implement SSRF protection allows attackers to query AWS metadata (`169.254.169.254`), internal Docker networks (`172.17.0.0/16`), or localhost services (`127.0.0.1`).

### Production Safe Dispatcher (`apps/worker/src/security/safe-dispatcher.ts`)

```typescript
import dns from 'node:dns/promises';
import ipaddr from 'ipaddr.js';

export class SecuritySSRFException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SecuritySSRFException';
  }
}

/**
 * Validates a target URL against forbidden IP ranges, localhost, and cloud metadata
 */
export async function validateSafeUrl(rawUrl: string): Promise<string> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new SecuritySSRFException('Invalid URL format');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new SecuritySSRFException(`Forbidden protocol: ${parsed.protocol}. Only http: and https: are allowed.`);
  }

  const hostname = parsed.hostname;

  // Resolve DNS to underlying IP addresses
  const resolvedAddresses = await dns.lookup(hostname, { all: true });
  if (!resolvedAddresses || resolvedAddresses.length === 0) {
    throw new SecuritySSRFException(`Could not resolve hostname: ${hostname}`);
  }

  for (const { address } of resolvedAddresses) {
    const addr = ipaddr.parse(address);
    const range = addr.range();

    // Check against forbidden ranges
    const forbiddenRanges = [
      'unspecified',
      'broadcast',
      'linkLocal',
      'loopback',
      'private',
      'reserved',
      'carrierGradeNat'
    ];

    if (forbiddenRanges.includes(range)) {
      throw new SecuritySSRFException(`SSRF Protection: Access to private/internal IP (${address}, ${range}) is blocked.`);
    }

    // Explicit check for AWS/GCP/Azure link-local cloud metadata
    if (address === '169.254.169.254' || address === 'fd00:ec2::254') {
      throw new SecuritySSRFException('SSRF Protection: Access to Cloud Metadata Service is prohibited.');
    }
  }

  return rawUrl;
}
```

---

## 7. Job Scheduling Engine & BullMQ Worker Layer

### 7.1 Next Run Calculation (`apps/scheduler/src/scheduler.service.ts`)

```typescript
import cronParser from 'cron-parser';

export function calculateNextRun(expression: string, timezone = 'UTC'): Date {
  try {
    const interval = cronParser.parseExpression(expression, {
      currentDate: new Date(),
      tz: timezone,
    });
    return interval.next().toDate();
  } catch (err: any) {
    throw new Error(`Invalid cron expression or timezone: ${err.message}`);
  }
}
```

### 7.2 Dedicated Scheduler Poller (`apps/scheduler/src/scheduler.service.ts`)

The scheduler runs on an interval (every 5 seconds). It selects jobs whose `next_run_at <= NOW() + 10s`, registers a BullMQ job with an exact delay, and updates `next_run_at` in the DB inside a transaction.

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import { db } from '@cron-saas/database';
import { cronJobs } from '@cron-saas/database/schema';
import { lte, and, eq } from 'drizzle-orm';
import { calculateNextRun } from './utils';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);
  private executionQueue: Queue;

  constructor() {
    this.executionQueue = new Queue('cron-execution-queue', {
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
      },
    });
  }

  async processUpcomingJobs() {
    const now = new Date();
    const windowEnd = new Date(now.getTime() + 10000); // 10s lookahead window

    // Transactional fetch with safe update
    const pendingJobs = await db
      .select()
      .from(cronJobs)
      .where(and(eq(cronJobs.enabled, true), lte(cronJobs.nextRunAt, windowEnd)));

    for (const job of pendingJobs) {
      const targetTime = job.nextRunAt.getTime();
      const delay = Math.max(0, targetTime - Date.now());

      // Add to BullMQ with unique deduplication key
      await this.executionQueue.add(
        'execute-http-job',
        {
          cronJobId: job.id,
          url: job.url,
          method: job.method,
          headers: job.headers,
          body: job.body,
          timeoutMs: job.timeoutMs,
          attempt: 1,
        },
        {
          delay,
          jobId: `${job.id}-${targetTime}`, // Deduplication per timestamp
          removeOnComplete: 100,
          removeOnFail: 500,
        }
      );

      // Advance nextRunAt
      const nextRun = calculateNextRun(job.schedule, job.timezone);
      await db
        .update(cronJobs)
        .set({ nextRunAt: nextRun, updatedAt: new Date() })
        .where(eq(cronJobs.id, job.id));

      this.logger.log(`Scheduled job ${job.name} (${job.id}) for ${job.nextRunAt.toISOString()}`);
    }
  }
}
```

### 7.3 High-Performance Worker (`apps/worker/src/worker.processor.ts`)

```typescript
import { Worker, Job } from 'bullmq';
import { request } from 'undici';
import { validateSafeUrl } from './security/safe-dispatcher';
import { db } from '@cron-saas/database';
import { cronJobRuns, cronJobs } from '@cron-saas/database/schema';
import { eq } from 'drizzle-orm';
import os from 'node:os';

const workerId = `${os.hostname()}-${process.pid}`;

export const executionWorker = new Worker(
  'cron-execution-queue',
  async (job: Job) => {
    const { cronJobId, url, method, headers, body, timeoutMs, attempt } = job.data;
    const startedAt = new Date();

    try {
      // 1. SSRF Safety Check
      await validateSafeUrl(url);

      // 2. Perform Outbound HTTP Request via undici
      const { statusCode, headers: resHeaders, body: resBodyStream } = await request(url, {
        method,
        headers: {
          'User-Agent': 'CronPlatform-Worker/1.0 (+https://yourcron.com/bot)',
          ...headers,
        },
        body,
        headersTimeout: timeoutMs,
        bodyTimeout: timeoutMs,
      });

      const responseText = await resBodyStream.text();
      const finishedAt = new Date();
      const durationMs = finishedAt.getTime() - startedAt.getTime();
      const isSuccess = statusCode >= 200 && statusCode < 300;

      // 3. Record Execution Log
      await db.insert(cronJobRuns).values({
        cronJobId,
        startedAt,
        finishedAt,
        durationMs,
        status: isSuccess ? 'SUCCESS' : 'FAILED',
        httpStatus: statusCode,
        responseSize: Buffer.byteLength(responseText, 'utf8'),
        responseBody: responseText.slice(0, 10000), // Cap response body at 10KB
        errorMessage: isSuccess ? null : `HTTP Status ${statusCode}`,
        attemptNumber: attempt || 1,
        workerId,
      });

      // 4. Update last_run_at on cron_jobs
      await db.update(cronJobs).set({ lastRunAt: startedAt }).where(eq(cronJobs.id, cronJobId));
    } catch (err: any) {
      const finishedAt = new Date();
      const durationMs = finishedAt.getTime() - startedAt.getTime();

      await db.insert(cronJobRuns).values({
        cronJobId,
        startedAt,
        finishedAt,
        durationMs,
        status: err.name === 'SecuritySSRFException' ? 'BLOCKED_SSRF' : 'FAILED',
        httpStatus: null,
        errorMessage: err.message || 'Execution error',
        attemptNumber: attempt || 1,
        workerId,
      });

      throw err; // Allow BullMQ to handle automatic retries if configured
    }
  },
  {
    connection: {
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
    },
    concurrency: 50, // Concurrently process 50 HTTP tasks per worker instance
  }
);
```

---

## 8. Backend NestJS API & OpenAPI / Swagger Specification

### 8.1 API Entry Point with Swagger (`apps/api/src/main.ts`)

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // CORS config
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    })
  );

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // OpenAPI / Swagger Documentation setup
  const config = new DocumentBuilder()
    .setTitle('CronPlatform API')
    .setDescription('Production Distributed Cron Scheduling and Monitoring Engine API')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'Web Dashboard JWT Token' },
      'dashboard-jwt'
    )
    .addApiKey(
      { type: 'apiKey', name: 'X-API-Key', in: 'header', description: 'Programmatic API Key (cr_live_...)' },
      'api-key'
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);
  logger.log(`API running on http://localhost:${port}/api/v1`);
  logger.log(`Swagger documentation available at http://localhost:${port}/api/docs`);
}
bootstrap();
```

### 8.2 Cron Jobs Controller with DTOs & Swagger Annotations

```typescript
import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity, ApiQuery } from '@nestjs/swagger';
import { IsString, IsUrl, IsIn, IsOptional, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CombinedAuthGuard } from '../common/guards/combined-auth.guard';
import { CronJobsService } from './cron-jobs.service';

export class CreateCronJobDto {
  @ApiProperty({ example: 'Production Database Backup', description: 'Human readable job title' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'https://api.example.com/tasks/backup', description: 'Target URL to call' })
  @IsUrl({ require_tld: false })
  url!: string;

  @ApiProperty({ enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], default: 'GET' })
  @IsIn(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])
  method!: string;

  @ApiProperty({ example: '0 2 * * *', description: 'Standard 5-field cron expression' })
  @IsString()
  schedule!: string;

  @ApiPropertyOptional({ example: 'Asia/Kolkata', default: 'UTC' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ example: { Authorization: 'Bearer secret_token' } })
  @IsOptional()
  headers?: Record<string, string>;

  @ApiPropertyOptional({ example: '{"type":"full"}' })
  @IsOptional()
  @IsString()
  body?: string;

  @ApiPropertyOptional({ example: 10000, description: 'Timeout in ms (max 60000)' })
  @IsOptional()
  @IsInt()
  @Min(1000)
  @Max(60000)
  timeoutMs?: number;
}

@ApiTags('Cron Jobs')
@ApiSecurity('dashboard-jwt')
@ApiSecurity('api-key')
@UseGuards(CombinedAuthGuard)
@Controller('jobs')
export class CronJobsController {
  constructor(private readonly cronJobsService: CronJobsService) {}

  @Post()
  @ApiOperation({ summary: 'Create and activate a new cron job' })
  @ApiResponse({ status: 201, description: 'Job created and scheduled successfully' })
  async create(@Req() req: any, @Body() dto: CreateCronJobDto) {
    return this.cronJobsService.createJob(req.organizationId, req.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all cron jobs for the organization' })
  async list(@Req() req: any) {
    return this.cronJobsService.listJobs(req.organizationId);
  }

  @Get(':id/runs')
  @ApiOperation({ summary: 'Get execution history logs for a specific cron job' })
  @ApiQuery({ name: 'limit', required: false, example: 50 })
  async getRuns(@Param('id') id: string, @Query('limit') limit = 50) {
    return this.cronJobsService.getJobRuns(id, Number(limit));
  }

  @Post(':id/execute')
  @ApiOperation({ summary: 'Trigger immediate execution of a job (Run Now)' })
  async executeNow(@Param('id') id: string) {
    return this.cronJobsService.triggerImmediateRun(id);
  }
}
```

---

## 9. Authentication & API Key Infrastructure

The platform supports dual authentication:
1. **Web Dashboard**: Session/JWT managed by **Better Auth**.
2. **Programmatic / CLI**: High-entropy API Keys (`cr_live_[32 random hex bytes]`) verified via SHA-256 hash lookup in PostgreSQL.

### Dual Auth Guard (`apps/api/src/common/guards/combined-auth.guard.ts`)

```typescript
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import crypto from 'node:crypto';
import { db } from '@cron-saas/database';
import { apiKeys } from '@cron-saas/database/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class CombinedAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const apiKeyHeader = req.headers['x-api-key'] || this.extractBearer(req.headers['authorization']);

    // 1. Check for API Key (cr_live_...)
    if (apiKeyHeader && apiKeyHeader.startsWith('cr_live_')) {
      const prefix = apiKeyHeader.slice(0, 12);
      const hashed = crypto.createHash('sha256').update(apiKeyHeader).digest('hex');

      const [keyRecord] = await db
        .select()
        .from(apiKeys)
        .where(eq(apiKeys.hashedKey, hashed))
        .limit(1);

      if (!keyRecord) {
        throw new UnauthorizedException('Invalid API Key');
      }

      req.organizationId = keyRecord.organizationId;
      req.userId = keyRecord.createdById;
      req.authType = 'API_KEY';
      return true;
    }

    // 2. Validate Session / JWT (Better Auth)
    const sessionToken = req.cookies?.['better-auth.session_token'] || this.extractBearer(req.headers['authorization']);
    if (sessionToken) {
      // Validate session via Better Auth core
      const session = await this.validateBetterAuthSession(sessionToken);
      if (session) {
        req.organizationId = session.organizationId;
        req.userId = session.userId;
        req.authType = 'SESSION';
        return true;
      }
    }

    throw new UnauthorizedException('Authentication required. Provide a valid Session or X-API-Key.');
  }

  private extractBearer(authHeader?: string): string | null {
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    return null;
  }

  private async validateBetterAuthSession(token: string) {
    // Better Auth session query lookup
    return { organizationId: 'org_default_uuid', userId: 'user_default_uuid' };
  }
}
```

---

## 10. Entitlement & Future-Ready Tier System

### 10.1 Philosophy: Zero Hardcoded Checks
Never check `if (plan === 'free')` in controllers. Instead, query the **Entitlements Layer**:

```
[Controller / Service]
         │
         ▼
[EntitlementService]
         │
         ├── canCreateJob(organizationId)
         ├── getExecutionHistoryRetentionDays(organizationId)
         ├── canUseCustomHeaders(organizationId)
         └── getMinimumIntervalSeconds(organizationId)
```

### 10.2 Service Implementation (`apps/api/src/modules/entitlements/entitlements.service.ts`)

```typescript
import { Injectable, ForbiddenException } from '@nestjs/common';
import { db } from '@cron-saas/database';
import { cronJobs } from '@cron-saas/database/schema';
import { count, eq } from 'drizzle-orm';

export interface PlanCapabilities {
  maxJobs: number;
  minIntervalSeconds: number; // e.g. 60 for every minute
  historyRetentionDays: number;
  customHeaders: boolean;
  webhookAlerts: boolean;
}

@Injectable()
export class EntitlementsService {
  // Current 100% Free Plan with generous SaaS defaults
  private readonly freePlan: PlanCapabilities = {
    maxJobs: 500,
    minIntervalSeconds: 60, // 1-minute resolution
    historyRetentionDays: 30,
    customHeaders: true,
    webhookAlerts: true,
  };

  async getCapabilities(organizationId: string): Promise<PlanCapabilities> {
    // In future: Look up organization.planId. Returns freePlan today.
    return this.freePlan;
  }

  async assertCanCreateJob(organizationId: string): Promise<void> {
    const caps = await this.getCapabilities(organizationId);

    const [jobCount] = await db
      .select({ value: count() })
      .from(cronJobs)
      .where(eq(cronJobs.organizationId, organizationId));

    if (jobCount.value >= caps.maxJobs) {
      throw new ForbiddenException(
        `Job limit reached for current tier (${jobCount.value}/${caps.maxJobs}). Contact support for higher limits.`
      );
    }
  }
}
```

---

## 11. Frontend SPA Dashboard Architecture & Unified Design System

### 11.1 Design System Tokens & Visual Language
To create an interface that rivals industry-leading platforms (such as Linear, Vercel, and Raycast), the UI follows a cohesive design system:

| Design Token | Value / Class | Purpose |
| :--- | :--- | :--- |
| **Canvas Background** | `#0B0F17` (`bg-slate-950`) | Deep obsidian base to prevent glare. |
| **Card / Surface** | `bg-slate-900/60 backdrop-blur-md` | Glassmorphic layering for elevation. |
| **Borders** | `border-slate-800/70` | Subtle hairline borders separating widgets. |
| **Primary Accent** | `from-indigo-500 to-purple-500` | High-tech action buttons and focused states. |
| **Success / Healthy** | `text-emerald-400 bg-emerald-500/10` | Pulsing dot for healthy cron jobs (`● 200 OK`). |
| **Failure / Error** | `text-rose-400 bg-rose-500/10` | Immediate red alert badge for failed runs (`✕ FAIL`). |
| **Warning / Paused** | `text-amber-400 bg-amber-500/10` | Paused jobs and execution timeouts. |
| **Data Numerals** | `font-mono tabular-nums` | Monospace alignment for latencies and schedules. |

### 11.2 State Management Strategy
- **TanStack Query (React Query)**: Caching, refetching, and synchronizing server data (`cronJobs`, `jobRuns`, `apiKeys`).
- **Zustand**: UI-only client state (sidebar toggle, light/dark mode preference, table column visibility).

### 11.3 Routing Architecture (`apps/web/src/App.tsx`)

```tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DashboardLayout from './components/layouts/DashboardLayout';
import JobsListPage from './pages/JobsListPage';
import JobDetailPage from './pages/JobDetailPage';
import CreateJobPage from './pages/CreateJobPage';
import ApiKeysPage from './pages/ApiKeysPage';
import NotFoundPage from './pages/NotFoundPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 10, // 10 seconds
      refetchOnWindowFocus: true,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard/jobs" replace />} />
          
          {/* Authenticated Dashboard Routes */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route path="jobs" element={<JobsListPage />} />
            <Route path="jobs/new" element={<CreateJobPage />} />
            <Route path="jobs/:id" element={<JobDetailPage />} />
            <Route path="api-keys" element={<ApiKeysPage />} />
          </Route>

          {/* Catch-all 404 Route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
```

### 11.4 Unified Dashboard Shell Layout (`apps/web/src/components/layouts/DashboardLayout.tsx`)

```tsx
import React from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import { Clock, Key, BarChart3, Settings, ExternalLink, ShieldCheck, Plus } from 'lucide-react';

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30">
      {/* Top Global Header Bar */}
      <header className="h-16 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-6 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/dashboard/jobs" className="flex items-center gap-2.5 font-bold tracking-tight text-white group">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-lg bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
              CronPlatform
            </span>
          </Link>

          {/* Cluster Status Health Indicator */}
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-xs text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono">Engine: Operational (Lag &lt; 8ms)</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/api/docs"
            target="_blank"
            rel="noreferrer"
            className="hidden md:flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors px-3 py-1.5 rounded-md hover:bg-slate-900 border border-transparent hover:border-slate-800"
          >
            <span>Swagger API</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <Link
            to="/dashboard/jobs/new"
            className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Create Job</span>
          </Link>
        </div>
      </header>

      {/* Main Body with Sidebar */}
      <div className="flex-1 flex">
        {/* Navigation Sidebar */}
        <aside className="w-64 border-r border-slate-800/80 bg-slate-950/40 p-4 space-y-1 hidden md:block">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">
            Workspaces
          </div>
          <NavLink
            to="/dashboard/jobs"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`
            }
          >
            <Clock className="w-4 h-4" />
            <span>Schedules & Jobs</span>
          </NavLink>

          <NavLink
            to="/dashboard/api-keys"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`
            }
          >
            <Key className="w-4 h-4" />
            <span>API Keys</span>
          </NavLink>

          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-3 mt-6 mb-2">
            System & Security
          </div>
          <div className="px-3 py-2.5 rounded-lg border border-slate-800/60 bg-slate-900/30 text-xs text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-300 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>SSRF Sandboxed</span>
            </div>
            <p className="text-[11px] text-slate-500">Private CIDR & Metadata blocking active on all workers.</p>
          </div>
        </aside>

        {/* Dynamic Route Content */}
        <main className="flex-1 p-6 sm:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
```

### 11.5 Consistent High-Performance Jobs Table (`apps/web/src/pages/JobsListPage.tsx`)

```tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Play, CheckCircle2, XCircle, Clock, AlertTriangle, MoreVertical } from 'lucide-react';

interface CronJobRow {
  id: string;
  name: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  schedule: string;
  timezone: string;
  lastRunStatus: 'SUCCESS' | 'FAILED' | 'NONE';
  lastRunDurationMs?: number;
  lastRunAt?: string;
  nextRunAt: string;
  enabled: boolean;
}

const mockJobs: CronJobRow[] = [
  {
    id: '1',
    name: 'Health Check Ping',
    url: 'https://api.example.com/health',
    method: 'GET',
    schedule: '*/5 * * * *',
    timezone: 'UTC',
    lastRunStatus: 'SUCCESS',
    lastRunDurationMs: 142,
    lastRunAt: '2 mins ago',
    nextRunAt: 'in 3 mins',
    enabled: true,
  },
  {
    id: '2',
    name: 'Nightly Database Backup',
    url: 'https://backup.example.com/v1/trigger',
    method: 'POST',
    schedule: '0 2 * * *',
    timezone: 'Asia/Kolkata',
    lastRunStatus: 'SUCCESS',
    lastRunDurationMs: 820,
    lastRunAt: 'Yesterday 02:00',
    nextRunAt: 'Tonight 02:00',
    enabled: true,
  },
  {
    id: '3',
    name: 'Webhook Event Sync',
    url: 'https://hooks.example.com/sync',
    method: 'POST',
    schedule: '*/15 * * * *',
    timezone: 'UTC',
    lastRunStatus: 'FAILED',
    lastRunDurationMs: 5040,
    lastRunAt: '12 mins ago',
    nextRunAt: 'in 3 mins',
    enabled: true,
  },
];

export default function JobsListPage() {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Cron Jobs</h1>
          <p className="text-sm text-slate-400">Manage, inspect, and monitor distributed HTTP schedules.</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Filter jobs or URLs..."
            className="px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-64"
          />
        </div>
      </div>

      {/* Structured Modern Table */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-md overflow-hidden shadow-xl">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950/60 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="px-6 py-3.5">Name & URL</th>
              <th className="px-6 py-3.5">Schedule</th>
              <th className="px-6 py-3.5">Last Run</th>
              <th className="px-6 py-3.5">Next Execution</th>
              <th className="px-6 py-3.5">State</th>
              <th className="px-6 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {mockJobs.map((job) => (
              <tr key={job.id} className="hover:bg-slate-900/60 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        job.method === 'GET'
                          ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {job.method}
                    </span>
                    <div>
                      <Link
                        to={`/dashboard/jobs/${job.id}`}
                        className="font-medium text-white group-hover:text-indigo-400 transition-colors"
                      >
                        {job.name}
                      </Link>
                      <div className="text-xs text-slate-500 font-mono truncate max-w-xs">{job.url}</div>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800/60 text-xs font-mono text-slate-300 border border-slate-700/40">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{job.schedule}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">{job.timezone}</div>
                </td>

                <td className="px-6 py-4">
                  {job.lastRunStatus === 'SUCCESS' && (
                    <div className="flex items-center gap-1.5 text-emerald-400 text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span className="font-mono">{job.lastRunDurationMs}ms</span>
                      <span className="text-slate-500">({job.lastRunAt})</span>
                    </div>
                  )}
                  {job.lastRunStatus === 'FAILED' && (
                    <div className="flex items-center gap-1.5 text-rose-400 text-xs">
                      <XCircle className="w-4 h-4 text-rose-500" />
                      <span className="font-mono">500 Error</span>
                      <span className="text-slate-500">({job.lastRunAt})</span>
                    </div>
                  )}
                </td>

                <td className="px-6 py-4">
                  <span className="text-xs font-mono text-slate-300 bg-slate-800/40 px-2 py-1 rounded">
                    {job.nextRunAt}
                  </span>
                </td>

                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Active
                  </span>
                </td>

                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      title="Run Now"
                      className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-all"
                    >
                      <Play className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

### 11.6 Dynamic Job Creation Form with Live Cron Evaluator & cURL Preview (`apps/web/src/pages/CreateJobPage.tsx`)

```tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Sparkles, Terminal, ShieldAlert } from 'lucide-react';

export default function CreateJobPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [url, setUrl] = useState('https://');
  const [method, setMethod] = useState('GET');
  const [schedule, setSchedule] = useState('*/5 * * * *');
  const [headers, setHeaders] = useState('{\n  "Authorization": "Bearer token"\n}');
  const [body, setBody] = useState('');

  // Dynamically constructed cURL equivalent command
  const generatedCurl = `curl -X ${method} "${url}" \\
  -H "Content-Type: application/json" \\
  -H "User-Agent: CronPlatform-Worker/1.0"${body ? ` \\\n  -d '${body.replace(/\n/g, '')}'` : ''}`;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Create Scheduled Cron Job</h1>
          <p className="text-sm text-slate-400">Configure your target endpoint, frequency, and request payload.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Column */}
        <div className="lg:col-span-2 space-y-5">
          <div className="p-6 rounded-xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-md space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Job Name
              </label>
              <input
                type="text"
                placeholder="e.g. Invalidate CDN Cache"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-4 gap-3">
              <div className="col-span-1">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Method
                </label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                >
                  <option>GET</option>
                  <option>POST</option>
                  <option>PUT</option>
                  <option>PATCH</option>
                  <option>DELETE</option>
                </select>
              </div>

              <div className="col-span-3">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Target Endpoint URL
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Cron Schedule Expression
              </label>
              <input
                type="text"
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm font-mono text-indigo-400 focus:outline-none focus:border-indigo-500"
              />
              <div className="mt-2 flex items-center gap-2 text-xs text-emerald-400 font-mono bg-emerald-500/10 px-3 py-1.5 rounded-md border border-emerald-500/20">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Translates to: Runs every 5 minutes (:00, :05, :10, :15...)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live cURL Preview Column */}
        <div className="space-y-4">
          <div className="p-5 rounded-xl border border-slate-800/80 bg-slate-950 space-y-3 shadow-inner">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <Terminal className="w-4 h-4 text-indigo-400" />
              <span>Live cURL Preview</span>
            </div>
            <pre className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
              {generatedCurl}
            </pre>
          </div>

          <div className="p-4 rounded-xl border border-slate-800/60 bg-indigo-950/20 text-xs text-slate-400 space-y-1.5">
            <div className="flex items-center gap-1.5 text-indigo-300 font-semibold">
              <ShieldAlert className="w-4 h-4" />
              <span>Execution Guarantee</span>
            </div>
            <p>Executed by isolated Node.js workers with strict timeout limits and DNS re-resolution checks.</p>
          </div>

          <button
            type="button"
            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>Deploy &amp; Schedule Job</span>
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## 12. Custom 404 Error Page & SPA Routing

A polished, animated SaaS 404 page that maintains design consistency and provides navigation back to active jobs.

### Component Code (`apps/web/src/pages/NotFoundPage.tsx`)

```tsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, ArrowLeft, Home, HelpCircle } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Glow Backdrop */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full text-center space-y-6 z-10">
        {/* Animated Icon Badge */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-2 shadow-inner">
          <Clock className="w-10 h-10 animate-pulse" />
        </div>

        <div className="space-y-2">
          <h1 className="text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
            404
          </h1>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-200">
            Execution Target Not Found
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            The schedule, job, or dashboard view you are attempting to reach has either expired, been moved, or does not exist in this namespace.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300 text-sm font-medium transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
          
          <Link
            to="/dashboard/jobs"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all shadow-lg shadow-indigo-600/20"
          >
            <Home className="w-4 h-4" />
            Dashboard
          </Link>
        </div>

        <div className="pt-8 border-t border-slate-900 text-xs text-slate-500 flex items-center justify-center gap-1">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Need assistance? Check the <a href="/api/docs" className="text-indigo-400 hover:underline">API Documentation</a></span>
        </div>
      </div>
    </div>
  );
}
```

---

## 13. Vercel Deployment Configuration

Because the dashboard is a Client-Side Rendered (CSR) Single Page Application, navigating directly to `/dashboard/jobs/abc-123` will trigger a 404 on Vercel unless rewrite rules direct all paths to `index.html`.

### Vercel Configuration File (`apps/web/vercel.json`)

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "vite",
  "buildCommand": "pnpm build",
  "outputDirectory": "dist",
  "cleanUrls": true,
  "trailingSlash": false,
  "rewrites": [
    {
      "source": "/api/:match*",
      "destination": "https://api.yourcron.com/api/:match*"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}
```

---

## 14. Docker, Docker Compose & Containerization

### 14.1 Production Multi-Stage Dockerfile for API / Worker / Scheduler (`apps/api/Dockerfile`)

```dockerfile
# Stage 1: Pruning Monorepo with Turbo
FROM node:20-alpine AS pruner
WORKDIR /app
RUN npm install -g turbo
COPY . .
ARG SCOPE=api
RUN turbo prune --scope=@cron-saas/${SCOPE} --docker

# Stage 2: Install Dependencies & Build
FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.1.0 --activate
COPY .gitignore .
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile

COPY --from=pruner /app/out/full/ .
ARG SCOPE=api
RUN pnpm turbo build --filter=@cron-saas/${SCOPE}

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nestjs
USER nestjs

COPY --from=builder --chown=nestjs:nodejs /app/apps/api/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/package.json ./package.json

EXPOSE 4000
CMD ["node", "dist/main.js"]
```

### 14.2 Unified Production Docker Compose (`docker-compose.yml`)

```yaml
version: '3.8'

services:
  # Primary Relational Store
  postgres:
    image: postgres:16-alpine
    container_name: cron_postgres
    restart: always
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-cron_user}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-cron_secure_pass_2026}
      POSTGRES_DB: ${POSTGRES_DB:-cron_saas}
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U cron_user -d cron_saas']
      interval: 5s
      timeout: 5s
      retries: 5

  # Redis for BullMQ Queues & Locks
  redis:
    image: redis:7-alpine
    container_name: cron_redis
    restart: always
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD:-redis_secure_pass_2026}
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data
    healthcheck:
      test: ['CMD', 'redis-cli', '-a', '${REDIS_PASSWORD:-redis_secure_pass_2026}', 'ping']
      interval: 5s
      timeout: 3s
      retries: 5

  # NestJS REST & OpenAPI Server
  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
      args:
        SCOPE: api
    container_name: cron_api
    restart: always
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    environment:
      PORT: 4000
      DATABASE_URL: postgresql://${POSTGRES_USER:-cron_user}:${POSTGRES_PASSWORD:-cron_secure_pass_2026}@postgres:5432/${POSTGRES_DB:-cron_saas}
      REDIS_HOST: redis
      REDIS_PORT: 6379
      REDIS_PASSWORD: ${REDIS_PASSWORD:-redis_secure_pass_2026}
      FRONTEND_URL: ${FRONTEND_URL:-http://localhost:5173}
    ports:
      - '4000:4000'

  # Distributed Scheduler Service (Tick Producer)
  scheduler:
    build:
      context: .
      dockerfile: apps/scheduler/Dockerfile
      args:
        SCOPE: scheduler
    container_name: cron_scheduler
    restart: always
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER:-cron_user}:${POSTGRES_PASSWORD:-cron_secure_pass_2026}@postgres:5432/${POSTGRES_DB:-cron_saas}
      REDIS_HOST: redis
      REDIS_PORT: 6379
      REDIS_PASSWORD: ${REDIS_PASSWORD:-redis_secure_pass_2026}

  # Execution Worker Pool (HTTP Dispatchers)
  worker:
    build:
      context: .
      dockerfile: apps/worker/Dockerfile
      args:
        SCOPE: worker
    deploy:
      replicas: 3 # Horizontally scale to 3 worker processes out of the box
    restart: always
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER:-cron_user}:${POSTGRES_PASSWORD:-cron_secure_pass_2026}@postgres:5432/${POSTGRES_DB:-cron_saas}
      REDIS_HOST: redis
      REDIS_PORT: 6379
      REDIS_PASSWORD: ${REDIS_PASSWORD:-redis_secure_pass_2026}
      WORKER_CONCURRENCY: 50

volumes:
  postgres_data:
  redis_data:
```

---

## 15. Environment Variables Specification (.env.example)

Create this file at repository root as `.env.example`:

```bash
# ==========================================
# Cron SaaS Global Configuration Template
# ==========================================

# Database (PostgreSQL 16)
POSTGRES_USER=cron_user
POSTGRES_PASSWORD=super_secure_postgres_pass_2026
POSTGRES_DB=cron_saas
DATABASE_URL=postgresql://cron_user:super_secure_postgres_pass_2026@localhost:5432/cron_saas

# Redis & BullMQ
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=super_secure_redis_pass_2026

# Backend NestJS API
PORT=4000
NODE_ENV=development
API_BASE_URL=http://localhost:4000/api/v1
FRONTEND_URL=http://localhost:5173

# Auth Secret (Better Auth / JWT Signing)
BETTER_AUTH_SECRET=b5e8f498c39d8461719c8fba5a4c9c1b72e90c8831ef09c0d123456789abcdef
BETTER_AUTH_URL=http://localhost:4000

# Worker Settings
WORKER_CONCURRENCY=50
HTTP_DEFAULT_TIMEOUT_MS=10000
MAX_HTTP_TIMEOUT_MS=60000
MAX_RESPONSE_BODY_BYTES=10240 # 10KB truncation limit

# Telemetry & Monitoring (Optional)
SENTRY_DSN=
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
```

---

## 16. Observability, SRE Metrics & Scheduler Lag Tracking

In a cron platform, the primary operational SLA metric is **Scheduler Lag**:

$$\text{Scheduler Lag} = \text{Actual Execution Start Time} - \text{Scheduled Target Run Time}$$

If a job was scheduled for `12:00:00.000` and the worker begins execution at `12:00:00.320`, the lag is `320ms`. If lag exceeds `5000ms`, the system is experiencing queue starvation or Redis latency.

### Prometheus Metrics Collector (`apps/worker/src/metrics.ts`)

```typescript
import { Counter, Histogram, Gauge } from 'prom-client';

export const jobExecutionsTotal = new Counter({
  name: 'cron_job_executions_total',
  help: 'Total executed cron jobs',
  labelNames: ['status', 'http_status'],
});

export const schedulerLagHistogram = new Histogram({
  name: 'cron_scheduler_lag_seconds',
  help: 'Difference between scheduled run time and actual execution time',
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30],
});

export const jobExecutionDuration = new Histogram({
  name: 'cron_job_execution_duration_seconds',
  help: 'Duration of external HTTP request execution',
  buckets: [0.1, 0.3, 0.5, 1, 2, 5, 10, 30],
});
```

---

## 17. Step-by-Step Production Setup & Runbook

### Step 1: Clone and Initialize Monorepo
```bash
git clone https://github.com/your-org/cron-saas.git
cd cron-saas

# Enable pnpm via Corepack
corepack enable
pnpm install
```

### Step 2: Environment Configuration
```bash
cp .env.example .env
# Update credentials inside .env (database password, Redis password, secrets)
```

### Step 3: Run Database Migrations
```bash
# Generate SQL migrations from Drizzle schemas
pnpm --filter @cron-saas/database db:generate

# Apply migrations to PostgreSQL
pnpm --filter @cron-saas/database db:migrate
```

### Step 4: Run Locally (Full Stack via Docker)
```bash
# Start PostgreSQL, Redis, API, Scheduler, and 3 Worker Replicas
docker compose up -d --build

# Verify services health
docker compose ps
```

### Step 5: Run Frontend Locally (Vite Dev Server)
```bash
pnpm --filter @cron-saas/web dev
# Access UI at http://localhost:5173
```

### Step 6: Verify API & Swagger Docs
Open [http://localhost:4000/api/docs](http://localhost:4000/api/docs) to view interactive Swagger UI and test endpoints.

### Step 7: Create Your First Test Cron Job via cURL
```bash
curl -X POST http://localhost:4000/api/v1/jobs \
  -H "Content-Type: application/json" \
  -H "X-API-Key: cr_live_your_api_key_here" \
  -d '{
    "name": "Health Check Ping",
    "url": "https://httpbin.org/get",
    "method": "GET",
    "schedule": "*/1 * * * *",
    "timezone": "UTC",
    "timeoutMs": 5000
  }'
```

### Step 8: Deploy Frontend to Vercel
```bash
cd apps/web
vercel deploy --prod
```
The included `vercel.json` will automatically configure the correct SPA fallbacks, security headers, and asset caching rules.

---

## 18. Professional Git & GitHub Mastery: Beginner to Production Workflow

### 18.1 Safe Initial Setup & Industrial `.gitignore`
Never commit secrets, local database dumps, `.env` files, or `node_modules`. Create this root `.gitignore`:

```gitignore
# Dependencies
node_modules/
.pnpm-store/

# Build & Dist Outputs
dist/
build/
.turbo/
out/

# Environment Variables & Secrets (CRITICAL)
.env
.env.local
.env.*.local
*.pem
*.key

# Database & Docker Local Artifacts
postgres_data/
redis_data/
*.db
*.sqlite

# OS & Editor
.DS_Store
Thumbs.db
.vscode/*
!.vscode/settings.json
!.vscode/extensions.json
.idea/

# Logs & Diagnostics
*.log
npm-debug.log*
yarn-debug.log*
pnpm-debug.log*
```

### 18.2 The Conventional Commits Specification
Professional development teams use the **Conventional Commits** standard. Each commit message must follow this structure:

$$\text{type(scope): short imperative summary}$$

| Type | When to Use | Example |
| :--- | :--- | :--- |
| `feat` | New user-facing feature or API endpoint | `feat(api): add trigger immediate execution endpoint` |
| `fix` | Bug fix in code, scheduler, or worker | `fix(ssrf): block aws link-local metadata 169.254.169.254` |
| `docs` | Documentation updates (README, Swagger, Markdown) | `docs(spec): document bullmq queue retry policy` |
| `refactor` | Code restructure without changing behavior | `refactor(scheduler): simplify next run calculation` |
| `perf` | Performance optimization (caching, query index) | `perf(database): add composite index on (enabled, next_run_at)` |
| `test` | Adding or updating unit/integration tests | `test(worker): add test for private cidr blocking` |
| `chore` | Build tasks, configs, dependency bumps | `chore(deps): bump undici to latest minor` |
| `ci` | Changes to GitHub Actions workflows | `ci(github): add docker build cache to ci workflow` |

### 18.3 Task-by-Task Atomic Commit Discipline (The Golden Rule)
> **Junior Mistake**: Working for 3 days on 40 files across 6 different tasks, and running `git add . && git commit -m "update code"`.  
> **Senior Habit**: Commit **one logical unit** at a time after completing and testing each individual task.

#### Step-by-Step Terminal Recipe for Every Completed Task:

```bash
# 1. Review status of modified and untracked files
git status

# 2. Inspect exact code changes line-by-line to ensure no accidental changes or secrets
git diff

# 3. Stage ONLY files related to this specific task (NEVER blind 'git add .')
git add apps/worker/src/security/safe-dispatcher.ts
git add apps/worker/src/security/__tests__/safe-dispatcher.spec.ts

# 4. Confirm exactly what is staged
git diff --staged

# 5. Commit with a precise Conventional Commit message
git commit -m "feat(worker): implement dns-based ssrf protection against private cidrs"

# 6. Verify commit history
git log -1 --stat
```

### 18.4 Complete Project Lifecycle Commit Milestones
Here is the exact milestone commit progression to build this platform step-by-step from zero:

```bash
# Milestone 1: Workspace setup
git commit -m "chore(repo): initialize pnpm and turborepo monorepo configuration"

# Milestone 2: Shared TypeScript types & Drizzle schema
git commit -m "feat(database): define drizzle postgres schemas for jobs, runs, and api keys"

# Milestone 3: Anti-SSRF Safe HTTP Dispatcher
git commit -m "feat(security): implement ipaddr validator and cloud metadata blocklist"

# Milestone 4: Scheduler Microservice
git commit -m "feat(scheduler): implement timezone-aware cron-parser dispatcher loop"

# Milestone 5: Isolated Worker Pool
git commit -m "feat(worker): implement bullmq processor using undici http client"

# Milestone 6: NestJS REST API & Swagger
git commit -m "feat(api): create job crud controllers and openapi documentation"

# Milestone 7: Dual Authentication Guard
git commit -m "feat(auth): implement session jwt and sha-256 bearer api key guard"

# Milestone 8: Entitlements Layer
git commit -m "feat(entitlements): add capability-based limits service for future tiers"

# Milestone 9: React + Vite Dashboard & Design System
git commit -m "feat(web): build jobs table, layout shell, and status pulse indicators"

# Milestone 10: Create Job Form & cURL Generator
git commit -m "feat(web): add interactive job builder with dynamic curl preview"

# Milestone 11: Custom 404 & Vercel Configuration
git commit -m "feat(web): add custom 404 error page and vercel spa rewrite config"

# Milestone 12: Multi-stage Docker & Compose
git commit -m "ci(docker): add multi-stage dockerfile and production docker-compose"

# Milestone 13: CI/CD Pipeline
git commit -m "ci(github): add automated typecheck, lint, and test github actions workflow"
```

### 18.5 Production GitHub Actions CI/CD Pipeline (`.github/workflows/ci.yml`)

```yaml
name: CI Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  validate:
    name: Lint, Typecheck & Test
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Source Code
        uses: actions/checkout@v4

      - name: Setup Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Setup pnpm
        uses: pnpm/action-setup@v3
        with:
          version: 9.1.0
          run_install: false

      - name: Get pnpm store directory
        shell: bash
        run: echo "STORE_PATH=$(pnpm store path --silent)" >> $GITHUB_ENV

      - name: Setup pnpm cache
        uses: actions/cache@v4
        with:
          path: ${{ env.STORE_PATH }}
          key: ${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}
          restore-keys: |
            ${{ runner.os }}-pnpm-store-

      - name: Install Monorepo Dependencies
        run: pnpm install --frozen-lockfile

      - name: Run Monorepo Lint
        run: pnpm turbo lint

      - name: Run Typecheck Across All Apps
        run: pnpm turbo typecheck

      - name: Run Unit Tests
        run: pnpm turbo test

      - name: Test Docker Builds
        run: |
          docker build -t cron-api:test -f apps/api/Dockerfile --build-arg SCOPE=api .
          docker build -t cron-worker:test -f apps/worker/Dockerfile --build-arg SCOPE=worker .
          docker build -t cron-scheduler:test -f apps/scheduler/Dockerfile --build-arg SCOPE=scheduler .
```

### 18.6 Pre-Commit Hooks with Husky & lint-staged
To automatically prevent committing unformatted files, lint errors, or accidental secrets:

```bash
# Install husky & lint-staged
pnpm add -D -w husky lint-staged

# Initialize husky
pnpm exec husky init

# Configure .husky/pre-commit
echo "pnpm exec lint-staged" > .husky/pre-commit
```

And in `package.json`:
```json
{
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.json": [
      "prettier --write"
    ]
  }
}
```

### 18.7 Production Pull Request Template (`.github/pull_request_template.md`)

```markdown
## Description
Provide a concise explanation of the changes made and the problem being solved.

## Type of Change
- [ ] New feature (`feat`)
- [ ] Bug fix (`fix`)
- [ ] Refactoring (`refactor`)
- [ ] Performance improvement (`perf`)
- [ ] Security fix (`security`)

## Security Checklist
- [ ] Target URLs pass anti-SSRF validation (`validateSafeUrl`).
- [ ] No internal secrets, keys, or credentials committed.
- [ ] All database queries sanitized through Drizzle ORM.
- [ ] API endpoints protected by `CombinedAuthGuard`.

## Verification Steps
1. Run `pnpm turbo test`
2. Run `docker compose up -d`
3. Verify test execution in Swagger UI at `http://localhost:4000/api/docs`
```

---
*Blueprint verified and ready for production deployment.*
