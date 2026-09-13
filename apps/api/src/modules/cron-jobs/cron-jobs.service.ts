import { Injectable, NotFoundException, ForbiddenException, Logger, OnModuleInit } from '@nestjs/common';
import { db, cronJobs, cronJobRuns, organizations, notificationChannels } from '@cron-saas/database';
import { eq, desc, and, lte, gte, count } from 'drizzle-orm';
import * as cronParser from 'cron-parser';
import { Queue } from 'bullmq';
import { CreateCronJobDto } from './dto/create-cron-job.dto';
import { UpdateCronJobDto } from './dto/update-cron-job.dto';
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

    // Initial 30-day retention cleanup on startup and recurring every 6 hours
    this.purgeOldLogs().catch(() => {});
    setInterval(() => {
      this.purgeOldLogs().catch(() => {});
    }, 6 * 60 * 60 * 1000);
  }

  calculateNextRun(schedule: string, timezone = 'UTC'): Date {
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

  getScheduleIntervalSeconds(schedule: string, timezone = 'UTC'): number {
    try {
      const parseFn =
        (cronParser as any).parseExpression ||
        (cronParser as any).default?.parseExpression ||
        (cronParser as any);

      const interval = parseFn(schedule, {
        currentDate: new Date(),
        tz: timezone || 'UTC',
      });
      const t1 = interval.next().toDate();
      const t2 = interval.next().toDate();
      return Math.max(1, Math.round((t2.getTime() - t1.getTime()) / 1000));
    } catch {
      return 60;
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

    // 2. Validate Entitlements (Job limit & minimum interval)
    await this.entitlementsService.assertCanCreateJob(organizationId);
    const intervalSeconds = this.getScheduleIntervalSeconds(dto.schedule, dto.timezone);
    await this.entitlementsService.assertCanSetInterval(organizationId, intervalSeconds);

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
        enabled: dto.enabled !== undefined ? dto.enabled : true,
        nextRunAt,

        // Benchmark advanced fields
        saveResponses: dto.saveResponses !== undefined ? dto.saveResponses : true,
        redirectSuccess: dto.redirectSuccess !== undefined ? dto.redirectSuccess : true,
        authUsername: dto.authUsername || null,
        authPassword: dto.authPassword || null,

        // Notification rules
        notifyOnFailure: dto.notifyOnFailure !== undefined ? dto.notifyOnFailure : true,
        failureThreshold: dto.failureThreshold !== undefined ? dto.failureThreshold : 1,
        notifyOnRecovery: dto.notifyOnRecovery !== undefined ? dto.notifyOnRecovery : true,
        notifyOnDisable: dto.notifyOnDisable !== undefined ? dto.notifyOnDisable : true,
        notifyTlsExpiry: dto.notifyTlsExpiry !== undefined ? dto.notifyTlsExpiry : false,
        tlsExpiryDays: dto.tlsExpiryDays !== undefined ? dto.tlsExpiryDays : 30,
      })
      .returning();

    this.logger.log(`Created cron job ${job.name} (${job.id}) scheduled for ${nextRunAt.toISOString()}`);
    return job;
  }

  async updateJob(id: string, organizationId: string, dto: UpdateCronJobDto) {
    const [existing] = await db
      .select()
      .from(cronJobs)
      .where(and(eq(cronJobs.id, id), eq(cronJobs.organizationId, organizationId)))
      .limit(1);

    if (!existing) {
      throw new NotFoundException('Cron job not found or you do not have permission to modify it');
    }

    // Validate Interval if schedule changed
    if (dto.schedule) {
      const intervalSeconds = this.getScheduleIntervalSeconds(dto.schedule, dto.timezone || existing.timezone);
      await this.entitlementsService.assertCanSetInterval(organizationId, intervalSeconds);
    }

    // Check limits when re-enabling a disabled job
    if (dto.enabled === true && !existing.enabled) {
      const caps = await this.entitlementsService.getCapabilities(organizationId);
      const [activeCount] = await db
        .select({ value: count() })
        .from(cronJobs)
        .where(and(eq(cronJobs.organizationId, organizationId), eq(cronJobs.enabled, true)));

      const currentActive = activeCount?.value ? Number(activeCount.value) : 0;
      if (currentActive >= caps.maxJobs) {
        throw new ForbiddenException(
          `Active job limit reached for ${caps.plan} tier (${currentActive}/${caps.maxJobs} active jobs). Upgrade to Pro to enable more jobs.`
        );
      }

      // Also verify interval for the re-enabled job
      const scheduleToCheck = dto.schedule || existing.schedule;
      const intervalSeconds = this.getScheduleIntervalSeconds(scheduleToCheck, dto.timezone || existing.timezone);
      await this.entitlementsService.assertCanSetInterval(organizationId, intervalSeconds);
    }

    // Recompute nextRunAt if schedule or timezone updated
    let nextRunAt = existing.nextRunAt;
    if (dto.schedule || dto.timezone) {
      nextRunAt = this.calculateNextRun(dto.schedule || existing.schedule, dto.timezone || existing.timezone);
    }

    const [updated] = await db
      .update(cronJobs)
      .set({
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.url !== undefined ? { url: dto.url } : {}),
        ...(dto.method !== undefined ? { method: dto.method } : {}),
        ...(dto.schedule !== undefined ? { schedule: dto.schedule, nextRunAt } : {}),
        ...(dto.timezone !== undefined ? { timezone: dto.timezone, nextRunAt } : {}),
        ...(dto.headers !== undefined ? { headers: dto.headers } : {}),
        ...(dto.body !== undefined ? { body: dto.body } : {}),
        ...(dto.timeoutMs !== undefined ? { timeoutMs: dto.timeoutMs } : {}),
        ...(dto.enabled !== undefined ? { enabled: dto.enabled } : {}),
        ...(dto.saveResponses !== undefined ? { saveResponses: dto.saveResponses } : {}),
        ...(dto.redirectSuccess !== undefined ? { redirectSuccess: dto.redirectSuccess } : {}),
        ...(dto.authUsername !== undefined ? { authUsername: dto.authUsername || null } : {}),
        ...(dto.authPassword !== undefined ? { authPassword: dto.authPassword || null } : {}),
        ...(dto.notifyOnFailure !== undefined ? { notifyOnFailure: dto.notifyOnFailure } : {}),
        ...(dto.failureThreshold !== undefined ? { failureThreshold: dto.failureThreshold } : {}),
        ...(dto.notifyOnRecovery !== undefined ? { notifyOnRecovery: dto.notifyOnRecovery } : {}),
        ...(dto.notifyOnDisable !== undefined ? { notifyOnDisable: dto.notifyOnDisable } : {}),
        ...(dto.notifyTlsExpiry !== undefined ? { notifyTlsExpiry: dto.notifyTlsExpiry } : {}),
        ...(dto.tlsExpiryDays !== undefined ? { tlsExpiryDays: dto.tlsExpiryDays } : {}),
        updatedAt: new Date(),
      })
      .where(eq(cronJobs.id, id))
      .returning();

    this.logger.log(`Updated cron job ${updated.name} (${updated.id})`);
    return updated;
  }

  async deleteJob(id: string, organizationId: string) {
    const [existing] = await db
      .select()
      .from(cronJobs)
      .where(eq(cronJobs.id, id))
      .limit(1);

    if (!existing) {
      throw new NotFoundException('Cron job not found');
    }

    // 1. Delete associated execution runs first to avoid Foreign Key constraint violation
    await db.delete(cronJobRuns).where(eq(cronJobRuns.cronJobId, id));

    // 2. Delete the cron job
    await db.delete(cronJobs).where(eq(cronJobs.id, id));

    this.logger.log(`Deleted cron job ${existing.name} (${id})`);
    return { success: true, message: `Cronjob ${existing.name} deleted successfully` };
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
    const [job] = await db
      .select({ organizationId: cronJobs.organizationId })
      .from(cronJobs)
      .where(eq(cronJobs.id, cronJobId))
      .limit(1);

    if (job) {
      const caps = await this.entitlementsService.getCapabilities(job.organizationId);
      const retentionCutoff = new Date(Date.now() - caps.historyRetentionDays * 24 * 60 * 60 * 1000);
      return db
        .select()
        .from(cronJobRuns)
        .where(and(eq(cronJobRuns.cronJobId, cronJobId), gte(cronJobRuns.startedAt, retentionCutoff)))
        .orderBy(desc(cronJobRuns.startedAt))
        .limit(limit);
    }

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

        // Build headers, including HTTP Basic Auth if defined
        const headers: Record<string, string> = {
          'User-Agent': 'SamastCron-Worker/1.0 (+https://cron.samast.pro)',
          ...((job.headers as Record<string, string>) || {}),
        };

        if (job.authUsername && job.authPassword && !headers['Authorization'] && !headers['authorization']) {
          const authCreds = Buffer.from(`${job.authUsername}:${job.authPassword}`).toString('base64');
          headers['Authorization'] = `Basic ${authCreds}`;
        }

        const res = await fetch(job.url, {
          method: job.method || 'GET',
          headers,
          body: job.method !== 'GET' && job.body ? job.body : undefined,
          signal: controller.signal,
          redirect: 'follow',
        });
        clearTimeout(timeout);

        httpStatus = res.status;
        const rawBody = await res.text();
        
        // Save responses option check
        if (job.saveResponses !== false) {
          responseBody = rawBody.slice(0, 10000);
        } else {
          responseBody = '[Response body not saved per job configuration]';
        }

        // Determine success status: 2xx is always success; 3xx is success if redirectSuccess is true
        const is2xx = res.status >= 200 && res.status < 300;
        const is3xxRedirect = (job.redirectSuccess !== false) && res.status >= 300 && res.status < 400;

        status = (is2xx || is3xxRedirect) ? 'SUCCESS' : 'FAILED';
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

    // Evaluate alert rules and notify configured channels
    this.evaluateAlertsAndNotify(job, insertedRun).catch((err) => {
      this.logger.error(`Alert evaluation error for ${job.id}: ${err.message}`);
    });

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

    // 1. Execute immediately and record run log synchronously
    const runResult = await this.executeJob(job);

    return {
      message: 'Immediate execution triggered successfully',
      jobId: job.id,
      runId: runResult.id,
      status: runResult.status,
      statusCode: runResult.httpStatus,
      durationMs: runResult.durationMs,
    };
  }

  private async purgeOldLogs() {
    try {
      // 1. Fetch all organizations and purge runs older than their plan retention window
      const orgList = await db.select({ id: organizations.id }).from(organizations);
      for (const org of orgList) {
        const caps = await this.entitlementsService.getCapabilities(org.id);
        const cutoff = new Date(Date.now() - caps.historyRetentionDays * 24 * 60 * 60 * 1000);

        const jobs = await db
          .select({ id: cronJobs.id })
          .from(cronJobs)
          .where(eq(cronJobs.organizationId, org.id));

        for (const j of jobs) {
          await db
            .delete(cronJobRuns)
            .where(and(eq(cronJobRuns.cronJobId, j.id), lte(cronJobRuns.startedAt, cutoff)));
        }
      }

      // 2. Absolute purge of all runs older than 90 days
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      await db.delete(cronJobRuns).where(lte(cronJobRuns.startedAt, ninetyDaysAgo));
      this.logger.log('Executed tier-based retention log purge (Free: 3d, Pro: 30d, Annual: 90d).');
    } catch (err: any) {
      this.logger.warn(`Retention purge error: ${err.message}`);
    }
  }

  private async evaluateAlertsAndNotify(
    job: typeof cronJobs.$inferSelect,
    run: typeof cronJobRuns.$inferSelect
  ) {
    try {
      // 1. Fetch recent runs for this job to count consecutive failures
      const recentRuns = await db
        .select({ status: cronJobRuns.status, startedAt: cronJobRuns.startedAt })
        .from(cronJobRuns)
        .where(eq(cronJobRuns.cronJobId, job.id))
        .orderBy(desc(cronJobRuns.startedAt))
        .limit(15);

      if (recentRuns.length === 0) return;

      let consecutiveFailures = 0;
      for (const r of recentRuns) {
        if (r.status !== 'SUCCESS') consecutiveFailures++;
        else break;
      }

      const isCurrentFailed = run.status !== 'SUCCESS';
      const previousRun = recentRuns[1];
      const isRecovery = !isCurrentFailed && previousRun && previousRun.status !== 'SUCCESS';
      const isFailureThresholdHit =
        isCurrentFailed &&
        job.notifyOnFailure !== false &&
        consecutiveFailures >= (job.failureThreshold || 1);
      const shouldDisable =
        isCurrentFailed && job.notifyOnDisable !== false && consecutiveFailures >= 10;

      if (shouldDisable && job.enabled) {
        await db.update(cronJobs).set({ enabled: false }).where(eq(cronJobs.id, job.id));
        this.logger.warn(
          `Disabled job ${job.name} (${job.id}) due to ${consecutiveFailures} consecutive failures.`
        );
      }

      if (!isFailureThresholdHit && !isRecovery && !shouldDisable) {
        return;
      }

      // 2. Fetch active notification channels for this organization
      const channels = await db
        .select()
        .from(notificationChannels)
        .where(
          and(
            eq(notificationChannels.organizationId, job.organizationId),
            eq(notificationChannels.enabled, true)
          )
        );

      if (channels.length === 0) return;

      // 3. Dispatch to all enabled channels
      for (const ch of channels) {
        const targetUrl = ch.config?.target;
        if (!targetUrl) continue;

        let alertTitle = '';
        let alertMessage = '';
        if (shouldDisable) {
          alertTitle = `⛔ [Samast Cron] Job Disabled: ${job.name}`;
          alertMessage = `Job has been automatically disabled after ${consecutiveFailures} consecutive failures.\nLast error: ${run.errorMessage || 'HTTP failure'}\nTarget URL: ${job.url}`;
        } else if (isRecovery) {
          alertTitle = `✅ [Samast Cron] Recovered: ${job.name}`;
          alertMessage = `Job has recovered and is now succeeding with HTTP ${run.httpStatus} in ${run.durationMs}ms.\nTarget URL: ${job.url}`;
        } else {
          alertTitle = `🚨 [Samast Cron Alert] Job Failed: ${job.name}`;
          alertMessage = `Execution failed with ${run.status} (${run.httpStatus || 'Timeout'}). Consecutive failures: ${consecutiveFailures}.\nTarget URL: ${job.url}\nError: ${run.errorMessage || 'Unknown error'}`;
        }

        const chType = (ch.type || '').toLowerCase();

        try {
          if (chType === 'slack') {
            await fetch(targetUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                text: `${alertTitle}\n${alertMessage}`,
              }),
            });
          } else if (chType === 'discord') {
            await fetch(targetUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                content: `**${alertTitle}**\n${alertMessage}`,
              }),
            });
          } else {
            // Webhook / Email endpoint
            await fetch(targetUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                event: shouldDisable
                  ? 'cronjob.disabled'
                  : isRecovery
                  ? 'cronjob.recovered'
                  : 'cronjob.failed',
                timestamp: new Date().toISOString(),
                job: { id: job.id, name: job.name, url: job.url, schedule: job.schedule },
                run: {
                  status: run.status,
                  httpStatus: run.httpStatus,
                  durationMs: run.durationMs,
                  errorMessage: run.errorMessage,
                  consecutiveFailures,
                },
              }),
            });
          }
          this.logger.log(`Dispatched alert to channel ${ch.name} (${ch.type}) for job ${job.id}`);
        } catch (err: any) {
          this.logger.warn(`Failed to dispatch alert to ${ch.name}: ${err.message}`);
        }
      }
    } catch (err: any) {
      this.logger.error(`Error in evaluateAlertsAndNotify for job ${job.id}: ${err.message}`);
    }
  }
}

