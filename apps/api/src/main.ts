import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { client } from '@cron-saas/database';

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
    // Add password_hash if table existed without it (idempotent)
    await client`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)`;

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
    await client`CREATE INDEX IF NOT EXISTS api_keys_prefix_idx ON api_keys (key_prefix)`;
    await client`CREATE INDEX IF NOT EXISTS api_keys_org_idx ON api_keys (organization_id)`;

    // ── 6. notification_channels (optional) ──────────────────────────────────
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

    logger.log('✓ Startup schema bootstrap complete — all tables ready');
  } catch (err: any) {
    logger.error(`✗ Startup migration failed: ${err.message}`);
    // In production, log the error but don't crash — let the API start and fail gracefully per-request
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
