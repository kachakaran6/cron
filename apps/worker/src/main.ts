import { createWorker } from './worker.processor';

console.log('[Worker] Starting HTTP Execution Worker Pool...');
const worker = createWorker();

worker.on('ready', () => {
  console.log('[Worker] Connected to Redis and ready to process jobs.');
});

worker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed: ${err.message}`);
});

process.on('SIGTERM', async () => {
  console.log('[Worker] Shutting down gracefully...');
  await worker.close();
  process.exit(0);
});
