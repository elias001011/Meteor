import { getStore } from '@netlify/blobs';
import type { HandlerEvent } from '@netlify/functions';

export interface RateLimitOptions {
  namespace: string;
  limit: number;
  windowSeconds: number;
  failClosed?: boolean;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfter: number;
}

const ALLOWED_ORIGINS = new Set([
  'https://meteor-ai.netlify.app',
  'https://dev--meteor-ai.netlify.app',
  'http://localhost:8888',
  'http://localhost:5173',
  'http://127.0.0.1:8888',
  'http://127.0.0.1:5173',
]);

const normalizeKeyPart = (value: string): string => (
  value
    .trim()
    .replace(/[^a-zA-Z0-9_.-]/g, '_')
    .slice(0, 140) || 'unknown'
);

const getHeader = (event: HandlerEvent, name: string): string => {
  const lower = name.toLowerCase();
  const direct = event.headers[lower] || event.headers[name];
  return typeof direct === 'string' ? direct : '';
};

const normalizeOrigin = (value: string): string => {
  const text = value.trim().replace(/\/$/, '');
  if (!text) return '';

  try {
    return new URL(text).origin;
  } catch {
    return '';
  }
};

export const buildCorsHeaders = (
  event: HandlerEvent,
  baseHeaders: Record<string, string> = {}
): Record<string, string> => {
  const requestOrigin = normalizeOrigin(getHeader(event, 'origin'));
  const origin = requestOrigin && ALLOWED_ORIGINS.has(requestOrigin)
    ? requestOrigin
    : 'https://meteor-ai.netlify.app';

  return {
    ...baseHeaders,
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
};

export const buildOptionsResponse = (event: HandlerEvent) => ({
  statusCode: 204,
  headers: buildCorsHeaders(event, { 'Cache-Control': 'no-store' }),
  body: '',
});

export const getClientIp = (event: HandlerEvent): string => {
  const netlifyIp = getHeader(event, 'x-nf-client-connection-ip');
  if (netlifyIp) return netlifyIp;

  const forwardedFor = getHeader(event, 'x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();

  const realIp = getHeader(event, 'x-real-ip');
  if (realIp) return realIp;

  return 'unknown';
};

const parseRateLimitState = (value: unknown): { windowId: number; count: number } | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return { windowId: -1, count: value };
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const numeric = Number(trimmed);
    if (Number.isFinite(numeric)) return { windowId: -1, count: numeric };

    try {
      const parsed = JSON.parse(trimmed);
      if (
        typeof parsed?.windowId === 'number' &&
        Number.isFinite(parsed.windowId) &&
        typeof parsed?.count === 'number' &&
        Number.isFinite(parsed.count)
      ) {
        return { windowId: parsed.windowId, count: parsed.count };
      }
    } catch {
      return null;
    }
  }

  if (typeof value === 'object' && value !== null && 'count' in value) {
    const state = value as { count?: unknown; windowId?: unknown };
    if (
      typeof state.windowId === 'number' &&
      Number.isFinite(state.windowId) &&
      typeof state.count === 'number' &&
      Number.isFinite(state.count)
    ) {
      return { windowId: state.windowId, count: state.count };
    }
  }

  return null;
};

export const checkRateLimit = async (
  event: HandlerEvent,
  options: RateLimitOptions
): Promise<RateLimitResult> => {
  const now = Math.floor(Date.now() / 1000);
  const windowId = Math.floor(now / options.windowSeconds);
  const retryAfter = options.windowSeconds - (now % options.windowSeconds);
  const ip = normalizeKeyPart(getClientIp(event));
  const namespace = normalizeKeyPart(options.namespace);
  const key = `${namespace}:${ip}`;

  try {
    const store = getStore('meteor-rate-limits');
    const state = parseRateLimitState(await store.get(key));
    const current = state?.windowId === windowId ? state.count : 0;

    if (current >= options.limit) {
      return { allowed: false, remaining: 0, retryAfter };
    }

    const next = current + 1;
    await store.set(key, JSON.stringify({ windowId, count: next, updatedAt: now }));

    return {
      allowed: true,
      remaining: Math.max(0, options.limit - next),
      retryAfter,
    };
  } catch (error) {
    console.warn('[Security] Rate limit unavailable:', error);

    if (options.failClosed) {
      return { allowed: false, remaining: 0, retryAfter: Math.max(60, retryAfter) };
    }

    return { allowed: true, remaining: options.limit, retryAfter };
  }
};

export const buildRateLimitResponse = (
  result: RateLimitResult,
  event?: HandlerEvent
) => ({
  statusCode: 429,
  headers: event
    ? buildCorsHeaders(event, {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        'Retry-After': String(result.retryAfter),
      })
    : {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        'Retry-After': String(result.retryAfter),
      },
  body: JSON.stringify({
    message: 'Muitas requisições. Tente novamente em alguns minutos.',
  }),
});

export const sanitizeExternalUrl = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 2048) return null;

  try {
    const url = new URL(trimmed);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    return url.toString();
  } catch {
    return null;
  }
};

export const safeText = (value: unknown, maxLength: number): string => {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLength);
};