import { Queue } from 'bullmq';
import { db } from '@cron-saas/database';
import { cronJobs } from '@cron-saas/database/schema';
import { lte, and, eq } from 'drizzle-orm';
import { calculateNextRun } from './utils';

export class SchedulerService {
  private executionQueue: Queue;

  constructor() {
    this.executionQueue = new Queue('cron-execution-queue', {
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
      },
    });
  }

  async processUpcomingJobs() {
    const now = new Date();
    const windowEnd = new Date(now.getTime() + 10000); // 10 second lookahead

    try {
      const pendingJobs = await db
        .select()
        .from(cronJobs)
        .where(and(eq(cronJobs.enabled, true), lte(cronJobs.nextRunAt, windowEnd)));

      for (const job of pendingJobs) {
        const targetTime = job.nextRunAt.getTime();
        const delay = Math.max(0, targetTime - Date.now());

        await this.executionQueue.add(
          'execute-http-job',
          {
            cronJobId: job.id,
            url: job.url,
            method: job.method,
            headers: job.headers,
            body: job.body,
            timeoutMs: job.timeoutMs,
            attempt: 1,
          },
          {
            delay,
            jobId: `${job.id}-${targetTime}`, // Unique deduplication key
            removeOnComplete: 100,
            removeOnFail: 500,
          }
        );

        // Advance nextRunAt
        const nextRun = calculateNextRun(job.schedule, job.timezone);
        await db
          .update(cronJobs)
          .set({ nextRunAt: nextRun, updatedAt: new Date() })
          .where(eq(cronJobs.id, job.id));

        console.log(`[Scheduler] Enqueued job ${job.name} (${job.id}) for run at ${job.nextRunAt.toISOString()}`);
      }
    } catch (err: any) {
      console.error(`[Scheduler] Polling loop error: ${err.message}`);
    }
  }
}
