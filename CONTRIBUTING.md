# Contributing to Samast Cron

Thank you for your interest in contributing to **Samast Cron**! We welcome contributions from developers of all skill levels to help build a reliable, high-performance scheduled job infrastructure.

---

## 🚀 Quick Start for Development

1. **Fork & Clone the Repository**:
   ```bash
   git clone https://github.com/kachakaran6/cron.git
   cd cron
   ```

2. **Install Dependencies**:
   ```bash
   pnpm install
   ```

3. **Set Up Local Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

4. **Start Infrastructure Services**:
   ```bash
   docker compose up -d postgres redis
   ```

5. **Run DB Migrations**:
   ```bash
   pnpm --filter @cron-saas/database db:push
   ```

6. **Start All Apps in Development Mode**:
   ```bash
   pnpm dev
   ```

---

## 🛠️ Code Architecture

* `apps/api`: NestJS REST & OpenAPI / Swagger backend (`http://localhost:4000/api/docs`).
* `apps/web`: React + Vite + Tailwind + TanStack Query frontend (`http://localhost:5173`).
* `apps/scheduler`: Next-run cron calculator & BullMQ job producer.
* `apps/worker`: Stateless HTTP execution workers with anti-SSRF protection.
* `packages/database`: PostgreSQL schema & migrations via Drizzle ORM.
* `packages/shared`: Shared TypeScript types, Zod validation schemas, and utilities.

---

## 📝 Commit Standards

We enforce **Conventional Commits**:
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation updates
- `chore:` Tooling & maintenance updates
- `refactor:` Code refactoring without behavioral changes

Example:
```bash
git commit -m "feat(auth): add OAuth 2.0 provider integration"
```

---

## 🛡️ Security Guidelines

* **Never commit secrets, API keys, or private tokens.**
* Use environment variables (`process.env`) for all sensitive credentials.
* Test code before submitting Pull Requests:
  ```bash
  pnpm --filter @cron-saas/api build
  pnpm --filter @cron-saas/web build
  ```

---

## 📄 License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
