import { Injectable, Logger, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { db, subscriptions, gumroadAccounts, gumroadSyncLogs, organizations, entitlements, users } from '@cron-saas/database';
import { eq, and, desc, sql, count } from 'drizzle-orm';
import crypto from 'node:crypto';
import { EntitlementsService } from '../entitlements/entitlements.service';
import { PlansPricingService, PlansAndPricingSettings, PricingConfig } from '../admin/plans-pricing.service';

export interface PublicPricingTier {
  id: string;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  priceMonthlyInr?: number;
  priceYearlyInr?: number;
  currency: string;
  description: string;
  features: string[];
  highlight?: boolean;
  ctaText: string;
  checkoutUrl?: string;
  checkoutUrlAnnual?: string;
  checkoutUrlInMonthly?: string;
  checkoutUrlInAnnual?: string;
}

function cleanEnv(val?: string) {
  if (!val) return '';
  return val.replace(/^["']|["']$/g, '').trim();
}

function maskLicenseKey(key?: string | null): string {
  if (!key) return '—';
  const clean = key.trim();
  if (clean.length < 10) return '****';
  return `${clean.slice(0, 4)}-****-****-${clean.slice(-4)}`;
}

function maskEmail(email?: string | null): string {
  if (!email) return '—';
  const [user, domain] = email.split('@');
  if (!domain) return email;
  const maskedUser = user.length > 2 ? `${user[0]}***${user[user.length - 1]}` : `${user[0]}*`;
  return `${maskedUser}@${domain}`;
}

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly entitlementsService: EntitlementsService,
    private readonly plansPricingService: PlansPricingService,
  ) {}

  // Fallback in-memory dynamic settings if DB settings table is not present
  private runtimeConfig = {
    productId: cleanEnv(process.env.GUMROAD_PRODUCT_ID) || 'OdOoVIikKUjgEGHM8heD8g==',
    productPermalink: cleanEnv(process.env.GUMROAD_PRODUCT_PERMALINK) || 'https://samastcron.gumroad.com/l/cron-ultra',
    productIdAnnual: cleanEnv(process.env.GUMROAD_PRODUCT_ID_ANNUAL) || 'tNElkLdNPILrAwC2QsTvCQ==',
    productPermalinkAnnual: cleanEnv(process.env.GUMROAD_PRODUCT_PERMALINK_ANNUAL) || 'https://samastcron.gumroad.com/l/cron-ultra-annual',
    productIdInMonthly: cleanEnv(process.env.GUMROAD_PRODUCT_ID_IN_MONTHLY) || 'pJPiNAvUYpWyInGZbwd89w==',
    productPermalinkInMonthly: cleanEnv(process.env.GUMROAD_PRODUCT_PERMALINK_IN_MONTHLY) || 'https://samastcron.gumroad.com/l/cron-ultra-in-monthly',
    productIdInAnnual: cleanEnv(process.env.GUMROAD_PRODUCT_ID_IN_ANNUAL) || 'Ph98cw2wu7Q7DjVdyPkmvQ==',
    productPermalinkInAnnual: cleanEnv(process.env.GUMROAD_PRODUCT_PERMALINK_IN_ANNUAL) || 'https://samastcron.gumroad.com/l/cron-ultra-in-annual',
    webhookSecret: cleanEnv(process.env.GUMROAD_WEBHOOK_SECRET),
  };

  /**
   * Return public pricing tier information and checkout links dynamically configured by admin
   */
  async getTiers(userEmail?: string): Promise<{
    tiers: PublicPricingTier[];
    pricing: PricingConfig;
    plans: PlansAndPricingSettings['plans'];
    productPermalink: string;
    productPermalinkAnnual: string;
    productPermalinkInMonthly: string;
    productPermalinkInAnnual: string;
  }> {
    const settings = await this.plansPricingService.getSettings();
    const p = settings.pricing;
    const plans = settings.plans;

    const emailParam = userEmail ? `?email=${encodeURIComponent(userEmail)}` : '';
    const checkoutUrl = `${p.permalinks?.usdMonthly || this.runtimeConfig.productPermalink}${emailParam}`;
    const checkoutUrlAnnual = `${p.permalinks?.usdAnnual || this.runtimeConfig.productPermalinkAnnual}${emailParam}`;
    const checkoutUrlInMonthly = `${p.permalinks?.inrMonthly || this.runtimeConfig.productPermalinkInMonthly}${emailParam}`;
    const checkoutUrlInAnnual = `${p.permalinks?.inrAnnual || this.runtimeConfig.productPermalinkInAnnual}${emailParam}`;

    const tiers: PublicPricingTier[] = [
      {
        id: 'free',
        name: plans.free.name,
        priceMonthly: 0,
        priceYearly: 0,
        priceMonthlyInr: 0,
        priceYearlyInr: 0,
        currency: 'USD',
        description: plans.free.description,
        features: [
          `${plans.free.quotas.maxJobs} Active Scheduled Jobs`,
          `${plans.free.quotas.minIntervalSeconds}s minimum execution interval`,
          `${plans.free.quotas.historyRetentionDays}-day run log & body retention`,
          `${plans.free.quotas.maxMonthlyEmails} monthly email alerts`,
          `${plans.free.quotas.maxNotificationChannels} alert notification channels`,
          `${plans.free.quotas.maxStatusPages} public status page`,
          'Standard shared worker pool',
        ],
        ctaText: 'Current Free Tier',
      },
      {
        id: 'pro',
        name: plans.pro.name,
        priceMonthly: p.usdMonthly,
        priceYearly: p.usdAnnual,
        priceMonthlyInr: p.inrMonthly,
        priceYearlyInr: p.inrAnnual,
        currency: 'USD',
        description: plans.pro.description,
        highlight: true,
        features: [
          `${plans.pro.quotas.maxJobs} Active Scheduled Jobs`,
          `${plans.pro.quotas.minIntervalSeconds}s precision cron intervals`,
          `${plans.pro.quotas.historyRetentionDays}-day full HTTP execution logs & headers`,
          `${plans.pro.quotas.maxMonthlyEmails.toLocaleString()} monthly email alerts`,
          `${plans.pro.quotas.maxNotificationChannels} alert notification channels`,
          `${plans.pro.quotas.maxStatusPages} branded public status pages`,
          'Smart Auto-Retries & Error Dispatcher',
          'Priority worker execution queue',
          'Instant License Key activation',
          'Email & Discord priority support',
        ],
        ctaText: 'Upgrade to Pro',
        checkoutUrl,
        checkoutUrlAnnual,
        checkoutUrlInMonthly,
        checkoutUrlInAnnual,
      },
      {
        id: 'annual',
        name: plans.annual.name,
        priceMonthly: Math.round(p.usdAnnual / 12),
        priceYearly: p.usdAnnual,
        priceMonthlyInr: Math.round(p.inrAnnual / 12),
        priceYearlyInr: p.inrAnnual,
        currency: 'USD',
        description: plans.annual.description,
        features: [
          `${plans.annual.quotas.maxJobs} Active Scheduled Jobs (2x Double Capacity)`,
          `${plans.annual.quotas.minIntervalSeconds}s ultra-precision cron intervals`,
          `${plans.annual.quotas.historyRetentionDays}-day extended execution logs`,
          `${plans.annual.quotas.maxMonthlyEmails.toLocaleString()} monthly email alerts`,
          'Unlimited Push, Webhook & Email Channels',
          'Custom Domain Status Pages',
          'Custom SMTP Server Support',
          'VIP Priority Queue & 24/7 Support',
        ],
        ctaText: 'Get Annual Pass',
        checkoutUrl: checkoutUrlAnnual,
        checkoutUrlAnnual,
        checkoutUrlInMonthly: checkoutUrlInAnnual,
        checkoutUrlInAnnual,
      },
      {
        id: 'enterprise',
        name: plans.enterprise.name,
        priceMonthly: -1,
        priceYearly: -1,
        currency: 'USD',
        description: plans.enterprise.description,
        features: [
          'Unlimited Active Scheduled Jobs',
          `${plans.enterprise.quotas.minIntervalSeconds}s real-time execution intervals`,
          `${plans.enterprise.quotas.historyRetentionDays}-day SOC2 & HIPAA audit logs`,
          'Dedicated VPC Isolated Worker Pool',
          '99.99% Uptime SLA Guarantee',
          'SIEM & Datadog Event Streaming',
          'B2B Tax Invoicing & Net-30 Terms',
          'Dedicated 24/7 Technical Account Manager',
        ],
        ctaText: 'Contact Enterprise',
      },
    ];

    return {
      tiers,
      pricing: p,
      plans,
      productPermalink: checkoutUrl,
      productPermalinkAnnual: checkoutUrlAnnual,
      productPermalinkInMonthly: checkoutUrlInMonthly,
      productPermalinkInAnnual: checkoutUrlInAnnual,
    };
  }

  /**
   * Fetch current user subscription state
   */
  async getUserSubscription(userId: string, organizationId: string) {
    let [sub] = await db
      .select()
      .from(subscriptions)
      .where(and(eq(subscriptions.userId, userId), eq(subscriptions.organizationId, organizationId)))
      .limit(1);

    if (!sub) {
      // Provision default FREE subscription record
      [sub] = await db
        .insert(subscriptions)
        .values({
          userId,
          organizationId,
          plan: 'FREE',
          billingStatus: 'ACTIVE',
        })
        .onConflictDoNothing()
        .returning();

      if (!sub) {
        const [existing] = await db
          .select()
          .from(subscriptions)
          .where(and(eq(subscriptions.userId, userId), eq(subscriptions.organizationId, organizationId)))
          .limit(1);
        sub = existing;
      }
    }

    let gumroadAcc: any = null;
    if (sub?.gumroadLicenseKey) {
      [gumroadAcc] = await db
        .select()
        .from(gumroadAccounts)
        .where(eq(gumroadAccounts.gumroadLicenseKey, sub.gumroadLicenseKey))
        .limit(1);
    }

    const capabilities = await this.entitlementsService.getCapabilities(organizationId);
    const activePlan = capabilities.plan || 'FREE';
    const isPro = activePlan !== 'FREE';
    const isGracePeriod = sub?.gumroadStatus === 'CANCELLED' && isPro;

    const planName =
      activePlan === 'ENTERPRISE'
        ? 'Enterprise Dedicated'
        : activePlan === 'ANNUAL'
        ? 'Annual Pass'
        : activePlan === 'PRO'
        ? 'Pro Platform'
        : 'Free Starter';

    return {
      plan: activePlan,
      planName,
      billingStatus: sub?.billingStatus || 'ACTIVE',
      gumroadStatus: sub?.gumroadStatus || null,
      isPro,
      isGracePeriod,
      subscribedSince: sub?.subscribedSince || null,
      expiresAt: sub?.expiresAt || null,
      lastSyncedAt: sub?.lastSyncedAt || null,
      licenseKeyMasked: maskLicenseKey(sub?.gumroadLicenseKey),
      hasLicenseKey: Boolean(sub?.gumroadLicenseKey),
      capabilities,
      account: gumroadAcc
        ? {
            productName: gumroadAcc.productName || 'Samast Cron Pro',
            purchaseEmailMasked: maskEmail(gumroadAcc.purchaseEmail),
            customerName: gumroadAcc.customerName || null,
            status: gumroadAcc.status,
            renewalDate: gumroadAcc.renewalDate,
            endedDate: gumroadAcc.endedDate,
            manageUrl: 'https://gumroad.com/library',
          }
        : null,
    };
  }

  /**
   * Flow B: Instant License Key Verification via Gumroad API v2
   */
  async verifyAndActivateLicense(userId: string, organizationId: string, rawLicenseKey: string) {
    const licenseKey = rawLicenseKey?.trim();
    if (!licenseKey) {
      throw new BadRequestException('License key cannot be empty');
    }

    // Sandbox / Development Test Keys for instant verification testing
    const upperKey = licenseKey.toUpperCase();
    if (upperKey === 'TEST-CRON-PRO-MONTHLY' || upperKey === 'TEST-CRON-PRO-ANNUAL' || upperKey === 'TEST-CRON-FREE') {
      const isTestAnnual = upperKey === 'TEST-CRON-PRO-ANNUAL';
      const isTestFree = upperKey === 'TEST-CRON-FREE';
      const isPro = !isTestFree;
      const testStatus = isPro ? 'ACTIVE' : 'EXPIRED';

      const maxJobs = !isPro ? 5 : isTestAnnual ? 1000 : 500;
      const minIntervalSeconds = !isPro ? 60 : isTestAnnual ? 5 : 10;
      const historyRetentionDays = !isPro ? 3 : isTestAnnual ? 90 : 30;

      // Update subscriptions table
      const [existingSub] = await db
        .select()
        .from(subscriptions)
        .where(and(eq(subscriptions.userId, userId), eq(subscriptions.organizationId, organizationId)))
        .limit(1);

      if (existingSub) {
        await db
          .update(subscriptions)
          .set({
            plan: isPro ? 'PRO' : 'FREE',
            billingStatus: isPro ? 'ACTIVE' : 'EXPIRED',
            gumroadLicenseKey: licenseKey,
            gumroadStatus: testStatus,
            subscribedSince: new Date(),
            expiresAt: new Date(Date.now() + (isTestAnnual ? 365 : 30) * 86400000),
            lastSyncedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.id, existingSub.id));
      } else {
        await db.insert(subscriptions).values({
          userId,
          organizationId,
          plan: isPro ? 'PRO' : 'FREE',
          billingStatus: isPro ? 'ACTIVE' : 'EXPIRED',
          gumroadLicenseKey: licenseKey,
          gumroadStatus: testStatus,
          subscribedSince: new Date(),
          expiresAt: new Date(Date.now() + (isTestAnnual ? 365 : 30) * 86400000),
          lastSyncedAt: new Date(),
        });
      }

      await db
        .update(organizations)
        .set({ planId: isPro ? 'pro' : 'free', updatedAt: new Date() })
        .where(eq(organizations.id, organizationId));

      await db
        .insert(entitlements)
        .values({
          organizationId,
          maxJobs,
          minIntervalSeconds,
          historyRetentionDays,
          customHeaders: true,
          webhookAlerts: true,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: entitlements.organizationId,
          set: {
            maxJobs,
            minIntervalSeconds,
            historyRetentionDays,
            updatedAt: new Date(),
          },
        });

      await db.insert(gumroadSyncLogs).values({
        userId,
        eventType: 'LICENSE_VERIFY_SANDBOX',
        status: 'SUCCESS',
        licenseKey: maskLicenseKey(licenseKey),
        details: {
          mode: 'SANDBOX_TEST_KEY',
          plan: isPro ? 'PRO' : 'FREE',
          isAnnual: isTestAnnual,
          maxJobs,
        },
      });

      return {
        success: true,
        plan: isPro ? 'PRO' : 'FREE',
        status: testStatus,
        message: isTestFree
          ? 'Sandbox test: Reset back to Free Starter tier.'
          : isTestAnnual
          ? '🚀 [TEST KEY] Pro Annual Power Pass activated! 1,000 jobs, 5-second intervals, and 90 days history unlocked.'
          : '⚡ [TEST KEY] Pro Monthly plan activated! 500 jobs, 10-second intervals unlocked.',
        licenseKeyMasked: maskLicenseKey(licenseKey),
        isGracePeriod: false,
      };
    }

    // 1. Enforce 1-user license lock in database
    const [existingAccount] = await db
      .select()
      .from(gumroadAccounts)
      .where(eq(gumroadAccounts.gumroadLicenseKey, licenseKey))
      .limit(1);

    if (existingAccount && existingAccount.userId !== userId) {
      throw new BadRequestException('This license key is already claimed by another user account.');
    }

    // 2. Call Gumroad API v2
    const verifyUrl = 'https://api.gumroad.com/v2/licenses/verify';
    const bodyParams = new URLSearchParams({
      license_key: licenseKey,
      increment_uses_count: 'false',
    });

    let gumroadRes: any;
    try {
      const res = await fetch(verifyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: bodyParams.toString(),
        signal: AbortSignal.timeout(12000),
      });
      gumroadRes = (await res.json().catch(() => ({}))) as any;
    } catch (err: any) {
      this.logger.error(`Gumroad license verify network error: ${err.message}`);
      throw new BadRequestException(`Failed to connect to Gumroad license verification service: ${err.message}`);
    }

    if (!gumroadRes || gumroadRes.success !== true || !gumroadRes.purchase) {
      const errorMsg = gumroadRes?.message || 'Invalid or non-existent Gumroad license key';
      await db.insert(gumroadSyncLogs).values({
        userId,
        eventType: 'LICENSE_VERIFY',
        status: 'FAILED',
        licenseKey: maskLicenseKey(licenseKey),
        details: gumroadRes || {},
        errorMessage: errorMsg,
      });
      throw new BadRequestException(errorMsg);
    }

    const purchase = gumroadRes.purchase;

    // 3. Subscription State Machine & Business Rules
    const isRefunded = Boolean(purchase.refunded || purchase.chargebacked);
    const isEnded = Boolean(purchase.ended || (purchase.subscription_ended_at && new Date(purchase.subscription_ended_at) < new Date()));
    const isCancelled = Boolean(purchase.subscription_cancelled_at);

    // Active status logic: user cancelled auto-renew but still has active grace period until ended_at
    const isPro = !isRefunded && !isEnded;
    const status = isRefunded ? 'REFUNDED' : isEnded ? 'EXPIRED' : isCancelled ? 'CANCELLED' : 'ACTIVE';

    const purchaseDate = purchase.created_at ? new Date(purchase.created_at) : new Date();
    const renewalDate = purchase.subscription_failed_at ? null : purchase.subscription_ended_at ? new Date(purchase.subscription_ended_at) : null;
    const cancellationDate = purchase.subscription_cancelled_at ? new Date(purchase.subscription_cancelled_at) : null;
    const endedDate = purchase.subscription_ended_at ? new Date(purchase.subscription_ended_at) : null;

    // 4. Upsert GumroadAccount
    let accountId: string;
    if (existingAccount) {
      const [updated] = await db
        .update(gumroadAccounts)
        .set({
          userId,
          organizationId,
          gumroadProductId: purchase.product_id || this.runtimeConfig.productId || null,
          gumroadSubscriptionId: purchase.subscription_id || purchase.sale_id || null,
          purchaseEmail: purchase.email ? purchase.email.toLowerCase() : existingAccount.purchaseEmail,
          customerName: purchase.full_name || null,
          productName: purchase.product_name || 'Samast Cron Pro',
          permalink: purchase.permalink || null,
          priceCents: purchase.price || 0,
          status,
          purchaseDate,
          renewalDate,
          cancellationDate,
          endedDate,
          lastSyncedAt: new Date(),
          rawPayload: gumroadRes,
          updatedAt: new Date(),
        })
        .where(eq(gumroadAccounts.id, existingAccount.id))
        .returning();
      accountId = updated.id;
    } else {
      const [created] = await db
        .insert(gumroadAccounts)
        .values({
          userId,
          organizationId,
          gumroadProductId: purchase.product_id || this.runtimeConfig.productId || null,
          gumroadSubscriptionId: purchase.subscription_id || purchase.sale_id || null,
          gumroadLicenseKey: licenseKey,
          purchaseEmail: purchase.email ? purchase.email.toLowerCase() : null,
          customerName: purchase.full_name || null,
          productName: purchase.product_name || 'Samast Cron Pro',
          permalink: purchase.permalink || null,
          priceCents: purchase.price || 0,
          status,
          purchaseDate,
          renewalDate,
          cancellationDate,
          endedDate,
          lastSyncedAt: new Date(),
          rawPayload: gumroadRes,
        })
        .returning();
      accountId = created.id;
    }

    // 5. Upsert Subscriptions
    const [existingSub] = await db
      .select()
      .from(subscriptions)
      .where(and(eq(subscriptions.userId, userId), eq(subscriptions.organizationId, organizationId)))
      .limit(1);

    if (existingSub) {
      await db
        .update(subscriptions)
        .set({
          plan: isPro ? 'PRO' : 'FREE',
          billingStatus: isPro ? 'ACTIVE' : 'EXPIRED',
          gumroadAccountId: accountId,
          gumroadProductId: purchase.product_id || null,
          gumroadSubscriptionId: purchase.subscription_id || purchase.sale_id || null,
          gumroadLicenseKey: licenseKey,
          gumroadStatus: status,
          subscribedSince: purchaseDate,
          expiresAt: endedDate,
          lastSyncedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.id, existingSub.id));
    } else {
      await db.insert(subscriptions).values({
        userId,
        organizationId,
        plan: isPro ? 'PRO' : 'FREE',
        billingStatus: isPro ? 'ACTIVE' : 'EXPIRED',
        gumroadAccountId: accountId,
        gumroadProductId: purchase.product_id || null,
        gumroadSubscriptionId: purchase.subscription_id || purchase.sale_id || null,
        gumroadLicenseKey: licenseKey,
        gumroadStatus: status,
        subscribedSince: purchaseDate,
        expiresAt: endedDate,
        lastSyncedAt: new Date(),
      });
    }

    // 6. Update Organization Plan & Entitlements
    await db
      .update(organizations)
      .set({ planId: isPro ? 'pro' : 'free', updatedAt: new Date() })
      .where(eq(organizations.id, organizationId));

    // 6. Update Organization Plan & Entitlements (Annual plans receive 1,000 jobs, 5s intervals, 90d retention)
    const isAnnual = Boolean(
      purchase.product_id === this.runtimeConfig.productIdAnnual ||
      purchase.product_id === this.runtimeConfig.productIdInAnnual ||
      (purchase.price && purchase.price >= 2500) ||
      (purchase.product_name && purchase.product_name.toLowerCase().includes('annual'))
    );

    const maxJobs = !isPro ? 5 : isAnnual ? 1000 : 500;
    const minIntervalSeconds = !isPro ? 60 : isAnnual ? 5 : 10;
    const historyRetentionDays = !isPro ? 3 : isAnnual ? 90 : 30;

    await db
      .update(organizations)
      .set({ planId: isPro ? 'pro' : 'free', updatedAt: new Date() })
      .where(eq(organizations.id, organizationId));

    // Update entitlements table limits
    await db
      .insert(entitlements)
      .values({
        organizationId,
        maxJobs,
        minIntervalSeconds,
        historyRetentionDays,
        customHeaders: true,
        webhookAlerts: true,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: entitlements.organizationId,
        set: {
          maxJobs,
          minIntervalSeconds,
          historyRetentionDays,
          updatedAt: new Date(),
        },
      });

    // 7. Write Audit Log
    await db.insert(gumroadSyncLogs).values({
      userId,
      eventType: 'LICENSE_VERIFY',
      status: 'SUCCESS',
      gumroadSubscriptionId: purchase.subscription_id || purchase.sale_id || null,
      licenseKey: maskLicenseKey(licenseKey),
      details: {
        buyerEmail: maskEmail(purchase.email),
        plan: isPro ? 'PRO' : 'FREE',
        isAnnual,
        maxJobs,
        status,
        productName: purchase.product_name,
      },
    });

    this.logger.log(`✓ License verified for user ${userId}: plan=${isPro ? 'PRO' : 'FREE'} isAnnual=${isAnnual} status=${status}`);

    const successMessage = isAnnual
      ? '🚀 Pro Annual Power Pass activated! 1,000 active schedules, 5-second precision, and 90 days log retention unlocked.'
      : '⚡ Pro plan activated successfully! High-frequency cron and 500 schedules unlocked.';

    return {
      success: true,
      plan: isPro ? 'PRO' : 'FREE',
      status,
      message: isPro ? successMessage : 'License verified, but subscription is currently inactive.',
      licenseKeyMasked: maskLicenseKey(licenseKey),
      isGracePeriod: isCancelled && isPro,
    };
  }

  /**
   * Re-sync subscription with Gumroad API
   */
  async syncSubscription(userId: string, organizationId: string) {
    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(and(eq(subscriptions.userId, userId), eq(subscriptions.organizationId, organizationId)))
      .limit(1);

    if (!sub || !sub.gumroadLicenseKey) {
      return {
        success: true,
        plan: 'FREE',
        message: 'No Gumroad license key found for this account.',
      };
    }

    return await this.verifyAndActivateLicense(userId, organizationId, sub.gumroadLicenseKey);
  }

  /**
   * Flow A: Webhook Ingestion Engine (`/api/v1/webhooks/gumroad`)
   */
  async handleWebhook(payload: any, rawBody?: string, signature?: string) {
    const secret = this.runtimeConfig.webhookSecret;

    // Optional HMAC signature check
    if (secret && signature && rawBody) {
      try {
        const expectedSig = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
        const isValid = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig));
        if (!isValid) {
          this.logger.warn('Gumroad webhook signature mismatch');
          throw new UnauthorizedException('Invalid webhook signature');
        }
      } catch (err: any) {
        this.logger.warn(`Signature verification failed: ${err.message}`);
      }
    }

    const resourceName = (payload.resource_name || payload.event || '').toLowerCase();
    const licenseKey = payload.license_key || payload.license_key_id || null;
    const email = (payload.email || payload.buyer_email || '').toLowerCase().trim();
    const subscriptionId = payload.subscription_id || payload.sale_id || null;

    this.logger.log(`Received Gumroad webhook: event=${resourceName} email=${email} subId=${subscriptionId}`);

    // Map Gumroad event to status
    let status = 'ACTIVE';
    let isPro = true;

    switch (resourceName) {
      case 'sale':
      case 'subscription_updated':
      case 'subscription_restarted':
        status = 'ACTIVE';
        isPro = true;
        break;
      case 'subscription_cancelled':
        status = 'CANCELLED';
        // Grace period: keep Pro active until current period ends
        isPro = true;
        break;
      case 'subscription_ended':
      case 'subscription_ended_failed':
      case 'ended_failed':
        status = 'EXPIRED';
        isPro = false;
        break;
      case 'refund':
      case 'dispute':
        status = 'REFUNDED';
        isPro = false;
        break;
      default:
        status = 'ACTIVE';
        isPro = true;
    }

    // 1. Identify User
    let matchedUserId: string | null = null;
    let matchedOrgId: string | null = null;

    if (licenseKey) {
      const [acc] = await db
        .select({ userId: gumroadAccounts.userId, orgId: gumroadAccounts.organizationId })
        .from(gumroadAccounts)
        .where(eq(gumroadAccounts.gumroadLicenseKey, licenseKey))
        .limit(1);

      if (acc) {
        matchedUserId = acc.userId;
        matchedOrgId = acc.orgId || null;
      }
    }

    if (!matchedUserId && email) {
      const [u] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (u) {
        matchedUserId = u.id;
        const [org] = await db
          .select({ id: organizations.id })
          .from(organizations)
          .where(eq(organizations.ownerId, u.id))
          .limit(1);
        matchedOrgId = org?.id || null;
      }
    }

    // Write audit log
    await db.insert(gumroadSyncLogs).values({
      userId: matchedUserId,
      eventType: 'WEBHOOK',
      status: matchedUserId ? 'SUCCESS' : 'IGNORED',
      gumroadSubscriptionId: subscriptionId,
      licenseKey: licenseKey ? maskLicenseKey(licenseKey) : null,
      details: {
        event: resourceName,
        buyerEmail: maskEmail(email),
        plan: isPro ? 'PRO' : 'FREE',
        status,
        hasMatchedUser: Boolean(matchedUserId),
      },
    });

    // If user matched, update state
    if (matchedUserId && matchedOrgId) {
      const [sub] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, matchedUserId))
        .limit(1);

      if (sub) {
        await db
          .update(subscriptions)
          .set({
            plan: isPro ? 'PRO' : 'FREE',
            billingStatus: isPro ? 'ACTIVE' : 'EXPIRED',
            gumroadStatus: status,
            lastSyncedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.id, sub.id));
      }

      await db
        .update(organizations)
        .set({ planId: isPro ? 'pro' : 'free', updatedAt: new Date() })
        .where(eq(organizations.id, matchedOrgId));

      await db
        .update(entitlements)
        .set({
          maxJobs: isPro ? 500 : 5,
          minIntervalSeconds: isPro ? 10 : 60,
          historyRetentionDays: isPro ? 30 : 3,
          updatedAt: new Date(),
        })
        .where(eq(entitlements.organizationId, matchedOrgId));
    }

    return { success: true, status: 'PROCESSED' };
  }

  /**
   * Admin Hub: Metrics and Audit logs
   */
  async getAdminData() {
    const [totalSubscribersRes] = await db.select({ value: count() }).from(subscriptions);
    const [activeProRes] = await db
      .select({ value: count() })
      .from(subscriptions)
      .where(eq(subscriptions.plan, 'PRO'));

    const [cancelledRes] = await db
      .select({ value: count() })
      .from(subscriptions)
      .where(eq(subscriptions.gumroadStatus, 'CANCELLED'));

    const [expiredRes] = await db
      .select({ value: count() })
      .from(subscriptions)
      .where(eq(subscriptions.gumroadStatus, 'EXPIRED'));

    const recentLogs = await db
      .select()
      .from(gumroadSyncLogs)
      .orderBy(desc(gumroadSyncLogs.createdAt))
      .limit(50);

    const recentAccounts = await db
      .select({
        id: gumroadAccounts.id,
        purchaseEmail: gumroadAccounts.purchaseEmail,
        customerName: gumroadAccounts.customerName,
        productName: gumroadAccounts.productName,
        status: gumroadAccounts.status,
        licenseKey: gumroadAccounts.gumroadLicenseKey,
        purchaseDate: gumroadAccounts.purchaseDate,
        lastSyncedAt: gumroadAccounts.lastSyncedAt,
      })
      .from(gumroadAccounts)
      .orderBy(desc(gumroadAccounts.createdAt))
      .limit(20);

    const activeProCount = activeProRes?.value ? Number(activeProRes.value) : 0;
    const estimatedMrr = activeProCount * 19; // $19 / mo per Pro subscriber

    return {
      metrics: {
        totalSubscribers: totalSubscribersRes?.value ? Number(totalSubscribersRes.value) : 0,
        activePro: activeProCount,
        cancelledGracePeriod: cancelledRes?.value ? Number(cancelledRes.value) : 0,
        expired: expiredRes?.value ? Number(expiredRes.value) : 0,
        estimatedMrr,
      },
      config: {
        productId: this.runtimeConfig.productId || 'Not set (optional)',
        productPermalink: this.runtimeConfig.productPermalink,
        webhookSecretConfigured: Boolean(this.runtimeConfig.webhookSecret),
      },
      recentLogs,
      recentAccounts: recentAccounts.map((acc) => ({
        ...acc,
        licenseKey: maskLicenseKey(acc.licenseKey),
        purchaseEmail: maskEmail(acc.purchaseEmail),
      })),
    };
  }

  /**
   * Update configuration dynamically from Admin dashboard
   */
  updateConfig(data: { productId?: string; productPermalink?: string; webhookSecret?: string }) {
    if (data.productId !== undefined) this.runtimeConfig.productId = data.productId.trim();
    if (data.productPermalink !== undefined) this.runtimeConfig.productPermalink = data.productPermalink.trim();
    if (data.webhookSecret !== undefined) this.runtimeConfig.webhookSecret = data.webhookSecret.trim();

    return {
      success: true,
      message: 'Gumroad configuration updated successfully',
      config: {
        productId: this.runtimeConfig.productId,
        productPermalink: this.runtimeConfig.productPermalink,
        webhookSecretConfigured: Boolean(this.runtimeConfig.webhookSecret),
      },
    };
  }
}
