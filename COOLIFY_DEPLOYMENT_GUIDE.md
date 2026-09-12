# Deployment Guide: Coolify Instance (Oracle Server)

> **Coolify URL**: `https://coolify.kachakaran.tech`  
> **Target Project**: `https://coolify.kachakaran.tech/projects`  
> **GitHub Repository**: `https://github.com/kachakaran6/cron.git` (Branch: `main`)

---

## Deployment Methods Overview

Coolify supports two seamless ways to deploy this project without requiring browser automation:
1. **Method A: Coolify Dashboard UI (Docker Compose Resource)**
2. **Method B: Coolify REST API (Automated Command Line)**

---

## Method A: Coolify Dashboard UI Setup (Recommended)

### Step 1: Create a New Project Resource
1. Open `https://coolify.kachakaran.tech/projects`.
2. Click **+ Add Project** or select an existing Project & Environment.
3. Click **+ Add Resource**.
4. Select **Docker Compose** (or **Public Repository**).

### Step 2: Configure Repository & Build Pack
* **Repository URL**: `https://github.com/kachakaran6/cron.git`
* **Branch**: `main`
* **Compose File Location**: `./docker-compose.coolify.yml` (or `./docker-compose.yml`)

### Step 3: Configure Environment Variables
Inside the Coolify Environment Variables tab for your service, set the following:

```env
POSTGRES_USER=cron_user
POSTGRES_PASSWORD=super_secure_postgres_pass_2026
POSTGRES_DB=cron_saas
REDIS_PASSWORD=super_secure_redis_pass_2026
BETTER_AUTH_SECRET=b5e8f498c39d8461719c8fba5a4c9c1b72e90c8831ef09c0d123456789abcdef
FRONTEND_URL=https://cron.kachakaran.tech
```

### Step 4: Domains & Ports Routing
Coolify will automatically map domains to the HTTP containers:
* **Web Dashboard**: Map to domain `cron.kachakaran.tech` → Container port `8080` (or `80`).
* **NestJS REST API**: Map to domain `api.cron.kachakaran.tech` → Container port `4000`.

### Step 5: Click Deploy
Click **Deploy**. Coolify will pull `https://github.com/kachakaran6/cron.git`, build the multi-stage Docker images (`api`, `scheduler`, `worker`, `web`), start PostgreSQL and Redis, and issue SSL certificates via Let's Encrypt automatically!

---

## Method B: Coolify REST API Automated Deployment

If you have generated an API Token in Coolify (`Keys & Tokens` -> `API Tokens`), you can deploy directly from your terminal using `cURL`:

### 1. Set Coolify Credentials
```bash
export COOLIFY_URL="https://coolify.kachakaran.tech/api/v1"
export COOLIFY_TOKEN="your_coolify_api_token_here"
```

### 2. Trigger Deployment webhook / endpoint
```bash
curl -X POST "$COOLIFY_URL/deploy" \
  -H "Authorization: Bearer $COOLIFY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "repository": "https://github.com/kachakaran6/cron",
    "branch": "main",
    "composeFile": "docker-compose.coolify.yml"
  }'
```

---

## Service Architecture Running on Oracle VPS

```
┌─────────────────────────────────────────────────────────────┐
│                      Oracle VPS Host                        │
│                   Coolify Reverse Proxy                     │
│               (Automatic SSL / TLS Routing)                 │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               ▼                              ▼
      https://cron...              https://api.cron...
    ┌──────────────────┐           ┌──────────────────┐
    │     cron_web     │           │     cron_api     │
    │   (React SPA)    │           │ (NestJS REST/DB) │
    └──────────────────┘           └────────┬─────────┘
                                            │
               ┌────────────────────────────┼────────────────────────────┐
               ▼                            ▼                            ▼
      ┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐
      │  cron_scheduler  │         │   cron_worker    │         │  cron_postgres   │
      │   (Tick Poller)  │         │ (HTTP Execution) │         │ (DB Data Store)  │
      └──────────────────┘         └──────────────────┘         └──────────────────┘
```

---
*Generated for Coolify Oracle VPS deployment.*
