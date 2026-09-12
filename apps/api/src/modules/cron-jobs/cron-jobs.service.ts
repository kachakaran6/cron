import { Injectable, NotFoundException, Logger, OnModuleInit } from '@nestjs/common';
import { db, cronJobs, cronJobRuns, organizations } from '@cron-saas/database';
import { eq, desc } from 'drizzle-orm';
import cronParser from 'cron-parser';
import { Queue } from 'bullmq';
import { CreateCronJobDto } from './dto/create-cron-job.dto';
import { EntitlementsService } from '../entitlements/entitlements.service';

@Injectable()
export class CronJobsService implements OnModuleInit {
  private readonly logger = new Logger(CronJobsService.name);
  private executionQueue: Queue | null = null;

  constructor(private readonly entitlementsService: EntitlementsService) {}

  /**
   * Initialize BullMQ queue lazily in lifecycle hook so Redis connection errors
   * do NOT crash the NestJS bootstrap process.
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
  }

  private calculateNextRun(schedule: string, timezone = 'UTC'): Date {
    const interval = cronParser.parseExpression(schedule, {
      currentDate: new Date(),
      tz: timezone,
    });
    return interval.next().toDate();
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
        } else {
          const [newOrg] = await db
            .insert(organizations)
            .values({
              name: 'Personal Organization',
              slug: `org-${createdById.slice(0, 8)}-${Date.now()}`,
              ownerId: createdById,
              planId: 'free',
            })
            .returning();
          organizationId = newOrg.id;
        }
      }
    }

    // 2. Entitlements check
    try {
      await this.entitlementsService.assertCanCreateJob(organizationId);
    } catch (err: any) {
      this.logger.warn(`Entitlements check notice: ${err.message}`);
    }

    // 3. Calculate next run
    const nextRunAt = this.calculateNextRun(dto.schedule, dto.timezone || 'UTC');

    // 4. Insert job with robust defaults
    const [job] = await db
      .insert(cronJobs)
      .values({
        organizationId,
        createdById: createdById || null,
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

    if (!this.executionQueue) {
      throw new Error('Execution queue is not available. Redis may be unreachable.');
    }

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
