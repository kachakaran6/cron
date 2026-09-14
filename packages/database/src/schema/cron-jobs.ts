import { pgTable, uuid, text, varchar, boolean, integer, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
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
  schedule: varchar('schedule', { length: 128 }).notNull(),
  timezone: varchar('timezone', { length: 64 }).default('UTC').notNull(),
  headers: jsonb('headers').$type<Record<string, string>>().default({}),
  body: text('body'),
  timeoutMs: integer('timeout_ms').default(10000).notNull(),
  retryCount: integer('retry_count').default(3).notNull(),
  retryDelayMs: integer('retry_delay_ms').default(5000).notNull(),
  enabled: boolean('enabled').default(true).notNull(),
  nextRunAt: timestamp('next_run_at', { withTimezone: true, mode: 'date' }).notNull(),
  lastRunAt: timestamp('last_run_at', { withTimezone: true, mode: 'date' }),
  
  // Advanced options from benchmark (cron-job.org)
  saveResponses: boolean('save_responses').default(true).notNull(),
  redirectSuccess: boolean('redirect_success').default(true).notNull(),
  authUsername: varchar('auth_username', { length: 255 }),
  authPassword: varchar('auth_password', { length: 255 }),
  
  // Notification & alerting rules
  notifyOnFailure: boolean('notify_on_failure').default(true).notNull(),
  failureThreshold: integer('failure_threshold').default(1).notNull(),
  notifyOnRecovery: boolean('notify_on_recovery').default(true).notNull(),
  notifyOnDisable: boolean('notify_on_disable').default(true).notNull(),
  notifyTlsExpiry: boolean('notify_tls_expiry').default(false).notNull(),
  tlsExpiryDays: integer('tls_expiry_days').default(30).notNull(),
  notificationChannelIds: jsonb('notification_channel_ids').$type<string[]>().default([]),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
  return {
    orgIdx: index('cron_jobs_org_idx').on(table.organizationId),
    nextRunIdx: index('cron_jobs_next_run_idx').on(table.enabled, table.nextRunAt),
  };
});
