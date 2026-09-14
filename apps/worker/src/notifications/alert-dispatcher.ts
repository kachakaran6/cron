import { db, cronJobs, cronJobRuns, notificationChannels, subscriptions, organizations, users } from '@cron-saas/database';
import { eq, and, desc } from 'drizzle-orm';
import IORedis from 'ioredis';
import nodemailer from 'nodemailer';

let redisClient: IORedis | null = null;
function getRedis(): IORedis {
  if (!redisClient) {
    redisClient = new IORedis({
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      lazyConnect: true,
      maxRetriesPerRequest: 1,
    });
    redisClient.connect().catch(() => {});
  }
  return redisClient;
}

function cleanEnv(val?: string) {
  if (!val) return '';
  return val.replace(/^["']|["']$/g, '').trim();
}

export async function checkAndDispatchAlerts(
  cronJobId: string,
  currentStatus: 'SUCCESS' | 'FAILED',
  httpStatus: number | null,
  errorMessage: string | null,
  durationMs: number
) {
  try {
    const [job] = await db
      .select()
      .from(cronJobs)
      .where(eq(cronJobs.id, cronJobId))
      .limit(1);

    if (!job) return;

    // Check last runs to detect state transition (failure threshold or recovery)
    const recentRuns = await db
      .select({ status: cronJobRuns.status })
      .from(cronJobRuns)
      .where(eq(cronJobRuns.cronJobId, cronJobId))
      .orderBy(desc(cronJobRuns.startedAt))
      .limit(15);

    const previousRun = recentRuns[1]; // run immediately before current one

    let shouldAlert = false;
    let eventType: 'JOB_FAILED' | 'JOB_RECOVERED' = 'JOB_FAILED';
    let title = '';
    let message = '';

    let consecutiveFailures = 0;
    for (const r of recentRuns) {
      if (r.status !== 'SUCCESS') consecutiveFailures++;
      else break;
    }

    if (currentStatus === 'FAILED' && job.notifyOnFailure !== false) {
      const threshold = job.failureThreshold || 1;

      if (consecutiveFailures >= threshold) {
        shouldAlert = true;
        eventType = 'JOB_FAILED';
        title = `Job Execution Alert: ${job.name} Failed`;
        message = `Scheduled HTTP job "${job.name}" failed with ${errorMessage || `HTTP ${httpStatus}`} (${consecutiveFailures} consecutive failure(s)). Target URL: ${job.url}`;
      }
    } else if (currentStatus === 'SUCCESS' && previousRun && previousRun.status === 'FAILED' && job.notifyOnRecovery !== false) {
      shouldAlert = true;
      eventType = 'JOB_RECOVERED';
      title = `Job Recovery Alert: ${job.name} Restored`;
      message = `Scheduled HTTP job "${job.name}" has successfully recovered in ${durationMs}ms (HTTP ${httpStatus}). Target URL: ${job.url}`;
    }

    if (!shouldAlert) return;

    // Fetch active notification channels for this organization
    let channels = await db
      .select()
      .from(notificationChannels)
      .where(
        and(
          eq(notificationChannels.organizationId, job.organizationId),
          eq(notificationChannels.enabled, true)
        )
      );

    const selectedChannelIds = (job as any).notificationChannelIds as string[] | undefined;
    if (Array.isArray(selectedChannelIds) && selectedChannelIds.length > 0 && !selectedChannelIds.includes('ALL')) {
      channels = channels.filter((ch) => selectedChannelIds.includes(ch.id));
    }

    if (!channels || channels.length === 0) {
      const [org] = await db
        .select({ ownerId: organizations.ownerId })
        .from(organizations)
        .where(eq(organizations.id, job.organizationId))
        .limit(1);

      if (org?.ownerId) {
        const [owner] = await db
          .select({ email: users.email, name: users.name })
          .from(users)
          .where(eq(users.id, org.ownerId))
          .limit(1);

        if (owner?.email) {
          channels = [
            {
              id: 'fallback-owner-email',
              organizationId: job.organizationId,
              name: owner.name ? `${owner.name} (Account Email)` : owner.email,
              type: 'email',
              config: { target: owner.email },
              enabled: true,
              createdAt: new Date(),
            } as any,
          ];
        }
      }
    }

    if (!channels || channels.length === 0) {
      console.warn(`[AlertDispatcher] No active notification channels found for job ${job.name} (${job.id})`);
      return;
    }

    console.log(`[AlertDispatcher] Dispatching ${eventType} alert for "${job.name}" to ${channels.length} channel(s)`);

    await Promise.allSettled(
      channels.map(async (ch) => {
        const target = ch.config?.target?.trim();
        if (!target) return;
        const type = (ch.type || '').toLowerCase();

        if (type === 'slack') {
          await fetch(target, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: `🚨 *[Samast Cron Alert]* ${title}\n${message}`,
            }),
            signal: AbortSignal.timeout(10000),
          });
        } else if (type === 'discord') {
          await fetch(target, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content: `🚨 **[Samast Cron Alert]** ${title}\n${message}`,
            }),
            signal: AbortSignal.timeout(10000),
          });
        } else if (type === 'email') {
          // 1. Quota Check: Enforce 50 email alerts/month for Free tier (Unlimited for Pro)
          const [sub] = await db
            .select({ plan: subscriptions.plan, gumroadStatus: subscriptions.gumroadStatus })
            .from(subscriptions)
            .where(eq(subscriptions.organizationId, job.organizationId))
            .limit(1);

          let isPro = sub?.plan === 'PRO' && sub?.gumroadStatus !== 'EXPIRED' && sub?.gumroadStatus !== 'REFUNDED';
          if (!isPro) {
            const [org] = await db
              .select({ planId: organizations.planId })
              .from(organizations)
              .where(eq(organizations.id, job.organizationId))
              .limit(1);
            if (org?.planId === 'pro') isPro = true;
          }

          if (!isPro) {
            try {
              const redis = getRedis();
              const now = new Date();
              const monthKey = `email_alert_quota:${job.organizationId}:${now.getUTCFullYear()}-${now.getUTCMonth() + 1}`;
              const count = await redis.incr(monthKey);
              if (count === 1) {
                await redis.expire(monthKey, 45 * 86400); // 45-day TTL
              }
              if (count > 50) {
                console.warn(
                  `[AlertDispatcher] Free tier monthly email alert quota (50/month) exceeded for organization ${job.organizationId} (attempt #${count}). Email suppressed.`
                );
                return;
              }
            } catch (quotaErr: any) {
              console.warn(`[AlertDispatcher] Quota check error: ${quotaErr.message}`);
            }
          }

          const resendKey = cleanEnv(process.env.RESEND_API_KEY);
          const smtpHost = cleanEnv(process.env.SMTP_HOST);
          const smtpUser = cleanEnv(process.env.SMTP_USER);
          const smtpPass = cleanEnv(process.env.SMTP_PASS);
          const smtpPort = Number(cleanEnv(process.env.SMTP_PORT)) || 587;
          const smtpFrom = cleanEnv(process.env.SMTP_FROM) || 'Samast Cron <alerts@samast.pro>';

          if (resendKey) {
            await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${resendKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                from: smtpFrom,
                to: [target],
                subject: `[Samast Cron Alert] ${title}`,
                text: message,
              }),
              signal: AbortSignal.timeout(10000),
            });
          } else if (smtpHost && smtpUser && smtpPass) {
            const transporter = nodemailer.createTransport({
              host: smtpHost,
              port: smtpPort,
              secure: smtpPort === 465,
              auth: { user: smtpUser, pass: smtpPass },
            });
            await transporter.sendMail({
              from: smtpFrom,
              to: target,
              subject: `[Samast Cron Alert] ${title}`,
              text: message,
            });
          }
        } else if (type === 'pushover') {
          const userKey = cleanEnv(ch.config?.userKey || target);
          const apiToken = cleanEnv(ch.config?.apiToken || process.env.PUSHOVER_API_TOKEN);
          if (userKey && apiToken) {
            const bodyParams = new URLSearchParams({
              token: apiToken,
              user: userKey,
              title: `[Samast Cron Alert] ${title}`,
              message: `${message}\nTarget URL: ${job.url}`,
              url: job.url || 'https://cron.samast.pro/dashboard/schedules',
              url_title: 'Open Samast Cron',
              priority: eventType === 'JOB_FAILED' ? '1' : '0',
            });
            await fetch('https://api.pushover.net/1/messages.json', {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: bodyParams.toString(),
              signal: AbortSignal.timeout(10000),
            });
          }
        } else {
          // Custom HTTP webhook
          await fetch(target, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'SamastCron-Worker/1.0',
            },
            body: JSON.stringify({
              event: eventType,
              title,
              message,
              job: { id: job.id, name: job.name, url: job.url },
              httpStatus,
              errorMessage,
              timestamp: new Date().toISOString(),
            }),
            signal: AbortSignal.timeout(10000),
          });
        }
      })
    );
  } catch (err: any) {
    console.error(`[AlertDispatcher] Failed to dispatch alerts for job ${cronJobId}:`, err.message);
  }
}
