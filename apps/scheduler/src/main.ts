import { SchedulerService } from './scheduler.service';
import { reconcileGumroadSubscriptions } from './reconciliation';

console.log('[Scheduler] Initializing Distributed Cron Scheduler Microservice...');
const scheduler = new SchedulerService();

// Poll every 5 seconds for upcoming jobs
const POLL_INTERVAL_MS = 5000;
let isPolling = false;

const intervalId = setInterval(async () => {
  if (isPolling) return;
  isPolling = true;
  await scheduler.processUpcomingJobs();
  isPolling = false;
}, POLL_INTERVAL_MS);

console.log(`[Scheduler] Polling loop running every ${POLL_INTERVAL_MS}ms.`);

// Gumroad subscription reconciliation every 6 hours (21600000ms)
const RECONCILIATION_INTERVAL_MS = 6 * 60 * 60 * 1000;
setTimeout(() => reconcileGumroadSubscriptions(), 30000); // 30s after startup
const reconIntervalId = setInterval(() => reconcileGumroadSubscriptions(), RECONCILIATION_INTERVAL_MS);

process.on('SIGTERM', () => {
  console.log('[Scheduler] Shutting down scheduler service...');
  clearInterval(intervalId);
  clearInterval(reconIntervalId);
  process.exit(0);
});
