import { Injectable, Logger } from '@nestjs/common';
import { db, systemSettings } from '@cron-saas/database';
import { eq } from 'drizzle-orm';

export interface PlanQuotas {
  maxJobs: number;
  minIntervalSeconds: number;
  historyRetentionDays: number;
  maxNotificationChannels: number;
  maxStatusPages: number;
  maxMonthlyEmails: number;
  maxApiKeys: number;
  maxTeamMembers: number;
  timeoutMs: number;
}

export interface PlanFeatures {
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
}

export interface PlanDefinition {
  id: 'free' | 'pro' | 'annual' | 'enterprise';
  name: string;
  description: string;
  enabled: boolean;
  quotas: PlanQuotas;
  features: PlanFeatures;
}

export interface PricingPermalinks {
  usdMonthly: string;
  usdAnnual: string;
  inrMonthly: string;
  inrAnnual: string;
}

export interface PricingConfig {
  usdMonthly: number;
  usdAnnual: number;
  inrMonthly: number;
  inrAnnual: number;
  inrMonthlyBase: number;
  gstRatePercent: number;
  discountTagUsd: string;
  discountTagInr: string;
  permalinks: PricingPermalinks;
  enterpriseNotice: string;
}

export interface PlansAndPricingSettings {
  plans: {
    free: PlanDefinition;
    pro: PlanDefinition;
    annual: PlanDefinition;
    enterprise: PlanDefinition;
  };
  pricing: PricingConfig;
}

export const DEFAULT_PLANS_AND_PRICING: PlansAndPricingSettings = {
  plans: {
    free: {
      id: 'free',
      name: 'Free Starter',
      description: 'Ideal for personal pet projects, side-hustle automations, and cron testing.',
      enabled: true,
      quotas: {
        maxJobs: 5,
        minIntervalSeconds: 60,
        historyRetentionDays: 3,
        maxNotificationChannels: 3,
        maxStatusPages: 1,
        maxMonthlyEmails: 50,
        maxApiKeys: 1,
        maxTeamMembers: 1,
        timeoutMs: 15000,
      },
      features: {
        customHeaders: true,
        webhookAlerts: true,
        priorityQueue: false,
        autoRetries: false,
        exportLogs: false,
        customDomainStatus: false,
        dedicatedWorker: false,
        siemIntegration: false,
        slaGuarantee: false,
        apiAccess: true,
        customSmtp: false,
        taxInvoicing: false,
      },
    },
    pro: {
      id: 'pro',
      name: 'Pro Platform',
      description: 'For production backend services, SaaS webhooks, and high-frequency scheduled jobs.',
      enabled: true,
      quotas: {
        maxJobs: 500,
        minIntervalSeconds: 10,
        historyRetentionDays: 30,
        maxNotificationChannels: 50,
        maxStatusPages: 10,
        maxMonthlyEmails: 10000,
        maxApiKeys: 25,
        maxTeamMembers: 10,
        timeoutMs: 30000,
      },
      features: {
        customHeaders: true,
        webhookAlerts: true,
        priorityQueue: true,
        autoRetries: true,
        exportLogs: true,
        customDomainStatus: true,
        dedicatedWorker: false,
        siemIntegration: false,
        slaGuarantee: true,
        apiAccess: true,
        customSmtp: false,
        taxInvoicing: true,
      },
    },
    annual: {
      id: 'annual',
      name: 'Annual VIP Pass',
      description: 'Annual Power Pass with 2x Double Capacity, 5s precision, and 90-day retention.',
      enabled: true,
      quotas: {
        maxJobs: 1000,
        minIntervalSeconds: 5,
        historyRetentionDays: 90,
        maxNotificationChannels: 9999,
        maxStatusPages: 9999,
        maxMonthlyEmails: 100000,
        maxApiKeys: 100,
        maxTeamMembers: 50,
        timeoutMs: 60000,
      },
      features: {
        customHeaders: true,
        webhookAlerts: true,
        priorityQueue: true,
        autoRetries: true,
        exportLogs: true,
        customDomainStatus: true,
        dedicatedWorker: false,
        siemIntegration: false,
        slaGuarantee: true,
        apiAccess: true,
        customSmtp: true,
        taxInvoicing: true,
      },
    },
    enterprise: {
      id: 'enterprise',
      name: 'Enterprise Dedicated',
      description: 'Dedicated isolated infrastructure, custom SLAs, VPC peering, and enterprise compliance.',
      enabled: true,
      quotas: {
        maxJobs: 999999,
        minIntervalSeconds: 1,
        historyRetentionDays: 365,
        maxNotificationChannels: 99999,
        maxStatusPages: 99999,
        maxMonthlyEmails: 9999999,
        maxApiKeys: 9999,
        maxTeamMembers: 9999,
        timeoutMs: 300000,
      },
      features: {
        customHeaders: true,
        webhookAlerts: true,
        priorityQueue: true,
        autoRetries: true,
        exportLogs: true,
        customDomainStatus: true,
        dedicatedWorker: true,
        siemIntegration: true,
        slaGuarantee: true,
        apiAccess: true,
        customSmtp: true,
        taxInvoicing: true,
      },
    },
  },
  pricing: {
    usdMonthly: 19,
    usdAnnual: 190,
    inrMonthly: 399,
    inrAnnual: 3295,
    inrMonthlyBase: 349,
    gstRatePercent: 18,
    discountTagUsd: 'Save 17%',
    discountTagInr: 'Save ~31%',
    permalinks: {
      usdMonthly: 'https://samastcron.gumroad.com/l/cron-ultra',
      usdAnnual: 'https://samastcron.gumroad.com/l/cron-ultra-annual',
      inrMonthly: 'https://samastcron.gumroad.com/l/cron-ultra-in-monthly',
      inrAnnual: 'https://samastcron.gumroad.com/l/cron-ultra-in-annual',
    },
    enterpriseNotice: 'Custom / tailored scale with Net 30 PO & GST ITC',
  },
};

const SETTINGS_KEY = 'plans_and_pricing';

@Injectable()
export class PlansPricingService {
  private readonly logger = new Logger(PlansPricingService.name);
  private cachedSettings: PlansAndPricingSettings = DEFAULT_PLANS_AND_PRICING;
  private lastFetchedAt = 0;
  private readonly CACHE_TTL_MS = 5000; // 5s cache

  async onModuleInit() {
    await this.getSettings();
  }

  /**
   * Retrieve plans and pricing settings with in-memory caching
   */
  async getSettings(): Promise<PlansAndPricingSettings> {
    const now = Date.now();
    if (this.cachedSettings && now - this.lastFetchedAt < this.CACHE_TTL_MS) {
      return this.cachedSettings;
    }

    try {
      const [record] = await db
        .select()
        .from(systemSettings)
        .where(eq(systemSettings.key, SETTINGS_KEY))
        .limit(1);

      if (record?.value) {
        // Deep merge with defaults to ensure all fields exist if schema expands
        this.cachedSettings = this.mergeWithDefaults(record.value as Partial<PlansAndPricingSettings>);
        this.lastFetchedAt = now;
        return this.cachedSettings;
      }

      // Seed defaults if row does not exist
      await db
        .insert(systemSettings)
        .values({
          key: SETTINGS_KEY,
          value: DEFAULT_PLANS_AND_PRICING,
          updatedBy: 'system_init',
        })
        .onConflictDoNothing();

      this.cachedSettings = DEFAULT_PLANS_AND_PRICING;
      this.lastFetchedAt = now;
      return this.cachedSettings;
    } catch (err: any) {
      this.logger.warn(`Failed to read system_settings: ${err.message}. Using defaults.`);
      return DEFAULT_PLANS_AND_PRICING;
    }
  }

  /**
   * Update plans and pricing settings
   */
  async updateSettings(
    newSettings: Partial<PlansAndPricingSettings>,
    updatedBy = 'admin'
  ): Promise<PlansAndPricingSettings> {
    const merged = this.mergeWithDefaults(newSettings);

    await db
      .insert(systemSettings)
      .values({
        key: SETTINGS_KEY,
        value: merged,
        updatedBy,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: {
          value: merged,
          updatedBy,
          updatedAt: new Date(),
        },
      });

    this.cachedSettings = merged;
    this.lastFetchedAt = Date.now();
    this.logger.log(`Plans & Pricing configuration updated by ${updatedBy}`);
    return this.cachedSettings;
  }

  /**
   * Reset to recommended defaults
   */
  async resetSettings(updatedBy = 'admin'): Promise<PlansAndPricingSettings> {
    return this.updateSettings(DEFAULT_PLANS_AND_PRICING, `${updatedBy}_reset`);
  }

  async resetToDefaults(updatedBy = 'admin'): Promise<PlansAndPricingSettings> {
    return this.resetSettings(updatedBy);
  }

  /**
   * Helper to merge user-provided settings with default fallback values
   */
  private mergeWithDefaults(incoming?: Partial<PlansAndPricingSettings>): PlansAndPricingSettings {
    if (!incoming) return DEFAULT_PLANS_AND_PRICING;

    return {
      plans: {
        free: {
          ...DEFAULT_PLANS_AND_PRICING.plans.free,
          ...(incoming.plans?.free || {}),
          quotas: {
            ...DEFAULT_PLANS_AND_PRICING.plans.free.quotas,
            ...(incoming.plans?.free?.quotas || {}),
          },
          features: {
            ...DEFAULT_PLANS_AND_PRICING.plans.free.features,
            ...(incoming.plans?.free?.features || {}),
          },
        },
        pro: {
          ...DEFAULT_PLANS_AND_PRICING.plans.pro,
          ...(incoming.plans?.pro || {}),
          quotas: {
            ...DEFAULT_PLANS_AND_PRICING.plans.pro.quotas,
            ...(incoming.plans?.pro?.quotas || {}),
          },
          features: {
            ...DEFAULT_PLANS_AND_PRICING.plans.pro.features,
            ...(incoming.plans?.pro?.features || {}),
          },
        },
        annual: {
          ...DEFAULT_PLANS_AND_PRICING.plans.annual,
          ...(incoming.plans?.annual || {}),
          quotas: {
            ...DEFAULT_PLANS_AND_PRICING.plans.annual.quotas,
            ...(incoming.plans?.annual?.quotas || {}),
          },
          features: {
            ...DEFAULT_PLANS_AND_PRICING.plans.annual.features,
            ...(incoming.plans?.annual?.features || {}),
          },
        },
        enterprise: {
          ...DEFAULT_PLANS_AND_PRICING.plans.enterprise,
          ...(incoming.plans?.enterprise || {}),
          quotas: {
            ...DEFAULT_PLANS_AND_PRICING.plans.enterprise.quotas,
            ...(incoming.plans?.enterprise?.quotas || {}),
          },
          features: {
            ...DEFAULT_PLANS_AND_PRICING.plans.enterprise.features,
            ...(incoming.plans?.enterprise?.features || {}),
          },
        },
      },
      pricing: {
        ...DEFAULT_PLANS_AND_PRICING.pricing,
        ...(incoming.pricing || {}),
        permalinks: {
          ...DEFAULT_PLANS_AND_PRICING.pricing.permalinks,
          ...(incoming.pricing?.permalinks || {}),
        },
      },
    };
  }
}
