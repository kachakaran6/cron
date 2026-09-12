import { Counter, Histogram } from 'prom-client';

export const jobExecutionsTotal = new Counter({
  name: 'cron_job_executions_total',
  help: 'Total executed cron jobs',
  labelNames: ['status', 'http_status'],
});

export const schedulerLagHistogram = new Histogram({
  name: 'cron_scheduler_lag_seconds',
  help: 'Difference between scheduled run time and actual execution time',
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30],
});

export const jobExecutionDuration = new Histogram({
  name: 'cron_job_execution_duration_seconds',
  help: 'Duration of external HTTP request execution',
  buckets: [0.1, 0.3, 0.5, 1, 2, 5, 10, 30],
});
