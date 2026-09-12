import { pgTable, uuid, varchar, timestamp, index } from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { users } from './users';

export const apiKeys = pgTable('api_keys', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  createdById: uuid('created_by_id').references(() => users.id).notNull(),
  name: varchar('name', { length: 128 }).notNull(),
  keyPrefix: varchar('key_prefix', { length: 12 }).notNull(),
  hashedKey: varchar('hashed_key', { length: 128 }).notNull(),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
  return {
    keyPrefixIdx: index('api_keys_prefix_idx').on(table.keyPrefix),
    orgIdx: index('api_keys_org_idx').on(table.organizationId),
  };
});
