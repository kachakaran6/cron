/**
 * URL and Authentication Resolution Utilities
 * Ensures OAuth redirects and app origins strictly resolve to official domain (cron.samast.pro)
 * and eliminates ephemeral provider domains (sslip.io).
 */

export function sanitizeUrl(url?: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim().replace(/\/+$/, '');
  if (!trimmed) return null;

  // Reject ephemeral sslip.io, nip.io, or raw IP URLs
  if (
    trimmed.includes('sslip.io') ||
    trimmed.includes('nip.io') ||
    /https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/i.test(trimmed)
  ) {
    return null;
  }

  return trimmed;
}

export function ensureHttpsForProduction(url: string): string {
  if (!url) return 'https://cron.samast.pro';
  if (url.includes('localhost') || url.includes('127.0.0.1')) {
    return url;
  }
  return url.replace(/^http:\/\//i, 'https://');
}

export function getFrontendUrl(req?: any, state?: string | null): string {
  // 1. If an explicit state was provided by the frontend (e.g. current origin)
  if (state) {
    const cleanState = sanitizeUrl(state);
    if (
      cleanState &&
      (cleanState.includes('cron.samast.pro') ||
        cleanState.includes('samast.pro') ||
        cleanState.includes('localhost') ||
        cleanState.includes('127.0.0.1'))
    ) {
      return ensureHttpsForProduction(cleanState);
    }
  }

  // 2. Check incoming request headers (Cloudflare / Caddy / Nginx forwarded host)
  if (req) {
    const rawHost = (req.headers?.['x-forwarded-host'] || req.headers?.host || '') as string;
    const host = rawHost.split(',')[0].trim().split(':')[0];

    if (host && !host.includes('sslip.io') && !/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) {
      if (host.includes('samast.pro')) {
        return `https://${host}`;
      }
      if (host.includes('localhost') || host.includes('127.0.0.1')) {
        return `http://${rawHost.split(',')[0].trim()}`;
      }
    }
  }

  // 3. Check environment FRONTEND_URL if not an ephemeral domain
  const envFrontend = sanitizeUrl(process.env.FRONTEND_URL);
  if (envFrontend) {
    return ensureHttpsForProduction(envFrontend);
  }

  // 4. Check environment APP_PUBLIC_URL if not an ephemeral domain
  const envPublic = sanitizeUrl(process.env.APP_PUBLIC_URL);
  if (envPublic) {
    return ensureHttpsForProduction(envPublic);
  }

  // 5. Default production domain (strictly HTTPS)
  return 'https://cron.samast.pro';
}

export function getPublicAppUrl(req?: any): string {
  // 1. Check incoming request headers
  if (req) {
    const rawHost = (req.headers?.['x-forwarded-host'] || req.headers?.host || '') as string;
    const host = rawHost.split(',')[0].trim().split(':')[0];

    if (host && !host.includes('sslip.io') && !/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) {
      if (host.includes('samast.pro')) {
        return `https://${host}`;
      }
      if (host.includes('localhost') || host.includes('127.0.0.1')) {
        return `http://${rawHost.split(',')[0].trim()}`;
      }
    }
  }

  // 2. Check APP_PUBLIC_URL
  const envPublic = sanitizeUrl(process.env.APP_PUBLIC_URL);
  if (envPublic) {
    return ensureHttpsForProduction(envPublic);
  }

  // 3. Check FRONTEND_URL
  const envFrontend = sanitizeUrl(process.env.FRONTEND_URL);
  if (envFrontend) {
    return ensureHttpsForProduction(envFrontend);
  }

  // 4. Default production domain (strictly HTTPS)
  return 'https://cron.samast.pro';
}

/**
 * Checks if the given email belongs to a Platform Master Administrator.
 * Recognizes master accounts and any emails configured in ADMIN_EMAILS environment variable.
 */
export function isPlatformAdmin(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.toLowerCase().trim();

  // Master administrator emails
  const hardcodedAdmins = [
    'kachakaran6@gmail.com',
    'kachakaran06@gmail.com',
  ];
  if (hardcodedAdmins.includes(normalized)) {
    return true;
  }

  // Environment-configured admin list
  const envAdmins = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.toLowerCase().trim())
    .filter(Boolean);

  return envAdmins.includes(normalized);
}
