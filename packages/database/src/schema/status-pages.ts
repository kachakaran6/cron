import { pgTable, uuid, varchar, text, boolean, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { organizations } from './organizations';

export interface IncidentItem {
  id: string;
  title: string;
  status: 'INVESTIGATING' | 'IDENTIFIED' | 'MONITORING' | 'RESOLVED';
  startDate: string;
  endDate?: string;
  message?: string;
}

export interface StatusPageConfig {
  showHeaders?: boolean;
  showPayload?: boolean;
  showResponseCodes?: boolean;
  showLatencyMetrics?: boolean;
  showServiceHealthScores?: boolean;
  showUptimeBarChart?: boolean;
  customColors?: {
    successColor?: string;
    redirectColor?: string;
    clientErrorColor?: string;
    serverErrorColor?: string;
  };
}

export const statusPages = pgTable('status_pages', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 128 }).notNull().unique(),
  isPublished: boolean('is_published').default(true).notNull(),
  logoUrl: text('logo_url'),
  monitoredJobIds: jsonb('monitored_job_ids').$type<string[]>().default([]).notNull(),
  incidents: jsonb('incidents').$type<IncidentItem[]>().default([]).notNull(),
  config: jsonb('config').$type<StatusPageConfig>().default({}).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
  return {
    orgIdx: index('status_pages_org_idx').on(table.organizationId),
    slugIdx: index('status_pages_slug_idx').on(table.slug),
  };
});
