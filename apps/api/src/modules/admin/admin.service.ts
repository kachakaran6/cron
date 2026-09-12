import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { db, users, organizations, cronJobs, cronJobRuns, statusPages, apiKeys } from '@cron-saas/database';
import { eq, sql, count, desc, gte } from 'drizzle-orm';
import { FileLoggerService } from '../../common/logger/file-logger.service';

export interface SystemRuntimeConfig {
  workerConcurrency: number;
  defaultTimeoutMs: number;
  blockPrivateIps: boolean;
  blockedRanges: string[];
  logRetentionDays: number;
  tlsAlertDaysBeforeExpiry: number;
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
  };

  constructor(private readonly fileLogger: FileLoggerService) {}

  async getStats() {
    // 1. Total counts
    const [userCountResult] = await db.select({ value: count() }).from(users);
    const [orgCountResult] = await db.select({ value: count() }).from(organizations);
    const [jobCountResult] = await db.select({ value: count() }).from(cronJobs);
    const [activeJobsResult] = await db
      .select({ value: count() })
      .from(cronJobs)
      .where(eq(cronJobs.enabled, true));
    const [statusPagesResult] = await db.select({ value: count() }).from(statusPages);
    const [apiKeysResult] = await db.select({ value: count() }).from(apiKeys);

    // 2. Execution metrics in last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [runs24hResult] = await db
      .select({ value: count() })
      .from(cronJobRuns)
      .where(gte(cronJobRuns.startedAt, twentyFourHoursAgo));

    const [success24hResult] = await db
      .select({ value: count() })
      .from(cronJobRuns)
      .where(sql`${cronJobRuns.startedAt} >= ${twentyFourHoursAgo} AND ${cronJobRuns.status} = 'SUCCESS'`);

    const [failed24hResult] = await db
      .select({ value: count() })
      .from(cronJobRuns)
      .where(sql`${cronJobRuns.startedAt} >= ${twentyFourHoursAgo} AND ${cronJobRuns.status} != 'SUCCESS'`);

    // Average latency
    const [avgLatencyResult] = await db
      .select({ avg: sql<number>`COALESCE(AVG(${cronJobRuns.durationMs}), 0)` })
      .from(cronJobRuns)
      .where(gte(cronJobRuns.startedAt, twentyFourHoursAgo));

    // Hourly throughput array for charts (last 12 hours)
    const hourlyThroughput: { hour: string; total: number; success: number; failed: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const start = new Date(Date.now() - (i + 1) * 60 * 60 * 1000);
      const end = new Date(Date.now() - i * 60 * 60 * 1000);
      const label = `${start.getHours()}:00`;

      const [hTotal] = await db
        .select({ value: count() })
        .from(cronJobRuns)
        .where(sql`${cronJobRuns.startedAt} >= ${start} AND ${cronJobRuns.startedAt} < ${end}`);

      const [hSuccess] = await db
        .select({ value: count() })
        .from(cronJobRuns)
        .where(sql`${cronJobRuns.startedAt} >= ${start} AND ${cronJobRuns.startedAt} < ${end} AND ${cronJobRuns.status} = 'SUCCESS'`);

      hourlyThroughput.push({
        hour: label,
        total: Number(hTotal?.value || 0),
        success: Number(hSuccess?.value || 0),
        failed: Number(hTotal?.value || 0) - Number(hSuccess?.value || 0),
      });
    }

    const total24h = Number(runs24hResult?.value || 0);
    const success24h = Number(success24hResult?.value || 0);
    const failed24h = Number(failed24hResult?.value || 0);
    const successRate = total24h > 0 ? Number(((success24h / total24h) * 100).toFixed(1)) : 100;

    // Node process memory info
    const memory = process.memoryUsage();

    return {
      overview: {
        totalUsers: Number(userCountResult?.value || 0),
        totalOrganizations: Number(orgCountResult?.value || 0),
        totalCronJobs: Number(jobCountResult?.value || 0),
        activeCronJobs: Number(activeJobsResult?.value || 0),
        totalStatusPages: Number(statusPagesResult?.value || 0),
        totalApiKeys: Number(apiKeysResult?.value || 0),
      },
      executions24h: {
        totalRuns: total24h,
        successCount: success24h,
        failedCount: failed24h,
        successRatePercentage: successRate,
        averageLatencyMs: Math.round(Number(avgLatencyResult?.avg || 0)),
      },
      charts: {
        hourlyThroughput,
        statusBreakdown: [
          { label: 'Success', count: success24h, color: '#10b981' },
          { label: 'Failed / Error', count: failed24h, color: '#f43f5e' },
        ],
      },
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

  async getLogs(options?: { level?: string; category?: string; search?: string; limit?: number; offset?: number }) {
    return this.fileLogger.queryLogs(options);
  }

  async getUsers() {
    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
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
