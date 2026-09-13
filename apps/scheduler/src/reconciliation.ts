import { db, gumroadAccounts, subscriptions, gumroadSyncLogs, organizations, entitlements } from '@cron-saas/database';
import { inArray, eq } from 'drizzle-orm';

export async function reconcileGumroadSubscriptions() {
  try {
    const activeAccounts = await db
      .select()
      .from(gumroadAccounts)
      .where(inArray(gumroadAccounts.status, ['ACTIVE', 'CANCELLED']));

    if (!activeAccounts || activeAccounts.length === 0) return;

    console.log(`[Reconciliation] Reconciling ${activeAccounts.length} Gumroad subscriptions...`);

    for (const acc of activeAccounts) {
      if (!acc.gumroadLicenseKey) continue;

      try {
        const bodyParams = new URLSearchParams({
          license_key: acc.gumroadLicenseKey,
          increment_uses_count: 'false',
        });
        if (acc.gumroadProductId) {
          bodyParams.append('product_id', acc.gumroadProductId);
        }

        const res = await fetch('https://api.gumroad.com/v2/licenses/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: bodyParams.toString(),
          signal: AbortSignal.timeout(10000),
        });

        const data = (await res.json().catch(() => ({}))) as any;

        if (data && data.success && data.purchase) {
          const purchase = data.purchase;
          const isRefunded = Boolean(purchase.refunded || purchase.chargebacked);
          const isEnded = Boolean(purchase.ended || (purchase.subscription_ended_at && new Date(purchase.subscription_ended_at) < new Date()));
          const isCancelled = Boolean(purchase.subscription_cancelled_at);

          const isPro = !isRefunded && !isEnded;
          const status = isRefunded ? 'REFUNDED' : isEnded ? 'EXPIRED' : isCancelled ? 'CANCELLED' : 'ACTIVE';

          await db
            .update(gumroadAccounts)
            .set({
              status,
              lastSyncedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(gumroadAccounts.id, acc.id));

          await db
            .update(subscriptions)
            .set({
              plan: isPro ? 'PRO' : 'FREE',
              billingStatus: isPro ? 'ACTIVE' : 'EXPIRED',
              gumroadStatus: status,
              lastSyncedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(subscriptions.gumroadAccountId, acc.id));

          if (acc.organizationId) {
            await db
              .update(organizations)
              .set({ planId: isPro ? 'pro' : 'free', updatedAt: new Date() })
              .where(eq(organizations.id, acc.organizationId));

            await db
              .update(entitlements)
              .set({
                maxJobs: isPro ? 500 : 5,
                minIntervalSeconds: isPro ? 10 : 60,
                historyRetentionDays: isPro ? 30 : 3,
                updatedAt: new Date(),
              })
              .where(eq(entitlements.organizationId, acc.organizationId));
          }

          await db.insert(gumroadSyncLogs).values({
            userId: acc.userId,
            eventType: 'CRON_SYNC',
            status: 'SUCCESS',
            gumroadSubscriptionId: acc.gumroadSubscriptionId,
            licenseKey: acc.gumroadLicenseKey,
            details: { status, plan: isPro ? 'PRO' : 'FREE' },
          });
        }
      } catch (err: any) {
        console.error(`[Reconciliation] Error reconciling account ${acc.id}:`, err.message);
      }
    }
  } catch (err: any) {
    console.error('[Reconciliation] Error in reconcileGumroadSubscriptions:', err.message);
  }
}
