import { SchedulerService } from './scheduler.service';

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

process.on('SIGTERM', () => {
  console.log('[Scheduler] Shutting down scheduler service...');
  clearInterval(intervalId);
  process.exit(0);
});
