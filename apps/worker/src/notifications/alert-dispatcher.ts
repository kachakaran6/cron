import { db, cronJobs, cronJobRuns, notificationChannels } from '@cron-saas/database';
import { eq, and, desc } from 'drizzle-orm';

import nodemailer from 'nodemailer';

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
      .limit(5);

    const previousRun = recentRuns[1]; // run immediately before current one

    let shouldAlert = false;
    let eventType: 'JOB_FAILED' | 'JOB_RECOVERED' = 'JOB_FAILED';
    let title = '';
    let message = '';

    if (currentStatus === 'FAILED' && job.notifyOnFailure) {
      const consecutiveFailures = recentRuns.filter((r) => r.status !== 'SUCCESS').length;
      const threshold = job.failureThreshold || 1;

      if (consecutiveFailures >= threshold) {
        shouldAlert = true;
        eventType = 'JOB_FAILED';
        title = `Job Execution Alert: ${job.name} Failed`;
        message = `Scheduled HTTP job "${job.name}" failed with ${errorMessage || `HTTP ${httpStatus}`} (${consecutiveFailures} consecutive failure(s)). Target URL: ${job.url}`;
      }
    } else if (currentStatus === 'SUCCESS' && previousRun && previousRun.status === 'FAILED' && job.notifyOnRecovery) {
      shouldAlert = true;
      eventType = 'JOB_RECOVERED';
      title = `Job Recovery Alert: ${job.name} Restored`;
      message = `Scheduled HTTP job "${job.name}" has successfully recovered in ${durationMs}ms (HTTP ${httpStatus}). Target URL: ${job.url}`;
    }

    if (!shouldAlert) return;

    // Fetch active notification channels for this organization
    const channels = await db
      .select()
      .from(notificationChannels)
      .where(
        and(
          eq(notificationChannels.organizationId, job.organizationId),
          eq(notificationChannels.enabled, true)
        )
      );

    if (!channels || channels.length === 0) return;

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
