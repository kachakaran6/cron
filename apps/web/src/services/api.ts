import { CronJobDTO, CronJobRunDTO, ApiKeyDTO } from '@cron-saas/shared';

const API_BASE = '/api/v1';

export async function fetchJobs(): Promise<CronJobDTO[]> {
  const res = await fetch(`${API_BASE}/jobs`);
  if (!res.ok) throw new Error('Failed to fetch jobs');
  return res.json();
}

export async function fetchJobById(id: string): Promise<CronJobDTO> {
  const res = await fetch(`${API_BASE}/jobs/${id}`);
  if (!res.ok) throw new Error('Failed to fetch job details');
  return res.json();
}

export async function createJob(data: any): Promise<CronJobDTO> {
  const res = await fetch(`${API_BASE}/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create job');
  return res.json();
}

export async function triggerJobExecution(id: string): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/jobs/${id}/execute`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to trigger execution');
  return res.json();
}

export async function fetchJobRuns(id: string): Promise<CronJobRunDTO[]> {
  const res = await fetch(`${API_BASE}/jobs/${id}/runs`);
  if (!res.ok) throw new Error('Failed to fetch job runs');
  return res.json();
}

export async function fetchApiKeys(): Promise<ApiKeyDTO[]> {
  const res = await fetch(`${API_BASE}/api-keys`);
  if (!res.ok) throw new Error('Failed to fetch API keys');
  return res.json();
}

export async function createApiKey(name: string): Promise<{ id: string; name: string; apiKey: string; createdAt: string }> {
  const res = await fetch(`${API_BASE}/api-keys`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error('Failed to create API key');
  return res.json();
}

export async function revokeApiKey(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api-keys/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to revoke API key');
}
