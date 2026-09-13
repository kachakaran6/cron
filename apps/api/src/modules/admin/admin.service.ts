import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { db, users, organizations, cronJobs, cronJobRuns, statusPages, apiKeys, notificationChannels } from '@cron-saas/database';
import { eq, sql, count, desc, gte, lte, and, inArray } from 'drizzle-orm';
import { FileLoggerService } from '../../common/logger/file-logger.service';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { isPlatformAdmin } from '../auth/auth-url.util';

export interface SystemRuntimeConfig {
  workerConcurrency: number;
  defaultTimeoutMs: number;
  blockPrivateIps: boolean;
  blockedRanges: string[];
  logRetentionDays: number;
  tlsAlertDaysBeforeExpiry: number;
  maintenanceMode: boolean;
}

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  // Runtime config cache
  private runtimeConfig: SystemRuntimeConfig = {
    workerConcurrency: 50,
    defaultTimeoutMs: 10000,
    blockPrivateIps: true,
    blockedRanges: ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16', '127.0.0.0/8', '169.254.0.0/16'],
    logRetentionDays: 30,
    tlsAlertDaysBeforeExpiry: 30,
    maintenanceMode: false,
  };

  constructor(private readonly fileLogger: FileLoggerService) {}

  async getStats() {
    try {
      // 1. Table Row Counts Telemetry with individual error handling
      const userCountResult = await db.select({ value: count() }).from(users).catch(() => [{ value: 0 }]);
      const orgCountResult = await db.select({ value: count() }).from(organizations).catch(() => [{ value: 0 }]);
      const jobCountResult = await db.select({ value: count() }).from(cronJobs).catch(() => [{ value: 0 }]);
      const activeJobsResult = await db.select({ value: count() }).from(cronJobs).where(eq(cronJobs.enabled, true)).catch(() => [{ value: 0 }]);
      const runsCountResult = await db.select({ value: count() }).from(cronJobRuns).catch(() => [{ value: 0 }]);
      const statusPagesResult = await db.select({ value: count() }).from(statusPages).catch(() => [{ value: 0 }]);
      const apiKeysResult = await db.select({ value: count() }).from(apiKeys).catch(() => [{ value: 0 }]);
      const notifChannelsResult = await db.select({ value: count() }).from(notificationChannels).catch(() => [{ value: 0 }]);

      // 2. Execution metrics in last 24 hours
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const runs24hResult = await db
        .select({ value: count() })
        .from(cronJobRuns)
        .where(gte(cronJobRuns.startedAt, twentyFourHoursAgo))
        .catch(() => [{ value: 0 }]);

      const success24hResult = await db
        .select({ value: count() })
        .from(cronJobRuns)
        .where(and(gte(cronJobRuns.startedAt, twentyFourHoursAgo), eq(cronJobRuns.status, 'SUCCESS')))
        .catch(() => [{ value: 0 }]);

      const total24h = Number(runs24hResult[0]?.value || 0);
      const success24h = Number(success24hResult[0]?.value || 0);
      const failed24h = Math.max(0, total24h - success24h);
      const successRate = total24h > 0 ? Number(((success24h / total24h) * 100).toFixed(1)) : 100;

      // HTTP Status Code breakdown
      let status2xx = 0, status3xx = 0, status4xx = 0, status5xx = 0;
      try {
        const [res2] = await db.select({ value: count() }).from(cronJobRuns).where(and(gte(cronJobRuns.httpStatus, 200), lte(cronJobRuns.httpStatus, 299)));
        status2xx = Number(res2?.value || 0);
        const [res3] = await db.select({ value: count() }).from(cronJobRuns).where(and(gte(cronJobRuns.httpStatus, 300), lte(cronJobRuns.httpStatus, 399)));
        status3xx = Number(res3?.value || 0);
        const [res4] = await db.select({ value: count() }).from(cronJobRuns).where(and(gte(cronJobRuns.httpStatus, 400), lte(cronJobRuns.httpStatus, 499)));
        status4xx = Number(res4?.value || 0);
        const [res5] = await db.select({ value: count() }).from(cronJobRuns).where(gte(cronJobRuns.httpStatus, 500));
        status5xx = Number(res5?.value || 0);
      } catch (err: any) {
        this.logger.warn(`Failed to fetch HTTP status distribution: ${err?.message}`);
      }

      // Average latency
      let avgLatency = 0;
      try {
        const [avgRes] = await db
          .select({ avg: sql<number>`COALESCE(AVG(${cronJobRuns.durationMs}), 0)` })
          .from(cronJobRuns)
          .where(gte(cronJobRuns.startedAt, twentyFourHoursAgo));
        avgLatency = Math.round(Number(avgRes?.avg || 0));
      } catch {
        avgLatency = 0;
      }

      // Hourly throughput array for charts (last 12 hours)
      const hourlyThroughput: { hour: string; total: number; success: number; failed: number }[] = [];
      for (let i = 11; i >= 0; i--) {
        const start = new Date(Date.now() - (i + 1) * 60 * 60 * 1000);
        const end = new Date(Date.now() - i * 60 * 60 * 1000);
        const label = `${start.getHours()}:00`;

        try {
          const [hTotal] = await db
            .select({ value: count() })
            .from(cronJobRuns)
            .where(and(gte(cronJobRuns.startedAt, start), lte(cronJobRuns.startedAt, end)));

          const [hSuccess] = await db
            .select({ value: count() })
            .from(cronJobRuns)
            .where(and(gte(cronJobRuns.startedAt, start), lte(cronJobRuns.startedAt, end), eq(cronJobRuns.status, 'SUCCESS')));

          const tot = Number(hTotal?.value || 0);
          const succ = Number(hSuccess?.value || 0);
          hourlyThroughput.push({
            hour: label,
            total: tot,
            success: succ,
            failed: Math.max(0, tot - succ),
          });
        } catch {
          hourlyThroughput.push({ hour: label, total: 0, success: 0, failed: 0 });
        }
      }

      // Top 5 Slowest Target Jobs
      let slowestJobs: any[] = [];
      try {
        const rows = await db
          .select({
            id: cronJobs.id,
            name: cronJobs.name,
            url: cronJobs.url,
            avgLatencyMs: sql<number>`COALESCE(AVG(${cronJobRuns.durationMs}), 0)`,
            runCount: count(cronJobRuns.id),
          })
          .from(cronJobs)
          .leftJoin(cronJobRuns, eq(cronJobs.id, cronJobRuns.cronJobId))
          .groupBy(cronJobs.id, cronJobs.name, cronJobs.url)
          .orderBy(desc(sql`COALESCE(AVG(${cronJobRuns.durationMs}), 0)`))
          .limit(5);

        slowestJobs = rows.map((j) => ({
          ...j,
          avgLatencyMs: Math.round(Number(j.avgLatencyMs || 0)),
          runCount: Number(j.runCount || 0),
        }));
      } catch (err: any) {
        this.logger.warn(`Failed to fetch slowest jobs: ${err?.message}`);
        slowestJobs = [];
      }

      const memory = process.memoryUsage();

      return {
        overview: {
          totalUsers: Number(userCountResult[0]?.value || 0),
          totalOrganizations: Number(orgCountResult[0]?.value || 0),
          totalCronJobs: Number(jobCountResult[0]?.value || 0),
          activeCronJobs: Number(activeJobsResult[0]?.value || 0),
          totalStatusPages: Number(statusPagesResult[0]?.value || 0),
          totalApiKeys: Number(apiKeysResult[0]?.value || 0),
          maintenanceMode: this.runtimeConfig.maintenanceMode,
        },
        tableCounts: {
          users: Number(userCountResult[0]?.value || 0),
          organizations: Number(orgCountResult[0]?.value || 0),
          cronJobs: Number(jobCountResult[0]?.value || 0),
          cronJobRuns: Number(runsCountResult[0]?.value || 0),
          statusPages: Number(statusPagesResult[0]?.value || 0),
          apiKeys: Number(apiKeysResult[0]?.value || 0),
          notificationChannels: Number(notifChannelsResult[0]?.value || 0),
        },
        executions24h: {
          totalRuns: total24h,
          successCount: success24h,
          failedCount: failed24h,
          successRatePercentage: successRate,
          averageLatencyMs: avgLatency,
        },
        statusDistribution: {
          code2xx: status2xx,
          code3xx: status3xx,
          code4xx: status4xx,
          code5xx: status5xx,
        },
        topSlowestJobs: slowestJobs,
        charts: {
          hourlyThroughput,
        },
        systemHealth: {
          status: this.runtimeConfig.maintenanceMode ? 'MAINTENANCE' : 'HEALTHY',
          uptimeSeconds: Math.round(process.uptime()),
          rssMemoryMb: Math.round(memory.rss / (1024 * 1024)),
          heapUsedMb: Math.round(memory.heapUsed / (1024 * 1024)),
          heapTotalMb: Math.round(memory.heapTotal / (1024 * 1024)),
          nodeVersion: process.version,
        },
      };
    } catch (err: any) {
      this.logger.error(`Critical error in getStats: ${err?.message}`, err?.stack);
      const memory = process.memoryUsage();
      return {
        overview: { totalUsers: 0, totalOrganizations: 0, totalCronJobs: 0, activeCronJobs: 0, totalStatusPages: 0, totalApiKeys: 0, maintenanceMode: false },
        tableCounts: { users: 0, organizations: 0, cronJobs: 0, cronJobRuns: 0, statusPages: 0, apiKeys: 0, notificationChannels: 0 },
        executions24h: { totalRuns: 0, successCount: 0, failedCount: 0, successRatePercentage: 100, averageLatencyMs: 0 },
        statusDistribution: { code2xx: 0, code3xx: 0, code4xx: 0, code5xx: 0 },
        topSlowestJobs: [],
        charts: { hourlyThroughput: [] },
        systemHealth: {
          status: 'HEALTHY',
          uptimeSeconds: Math.round(process.uptime()),
          rssMemoryMb: Math.round(memory.rss / (1024 * 1024)),
          heapUsedMb: Math.round(memory.heapUsed / (1024 * 1024)),
          heapTotalMb: Math.round(memory.heapTotal / (1024 * 1024)),
          nodeVersion: process.version,
        },
      };
    }
  }

  async getLogs(options?: { level?: string; category?: string; search?: string; limit?: number; offset?: number }) {
    return this.fileLogger.queryLogs(options);
  }

  async clearLogs() {
    const logsDir = path.join(process.cwd(), 'logs');
    const apiLogFile = path.join(logsDir, 'app-api.log');
    const errorLogFile = path.join(logsDir, 'app-error.log');

    try {
      if (fs.existsSync(apiLogFile)) fs.writeFileSync(apiLogFile, '');
      if (fs.existsSync(errorLogFile)) fs.writeFileSync(errorLogFile, '');
      this.fileLogger.logInfo('Cleared all application file log files', 'ADMIN');
      return { success: true, message: 'Application log files truncated successfully' };
    } catch (err: any) {
      return { success: false, message: `Failed to clear logs: ${err?.message}` };
    }
  }

  async getUsers() {
    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        provider: users.provider,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt));

    return Promise.all(
      allUsers.map(async (u) => {
        const [userOrg] = await db
          .select()
          .from(organizations)
          .where(eq(organizations.ownerId, u.id))
          .limit(1);

        const orgId = userOrg?.id;
        let jobCount = 0;
        if (orgId) {
          const [jCount] = await db
            .select({ value: count() })
            .from(cronJobs)
            .where(eq(cronJobs.organizationId, orgId));
          jobCount = Number(jCount?.value || 0);
        }

        return {
          ...u,
          organization: userOrg || null,
          jobCount,
          planId: userOrg?.planId || 'free',
        };
      })
    );
  }

  async updateUserRole(targetUserId: string, role: 'admin' | 'user') {
    const [user] = await db.select().from(users).where(eq(users.id, targetUserId)).limit(1);
    if (!user) throw new NotFoundException('User not found');

    const [updated] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, targetUserId))
      .returning();

    this.fileLogger.logInfo(`Promoted/updated user ${user.email} role to ${role}`, 'ADMIN', { targetUserId, role });
    return updated;
  }

  async updateUserPlan(targetUserId: string, planId: string) {
    const [org] = await db.select().from(organizations).where(eq(organizations.ownerId, targetUserId)).limit(1);
    if (!org) throw new NotFoundException('User organization not found');

    const [updatedOrg] = await db
      .update(organizations)
      .set({ planId, updatedAt: new Date() })
      .where(eq(organizations.id, org.id))
      .returning();

    this.fileLogger.logInfo(`Updated organization ${org.name} plan to ${planId}`, 'ADMIN', { targetUserId, planId });
    return updatedOrg;
  }

  async deleteUser(targetUserId: string) {
    const [user] = await db.select().from(users).where(eq(users.id, targetUserId)).limit(1);
    if (!user) throw new NotFoundException('User not found');

    if (isPlatformAdmin(user.email)) {
      throw new NotFoundException('Cannot delete primary system developer admin account');
    }

    const orgs = await db.select().from(organizations).where(eq(organizations.ownerId, targetUserId));

    for (const org of orgs) {
      const jobs = await db.select().from(cronJobs).where(eq(cronJobs.organizationId, org.id));
      for (const job of jobs) {
        await db.delete(cronJobRuns).where(eq(cronJobRuns.cronJobId, job.id));
      }
      await db.delete(cronJobs).where(eq(cronJobs.organizationId, org.id));
      await db.delete(apiKeys).where(eq(apiKeys.organizationId, org.id));
      await db.delete(statusPages).where(eq(statusPages.organizationId, org.id));
      await db.delete(notificationChannels).where(eq(notificationChannels.organizationId, org.id));
      await db.delete(organizations).where(eq(organizations.id, org.id));
    }

    await db.delete(users).where(eq(users.id, targetUserId));
    this.fileLogger.logInfo(`Deleted user account ${user.email} (${targetUserId})`, 'ADMIN');
    return { success: true, message: `User ${user.email} deleted successfully` };
  }

  getConfig(): SystemRuntimeConfig {
    return this.runtimeConfig;
  }

  updateConfig(newConfig: Partial<SystemRuntimeConfig>): SystemRuntimeConfig {
    this.runtimeConfig = {
      ...this.runtimeConfig,
      ...newConfig,
    };
    this.fileLogger.logInfo(`Updated system runtime configuration`, 'ADMIN', this.runtimeConfig);
    return this.runtimeConfig;
  }
}
