import { Injectable, ForbiddenException, Logger } from '@nestjs/common';
import {
  db,
  cronJobs,
  subscriptions,
  organizations,
  entitlements,
  notificationChannels,
  statusPages,
} from '@cron-saas/database';
import { count, eq } from 'drizzle-orm';
import {
  PlansPricingService,
  PlanFeatures,
  PlanQuotas,
  DEFAULT_PLANS_AND_PRICING,
} from '../admin/plans-pricing.service';

export interface PlanCapabilities {
  plan: 'FREE' | 'PRO' | 'ANNUAL' | 'ENTERPRISE';
  maxJobs: number;
  minIntervalSeconds: number;
  historyRetentionDays: number;
  maxNotificationChannels: number;
  maxStatusPages: number;
  maxMonthlyEmails: number;
  maxApiKeys: number;
  maxTeamMembers: number;
  timeoutMs: number;
  customHeaders: boolean;
  webhookAlerts: boolean;
  priorityQueue: boolean;
  autoRetries: boolean;
  exportLogs: boolean;
  customDomainStatus: boolean;
  dedicatedWorker: boolean;
  siemIntegration: boolean;
  slaGuarantee: boolean;
  apiAccess: boolean;
  customSmtp: boolean;
  taxInvoicing: boolean;
  features: PlanFeatures;
  quotas: PlanQuotas;
}

@Injectable()
export class EntitlementsService {
  private readonly logger = new Logger(EntitlementsService.name);
  private monthlyEmailUsage = new Map<string, { count: number; month: string }>();

  constructor(private readonly plansPricingService: PlansPricingService) {}

  private getMonthlyEmailCount(organizationId: string): number {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const record = this.monthlyEmailUsage.get(organizationId);
    if (!record || record.month !== currentMonth) {
      this.monthlyEmailUsage.set(organizationId, { count: 0, month: currentMonth });
      return 0;
    }
    return record.count;
  }

  recordEmailSent(organizationId: string): void {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const record = this.monthlyEmailUsage.get(organizationId);
    if (!record || record.month !== currentMonth) {
      this.monthlyEmailUsage.set(organizationId, { count: 1, month: currentMonth });
    } else {
      record.count += 1;
    }
  }

  async getCapabilities(organizationId: string): Promise<PlanCapabilities> {
    try {
      const settings = await this.plansPricingService.getSettings();

      // 1. Check subscriptions table for active plan
      const [sub] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.organizationId, organizationId))
        .limit(1);

      let activePlan: 'FREE' | 'PRO' | 'ANNUAL' | 'ENTERPRISE' = 'FREE';

      if (sub && sub.billingStatus !== 'CANCELLED' && sub.gumroadStatus !== 'EXPIRED' && sub.gumroadStatus !== 'REFUNDED') {
        const p = (sub.plan || 'FREE').toUpperCase();
        if (p === 'ENTERPRISE') activePlan = 'ENTERPRISE';
        else if (p === 'ANNUAL') activePlan = 'ANNUAL';
        else if (p === 'PRO') activePlan = 'PRO';
      }

      if (activePlan === 'FREE') {
        // Check organization planId
        const [org] = await db
          .select({ planId: organizations.planId })
          .from(organizations)
          .where(eq(organizations.id, organizationId))
          .limit(1);

        if (org?.planId) {
          const orgPlan = org.planId.toLowerCase();
          if (orgPlan === 'enterprise') activePlan = 'ENTERPRISE';
          else if (orgPlan === 'annual') activePlan = 'ANNUAL';
          else if (orgPlan === 'pro') activePlan = 'PRO';
        }
      }

      // Check entitlements table override
      const [ent] = await db
        .select()
        .from(entitlements)
        .where(eq(entitlements.organizationId, organizationId))
        .limit(1);

      if (ent) {
        if (ent.maxJobs >= 5000) activePlan = 'ENTERPRISE';
        else if (ent.maxJobs >= 1000 || ent.historyRetentionDays >= 90) activePlan = 'ANNUAL';
        else if (ent.maxJobs >= 500) activePlan = 'PRO';
      }

      const planKey = (activePlan.toLowerCase() as 'free' | 'pro' | 'annual' | 'enterprise');
      const planDef = settings.plans[planKey] || settings.plans.free;

      const quotas: PlanQuotas = {
        maxJobs: ent?.maxJobs ?? planDef.quotas.maxJobs,
        minIntervalSeconds: ent?.minIntervalSeconds ?? planDef.quotas.minIntervalSeconds,
        historyRetentionDays: ent?.historyRetentionDays ?? planDef.quotas.historyRetentionDays,
        maxNotificationChannels: planDef.quotas.maxNotificationChannels,
        maxStatusPages: planDef.quotas.maxStatusPages,
        maxMonthlyEmails: planDef.quotas.maxMonthlyEmails,
        maxApiKeys: planDef.quotas.maxApiKeys,
        maxTeamMembers: planDef.quotas.maxTeamMembers,
        timeoutMs: planDef.quotas.timeoutMs,
      };

      return {
        plan: activePlan,
        maxJobs: quotas.maxJobs,
        minIntervalSeconds: quotas.minIntervalSeconds,
        historyRetentionDays: quotas.historyRetentionDays,
        maxNotificationChannels: quotas.maxNotificationChannels,
        maxStatusPages: quotas.maxStatusPages,
        maxMonthlyEmails: quotas.maxMonthlyEmails,
        maxApiKeys: quotas.maxApiKeys,
        maxTeamMembers: quotas.maxTeamMembers,
        timeoutMs: quotas.timeoutMs,
        customHeaders: planDef.features.customHeaders,
        webhookAlerts: planDef.features.webhookAlerts,
        priorityQueue: planDef.features.priorityQueue,
        autoRetries: planDef.features.autoRetries,
        exportLogs: planDef.features.exportLogs,
        customDomainStatus: planDef.features.customDomainStatus,
        dedicatedWorker: planDef.features.dedicatedWorker,
        siemIntegration: planDef.features.siemIntegration,
        slaGuarantee: planDef.features.slaGuarantee,
        apiAccess: planDef.features.apiAccess,
        customSmtp: planDef.features.customSmtp,
        taxInvoicing: planDef.features.taxInvoicing,
        features: planDef.features,
        quotas,
      };
    } catch (err: any) {
      this.logger.warn(`Failed to resolve dynamic entitlements, falling back to default FREE: ${err.message}`);
      const freeDef = DEFAULT_PLANS_AND_PRICING.plans.free;
      return {
        plan: 'FREE',
        ...freeDef.quotas,
        ...freeDef.features,
        features: freeDef.features,
        quotas: freeDef.quotas,
      };
    }
  }

  /**
   * Enforce max jobs per organization
   */
  async assertCanCreateJob(organizationId: string): Promise<void> {
    const caps = await this.getCapabilities(organizationId);

    const [jobCount] = await db
      .select({ value: count() })
      .from(cronJobs)
      .where(eq(cronJobs.organizationId, organizationId));

    const currentCount = jobCount?.value ? Number(jobCount.value) : 0;
    if (currentCount >= caps.maxJobs) {
      throw new ForbiddenException(
        `Job limit reached for ${caps.plan} tier (${currentCount}/${caps.maxJobs} active jobs). Upgrade plan in settings to increase active job limits.`
      );
    }
  }

  /**
   * Enforce minimum schedule interval
   */
  async assertCanSetInterval(organizationId: string, intervalSeconds: number): Promise<void> {
    const caps = await this.getCapabilities(organizationId);

    if (intervalSeconds < caps.minIntervalSeconds) {
      throw new ForbiddenException(
        `Your ${caps.plan} plan allows a minimum execution interval of ${caps.minIntervalSeconds}s (requested: ${intervalSeconds}s). Upgrade plan to unlock faster execution intervals.`
      );
    }
  }

  /**
   * Enforce notification channels limits
   */
  async assertCanCreateNotificationChannel(organizationId: string): Promise<void> {
    const caps = await this.getCapabilities(organizationId);

    const [channelCount] = await db
      .select({ value: count() })
      .from(notificationChannels)
      .where(eq(notificationChannels.organizationId, organizationId));

    const currentCount = channelCount?.value ? Number(channelCount.value) : 0;
    if (currentCount >= caps.maxNotificationChannels) {
      throw new ForbiddenException(
        `Notification channels limit reached for ${caps.plan} tier (${currentCount}/${caps.maxNotificationChannels}). Upgrade plan to add more alert channels.`
      );
    }
  }

  /**
   * Enforce status page limits
   */
  async assertCanCreateStatusPage(organizationId: string): Promise<void> {
    const caps = await this.getCapabilities(organizationId);

    const [pageCount] = await db
      .select({ value: count() })
      .from(statusPages)
      .where(eq(statusPages.organizationId, organizationId));

    const currentCount = pageCount?.value ? Number(pageCount.value) : 0;
    if (currentCount >= caps.maxStatusPages) {
      throw new ForbiddenException(
        `Status page limit reached for ${caps.plan} tier (${currentCount}/${caps.maxStatusPages}). Upgrade plan to host more status pages.`
      );
    }
  }

  /**
   * Enforce email dispatch quota and feature availability
   */
  async assertCanSendEmail(organizationId: string): Promise<void> {
    const caps = await this.getCapabilities(organizationId);

    if (!caps.webhookAlerts && !caps.customSmtp && caps.maxMonthlyEmails <= 0) {
      throw new ForbiddenException(
        `Email alerts are disabled on your current ${caps.plan} plan. Please upgrade to Pro or Annual to enable alert dispatching.`
      );
    }

    const currentUsage = this.getMonthlyEmailCount(organizationId);
    if (currentUsage >= caps.maxMonthlyEmails) {
      throw new ForbiddenException(
        `Monthly email quota reached for ${caps.plan} tier (${currentUsage}/${caps.maxMonthlyEmails} emails sent this month). Upgrade your plan to increase email quotas.`
      );
    }
  }

  /**
   * Enforce specific feature flag toggle
   */
  async assertCanUseFeature(organizationId: string, feature: keyof PlanFeatures): Promise<void> {
    const caps = await this.getCapabilities(organizationId);
    if (!caps.features[feature]) {
      throw new ForbiddenException(
        `Feature '${String(feature)}' is not enabled on your current ${caps.plan} plan. Upgrade to unlock this feature.`
      );
    }
  }
}
