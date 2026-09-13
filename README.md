# ⚡ Samast Cron — Open-Source Scheduled HTTP Request Infrastructure

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build & Deployment](https://img.shields.io/badge/Production-Live-emerald.svg)](https://cron.samast.pro)
[![Code style](https://img.shields.io/badge/Code%20Style-Prettier-ff69b4.svg)](https://prettier.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg)](https://www.typescriptlang.org/)

**Samast Cron** is a high-reliability, distributed HTTP job scheduling & execution engine inspired by `cron-job.org`. Engineered for millisecond-accurate webhook dispatches, background task execution, and real-time execution monitoring.

---

## ✨ Features

- ⏱️ **Millisecond-Accurate Cron Scheduler**: Evaluates complex cron expressions (`* * * * *`, `@every 5m`, etc.) with timezone support.
- 🔒 **Anti-SSRF Protection Perimeter**: Built-in DNS resolution validator blocking private CIDRs (`127.0.0.1`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), loopback, and Cloud Metadata IPs.
- ⚡ **Stateless Worker Pool**: High-concurrency workers powered by BullMQ & Redis with automated retries and latency tracking.
- 📊 **Developer Admin Console**: Real-time system telemetry, Node memory health, 12h request throughput charts, HTTP status distribution, and log file streams.
- 🔐 **OAuth 2.0 & API Key Security**: Native Google and GitHub OAuth 2.0 authentication + bearer JWT & `X-API-Key` authentication.
- 🌐 **Public Status Pages**: Customizable public status monitors and uptime pages.
- 🔔 **Multi-Channel Alerts**: Webhook, Email, Slack, and Discord incident notifications.

---

## 🏗️ Architecture Overview

```
                        ┌───────────────────────────────┐
                        │   React + Vite SPA Dashboard   │
                        │    (https://cron.samast.pro)   │
                        └───────────────┬───────────────┘
                                        │ REST / OpenAPI
                                        ▼
                        ┌───────────────────────────────┐
                        │   NestJS REST API Gateway     │
                        │    (OpenAPI / Swagger Docs)   │
                        └───────────────┬───────────────┘
                                        │
                 ┌──────────────────────┴──────────────────────┐
                 ▼                                             ▼
       ┌──────────────────┐                           ┌──────────────────┐
       │   PostgreSQL     │                           │   Redis Cache    │
       │  (Drizzle ORM)   │                           │  & BullMQ Queues │
       └──────────────────┘                           └────────┬─────────┘
                                                               │
                                                               ▼
                                                      ┌──────────────────┐
                                                      │ HTTP Workers     │
                                                      │ (Anti-SSRF Guard)│
                                                      └──────────────────┘
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js `v20+`
- `pnpm` `v9+`
- Docker & Docker Compose

### Step 1: Clone & Install Dependencies
```bash
git clone https://github.com/kachakaran6/cron.git
cd cron
pnpm install
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### Step 3: Start Services with Docker
```bash
# Start PostgreSQL & Redis
docker compose up -d postgres redis

# Run database migrations
pnpm --filter @cron-saas/database db:push

# Start development servers
pnpm dev
```

- **Frontend Dashboard**: `http://localhost:5173`
- **Backend API & Swagger Docs**: `http://localhost:4000/api/docs`

---

## 🔑 Environment Variables Reference

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `PORT` | API Server Port | `4000` |
| `DATABASE_URL` | PostgreSQL Connection String | `postgresql://cron_user:pass@localhost:5432/cron_saas` |
| `REDIS_HOST` | Redis Server Host | `localhost` |
| `REDIS_PORT` | Redis Server Port | `6379` |
| `JWT_SECRET` | Secret key for JWT signing | `your-secret-key` |
| `GOOGLE_CLIENT_ID` | Google OAuth 2.0 Client ID | `your-google-client-id.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth 2.0 Client Secret | `your-google-client-secret` |
| `GITHUB_CLIENT_ID` | GitHub OAuth 2.0 Client ID | `your-github-client-id` |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth 2.0 Client Secret | `your-github-client-secret` |

---

## 🚢 Docker & Coolify Deployment

Deploy to any Linux server or Coolify instance using Docker Compose:

```bash
docker compose -f docker-compose.coolify.yml up -d --build
```

Detailed deployment runbooks and reverse-proxy setup instructions are documented in [COOLIFY_DEPLOYMENT_GUIDE.md](COOLIFY_DEPLOYMENT_GUIDE.md).

---

## 🤝 Contributing

Contributions are welcome! Please read our [CONTRIBUTING.md](CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) before submitting Pull Requests.

---

## 📄 License

Distributed under the MIT License. See [LICENSE](LICENSE) for details.
