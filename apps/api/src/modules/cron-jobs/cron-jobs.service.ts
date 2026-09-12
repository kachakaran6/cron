import { Injectable, NotFoundException } from '@nestjs/common';
import { db, cronJobs, cronJobRuns } from '@cron-saas/database';
import { eq, desc } from 'drizzle-orm';
import cronParser from 'cron-parser';
import { Queue } from 'bullmq';
import { CreateCronJobDto } from './dto/create-cron-job.dto';
import { EntitlementsService } from '../entitlements/entitlements.service';

@Injectable()
export class CronJobsService {
  private executionQueue: Queue;

  constructor(private readonly entitlementsService: EntitlementsService) {
    this.executionQueue = new Queue('cron-execution-queue', {
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
      },
    });
    this.executionQueue.on('error', (err) => {
      console.error('[CronJobsService] Redis Queue error:', err.message);
    });
  }

  private calculateNextRun(schedule: string, timezone = 'UTC'): Date {
    const interval = cronParser.parseExpression(schedule, {
      currentDate: new Date(),
      tz: timezone,
    });
    return interval.next().toDate();
  }

  async createJob(organizationId: string, createdById: string, dto: CreateCronJobDto) {
    await this.entitlementsService.assertCanCreateJob(organizationId);
    const nextRunAt = this.calculateNextRun(dto.schedule, dto.timezone || 'UTC');

    const [job] = await db
      .insert(cronJobs)
      .values({
        organizationId,
        createdById,
        name: dto.name,
        url: dto.url,
        method: dto.method || 'GET',
        schedule: dto.schedule,
        timezone: dto.timezone || 'UTC',
        headers: dto.headers || {},
        body: dto.body || null,
        timeoutMs: dto.timeoutMs || 10000,
        enabled: true,
        nextRunAt,
      })
      .returning();

    return job;
  }

  async listJobs(organizationId: string) {
    return db
      .select()
      .from(cronJobs)
      .where(eq(cronJobs.organizationId, organizationId))
      .orderBy(desc(cronJobs.createdAt));
  }

  async getJobById(id: string) {
    const [job] = await db.select().from(cronJobs).where(eq(cronJobs.id, id)).limit(1);
    if (!job) throw new NotFoundException('Cron job not found');
    return job;
  }

  async getJobRuns(cronJobId: string, limit = 50) {
    return db
      .select()
      .from(cronJobRuns)
      .where(eq(cronJobRuns.cronJobId, cronJobId))
      .orderBy(desc(cronJobRuns.startedAt))
      .limit(limit);
  }

  async triggerImmediateRun(id: string) {
    const job = await this.getJobById(id);

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
        jobId: `manual-${job.id}-${Date.now()}`,
      }
    );

    return { message: 'Immediate execution triggered successfully', jobId: job.id };
  }
}
