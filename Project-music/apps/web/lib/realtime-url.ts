const DEFAULT_URL =
  process.env.NEXT_PUBLIC_REALTIME_URL ?? 'http://localhost:4000';
const STORAGE_KEY = 'syncjam:realtime-url';

export function getDefaultRealtimeUrl(): string {
  return DEFAULT_URL;
}

export function isCloudDefault(url: string): boolean {
  return normalizeUrl(url) === normalizeUrl(DEFAULT_URL);
}

export function normalizeUrl(raw: string): string {
  let s = raw.trim();
  if (!s) return DEFAULT_URL;
  if (!/^https?:\/\//i.test(s)) s = `http://${s}`;
  return s.replace(/\/+$/, '');
}

export function getRealtimeUrl(): string {
  if (typeof window === 'undefined') return DEFAULT_URL;
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get('s');
  if (fromQuery) {
    const normalized = normalizeUrl(fromQuery);
    window.localStorage.setItem(STORAGE_KEY, normalized);
    return normalized;
  }
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored ? normalizeUrl(stored) : DEFAULT_URL;
}

export function setRealtimeUrl(url: string) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, normalizeUrl(url));
}

export function clearRealtimeUrl() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function buildInviteLink(code: string): string {
  if (typeof window === 'undefined') return `/r/${code}`;
  const s = window.localStorage.getItem(STORAGE_KEY);
  const lan = s ? normalizeUrl(s) : null;
  const useLan = lan && lan !== DEFAULT_URL;

  const loc = window.location;
  const isLocal = loc.hostname === 'localhost' || loc.hostname === '127.0.0.1';
  let origin = loc.origin;
  if (useLan && isLocal) {
    try {
      const lanHost = new URL(lan).hostname;
      origin = `${loc.protocol}//${lanHost}${loc.port ? `:${loc.port}` : ''}`;
    } catch {}
  }

  const base = `${origin}/r/${code}`;
  return useLan ? `${base}?s=${encodeURIComponent(lan)}` : base;
}
