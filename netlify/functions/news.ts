import { type Handler, type HandlerEvent } from "@netlify/functions";

const BASE_URL = "https://gnews.io/api/v4";
const VALID_CATEGORIES = ['general', 'world', 'nation', 'business', 'technology', 'entertainment', 'sports', 'science', 'health'];

const handler: Handler = async (event: HandlerEvent) => {
    const PRIMARY_KEY = process.env.GNEWS_API;
    const FALLBACK_KEY = process.env.GNEWS_2;

    if (!PRIMARY_KEY && !FALLBACK_KEY) {
        return { 
            statusCode: 500, 
            body: JSON.stringify({ message: "API keys not configured" }) 
        };
    }

    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { endpoint, q, category, lang, country, max } = event.queryStringParameters || {};
        
        const defaultLang = 'pt';
        const defaultCountry = 'br';
        const defaultMax = '10';

        let params = new URLSearchParams();
        
        switch (endpoint) {
            case 'top-headlines': {
                params.set('lang', lang || defaultLang);
                params.set('country', country || defaultCountry);
                params.set('max', max || defaultMax);
                
                if (category && VALID_CATEGORIES.includes(category)) {
                    params.set('category', category);
                }
                break;
            }
            
            case 'search': {
                const query = (q || '').trim().slice(0, 100);
                if (!query || query.length < 2) {
                    return { 
                        statusCode: 400, 
                        body: JSON.stringify({ message: "Search query required (min 2 chars)" }) 
                    };
                }
                
                params.set('q', query);
                params.set('lang', (lang || defaultLang).slice(0, 2));
                params.set('max', Math.min(parseInt(max || defaultMax, 10), 20).toString());
                
                if (country) {
                    params.set('country', country);
                }
                break;
            }
            
            default:
                return { 
                    statusCode: 400, 
                    body: JSON.stringify({ message: 'Invalid endpoint' }) 
                };
        }

        // Tenta com a API primária
        const keyToUse = PRIMARY_KEY || FALLBACK_KEY!;
        params.set('apikey', keyToUse);
        const apiUrl = `${BASE_URL}/${endpoint}?${params.toString()}`;
        
        console.log('[News] Trying primary API...');
        let response = await fetch(apiUrl, { 
            headers: { 'Accept': 'application/json' },
            signal: AbortSignal.timeout(10000)
        });
        console.log('[News] Primary response:', response.status);

        // Se falhou com 403 ou 429 e tem fallback, tenta
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
                body: JSON.stringify({ message: errorData.message || "Error fetching news" }),
            };
        }

        const data = await response.json();
        
        const sanitizedArticles = (data.articles || []).map((article: any) => ({
            title: article.title?.trim() || 'No title',
            description: article.description?.trim() || '',
            content: article.content?.trim() || '',
            url: article.url,
            image: article.image || null,
            publishedAt: article.publishedAt,
            source: {
                name: article.source?.name || 'Unknown source',
                url: article.source?.url || '',
            },
        }));

        return {
            statusCode: 200,
            headers: { 
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=300',
            },
            body: JSON.stringify({
                totalArticles: data.totalArticles || sanitizedArticles.length,
                articles: sanitizedArticles,
            }),
        };

    } catch (error) {
        console.error("[News] Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                message: error instanceof Error ? error.message : "Internal error" 
            }),
        };
    }
};

export { handler };
