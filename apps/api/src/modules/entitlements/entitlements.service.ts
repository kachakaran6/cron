import { Injectable, ForbiddenException } from '@nestjs/common';
import { db, cronJobs } from '@cron-saas/database';
import { count, eq } from 'drizzle-orm';

export interface PlanCapabilities {
  maxJobs: number;
  minIntervalSeconds: number;
  historyRetentionDays: number;
  customHeaders: boolean;
  webhookAlerts: boolean;
}

@Injectable()
export class EntitlementsService {
  private readonly freePlan: PlanCapabilities = {
    maxJobs: 500,
    minIntervalSeconds: 60,
    historyRetentionDays: 30,
    customHeaders: true,
    webhookAlerts: true,
  };

  async getCapabilities(organizationId: string): Promise<PlanCapabilities> {
    return this.freePlan;
  }

  async assertCanCreateJob(organizationId: string): Promise<void> {
    const caps = await this.getCapabilities(organizationId);

    const [jobCount] = await db
      .select({ value: count() })
      .from(cronJobs)
      .where(eq(cronJobs.organizationId, organizationId));

    const currentCount = jobCount?.value ? Number(jobCount.value) : 0;
    if (currentCount >= caps.maxJobs) {
      throw new ForbiddenException(
        `Job limit reached for current tier (${currentCount}/${caps.maxJobs}). Contact support for higher limits.`
      );
    }
  }
}
