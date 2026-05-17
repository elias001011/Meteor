import { type Handler, type HandlerEvent } from "@netlify/functions";
import { buildRateLimitResponse, checkRateLimit, safeText, sanitizeExternalUrl } from "./security";

const BASE_URL = "https://gnews.io/api/v4";
const VALID_CATEGORIES = ['general', 'world', 'nation', 'business', 'technology', 'entertainment', 'sports', 'science', 'health'];
const DEFAULT_HEADERS = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
};

const clampMax = (value: string | undefined, fallback: number, maxAllowed: number): string => {
    const parsed = Number.parseInt(value || String(fallback), 10);
    if (!Number.isFinite(parsed)) return String(fallback);
    return String(Math.min(Math.max(parsed, 1), maxAllowed));
};

const handler: Handler = async (event: HandlerEvent) => {
    const PRIMARY_KEY = process.env.GNEWS_API;
    const FALLBACK_KEY = process.env.GNEWS_2;

    if (!PRIMARY_KEY && !FALLBACK_KEY) {
        return { 
            statusCode: 500,
            headers: DEFAULT_HEADERS,
            body: JSON.stringify({ message: "API keys not configured" }) 
        };
    }

    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, headers: DEFAULT_HEADERS, body: JSON.stringify({ message: 'Method Not Allowed' }) };
    }

    const rateLimit = await checkRateLimit(event, {
        namespace: 'news',
        limit: 80,
        windowSeconds: 600,
    });
    if (!rateLimit.allowed) {
        return buildRateLimitResponse(rateLimit);
    }

    try {
        const { endpoint, q, category, lang, country, max } = event.queryStringParameters || {};
        
        const defaultLang = 'pt';
        const defaultCountry = 'br';
        const defaultMax = '10';

        let params = new URLSearchParams();
        
        switch (endpoint) {
            case 'top-headlines': {
                params.set('lang', safeText(lang, 2) || defaultLang);
                params.set('country', safeText(country, 2) || defaultCountry);
                params.set('max', clampMax(max, Number(defaultMax), 20));
                
                if (category && VALID_CATEGORIES.includes(category)) {
                    params.set('category', category);
                }
                break;
            }
            
            case 'search': {
                const query = safeText(q, 100);
                if (!query || query.length < 2) {
                    return { 
                        statusCode: 400,
                        headers: DEFAULT_HEADERS,
                        body: JSON.stringify({ message: "Search query required (min 2 chars)" }) 
                    };
                }
                
                params.set('q', query);
                params.set('lang', safeText(lang, 2) || defaultLang);
                params.set('max', clampMax(max, Number(defaultMax), 20));
                
                const safeCountry = safeText(country, 2);
                if (safeCountry) {
                    params.set('country', safeCountry);
                }
                break;
            }
            
            default:
                return { 
                    statusCode: 400,
                    headers: DEFAULT_HEADERS,
                    body: JSON.stringify({ message: 'Invalid endpoint' }) 
                };
        }

        const keyToUse = PRIMARY_KEY || FALLBACK_KEY!;
        params.set('apikey', keyToUse);
        const apiUrl = `${BASE_URL}/${endpoint}?${params.toString()}`;
        
        console.log('[News] Trying primary API...');
        let response = await fetch(apiUrl, { 
            headers: { 'Accept': 'application/json' },
            signal: AbortSignal.timeout(10000)
        });
        console.log('[News] Primary response:', response.status);

        if ((response.status === 403 || response.status === 429) && PRIMARY_KEY && FALLBACK_KEY) {
            console.log('[News] Primary failed, trying fallback...');
            params.set('apikey', FALLBACK_KEY);
            const fallbackUrl = `${BASE_URL}/${endpoint}?${params.toString()}`;
            response = await fetch(fallbackUrl, { 
                headers: { 'Accept': 'application/json' },
                signal: AbortSignal.timeout(10000)
            });
            console.log('[News] Fallback response:', response.status);
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
            return {
                statusCode: response.status,
                headers: DEFAULT_HEADERS,
                body: JSON.stringify({ message: safeText(errorData.message, 180) || "Error fetching news" }),
            };
        }

        const data = await response.json();
        
        const sanitizedArticles = (Array.isArray(data.articles) ? data.articles : []).map((article: any) => ({
            title: safeText(article.title, 220) || 'No title',
            description: safeText(article.description, 500),
            content: safeText(article.content, 1200),
            url: sanitizeExternalUrl(article.url),
            image: sanitizeExternalUrl(article.image),
            publishedAt: safeText(article.publishedAt, 80),
            source: {
                name: safeText(article.source?.name, 120) || 'Unknown source',
                url: sanitizeExternalUrl(article.source?.url) || '',
            },
        })).filter((article: any) => article.url);

        return {
            statusCode: 200,
            headers: { 
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=300',
            },
            body: JSON.stringify({
                totalArticles: typeof data.totalArticles === 'number' ? data.totalArticles : sanitizedArticles.length,
                articles: sanitizedArticles,
            }),
        };

    } catch (error) {
        console.error("[News] Error:", error);
        return {
            statusCode: 500,
            headers: DEFAULT_HEADERS,
            body: JSON.stringify({ 
                message: error instanceof Error ? safeText(error.message, 180) : "Internal error" 
            }),
        };
    }
};

export { handler };
