import { pgTable, uuid, varchar, integer, boolean, timestamp } from 'drizzle-orm/pg-core';
import { organizations } from './organizations';

export const entitlements = pgTable('entitlements', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull().unique(),
  maxJobs: integer('max_jobs').default(500).notNull(),
  minIntervalSeconds: integer('min_interval_seconds').default(60).notNull(),
  historyRetentionDays: integer('history_retention_days').default(30).notNull(),
  customHeaders: boolean('custom_headers').default(true).notNull(),
  webhookAlerts: boolean('webhook_alerts').default(true).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
