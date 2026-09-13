import { Queue } from 'bullmq';
import { db, cronJobs, organizations } from '@cron-saas/database';
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
    this.executionQueue.on('error', (err) => {
      console.error('[Scheduler] Redis Queue error:', err.message);
    });
  }

  async processUpcomingJobs() {
    const now = new Date();
    const windowEnd = new Date(now.getTime() + 10000); // 10 second lookahead

    try {
      const pendingJobs = await db
        .select({
          job: cronJobs,
          orgPlanId: organizations.planId,
        })
        .from(cronJobs)
        .leftJoin(organizations, eq(cronJobs.organizationId, organizations.id))
        .where(and(eq(cronJobs.enabled, true), lte(cronJobs.nextRunAt, windowEnd)));

      for (const { job, orgPlanId } of pendingJobs) {
        const isPro = orgPlanId === 'pro';
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
            priority: isPro ? 1 : 10, // Dedicated high-priority execution for Pro/Annual
            attempts: isPro ? (job.retryCount || 3) : 1,
            backoff: isPro ? { type: 'exponential', delay: job.retryDelayMs || 5000 } : undefined,
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

        console.log(`[Scheduler] Enqueued job ${job.name} (${job.id}, tier=${isPro ? 'PRO' : 'FREE'}) for run at ${job.nextRunAt.toISOString()}`);
      }
    } catch (err: any) {
      console.error(`[Scheduler] Polling loop error: ${err.message}`);
    }
  }
}
