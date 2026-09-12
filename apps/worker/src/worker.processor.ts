import { Worker, Job } from 'bullmq';
import { request } from 'undici';
import { validateSafeUrl } from './security/safe-dispatcher';
import { db, cronJobRuns, cronJobs } from '@cron-saas/database';
import { eq } from 'drizzle-orm';
import os from 'node:os';
import { jobExecutionsTotal, jobExecutionDuration } from './metrics';

const workerId = `${os.hostname()}-${process.pid}`;

export function createWorker() {
  return new Worker(
    'cron-execution-queue',
    async (job: Job) => {
      const { cronJobId, url, method, headers, body, timeoutMs, attempt } = job.data;
      const startedAt = new Date();

      try {
        // 1. Anti-SSRF Safety Check
        await validateSafeUrl(url);

        // 2. Perform Outbound HTTP Request via undici
        const { statusCode, headers: resHeaders, body: resBodyStream } = await request(url, {
          method: method || 'GET',
          headers: {
            'User-Agent': 'CronPlatform-Worker/1.0 (+https://yourcron.com/bot)',
            ...headers,
          },
          body,
          headersTimeout: timeoutMs || 10000,
          bodyTimeout: timeoutMs || 10000,
        });

        const responseText = await resBodyStream.text();
        const finishedAt = new Date();
        const durationMs = finishedAt.getTime() - startedAt.getTime();
        const isSuccess = statusCode >= 200 && statusCode < 300;

        jobExecutionsTotal.inc({ status: isSuccess ? 'SUCCESS' : 'FAILED', http_status: String(statusCode) });
        jobExecutionDuration.observe(durationMs / 1000);

        // 3. Record Execution Log in PostgreSQL
        await db.insert(cronJobRuns).values({
          cronJobId,
          startedAt,
          finishedAt,
          durationMs,
          status: isSuccess ? 'SUCCESS' : 'FAILED',
          httpStatus: statusCode,
          responseSize: Buffer.byteLength(responseText, 'utf8'),
          responseBody: responseText.slice(0, 10000), // Cap response body at 10KB
          errorMessage: isSuccess ? null : `HTTP Status ${statusCode}`,
          attemptNumber: attempt || 1,
          workerId,
        });

        // 4. Update last_run_at on cron_jobs
        await db.update(cronJobs).set({ lastRunAt: startedAt }).where(eq(cronJobs.id, cronJobId));
      } catch (err: any) {
        const finishedAt = new Date();
        const durationMs = finishedAt.getTime() - startedAt.getTime();

        const isSSRF = err.name === 'SecuritySSRFException';
        jobExecutionsTotal.inc({ status: isSSRF ? 'BLOCKED_SSRF' : 'FAILED', http_status: 'none' });

        await db.insert(cronJobRuns).values({
          cronJobId,
          startedAt,
          finishedAt,
          durationMs,
          status: isSSRF ? 'BLOCKED_SSRF' : 'FAILED',
          httpStatus: null,
          errorMessage: err.message || 'Execution error',
          attemptNumber: attempt || 1,
          workerId,
        });

        throw err;
      }
    },
    {
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
      },
      concurrency: Number(process.env.WORKER_CONCURRENCY) || 50,
    }
  );
}
