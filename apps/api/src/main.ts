import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { client } from '@cron-saas/database';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

/**
 * Idempotent startup schema bootstrap.
 * Creates all required tables if they don't exist and adds any missing columns.
 * Safe to run on every API startup — uses CREATE TABLE IF NOT EXISTS / ADD COLUMN IF NOT EXISTS.
 * Order matters: respect FK constraints (users → organizations → cron_jobs, etc.)
 */
async function runStartupMigrations(logger: Logger) {
  try {
    // ── 1. users ─────────────────────────────────────────────────────────────
    await client`
      CREATE TABLE IF NOT EXISTS users (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email           VARCHAR(255) NOT NULL UNIQUE,
        name            VARCHAR(255),
        password_hash   VARCHAR(255),
        email_verified  BOOLEAN NOT NULL DEFAULT false,
        image           TEXT,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await client`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)`;
    await client`ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(32) NOT NULL DEFAULT 'user'`;
    await client`ALTER TABLE users ADD COLUMN IF NOT EXISTS provider VARCHAR(32) NOT NULL DEFAULT 'email'`;
    await client`ALTER TABLE users ADD COLUMN IF NOT EXISTS provider_id VARCHAR(255)`;
    await client`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false`;
    await client`ALTER TABLE users ADD COLUMN IF NOT EXISTS image TEXT`;
    await client`ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`;

    // ── 2. organizations ─────────────────────────────────────────────────────
    await client`
      CREATE TABLE IF NOT EXISTS organizations (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name        VARCHAR(255) NOT NULL,
        slug        VARCHAR(255) NOT NULL UNIQUE,
        owner_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        plan_id     VARCHAR(64) NOT NULL DEFAULT 'free',
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await client`ALTER TABLE organizations ADD COLUMN IF NOT EXISTS name VARCHAR(255)`;
    await client`ALTER TABLE organizations ADD COLUMN IF NOT EXISTS slug VARCHAR(255)`;
    await client`ALTER TABLE organizations ADD COLUMN IF NOT EXISTS owner_id UUID`;
    await client`ALTER TABLE organizations ADD COLUMN IF NOT EXISTS plan_id VARCHAR(64) NOT NULL DEFAULT 'free'`;
    await client`ALTER TABLE organizations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`;

    // ── 3. cron_jobs ─────────────────────────────────────────────────────────
    await client`
      CREATE TABLE IF NOT EXISTS cron_jobs (
        id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        created_by_id    UUID REFERENCES users(id) ON DELETE SET NULL,
        name             VARCHAR(255) NOT NULL,
        url              TEXT NOT NULL,
        method           VARCHAR(16) NOT NULL DEFAULT 'GET',
        schedule         VARCHAR(128) NOT NULL,
        timezone         VARCHAR(64) NOT NULL DEFAULT 'UTC',
        headers          JSONB NOT NULL DEFAULT '{}',
        body             TEXT,
        timeout_ms       INTEGER NOT NULL DEFAULT 10000,
        retry_count      INTEGER NOT NULL DEFAULT 3,
        retry_delay_ms   INTEGER NOT NULL DEFAULT 5000,
        enabled          BOOLEAN NOT NULL DEFAULT true,
        next_run_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_run_at      TIMESTAMPTZ,
        created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await client`ALTER TABLE cron_jobs ADD COLUMN IF NOT EXISTS organization_id UUID`;
    await client`ALTER TABLE cron_jobs ADD COLUMN IF NOT EXISTS created_by_id UUID`;
    await client`ALTER TABLE cron_jobs ADD COLUMN IF NOT EXISTS name VARCHAR(255)`;
    await client`ALTER TABLE cron_jobs ADD COLUMN IF NOT EXISTS url TEXT`;
    await client`ALTER TABLE cron_jobs ADD COLUMN IF NOT EXISTS method VARCHAR(16) NOT NULL DEFAULT 'GET'`;
    await client`ALTER TABLE cron_jobs ADD COLUMN IF NOT EXISTS schedule VARCHAR(128)`;
    await client`ALTER TABLE cron_jobs ADD COLUMN IF NOT EXISTS timezone VARCHAR(64) NOT NULL DEFAULT 'UTC'`;
    await client`ALTER TABLE cron_jobs ADD COLUMN IF NOT EXISTS headers JSONB NOT NULL DEFAULT '{}'`;
    await client`ALTER TABLE cron_jobs ADD COLUMN IF NOT EXISTS body TEXT`;
    await client`ALTER TABLE cron_jobs ADD COLUMN IF NOT EXISTS timeout_ms INTEGER NOT NULL DEFAULT 10000`;
    await client`ALTER TABLE cron_jobs ADD COLUMN IF NOT EXISTS retry_count INTEGER NOT NULL DEFAULT 3`;
    await client`ALTER TABLE cron_jobs ADD COLUMN IF NOT EXISTS retry_delay_ms INTEGER NOT NULL DEFAULT 5000`;
    await client`ALTER TABLE cron_jobs ADD COLUMN IF NOT EXISTS enabled BOOLEAN NOT NULL DEFAULT true`;
    await client`ALTER TABLE cron_jobs ADD COLUMN IF NOT EXISTS next_run_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`;
    await client`ALTER TABLE cron_jobs ADD COLUMN IF NOT EXISTS last_run_at TIMESTAMPTZ`;
    await client`ALTER TABLE cron_jobs ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`;
    await client`ALTER TABLE cron_jobs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`;
    await client`ALTER TABLE cron_jobs ADD COLUMN IF NOT EXISTS save_responses BOOLEAN NOT NULL DEFAULT true`;
    await client`ALTER TABLE cron_jobs ADD COLUMN IF NOT EXISTS redirect_success BOOLEAN NOT NULL DEFAULT true`;
    await client`ALTER TABLE cron_jobs ADD COLUMN IF NOT EXISTS auth_username VARCHAR(255)`;
    await client`ALTER TABLE cron_jobs ADD COLUMN IF NOT EXISTS auth_password VARCHAR(255)`;
    await client`ALTER TABLE cron_jobs ADD COLUMN IF NOT EXISTS notify_on_failure BOOLEAN NOT NULL DEFAULT true`;
    await client`ALTER TABLE cron_jobs ADD COLUMN IF NOT EXISTS failure_threshold INTEGER NOT NULL DEFAULT 1`;
    await client`ALTER TABLE cron_jobs ADD COLUMN IF NOT EXISTS notify_on_recovery BOOLEAN NOT NULL DEFAULT true`;
    await client`ALTER TABLE cron_jobs ADD COLUMN IF NOT EXISTS notify_on_disable BOOLEAN NOT NULL DEFAULT true`;
    await client`ALTER TABLE cron_jobs ADD COLUMN IF NOT EXISTS notify_tls_expiry BOOLEAN NOT NULL DEFAULT false`;
    await client`ALTER TABLE cron_jobs ADD COLUMN IF NOT EXISTS tls_expiry_days INTEGER NOT NULL DEFAULT 30`;
    await client`CREATE INDEX IF NOT EXISTS cron_jobs_org_idx ON cron_jobs (organization_id)`;
    await client`CREATE INDEX IF NOT EXISTS cron_jobs_next_run_idx ON cron_jobs (enabled, next_run_at)`;

    // ── 4. cron_job_runs ─────────────────────────────────────────────────────
    await client`
      CREATE TABLE IF NOT EXISTS cron_job_runs (
        id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        cron_job_id       UUID NOT NULL REFERENCES cron_jobs(id) ON DELETE CASCADE,
        started_at        TIMESTAMPTZ NOT NULL,
        finished_at       TIMESTAMPTZ NOT NULL,
        duration_ms       INTEGER NOT NULL,
        status            VARCHAR(32) NOT NULL,
        http_status       INTEGER,
        response_size     INTEGER DEFAULT 0,
        response_headers  TEXT,
        response_body     TEXT,
        error_message     TEXT,
        attempt_number    INTEGER NOT NULL DEFAULT 1,
        worker_id         VARCHAR(64) NOT NULL,
        created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await client`ALTER TABLE cron_job_runs ADD COLUMN IF NOT EXISTS cron_job_id UUID`;
    await client`ALTER TABLE cron_job_runs ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ`;
    await client`ALTER TABLE cron_job_runs ADD COLUMN IF NOT EXISTS finished_at TIMESTAMPTZ`;
    await client`ALTER TABLE cron_job_runs ADD COLUMN IF NOT EXISTS duration_ms INTEGER`;
    await client`ALTER TABLE cron_job_runs ADD COLUMN IF NOT EXISTS status VARCHAR(32)`;
    await client`ALTER TABLE cron_job_runs ADD COLUMN IF NOT EXISTS http_status INTEGER`;
    await client`ALTER TABLE cron_job_runs ADD COLUMN IF NOT EXISTS response_size INTEGER DEFAULT 0`;
    await client`ALTER TABLE cron_job_runs ADD COLUMN IF NOT EXISTS response_headers TEXT`;
    await client`ALTER TABLE cron_job_runs ADD COLUMN IF NOT EXISTS response_body TEXT`;
    await client`ALTER TABLE cron_job_runs ADD COLUMN IF NOT EXISTS error_message TEXT`;
    await client`ALTER TABLE cron_job_runs ADD COLUMN IF NOT EXISTS attempt_number INTEGER NOT NULL DEFAULT 1`;
    await client`ALTER TABLE cron_job_runs ADD COLUMN IF NOT EXISTS worker_id VARCHAR(64)`;
    await client`CREATE INDEX IF NOT EXISTS cron_job_runs_job_id_idx ON cron_job_runs (cron_job_id, created_at)`;

    // ── 5. api_keys ──────────────────────────────────────────────────────────
    await client`
      CREATE TABLE IF NOT EXISTS api_keys (
        id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        created_by_id    UUID NOT NULL REFERENCES users(id),
        name             VARCHAR(128) NOT NULL,
        key_prefix       VARCHAR(12) NOT NULL,
        hashed_key       VARCHAR(128) NOT NULL,
        last_used_at     TIMESTAMPTZ,
        expires_at       TIMESTAMPTZ,
        created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await client`ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS organization_id UUID`;
    await client`ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS created_by_id UUID`;
    await client`ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS name VARCHAR(128)`;
    await client`ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS key_prefix VARCHAR(12)`;
    await client`ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS hashed_key VARCHAR(128)`;
    await client`ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ`;
    await client`ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ`;
    await client`CREATE INDEX IF NOT EXISTS api_keys_prefix_idx ON api_keys (key_prefix)`;
    await client`CREATE INDEX IF NOT EXISTS api_keys_org_idx ON api_keys (organization_id)`;

    // ── 6. notification_channels ─────────────────────────────────────────────
    await client`
      CREATE TABLE IF NOT EXISTS notification_channels (
        id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        name             VARCHAR(128) NOT NULL,
        type             VARCHAR(32) NOT NULL,
        config           JSONB NOT NULL DEFAULT '{}',
        enabled          BOOLEAN NOT NULL DEFAULT true,
        created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    // ── 7. entitlements ──────────────────────────────────────────────────────
    await client`
      CREATE TABLE IF NOT EXISTS entitlements (
        id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
        max_jobs               INTEGER NOT NULL DEFAULT 500,
        min_interval_seconds   INTEGER NOT NULL DEFAULT 60,
        history_retention_days INTEGER NOT NULL DEFAULT 30,
        custom_headers         BOOLEAN NOT NULL DEFAULT true,
        webhook_alerts         BOOLEAN NOT NULL DEFAULT true,
        updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    // ── 8. status_pages ──────────────────────────────────────────────────────
    await client`
      CREATE TABLE IF NOT EXISTS status_pages (
        id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id    UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        title              VARCHAR(255) NOT NULL,
        slug               VARCHAR(128) NOT NULL UNIQUE,
        is_published       BOOLEAN NOT NULL DEFAULT true,
        logo_url           TEXT,
        monitored_job_ids  JSONB NOT NULL DEFAULT '[]',
        incidents          JSONB NOT NULL DEFAULT '[]',
        created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await client`ALTER TABLE status_pages ADD COLUMN IF NOT EXISTS title VARCHAR(255)`;
    await client`ALTER TABLE status_pages ADD COLUMN IF NOT EXISTS slug VARCHAR(128)`;
    await client`ALTER TABLE status_pages ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT true`;
    await client`ALTER TABLE status_pages ADD COLUMN IF NOT EXISTS logo_url TEXT`;
    await client`ALTER TABLE status_pages ADD COLUMN IF NOT EXISTS monitored_job_ids JSONB NOT NULL DEFAULT '[]'`;
    await client`ALTER TABLE status_pages ADD COLUMN IF NOT EXISTS incidents JSONB NOT NULL DEFAULT '[]'`;
    await client`CREATE INDEX IF NOT EXISTS status_pages_org_idx ON status_pages (organization_id)`;
    await client`CREATE INDEX IF NOT EXISTS status_pages_slug_idx ON status_pages (slug)`;

    logger.log('✓ Startup schema bootstrap complete — all tables & columns verified');
  } catch (err: any) {
    logger.error(`✗ Startup migration error: ${err.message}`);
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // Bootstrap the database schema before accepting traffic
  await runStartupMigrations(logger);

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  });

  // Cloudflare analytics auto-injection suppression middleware
  app.use((req: any, res: any, next: any) => {
    res.setHeader('X-Cloudflare-Analytics', 'off');
    res.setHeader('CF-Beacon', 'off');
    next();
  });

  // Global exception filter for clear error logging and formatted responses
  app.useGlobalFilters(new AllExceptionsFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    })
  );

  app.setGlobalPrefix('api/v1');

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
