import { pgTable, uuid, varchar, text, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { users } from './users';

export const gumroadSyncLogs = pgTable('gumroad_sync_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  eventType: varchar('event_type', { length: 64 }).notNull(), // 'WEBHOOK' | 'LICENSE_VERIFY' | 'MANUAL_SYNC' | 'CRON_SYNC'
  status: varchar('status', { length: 32 }).notNull(), // 'SUCCESS' | 'FAILED' | 'IGNORED'
  gumroadSubscriptionId: varchar('gumroad_subscription_id', { length: 128 }),
  licenseKey: varchar('license_key', { length: 255 }),
  details: jsonb('details').$type<Record<string, any>>(),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
