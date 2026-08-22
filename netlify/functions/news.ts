import { type Handler, type HandlerEvent } from '@netlify/functions';
import {
    buildRateLimitResponse,
    checkRateLimit,
    errorResponse,
    fetchWithTimeout,
    jsonResponse,
    preflightResponse,
    safeErrorName,
    safeText,
    sanitizeExternalUrl,
} from './security';

const BASE_URL = 'https://gnews.io/api/v4';
const VALID_CATEGORIES = new Set([
    'general', 'world', 'nation', 'business', 'technology',
    'entertainment', 'sports', 'science', 'health',
]);
const ALLOWED_METHODS = ['GET', 'OPTIONS'];

const clampMax = (value: unknown, fallback = 10, maxAllowed = 20): number => {
    const parsed = typeof value === 'string' ? Number.parseInt(value, 10) : fallback;
    return Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), maxAllowed) : fallback;
};

const sanitizeLocale = (value: unknown, fallback = ''): string => {
    const candidate = safeText(value, 2).toLowerCase();
    return /^[a-z]{2}$/.test(candidate) ? candidate : fallback;
};

const parsePublishedAt = (value: unknown): string => {
    const candidate = safeText(value, 80);
    if (!candidate || !Number.isFinite(Date.parse(candidate))) return '';
    return new Date(candidate).toISOString();
};

export const sanitizeArticles = (value: unknown) => {
    if (!Array.isArray(value)) return [];

    return value.slice(0, 20).map((article) => {
        if (typeof article !== 'object' || article === null || Array.isArray(article)) return null;
        const item = article as Record<string, unknown>;
        const source = typeof item.source === 'object' && item.source !== null && !Array.isArray(item.source)
            ? item.source as Record<string, unknown>
            : {};
        const url = sanitizeExternalUrl(item.url);
        const title = safeText(item.title, 220);
        if (!url || !title) return null;

        return {
            title,
            description: safeText(item.description, 500),
            content: safeText(item.content, 1_200),
            url,
            image: sanitizeExternalUrl(item.image),
            publishedAt: parsePublishedAt(item.publishedAt),
            source: {
                name: safeText(source.name, 120) || 'Fonte não informada',
                url: sanitizeExternalUrl(source.url) || '',
            },
        };
    }).filter((article): article is NonNullable<typeof article> => article !== null);
};

const shouldTryAnotherKey = (status: number): boolean => (
    status === 401 || status === 403 || status === 429 || status >= 500
);

const fetchNews = async (
    endpoint: string,
    params: URLSearchParams,
    keys: string[]
): Promise<Response> => {
    let lastResponse: Response | null = null;
    let lastError: unknown = null;

    for (const key of keys) {
        try {
            const keyedParams = new URLSearchParams(params);
            keyedParams.set('apikey', key);
            const response = await fetchWithTimeout(`${BASE_URL}/${endpoint}?${keyedParams.toString()}`, {
                headers: { Accept: 'application/json' },
            }, 9_000);
            lastResponse = response;

            if (response.ok || !shouldTryAnotherKey(response.status)) return response;
        } catch (error) {
            lastError = error;
        }
    }

    if (!lastResponse) throw lastError instanceof Error ? lastError : new Error('News upstream unavailable');
    return lastResponse;
};

const handler: Handler = async (event: HandlerEvent) => {
    if (event.httpMethod === 'OPTIONS') return preflightResponse(event, ALLOWED_METHODS);
    if (event.httpMethod !== 'GET') {
        return errorResponse(event, 405, 'METHOD_NOT_ALLOWED', 'Método não permitido.', {
            methods: ALLOWED_METHODS,
            headers: { Allow: ALLOWED_METHODS.join(', ') },
        });
    }

    const keys = [...new Set([process.env.GNEWS_API, process.env.GNEWS_2]
        .map((key) => safeText(key, 256))
        .filter(Boolean))];
    if (keys.length === 0) {
        return errorResponse(event, 503, 'NEWS_NOT_CONFIGURED', 'O serviço de notícias está temporariamente indisponível.', {
            methods: ALLOWED_METHODS,
        });
    }

    const rateLimit = await checkRateLimit(event, {
        namespace: 'news',
        limit: 80,
        windowSeconds: 600,
    });
    if (!rateLimit.allowed) return buildRateLimitResponse(event, rateLimit, ALLOWED_METHODS);

    const query = event.queryStringParameters || {};
    const endpoint = query.endpoint;
    const params = new URLSearchParams();

    if (endpoint === 'top-headlines') {
        params.set('lang', sanitizeLocale(query.lang, 'pt'));
        params.set('country', sanitizeLocale(query.country, 'br'));
        params.set('max', String(clampMax(query.max)));

        const category = safeText(query.category, 24).toLowerCase();
        if (category && !VALID_CATEGORIES.has(category)) {
            return errorResponse(event, 400, 'INVALID_CATEGORY', 'Categoria de notícias inválida.', {
                methods: ALLOWED_METHODS,
            });
        }
        if (category) params.set('category', category);
    } else if (endpoint === 'search') {
        const searchQuery = safeText(query.q, 100);
        if (searchQuery.length < 2) {
            return errorResponse(event, 400, 'INVALID_SEARCH_QUERY', 'Informe ao menos 2 caracteres para buscar notícias.', {
                methods: ALLOWED_METHODS,
            });
        }

        params.set('q', searchQuery);
        params.set('lang', sanitizeLocale(query.lang, 'pt'));
        params.set('max', String(clampMax(query.max)));
        const country = sanitizeLocale(query.country);
        if (country) params.set('country', country);
    } else {
        return errorResponse(event, 400, 'INVALID_ENDPOINT', 'Endpoint de notícias inválido.', {
            methods: ALLOWED_METHODS,
        });
    }

    try {
        const response = await fetchNews(endpoint, params, keys);
        if (!response.ok) {
            console.warn(`[News] Upstream returned ${response.status}.`);
            return errorResponse(event, 503, 'NEWS_UPSTREAM_UNAVAILABLE', 'Não foi possível carregar as notícias agora. Tente novamente em instantes.', {
                methods: ALLOWED_METHODS,
                headers: { 'Retry-After': response.status === 429 ? '60' : '15' },
            });
        }

        const data: unknown = await response.json();
        const record = typeof data === 'object' && data !== null && !Array.isArray(data)
            ? data as Record<string, unknown>
            : {};
        const articles = sanitizeArticles(record.articles);
        const totalArticles = typeof record.totalArticles === 'number' && Number.isFinite(record.totalArticles)
            ? Math.max(articles.length, Math.floor(record.totalArticles))
            : articles.length;

        return jsonResponse(event, 200, { totalArticles, articles }, {
            methods: ALLOWED_METHODS,
            cacheControl: 'public, max-age=120, s-maxage=300, stale-while-revalidate=600',
            headers: {
                'X-RateLimit-Limit': String(rateLimit.limit),
                'X-RateLimit-Remaining': String(rateLimit.remaining),
            },
        });
    } catch (error) {
        console.error(`[News] Request failed (${safeErrorName(error)}).`);
        return errorResponse(event, 503, 'NEWS_UPSTREAM_UNAVAILABLE', 'Não foi possível carregar as notícias agora. Tente novamente em instantes.', {
            methods: ALLOWED_METHODS,
            headers: { 'Retry-After': '15' },
        });
    }
};

export { handler };
