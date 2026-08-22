import { createHash, randomUUID } from 'node:crypto';
import { getStore } from '@netlify/blobs';
import type { HandlerEvent, HandlerResponse } from '@netlify/functions';

export const API_VERSION = '1';

export interface RateLimitOptions {
  namespace: string;
  limit: number;
  windowSeconds: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfter: number;
  limit: number;
}

interface JsonResponseOptions {
  cacheControl?: string;
  methods?: string[];
  headers?: Record<string, string>;
}

interface LocalRateLimitState {
  windowId: number;
  count: number;
}

const localRateLimits = new Map<string, LocalRateLimitState>();
const MAX_LOCAL_RATE_LIMIT_KEYS = 2_000;
let rateLimitStorageUnavailableUntil = 0;

const normalizeKeyPart = (value: string): string => (
  value
    .trim()
    .replace(/[^a-zA-Z0-9_.-]/g, '_')
    .slice(0, 80) || 'unknown'
);

const getHeader = (event: HandlerEvent, name: string): string => {
  const lower = name.toLowerCase();
  const direct = event.headers[lower] || event.headers[name];
  return typeof direct === 'string' ? direct.trim() : '';
};

const normalizeOrigin = (value: unknown): string | null => {
  if (typeof value !== 'string' || !value.trim()) return null;

  try {
    const url = new URL(value.trim());
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return null;
    return url.origin;
  } catch {
    return null;
  }
};

const configuredOrigins = (): Set<string> => {
  const candidates = [
    ...(process.env.METEOR_ALLOWED_ORIGINS || '').split(','),
    process.env.URL,
    process.env.DEPLOY_URL,
    process.env.DEPLOY_PRIME_URL,
  ];

  return new Set(candidates.map(normalizeOrigin).filter((origin): origin is string => Boolean(origin)));
};

const isAllowedOrigin = (event: HandlerEvent, origin: string): boolean => {
  const allowed = configuredOrigins();
  const requestOrigin = normalizeOrigin(event.rawUrl);
  if (requestOrigin) allowed.add(requestOrigin);

  try {
    const hostname = new URL(origin).hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]') return true;
  } catch {
    return false;
  }

  return allowed.has(origin);
};

export const createApiHeaders = (
  event: HandlerEvent,
  options: JsonResponseOptions = {}
): Record<string, string> => {
  const methods = options.methods || ['GET', 'OPTIONS'];
  const headers: Record<string, string> = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': options.cacheControl || 'no-store',
    'X-API-Version': API_VERSION,
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'Access-Control-Allow-Methods': methods.join(', '),
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
    ...options.headers,
  };

  const origin = normalizeOrigin(getHeader(event, 'origin'));
  if (origin && isAllowedOrigin(event, origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }

  return headers;
};

export const jsonResponse = (
  event: HandlerEvent,
  statusCode: number,
  payload: unknown,
  options: JsonResponseOptions = {}
): HandlerResponse => ({
  statusCode,
  headers: createApiHeaders(event, options),
  body: statusCode === 204 ? '' : JSON.stringify(payload),
});

export const preflightResponse = (
  event: HandlerEvent,
  methods: string[]
): HandlerResponse => jsonResponse(event, 204, null, { methods });

export const errorResponse = (
  event: HandlerEvent,
  statusCode: number,
  code: string,
  message: string,
  options: JsonResponseOptions = {}
): HandlerResponse => {
  const requestId = getHeader(event, 'x-nf-request-id') || randomUUID();
  return jsonResponse(event, statusCode, {
    message,
    error: { code, message, requestId },
  }, options);
};

export const getClientIp = (event: HandlerEvent): string => {
  const netlifyIp = getHeader(event, 'x-nf-client-connection-ip');
  if (netlifyIp) return netlifyIp;

  const forwardedFor = getHeader(event, 'x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();

  const realIp = getHeader(event, 'x-real-ip');
  if (realIp) return realIp;

  return 'unknown';
};

const hashClientIp = (ip: string): string => (
  createHash('sha256').update(ip).digest('hex').slice(0, 32)
);

export const parseRateLimitState = (value: unknown): LocalRateLimitState | null => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;

    try {
      return parseRateLimitState(JSON.parse(trimmed));
    } catch {
      return null;
    }
  }

  if (typeof value === 'object' && value !== null) {
    const state = value as { count?: unknown; windowId?: unknown };
    if (
      typeof state.windowId === 'number' &&
      Number.isSafeInteger(state.windowId) &&
      typeof state.count === 'number' &&
      Number.isSafeInteger(state.count) &&
      state.count >= 0
    ) {
      return { windowId: state.windowId, count: state.count };
    }
  }

  return null;
};

const pruneLocalRateLimits = (currentWindowId: number): void => {
  if (localRateLimits.size < MAX_LOCAL_RATE_LIMIT_KEYS) return;

  for (const [key, state] of localRateLimits) {
    if (state.windowId < currentWindowId) localRateLimits.delete(key);
    if (localRateLimits.size < MAX_LOCAL_RATE_LIMIT_KEYS) return;
  }

  const oldestKeys = [...localRateLimits.keys()].slice(0, Math.ceil(MAX_LOCAL_RATE_LIMIT_KEYS / 4));
  oldestKeys.forEach((key) => localRateLimits.delete(key));
};

export const checkRateLimit = async (
  event: HandlerEvent,
  options: RateLimitOptions
): Promise<RateLimitResult> => {
  const limit = Math.max(1, Math.floor(options.limit));
  const windowSeconds = Math.max(1, Math.floor(options.windowSeconds));
  const now = Math.floor(Date.now() / 1000);
  const windowId = Math.floor(now / windowSeconds);
  const retryAfter = Math.max(1, windowSeconds - (now % windowSeconds));
  const namespace = normalizeKeyPart(options.namespace);
  const key = `${namespace}:${hashClientIp(getClientIp(event))}`;

  pruneLocalRateLimits(windowId);
  const cachedState = localRateLimits.get(key);
  const localCount = cachedState?.windowId === windowId ? cachedState.count : 0;

  if (localCount >= limit) {
    return { allowed: false, remaining: 0, retryAfter, limit };
  }

  // The per-instance counter is a safe fallback when Blobs is unavailable and
  // also reduces bursts caused by concurrent reads of the same remote value.
  localRateLimits.set(key, { windowId, count: localCount + 1 });

  if (Date.now() < rateLimitStorageUnavailableUntil) {
    return {
      allowed: true,
      remaining: Math.max(0, limit - localCount - 1),
      retryAfter,
      limit,
    };
  }

  try {
    const store = getStore('meteor-rate-limits');
    for (let writeAttempt = 0; writeAttempt < 3; writeAttempt += 1) {
      const stored = await store.getWithMetadata(key, { type: 'json', consistency: 'strong' });
      const state = parseRateLimitState(stored?.data);
      const remoteCount = state?.windowId === windowId ? state.count : 0;
      const current = Math.max(remoteCount, localCount);

      if (current >= limit) {
        localRateLimits.set(key, { windowId, count: current });
        return { allowed: false, remaining: 0, retryAfter, limit };
      }

      const next = current + 1;
      const writeResult = stored?.etag
        ? await store.setJSON(key, { windowId, count: next, updatedAt: now }, { onlyIfMatch: stored.etag })
        : await store.setJSON(key, { windowId, count: next, updatedAt: now }, { onlyIfNew: true });
      if (!writeResult.modified) continue;

      rateLimitStorageUnavailableUntil = 0;
      localRateLimits.set(key, { windowId, count: next });
      return { allowed: true, remaining: Math.max(0, limit - next), retryAfter, limit };
    }

    // Heavy concurrent contention should not turn a healthy endpoint into a
    // 500. Keep the local shield and let the next invocation retry Blobs.
    const fallbackCount = localRateLimits.get(key)?.count || 1;
    return {
      allowed: fallbackCount <= limit,
      remaining: Math.max(0, limit - fallbackCount),
      retryAfter,
      limit,
    };
  } catch (error) {
    rateLimitStorageUnavailableUntil = Date.now() + 30_000;
    const errorName = error instanceof Error ? error.name : 'UnknownError';
    console.warn(`[Security] Rate limit storage unavailable (${errorName}); using local protection.`);
    const fallbackCount = localRateLimits.get(key)?.count || 1;
    return {
      allowed: fallbackCount <= limit,
      remaining: Math.max(0, limit - fallbackCount),
      retryAfter,
      limit,
    };
  }
};

export const buildRateLimitResponse = (
  event: HandlerEvent,
  result: RateLimitResult,
  methods: string[] = ['GET', 'OPTIONS']
): HandlerResponse => errorResponse(
  event,
  429,
  'RATE_LIMITED',
  'Muitas requisições. Aguarde um momento e tente novamente.',
  {
    methods,
    headers: {
      'Retry-After': String(result.retryAfter),
      'X-RateLimit-Limit': String(result.limit),
      'X-RateLimit-Remaining': String(result.remaining),
    },
  }
);

export const sanitizeExternalUrl = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 2048) return null;

  try {
    const url = new URL(trimmed);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return null;
    url.hash = '';
    return url.toString();
  } catch {
    return null;
  }
};

export const safeText = (value: unknown, maxLength: number): string => {
  if (typeof value !== 'string' || maxLength <= 0) return '';
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLength);
};

export const fetchWithTimeout = async (
  input: string | URL,
  init: RequestInit = {},
  timeoutMs = 10_000
): Promise<Response> => {
  const signal = init.signal || AbortSignal.timeout(Math.max(250, timeoutMs));
  return fetch(input, { ...init, signal });
};

export const safeErrorName = (error: unknown): string => {
  if (error instanceof DOMException && error.name === 'TimeoutError') return 'TimeoutError';
  if (error instanceof Error) return safeText(error.name, 80) || 'Error';
  return 'UnknownError';
};
