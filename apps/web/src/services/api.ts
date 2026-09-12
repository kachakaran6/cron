import { CronJobDTO, CronJobRunDTO, ApiKeyDTO } from '@cron-saas/shared';

const API_BASE = '/api/v1';

// ── Token Management ─────────────────────────────────────────────────────────

const TOKEN_KEY = 'samast_cron_token';

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

function authHeaders(extra?: Record<string, string>): Record<string, string> {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      ...authHeaders(),
      ...(options?.headers || {}),
    },
  });

  if (res.status === 401) {
    clearAuthToken();
    window.location.href = '/login';
    throw new Error('Session expired');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message || `HTTP ${res.status}`);
  }

  return res.json();
}

// ── Auth API ─────────────────────────────────────────────────────────────────

export interface AuthResponse {
  token: string;
  user: { id: string; email: string; name: string | null };
  organization: { id: string; name: string; slug: string } | null;
}

export async function apiRegister(name: string, email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message || 'Registration failed');
  }
  return res.json();
}

export async function apiLogin(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message || 'Login failed');
  }
  return res.json();
}

export async function apiGetMe(): Promise<{ user: { id: string; email: string; name: string | null }; organization: any }> {
  return request(`${API_BASE}/auth/me`);
}

// ── Jobs API ─────────────────────────────────────────────────────────────────

export async function fetchJobs(): Promise<CronJobDTO[]> {
  return request(`${API_BASE}/jobs`);
}

export async function fetchJobById(id: string): Promise<CronJobDTO> {
  return request(`${API_BASE}/jobs/${id}`);
}

export async function createJob(data: any): Promise<CronJobDTO> {
  return request(`${API_BASE}/jobs`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function triggerJobExecution(id: string): Promise<{ message: string }> {
  return request(`${API_BASE}/jobs/${id}/execute`, { method: 'POST' });
}

export async function fetchJobRuns(id: string): Promise<CronJobRunDTO[]> {
  return request(`${API_BASE}/jobs/${id}/runs`);
}

// ── API Keys API ──────────────────────────────────────────────────────────────

export async function fetchApiKeys(): Promise<ApiKeyDTO[]> {
  return request(`${API_BASE}/api-keys`);
}

export async function createApiKey(name: string): Promise<{ id: string; name: string; apiKey: string; createdAt: string }> {
  return request(`${API_BASE}/api-keys`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function revokeApiKey(id: string): Promise<void> {
  return request(`${API_BASE}/api-keys/${id}`, { method: 'DELETE' });
}
