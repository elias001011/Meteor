

import React, { useState, useEffect, useCallback } from 'react';
import { getTopHeadlines, searchNews, NewsArticle, NewsCategory, formatPublishedDate, extractNewsContext } from '../../services/newsService';
import { useTheme } from '../context/ThemeContext';
import { SearchIcon, NewspaperIcon, RefreshCwIcon, ExternalLinkIcon, AlertCircleIcon } from '../icons';

interface NewsViewProps {
    onAskAIAboutNews?: (newsContext: string) => void;
}

// Extend Window interface for news to AI feature
declare global {
    interface Window {
        __meteor_newsToAI?: (context: string) => void;
    }
}

const CATEGORIES: { value: NewsCategory | ''; label: string }[] = [
    { value: '', label: 'Destaques' },
    { value: 'general', label: 'Geral' },
    { value: 'world', label: 'Mundo' },
    { value: 'nation', label: 'Brasil' },
    { value: 'business', label: 'Negócios' },
    { value: 'technology', label: 'Tecnologia' },
    { value: 'science', label: 'Ciência' },
    { value: 'health', label: 'Saúde' },
    { value: 'sports', label: 'Esportes' },
    { value: 'entertainment', label: 'Entretenimento' },
];

const safeExternalUrl = (value: string): string | undefined => {
    try {
        const url = new URL(value);
        return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : undefined;
    } catch {
        return undefined;
    }
};

const NewsView: React.FC<NewsViewProps> = ({ onAskAIAboutNews }) => {
    const { cardClass, classes } = useTheme();
    
    const [articles, setArticles] = useState<NewsArticle[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<NewsCategory | ''>('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    // Buscar notícias iniciais
    const fetchNews = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await getTopHeadlines(
                selectedCategory || undefined,
                12
            );
            setArticles(response.articles);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao carregar notícias');
            setArticles([]);
        } finally {
            setLoading(false);
        }
    }, [selectedCategory]);

    // Buscar ao mudar categoria
    useEffect(() => {
        if (!isSearching) {
            fetchNews();
        }
    }, [selectedCategory, fetchNews, isSearching]);

    // Handler de busca
    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) {
            setIsSearching(false);
            fetchNews();
            return;
        }

        setLoading(true);
        setError(null);
        setIsSearching(true);

        try {
            const response = await searchNews(searchQuery.trim(), 12);
            setArticles(response.articles);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro na busca');
            setArticles([]);
        } finally {
            setLoading(false);
        }
    };

    // Limpar busca
    const clearSearch = () => {
        setSearchQuery('');
        setIsSearching(false);
        fetchNews();
    };

    // Handler para "Resumo com IA"
    const handleSummarizeWithAI = (article: NewsArticle) => {
        if (onAskAIAboutNews) {
            const context = extractNewsContext(article);
            onAskAIAboutNews(context);
        }
    };

    return (
        <div className="h-full overflow-y-auto pb-24 pt-10 lg:pb-6">
            <div className="mx-auto max-w-5xl space-y-5 px-4 sm:px-6">
                
                {/* Header */}
                <div>
                        <h2 className="text-2xl font-semibold tracking-tight text-white">Notícias</h2>
                        <p className="text-sm text-gray-400">
                            {isSearching 
                                ? `Buscando: "${searchQuery}"` 
                                : selectedCategory 
                                    ? CATEGORIES.find(c => c.value === selectedCategory)?.label 
                                    : 'Principais destaques'
                            }
                        </p>
                </div>

                {/* Barra de Busca */}
                <form onSubmit={handleSearch} className="relative">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar notícias..."
                        className={`h-11 w-full rounded-xl border border-white/[0.08] bg-[#111419] pl-10 pr-24 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 ${classes.ring}`}
                    />
                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={clearSearch}
                                className="px-2 py-1 text-xs text-gray-400 hover:text-white transition-colors"
                            >
                                Limpar
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={loading}
                            className={`${classes.bg} ${classes.bgHover} text-white text-xs px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50`}
                        >
                            Buscar
                        </button>
                    </div>
                </form>

                {/* Categorias */}
                {!isSearching && (
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat.value}
                                onClick={() => setSelectedCategory(cat.value)}
                                className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm transition-colors ${
                                    selectedCategory === cat.value
                                        ? 'bg-white/[0.09] text-white'
                                        : 'text-gray-500 hover:bg-white/[0.04] hover:text-white'
                                }`}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                        <div className={`w-8 h-8 border-2 border-white/20 ${classes.text.replace('text-', 'border-t-')} rounded-full animate-spin`} />
                        <p className="text-gray-400 text-sm">Carregando notícias...</p>
                    </div>
                )}

                {/* Error State */}
                {error && !loading && (
                    <div className={`${cardClass} rounded-2xl p-6 text-center`}>
                        <AlertCircleIcon className="w-10 h-10 text-red-400 mx-auto mb-3" />
                        <h3 className="text-white font-medium mb-1">Erro ao carregar</h3>
                        <p className="text-gray-400 text-sm mb-4">{error}</p>
                        <button
                            onClick={fetchNews}
                            className={`inline-flex items-center gap-2 ${classes.bg} ${classes.bgHover} text-white px-4 py-2 rounded-lg text-sm transition-colors`}
                        >
                            <RefreshCwIcon className="w-4 h-4" />
                            Tentar novamente
                        </button>
                    </div>
                )}

                {/* News Grid */}
                {!loading && !error && articles.length > 0 && (
                    <div className="space-y-3">
                        {articles.map((article, index) => (
                            <article
                                key={`${article.url}-${index}`}
                                className={`group overflow-hidden rounded-2xl sm:flex ${cardClass}`}
                            >
                                {/* Imagem */}
                                <div className="relative h-40 flex-none overflow-hidden bg-[#181c22] sm:h-auto sm:w-52">
                                    {article.image ? (
                                        <img
                                            src={article.image}
                                            alt={article.title}
                                            className="h-full w-full object-cover"
                                            loading="lazy"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                            }}
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center bg-[#181c22]">
                                            <NewspaperIcon className="h-8 w-8 text-gray-700" />
                                        </div>
                                    )}
                                    
                                    {/* Badge de data */}
                                    <div className="absolute right-2 top-2 rounded-md bg-black/65 px-2 py-1 text-[10px] text-white/75">
                                        {formatPublishedDate(article.publishedAt)}
                                    </div>
                                </div>

                                {/* Conteúdo */}
                                <div className="flex min-w-0 flex-1 flex-col p-4">
                                    {/* Fonte */}
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-xs text-gray-500 truncate">
                                            {article.source.name}
                                        </span>
                                    </div>

                                    {/* Título */}
                                    <h3 className="mb-2 line-clamp-2 text-base font-medium leading-snug text-white">
                                        {article.title}
                                    </h3>

                                    {/* Descrição */}
                                    <p className="mb-4 line-clamp-2 flex-1 text-sm leading-relaxed text-gray-400">
                                        {article.description || 'Sem descrição disponível.'}
                                    </p>

                                    {/* Ações */}
                                    <div className="flex gap-2 pt-3 border-t border-white/5">
                                        <button
                                            onClick={() => handleSummarizeWithAI(article)}
                                            className={`rounded-lg px-2 py-2 text-left text-xs font-medium ${classes.text} hover:bg-white/[0.04]`}
                                        >
                                            Perguntar à IA
                                        </button>
                                        
                                        <a
                                            href={safeExternalUrl(article.url)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="ml-auto flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-gray-400 hover:bg-white/[0.04] hover:text-white"
                                        >
                                            <ExternalLinkIcon className="w-3.5 h-3.5" />
                                            Ler
                                        </a>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {!loading && !error && articles.length === 0 && (
                    <div className={`${cardClass} rounded-2xl p-8 text-center`}>
                        <NewspaperIcon className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-white font-medium mb-1">Nenhuma notícia encontrada</h3>
                        <p className="text-gray-400 text-sm">
                            {isSearching 
                                ? 'Tente outros termos de busca.' 
                                : 'Não há notícias disponíveis no momento.'
                            }
                        </p>
                    </div>
                )}

                {/* Footer Info */}
                <div className="text-center text-xs text-gray-500 pt-4">
                    Notícias fornecidas por GNews API • Atualizado em tempo real
                </div>
            </div>
        </div>
    );
};

export default NewsView;
