

import { type Handler, type HandlerEvent } from "@netlify/functions";

const GNEWS_API_KEY = process.env.GNEWS_API;
const BASE_URL = "https://gnews.io/api/v4";

// Categorias disponíveis na GNews
const VALID_CATEGORIES = ['general', 'world', 'nation', 'business', 'technology', 'entertainment', 'sports', 'science', 'health'];

// Rate limiting simples baseado em IP (em memória - reseta a cada deploy)
// Para produção com alta carga, considere usar Netlify Blobs ou outra solução persistente
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_REQUESTS = 30; // 30 requests por hora por IP
const RATE_LIMIT_WINDOW = 3600000; // 1 hora em ms

const getClientIP = (event: HandlerEvent): string => {
    // Tentar obter IP de vários headers possíveis
    const headers = event.headers;
    return headers['x-forwarded-for']?.split(',')[0]?.trim() || 
           headers['x-real-ip'] || 
           headers['client-ip'] || 
           'unknown';
};

const checkRateLimit = (ip: string): boolean => {
    const now = Date.now();
    const record = rateLimitMap.get(ip);
    
    if (!record || now > record.resetTime) {
        // Primeira requisição ou janela expirada
        rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
        return true;
    }
    
    if (record.count >= RATE_LIMIT_REQUESTS) {
        return false;
    }
    
    record.count++;
    return true;
};

// Sanitização de input para prevenir XSS
const sanitizeInput = (input: string): string => {
    return input
        .replace(/[<>]/g, '') // Remove < e >
        .replace(/["']/g, '') // Remove aspas
        .trim()
        .slice(0, 100); // Limita a 100 caracteres
};

const handler: Handler = async (event: HandlerEvent) => {
    // Log para debug
    console.log('[GNews] Request recebida:', {
        httpMethod: event.httpMethod,
        headers: event.headers,
        queryStringParameters: event.queryStringParameters,
        hasApiKey: !!GNEWS_API_KEY,
        apiKeyPrefix: GNEWS_API_KEY ? GNEWS_API_KEY.substring(0, 10) + '...' : 'VAZIA'
    });
    
    if (!GNEWS_API_KEY) {
        console.error('[GNews] API key não configurada');
        return { 
            statusCode: 500, 
            body: JSON.stringify({ message: "Serviço de notícias indisponível - API key não configurada." }) 
        };
    }

    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    // Rate limiting
    const clientIP = getClientIP(event);
    if (!checkRateLimit(clientIP)) {
        return {
            statusCode: 429,
            body: JSON.stringify({ message: "Muitas requisições. Tente novamente em alguns minutos." }),
        };
    }

    try {
        const { endpoint, q, category, lang, country, max } = event.queryStringParameters || {};
        
        // Parâmetros padrão otimizados para o Brasil
        const defaultLang = 'pt';
        const defaultCountry = 'br';
        const defaultMax = '10';

        let apiUrl: string;

        switch (endpoint) {
            case 'top-headlines': {
                // Notícias principais/top headlines
                const params = new URLSearchParams({
                    apikey: GNEWS_API_KEY,
                    lang: lang || defaultLang,
                    country: country || defaultCountry,
                    max: max || defaultMax,
                });
                
                // Categoria opcional
                if (category && VALID_CATEGORIES.includes(category)) {
                    params.append('category', category);
                }
                
                apiUrl = `${BASE_URL}/top-headlines?${params.toString()}`;
                break;
            }
            
            case 'search': {
                // Busca por palavras-chave
                const sanitizedQuery = sanitizeInput(q || '');
                if (!sanitizedQuery || sanitizedQuery.length < 2) {
                    return { 
                        statusCode: 400, 
                        body: JSON.stringify({ message: "Termo de busca é obrigatório (mínimo 2 caracteres)." }) 
                    };
                }
                
                const params = new URLSearchParams({
                    apikey: GNEWS_API_KEY,
                    q: sanitizedQuery,
                    lang: sanitizeInput(lang || defaultLang).slice(0, 2),
                    max: Math.min(parseInt(max || defaultMax, 10), 20).toString(), // Max 20
                });
                
                // Filtro de país opcional
                if (country) {
                    params.append('country', country);
                }
                
                apiUrl = `${BASE_URL}/search?${params.toString()}`;
                break;
            }
            
            default:
                return { 
                    statusCode: 400, 
                    body: JSON.stringify({ message: 'Endpoint inválido. Use "top-headlines" ou "search".' }) 
                };
        }

        const response = await fetch(apiUrl, {
            headers: {
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido na GNews API' }));
            
            console.error('[GNews] Erro da API:', {
                status: response.status,
                statusText: response.statusText,
                errorData,
                apiUrl: apiUrl.replace(GNEWS_API_KEY!, '***')
            });
            
            // Rate limit específico
            if (response.status === 429) {
                return {
                    statusCode: 429,
                    body: JSON.stringify({ 
                        message: "Limite de requisições atingido. Tente novamente em alguns minutos." 
                    }),
                };
            }
            
            return {
                statusCode: response.status,
                body: JSON.stringify({ 
                    message: errorData.message || "Erro ao buscar notícias." 
                }),
            };
        }

        const data = await response.json();
        
        // Processar e sanitizar os dados antes de retornar
        const sanitizedArticles = (data.articles || []).map((article: any) => ({
            title: article.title?.trim() || 'Sem título',
            description: article.description?.trim() || '',
            content: article.content?.trim() || '',
            url: article.url,
            image: article.image || null,
            publishedAt: article.publishedAt,
            source: {
                name: article.source?.name || 'Fonte desconhecida',
                url: article.source?.url || '',
            },
        }));

        return {
            statusCode: 200,
            headers: { 
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=300', // Cache de 5 minutos
            },
            body: JSON.stringify({
                totalArticles: data.totalArticles || sanitizedArticles.length,
                articles: sanitizedArticles,
            }),
        };

    } catch (error) {
        console.error("[GNews Function] Fatal error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                message: error instanceof Error ? error.message : "Erro interno ao processar notícias." 
            }),
        };
    }
};

export { handler };
