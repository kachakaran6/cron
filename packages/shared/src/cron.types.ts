export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export type ExecutionStatus = 'SUCCESS' | 'FAILED' | 'TIMED_OUT' | 'BLOCKED_SSRF';

export interface CronJobDTO {
  id: string;
  organizationId: string;
  createdById?: string | null;
  name: string;
  url: string;
  method: HttpMethod;
  schedule: string;
  timezone: string;
  headers?: Record<string, string>;
  body?: string | null;
  timeoutMs: number;
  retryCount: number;
  retryDelayMs: number;
  enabled: boolean;
  nextRunAt: string;
  lastRunAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CronJobRunDTO {
  id: string;
  cronJobId: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  status: ExecutionStatus;
  httpStatus?: number | null;
  responseSize: number;
  responseHeaders?: string | null;
  responseBody?: string | null;
  errorMessage?: string | null;
  attemptNumber: number;
  workerId: string;
  createdAt: string;
}
