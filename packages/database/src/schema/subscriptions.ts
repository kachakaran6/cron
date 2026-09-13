import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';
import { organizations } from './organizations';
import { gumroadAccounts } from './gumroad-accounts';

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull().unique(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull().unique(),
  plan: varchar('plan', { length: 32 }).default('FREE').notNull(), // 'FREE' | 'PRO'
  billingStatus: varchar('billing_status', { length: 32 }).default('ACTIVE').notNull(), // 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'EXPIRED'
  gumroadAccountId: uuid('gumroad_account_id').references(() => gumroadAccounts.id, { onDelete: 'set null' }),
  gumroadProductId: varchar('gumroad_product_id', { length: 128 }),
  gumroadSubscriptionId: varchar('gumroad_subscription_id', { length: 128 }),
  gumroadLicenseKey: varchar('gumroad_license_key', { length: 255 }).unique(),
  gumroadStatus: varchar('gumroad_status', { length: 32 }), // 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'REFUNDED' | 'PAUSED'
  subscribedSince: timestamp('subscribed_since', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
