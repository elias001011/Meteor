

export interface NewsArticle {
    title: string;
    description: string;
    content: string;
    url: string;
    image: string | null;
    publishedAt: string;
    source: {
        name: string;
        url: string;
    };
}

export interface NewsResponse {
    totalArticles: number;
    articles: NewsArticle[];
}

export type NewsCategory = 'general' | 'world' | 'nation' | 'business' | 'technology' | 'entertainment' | 'sports' | 'science' | 'health';

const fetchNewsResponse = async (params: URLSearchParams): Promise<NewsResponse> => {
    let response: Response;
    try {
        response = await fetch(`/.netlify/functions/news?${params.toString()}`, {
            headers: { Accept: 'application/json' },
            signal: AbortSignal.timeout(12_000),
        });
    } catch (error) {
        if (error instanceof DOMException && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
            throw new Error('As notícias demoraram para responder. Tente novamente.');
        }
        throw new Error('Não foi possível conectar ao serviço de notícias.');
    }

    const data: unknown = await response.json().catch(() => null);
    if (!response.ok) {
        const message = typeof data === 'object' && data !== null && 'message' in data && typeof data.message === 'string'
            ? data.message
            : `Não foi possível carregar as notícias (erro ${response.status}).`;
        throw new Error(message);
    }

    if (typeof data !== 'object' || data === null || !('articles' in data) || !Array.isArray(data.articles)) {
        throw new Error('O serviço de notícias retornou uma resposta inválida.');
    }

    return data as NewsResponse;
};

/**
 * Busca as principais notícias (top headlines)
 */
export async function getTopHeadlines(
    category?: NewsCategory, 
    max: number = 10
): Promise<NewsResponse> {
    const params = new URLSearchParams({
        endpoint: 'top-headlines',
        max: String(Math.min(Math.max(Math.floor(max), 1), 20)),
    });
    
    if (category) {
        params.append('category', category);
    }

    return fetchNewsResponse(params);
}

/**
 * Busca notícias por termo de pesquisa
 */
export async function searchNews(
    query: string, 
    max: number = 10
): Promise<NewsResponse> {
    if (!query.trim() || query.trim().length < 2) {
        throw new Error('Termo de busca deve ter pelo menos 2 caracteres');
    }

    const params = new URLSearchParams({
        endpoint: 'search',
        q: query.trim().slice(0, 100),
        max: String(Math.min(Math.max(Math.floor(max), 1), 20)),
    });

    return fetchNewsResponse(params);
}

/**
 * Formata a data de publicação para exibição relativa
 * Ex: "há 2 horas", "hoje", "ontem"
 */
export function formatPublishedDate(publishedAt: string): string {
    const published = new Date(publishedAt);
    if (!Number.isFinite(published.getTime())) return 'data não informada';
    const now = new Date();
    const diffMs = Math.max(0, now.getTime() - published.getTime());
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 5) return 'agora mesmo';
    if (diffMins < 60) return `há ${diffMins} min`;
    if (diffHours < 24) return `há ${diffHours}h`;
    if (diffDays === 1) return 'ontem';
    if (diffDays < 7) return `há ${diffDays} dias`;
    
    return published.toLocaleDateString('pt-BR', {
        day: 'numeric',
        month: 'short',
    });
}

/**
 * Extrai texto relevante de uma notícia para enviar à IA
 */
export function extractNewsContext(article: NewsArticle): string {
    const parts = [
        `📰 **${article.title}**`,
        '',
        article.description,
    ];
    
    if (article.content) {
        // Remove o "... [+X chars]" do final do conteúdo
        const cleanContent = article.content.replace(/\s*\[\+\d+\s*chars\]\s*$/, '').trim();
        if (cleanContent) {
            parts.push('', cleanContent);
        }
    }
    
    parts.push('', `Fonte: ${article.source.name}`);
    
    return parts.join('\n');
}
