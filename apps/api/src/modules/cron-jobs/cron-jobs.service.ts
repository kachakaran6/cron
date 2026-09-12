import { Injectable, NotFoundException, Logger, OnModuleInit } from '@nestjs/common';
import { db, cronJobs, cronJobRuns, organizations } from '@cron-saas/database';
import { eq, desc, and, lte } from 'drizzle-orm';
import * as cronParser from 'cron-parser';
import { Queue } from 'bullmq';
import { CreateCronJobDto } from './dto/create-cron-job.dto';
import { EntitlementsService } from '../entitlements/entitlements.service';

@Injectable()
export class CronJobsService implements OnModuleInit {
  private readonly logger = new Logger(CronJobsService.name);
  private executionQueue: Queue | null = null;

  constructor(private readonly entitlementsService: EntitlementsService) {}

  /**
   * Initialize BullMQ queue lazily in lifecycle hook and launch the background
   * scheduler ticker so scheduled and manual jobs execute reliably.
   */
  onModuleInit() {
    try {
      this.executionQueue = new Queue('cron-execution-queue', {
        connection: {
          host: process.env.REDIS_HOST || 'localhost',
          port: Number(process.env.REDIS_PORT) || 6379,
          password: process.env.REDIS_PASSWORD || undefined,
        },
      });

      this.executionQueue.on('error', (err) => {
        this.logger.error(`Redis Queue error: ${err.message}`);
      });

      this.logger.log('Execution queue connected to Redis');
    } catch (err: any) {
      this.logger.error(`Failed to initialize BullMQ queue: ${err.message}. Execution queue will be unavailable.`);
      this.executionQueue = null;
    }

    // Start background ticker for scheduled jobs (checks every 10 seconds)
    setInterval(async () => {
      try {
        const now = new Date();
        const dueJobs = await db
          .select()
          .from(cronJobs)
          .where(and(eq(cronJobs.enabled, true), lte(cronJobs.nextRunAt, now)))
          .limit(25);

        for (const job of dueJobs) {
          // Advance nextRunAt first to prevent duplicate trigger races
          const nextRun = this.calculateNextRun(job.schedule, job.timezone);
          await db
            .update(cronJobs)
            .set({ nextRunAt: nextRun, updatedAt: new Date() })
            .where(eq(cronJobs.id, job.id));

          this.logger.log(`[Scheduler] Firing scheduled job ${job.name} (${job.id})`);
          this.executeJob(job).catch((err) => {
            this.logger.error(`[Scheduler] Execution failed for ${job.id}: ${err.message}`);
          });
        }
      } catch (err: any) {
        this.logger.warn(`Scheduler tick error: ${err.message}`);
      }
    }, 10000);
  }

  private calculateNextRun(schedule: string, timezone = 'UTC'): Date {
    try {
      const parseFn =
        (cronParser as any).parseExpression ||
        (cronParser as any).default?.parseExpression ||
        (cronParser as any);

      const interval = parseFn(schedule, {
        currentDate: new Date(),
        tz: timezone || 'UTC',
      });
      return interval.next().toDate();
    } catch (err: any) {
      this.logger.warn(`Failed to parse cron expression "${schedule}": ${err.message}. Using fallback +5m.`);
      return new Date(Date.now() + 5 * 60 * 1000);
    }
  }

  async createJob(organizationId: string, createdById: string, dto: CreateCronJobDto) {
    // 1. Ensure valid organizationId (auto-heal if missing or placeholder)
    if (!organizationId || organizationId === '00000000-0000-0000-0000-000000000000') {
      if (createdById) {
        const [userOrg] = await db
          .select({ id: organizations.id })
          .from(organizations)
          .where(eq(organizations.ownerId, createdById))
          .limit(1);

        if (userOrg) {
          organizationId = userOrg.id;
        }
      }

      if (!organizationId || organizationId === '00000000-0000-0000-0000-000000000000') {
        const [newOrg] = await db
          .insert(organizations)
          .values({
            name: 'Personal Workspace',
            slug: `personal-${Date.now()}`,
            ownerId: createdById || undefined,
          })
          .returning();
        organizationId = newOrg.id;
      }
    }

    // 2. Validate Entitlements
    await this.entitlementsService.assertCanCreateJob(organizationId);

    // 3. Compute nextRunAt safely
    const nextRunAt = this.calculateNextRun(dto.schedule, dto.timezone);

    // 4. Insert into database
    const [job] = await db
      .insert(cronJobs)
      .values({
        organizationId,
        createdById: createdById || undefined,
        name: dto.name,
        url: dto.url,
        method: dto.method || 'GET',
        schedule: dto.schedule,
        timezone: dto.timezone || 'UTC',
        headers: dto.headers || {},
        body: dto.body,
        timeoutMs: dto.timeoutMs || 10000,
        nextRunAt,
      })
      .returning();

    this.logger.log(`Created cron job ${job.name} (${job.id}) scheduled for ${nextRunAt.toISOString()}`);
    return job;
  }

  async listJobs(organizationId: string) {
    const jobs = await db
      .select()
      .from(cronJobs)
      .where(eq(cronJobs.organizationId, organizationId))
      .orderBy(desc(cronJobs.createdAt));

    // Attach latest execution runs to each job for UI display
    return Promise.all(
      jobs.map(async (job) => {
        const rawRuns = await this.getJobRuns(job.id, 10);
        const logs = rawRuns.map((r) => ({
          ...r,
          statusCode: r.httpStatus,
          responseTime: r.durationMs,
          executedAt: r.startedAt,
        }));
        return {
          ...job,
          logs,
          executionLogs: logs,
        };
      })
    );
  }

  async getJobById(id: string) {
    const [job] = await db.select().from(cronJobs).where(eq(cronJobs.id, id)).limit(1);
    if (!job) throw new NotFoundException('Cron job not found');

    const rawRuns = await this.getJobRuns(job.id, 50);
    const logs = rawRuns.map((r) => ({
      ...r,
      statusCode: r.httpStatus,
      responseTime: r.durationMs,
      executedAt: r.startedAt,
    }));

    return {
      ...job,
      logs,
      executionLogs: logs,
    };
  }

  async getJobRuns(cronJobId: string, limit = 50) {
    return db
      .select()
      .from(cronJobRuns)
      .where(eq(cronJobRuns.cronJobId, cronJobId))
      .orderBy(desc(cronJobRuns.startedAt))
      .limit(limit);
  }

  /**
   * Dispatches the HTTP call directly, enforces anti-SSRF protections, records
   * execution run metrics in PostgreSQL, and updates the job's lastRunAt.
   */
  async executeJob(job: typeof cronJobs.$inferSelect): Promise<any> {
    const startedAt = new Date();
    let status: 'SUCCESS' | 'FAILED' | 'TIMED_OUT' | 'BLOCKED_SSRF' = 'SUCCESS';
    let httpStatus: number | null = null;
    let responseBody = '';
    let errorMessage: string | null = null;
    let responseHeaders = '';

    try {
      // Basic SSRF security check
      const parsedUrl = new URL(job.url);
      const hostname = parsedUrl.hostname.toLowerCase();
      if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '0.0.0.0' ||
        hostname === '169.254.169.254' ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        (hostname.startsWith('172.') && Number(hostname.split('.')[1]) >= 16 && Number(hostname.split('.')[1]) <= 31)
      ) {
        status = 'BLOCKED_SSRF';
        errorMessage = 'SSRF Protection: Access to private or loopback IP blocked';
      } else {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), job.timeoutMs || 10000);

        const res = await fetch(job.url, {
          method: job.method || 'GET',
          headers: {
            'User-Agent': 'SamastCron-Worker/1.0 (+https://cron.samast.pro)',
            ...((job.headers as Record<string, string>) || {}),
          },
          body: job.method !== 'GET' && job.body ? job.body : undefined,
          signal: controller.signal,
        });
        clearTimeout(timeout);

        httpStatus = res.status;
        responseBody = (await res.text()).slice(0, 10000);
        status = res.status >= 200 && res.status < 300 ? 'SUCCESS' : 'FAILED';
        if (status === 'FAILED') {
          errorMessage = `HTTP ${res.status} ${res.statusText}`;
        }

        const headerObj: Record<string, string> = {};
        res.headers.forEach((val, key) => {
          headerObj[key] = val;
        });
        responseHeaders = JSON.stringify(headerObj);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        status = 'TIMED_OUT';
        errorMessage = `Request timed out after ${job.timeoutMs || 10000}ms`;
      } else {
        status = 'FAILED';
        errorMessage = err.message || 'Execution error';
      }
    }

    const finishedAt = new Date();
    const durationMs = Math.max(1, finishedAt.getTime() - startedAt.getTime());

    // Record execution run in PostgreSQL
    const [insertedRun] = await db
      .insert(cronJobRuns)
      .values({
        cronJobId: job.id,
        startedAt,
        finishedAt,
        durationMs,
        status,
        httpStatus,
        responseSize: Buffer.byteLength(responseBody, 'utf8'),
        responseHeaders,
        responseBody,
        errorMessage,
        attemptNumber: 1,
        workerId: 'engine-direct-dispatcher',
      })
      .returning();

    // Update lastRunAt on cron_jobs
    await db
      .update(cronJobs)
      .set({ lastRunAt: startedAt, updatedAt: new Date() })
      .where(eq(cronJobs.id, job.id));

    this.logger.log(`Executed job ${job.id} -> HTTP ${httpStatus} (${status}) in ${durationMs}ms`);

    return {
      ...insertedRun,
      statusCode: httpStatus,
      responseTime: durationMs,
      executedAt: startedAt,
    };
  }

  async triggerImmediateRun(id: string) {
    const [job] = await db.select().from(cronJobs).where(eq(cronJobs.id, id)).limit(1);
    if (!job) throw new NotFoundException('Cron job not found');

    // 1. Execute immediately and record run log
    const runResult = await this.executeJob(job);

    // 2. Also notify Redis execution queue if available
    if (this.executionQueue) {
      this.executionQueue
        .add(
          'execute-http-job',
          {
            cronJobId: job.id,
            url: job.url,
            method: job.method,
            attempt: 1,
          },
          { removeOnComplete: true }
        )
        .catch(() => {});
    }

    return {
      message: 'Immediate execution triggered successfully',
      jobId: job.id,
      runId: runResult.id,
      status: runResult.status,
      statusCode: runResult.httpStatus,
      durationMs: runResult.durationMs,
    };
  }
}
