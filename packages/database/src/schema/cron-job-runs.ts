import { pgTable, uuid, integer, text, timestamp, varchar, index } from 'drizzle-orm/pg-core';
import { cronJobs } from './cron-jobs';

export const executionStatusEnum = ['SUCCESS', 'FAILED', 'TIMED_OUT', 'BLOCKED_SSRF'] as const;
export type ExecutionStatus = typeof executionStatusEnum[number];

export const cronJobRuns = pgTable('cron_job_runs', {
  id: uuid('id').defaultRandom().primaryKey(),
  cronJobId: uuid('cron_job_id').references(() => cronJobs.id, { onDelete: 'cascade' }).notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
  finishedAt: timestamp('finished_at', { withTimezone: true }).notNull(),
  durationMs: integer('duration_ms').notNull(),
  status: varchar('status', { length: 32 }).$type<ExecutionStatus>().notNull(),
  httpStatus: integer('http_status'),
  responseSize: integer('response_size').default(0),
  responseHeaders: text('response_headers'),
  responseBody: text('response_body'),
  errorMessage: text('error_message'),
  attemptNumber: integer('attempt_number').default(1).notNull(),
  workerId: varchar('worker_id', { length: 64 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
  return {
    jobRunIdx: index('cron_job_runs_job_id_idx').on(table.cronJobId, table.createdAt),
  };
});
