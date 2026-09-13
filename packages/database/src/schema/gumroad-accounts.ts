import { pgTable, uuid, varchar, integer, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { users } from './users';
import { organizations } from './organizations';

export const gumroadAccounts = pgTable('gumroad_accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),
  gumroadProductId: varchar('gumroad_product_id', { length: 128 }),
  gumroadSubscriptionId: varchar('gumroad_subscription_id', { length: 128 }),
  gumroadLicenseKey: varchar('gumroad_license_key', { length: 255 }).unique(),
  purchaseEmail: varchar('purchase_email', { length: 255 }),
  customerName: varchar('customer_name', { length: 255 }),
  productName: varchar('product_name', { length: 255 }),
  permalink: varchar('permalink', { length: 255 }),
  priceCents: integer('price_cents').default(0).notNull(),
  status: varchar('status', { length: 32 }).default('ACTIVE').notNull(), // 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'REFUNDED'
  purchaseDate: timestamp('purchase_date', { withTimezone: true }),
  renewalDate: timestamp('renewal_date', { withTimezone: true }),
  cancellationDate: timestamp('cancellation_date', { withTimezone: true }),
  endedDate: timestamp('ended_date', { withTimezone: true }),
  lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }).defaultNow().notNull(),
  rawPayload: jsonb('raw_payload').$type<Record<string, any>>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
