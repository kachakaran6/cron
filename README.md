# Production Cron Job SaaS Platform

> A high-reliability, distributed scheduling & HTTP job execution platform inspired by cron-job.org.
> Engineered with **React + Vite**, **NestJS**, **PostgreSQL (Drizzle ORM)**, and **Redis/BullMQ** with isolated execution workers.

---

## 📖 Master Documentation

The complete architectural guide, code templates, security guidelines, and runbooks are available in:
👉 **[PRODUCTION_CRON_SAAS_BLUEPRINT.md](file:///d:/Cron/PRODUCTION_CRON_SAAS_BLUEPRINT.md)**

### Highlights of the Master Specification:
1. **Core Philosophy & Architectural Decisions**:
   - Why not Express? (Domain-heavy modular NestJS structure vs raw minimal Express).
   - Why not execute HTTP requests in the API server? (Worker isolation with `undici` + BullMQ).
   - Why React + Vite instead of Next.js? (Pure authenticated SPA dashboard with TanStack Query and zero SSR overhead).
2. **Turborepo Monorepo Layout**:
   - `apps/api`: NestJS REST & OpenAPI / Swagger backend.
   - `apps/scheduler`: Next-run calculator and BullMQ task producer.
   - `apps/worker`: Stateless HTTP execution workers with anti-SSRF protection.
   - `apps/web`: React + Vite + Tailwind + shadcn/ui dashboard.
   - `packages/database`: PostgreSQL schema & migrations via Drizzle ORM.
   - `packages/shared`: Shared types, Zod schemas, and cron utilities.
3. **Database Schemas (Drizzle ORM)**:
   - `cron_jobs`, `cron_job_runs`, `api_keys`, `organizations`, `users`, `entitlements`.
4. **Security & Anti-SSRF Defense Perimeter**:
   - Node.js DNS resolution validator blocking private CIDRs (`127.0.0.1`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), loopback, and Cloud Metadata (`169.254.169.254`).
5. **Job Scheduling Engine & BullMQ Worker**:
   - `cron-parser` + timezone-aware next-run evaluation.
   - 50-concurrency worker loop with response latency tracking and log truncation.
6. **NestJS API with OpenAPI / Swagger**:
   - Global validation, CORS, bearer JWT, and `X-API-Key` guard.
   - Interactive Swagger documentation at `/api/docs`.
7. **Future-Ready Entitlement System**:
   - Zero hardcoded plan strings; clean capability-based checks (`assertCanCreateJob`).
   - 100% free at launch, immediately upgradeable to paid Stripe tiers without refactoring.
8. **Consistent Professional Frontend UI Architecture**:
   - Design System Tokens: Slate-950 obsidian background, glassmorphic cards, emerald active pulses, rose error badges.
   - Master Layout Shell (`DashboardLayout.tsx`) with real-time cluster latency heartbeat and workspace switcher.
   - Real-time Jobs Table (`JobsListPage.tsx`) with countdown timers and instant "Run Now" actions.
   - Interactive Job Creation Form (`CreateJobPage.tsx`) with live Cron expression translator and dynamic cURL preview.
   - Beautiful dark-themed custom 404 error page (`NotFoundPage.tsx`) and Vercel SPA routing (`vercel.json`).
9. **Docker & Containerization**:
   - Multi-stage production `Dockerfile`.
   - Complete `docker-compose.yml` (PostgreSQL, Redis, API, Scheduler, 3 Worker replicas).
   - `.env.example` reference.
10. **Observability & SRE Metrics**:
    - Prometheus tracking for `cron_scheduler_lag_seconds`, `cron_job_executions_total`, and `cron_job_execution_duration_seconds`.
11. **Professional Git & GitHub Mastery (Beginner to Production)**:
    - Safe monorepo `.gitignore` (blocking secrets, keys, and dumps).
    - Conventional Commits standard (`feat:`, `fix:`, `docs:`, `chore:`).
    - Task-by-task atomic commit checklist (exact commands to stage, diff, and commit per completed milestone).
    - Complete 13-step project lifecycle commit history from zero to production.
    - Automated GitHub Actions CI/CD pipeline (`.github/workflows/ci.yml`).
    - Husky + lint-staged pre-commit hooks and Pull Request template.

---

## Quick Start

```bash
# 1. Start all infrastructure and services via Docker Compose
docker compose up -d --build

# 2. View interactive API documentation (Swagger)
open http://localhost:4000/api/docs

# 3. Start the Web Dashboard
pnpm --filter @cron-saas/web dev
# Access http://localhost:5173
```
