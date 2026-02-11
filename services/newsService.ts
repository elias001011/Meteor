

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

/**
 * Busca as principais notícias (top headlines)
 */
export async function getTopHeadlines(
    category?: NewsCategory, 
    max: number = 10
): Promise<NewsResponse> {
    const params = new URLSearchParams({
        endpoint: 'top-headlines',
        max: max.toString(),
    });
    
    if (category) {
        params.append('category', category);
    }

    const response = await fetch(`/.netlify/functions/news?${params.toString()}`);
    
    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Erro ao buscar notícias' }));
        throw new Error(error.message || `Erro ${response.status}`);
    }
    
    return response.json();
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
        q: query.trim(),
        max: max.toString(),
    });

    const response = await fetch(`/.netlify/functions/news?${params.toString()}`);
    
    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Erro ao buscar notícias' }));
        throw new Error(error.message || `Erro ${response.status}`);
    }
    
    return response.json();
}

/**
 * Formata a data de publicação para exibição relativa
 * Ex: "há 2 horas", "hoje", "ontem"
 */
export function formatPublishedDate(publishedAt: string): string {
    const published = new Date(publishedAt);
    const now = new Date();
    const diffMs = now.getTime() - published.getTime();
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
