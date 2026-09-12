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
  user: { id: string; email: string; name: string | null; role?: string };
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

export async function apiOAuthLogin(data: {
  provider: 'google' | 'github';
  email: string;
  name?: string;
  providerId?: string;
  image?: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/oauth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message || 'OAuth authentication failed');
  }
  return res.json();
}

export async function apiGetMe(): Promise<{ user: { id: string; email: string; name: string | null; role?: string }; organization: any }> {
  return request(`${API_BASE}/auth/me`);
}

// ── Jobs API ─────────────────────────────────────────────────────────────────

export async function fetchJobs(): Promise<any[]> {
  return request(`${API_BASE}/jobs`);
}

export async function fetchJobById(id: string): Promise<any> {
  return request(`${API_BASE}/jobs/${id}`);
}

export async function createJob(data: any): Promise<any> {
  return request(`${API_BASE}/jobs`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateJob(id: string, data: any): Promise<any> {
  return request(`${API_BASE}/jobs/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteJob(id: string): Promise<{ success: boolean; message: string }> {
  return request(`${API_BASE}/jobs/${id}`, {
    method: 'DELETE',
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

// ── Status Pages API ─────────────────────────────────────────────────────────

export interface IncidentItem {
  id: string;
  title: string;
  status: 'INVESTIGATING' | 'IDENTIFIED' | 'MONITORING' | 'RESOLVED';
  startDate: string;
  endDate?: string;
  message?: string;
}

export interface StatusPageDTO {
  id: string;
  organizationId: string;
  title: string;
  slug: string;
  isPublished: boolean;
  logoUrl?: string;
  monitoredJobIds: string[];
  incidents: IncidentItem[];
  monitorCount?: number;
  activeIncidentsCount?: number;
  publicUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export async function fetchStatusPages(): Promise<StatusPageDTO[]> {
  return request(`${API_BASE}/status-pages`);
}

export async function fetchStatusPageById(id: string): Promise<any> {
  return request(`${API_BASE}/status-pages/${id}`);
}

export async function createStatusPage(data: Partial<StatusPageDTO>): Promise<StatusPageDTO> {
  return request(`${API_BASE}/status-pages`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateStatusPage(id: string, data: Partial<StatusPageDTO>): Promise<StatusPageDTO> {
  return request(`${API_BASE}/status-pages/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteStatusPage(id: string): Promise<{ success: boolean }> {
  return request(`${API_BASE}/status-pages/${id}`, {
    method: 'DELETE',
  });
}

export async function fetchPublicStatusPage(slug: string): Promise<any> {
  const res = await fetch(`${API_BASE}/public/status/${slug}`);
  if (!res.ok) {
    throw new Error('Status page not found');
  }
  return res.json();
}

// ── Notification Channels API ────────────────────────────────────────────────

export interface NotificationChannelDTO {
  id: string;
  organizationId: string;
  name: string;
  type: 'email' | 'webhook' | 'slack' | 'discord';
  config: Record<string, any>;
  enabled: boolean;
  createdAt: string;
}

export async function fetchNotificationChannels(): Promise<NotificationChannelDTO[]> {
  return request(`${API_BASE}/notifications`);
}

export async function createNotificationChannel(data: {
  name: string;
  type: 'email' | 'webhook' | 'slack' | 'discord';
  config: Record<string, any>;
  enabled?: boolean;
}): Promise<NotificationChannelDTO> {
  return request(`${API_BASE}/notifications`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function toggleNotificationChannel(id: string, enabled: boolean): Promise<NotificationChannelDTO> {
  return request(`${API_BASE}/notifications/${id}/toggle`, {
    method: 'PATCH',
    body: JSON.stringify({ enabled }),
  });
}

export async function deleteNotificationChannel(id: string): Promise<{ success: boolean }> {
  return request(`${API_BASE}/notifications/${id}`, {
    method: 'DELETE',
  });
}

// ── Admin API ────────────────────────────────────────────────────────────────

export async function fetchAdminStats(): Promise<any> {
  return request(`${API_BASE}/admin/stats`);
}

export async function fetchAdminLogs(params?: {
  level?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ logs: any[]; total: number; limit: number; offset: number }> {
  const query = new URLSearchParams();
  if (params?.level) query.append('level', params.level);
  if (params?.search) query.append('search', params.search);
  if (params?.limit) query.append('limit', String(params.limit));
  if (params?.offset) query.append('offset', String(params.offset));
  return request(`${API_BASE}/admin/logs?${query.toString()}`);
}

export async function fetchAdminUsers(): Promise<any[]> {
  return request(`${API_BASE}/admin/users`);
}

export async function updateAdminUserRole(userId: string, role: 'admin' | 'user'): Promise<any> {
  return request(`${API_BASE}/admin/users/${userId}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });
}

export async function updateAdminUserPlan(userId: string, planId: string): Promise<any> {
  return request(`${API_BASE}/admin/users/${userId}/plan`, {
    method: 'PATCH',
    body: JSON.stringify({ planId }),
  });
}

export async function fetchAdminConfig(): Promise<any> {
  return request(`${API_BASE}/admin/config`);
}

export async function updateAdminConfig(config: any): Promise<any> {
  return request(`${API_BASE}/admin/config`, {
    method: 'PATCH',
    body: JSON.stringify(config),
  });
}
