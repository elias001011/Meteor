

import React, { useState, useEffect, useCallback } from 'react';
import { getTopHeadlines, searchNews, NewsArticle, NewsCategory, formatPublishedDate, extractNewsContext } from '../../services/newsService';
import { useTheme } from '../context/ThemeContext';
import { safeExternalUrl } from '../../services/urlSafety';
import { SearchIcon, NewspaperIcon, RefreshCwIcon, SparklesIcon, ExternalLinkIcon, AlertCircleIcon } from '../icons';

interface NewsViewProps {
    onAskAIAboutNews?: (newsContext: string) => void;
}

// Extend Window interface for news to AI feature
declare global {
    interface Window {
        __meteor_newsToAI?: (context: string) => void;
    }
}

const CATEGORIES: { value: NewsCategory | ''; label: string; emoji: string }[] = [
    { value: '', label: 'Destaques', emoji: '🔥' },
    { value: 'general', label: 'Geral', emoji: '📰' },
    { value: 'world', label: 'Mundo', emoji: '🌍' },
    { value: 'nation', label: 'Brasil', emoji: '🇧🇷' },
    { value: 'business', label: 'Negócios', emoji: '💼' },
    { value: 'technology', label: 'Tecnologia', emoji: '💻' },
    { value: 'science', label: 'Ciência', emoji: '🔬' },
    { value: 'health', label: 'Saúde', emoji: '🏥' },
    { value: 'sports', label: 'Esportes', emoji: '⚽' },
    { value: 'entertainment', label: 'Entretenimento', emoji: '🎬' },
];

const NewsView: React.FC<NewsViewProps> = ({ onAskAIAboutNews }) => {
    const { cardClass, classes, glassClass, density } = useTheme();
    
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
        <div className="h-full overflow-y-auto pb-24 pt-16 lg:pb-6">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
                
                {/* Header */}
                <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-xl ${classes.bg} bg-opacity-20`}>
                        <NewspaperIcon className={`w-6 h-6 ${classes.text}`} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">Notícias</h2>
                        <p className="text-sm text-gray-400">
                            {isSearching 
                                ? `Buscando: "${searchQuery}"` 
                                : selectedCategory 
                                    ? CATEGORIES.find(c => c.value === selectedCategory)?.label 
                                    : 'Principais destaques'
                            }
                        </p>
                    </div>
                </div>

                {/* Barra de Busca */}
                <form onSubmit={handleSearch} className="relative">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar notícias..."
                        className={`w-full bg-gray-900/60 border border-white/10 rounded-2xl py-3 pl-11 pr-24 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-inset ${classes.ring} transition-all`}
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
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${
                                    selectedCategory === cat.value
                                        ? `${classes.bg} text-white`
                                        : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                                }`}
                            >
                                <span>{cat.emoji}</span>
                                <span>{cat.label}</span>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {articles.map((article, index) => {
                            const safeUrl = safeExternalUrl(article.url);

                            return (
                            <article
                                key={`${article.url}-${index}`}
                                className={`group ${cardClass} rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl border border-white/5 hover:border-white/10 flex flex-col`}
                            >
                                {/* Imagem */}
                                <div className="relative h-40 overflow-hidden bg-gray-800">
                                    {article.image ? (
                                        <img
                                            src={article.image}
                                            alt={article.title}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            loading="lazy"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                            }}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                                            <NewspaperIcon className="w-12 h-12 text-gray-600" />
                                        </div>
                                    )}
                                    
                                    {/* Badge de data */}
                                    <div className={`absolute top-3 right-3 ${glassClass} px-2 py-1 rounded-lg text-xs text-white`}>
                                        {formatPublishedDate(article.publishedAt)}
                                    </div>
                                </div>

                                {/* Conteúdo */}
                                <div className="p-4 flex-1 flex flex-col">
                                    {/* Fonte */}
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-xs text-gray-500 truncate">
                                            {article.source.name}
                                        </span>
                                    </div>

                                    {/* Título */}
                                    <h3 className="text-white font-semibold text-base leading-snug mb-2 line-clamp-2 group-hover:text-cyan-300 transition-colors">
                                        {article.title}
                                    </h3>

                                    {/* Descrição */}
                                    <p className="text-gray-400 text-sm leading-relaxed line-clamp-3 mb-4 flex-1">
                                        {article.description || 'Sem descrição disponível.'}
                                    </p>

                                    {/* Ações */}
                                    <div className="flex gap-2 pt-3 border-t border-white/5">
                                        <button
                                            onClick={() => handleSummarizeWithAI(article)}
                                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl ${classes.bg} hover:brightness-110 text-white text-sm font-semibold shadow-lg transition-all active:scale-95`}
                                        >
                                            <SparklesIcon className="w-4 h-4" />
                                            Resumo com IA
                                        </button>
                                        {safeUrl ? (
                                            <a
                                                href={safeUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-medium transition-colors"
                                            >
                                                <ExternalLinkIcon className="w-3.5 h-3.5" />
                                                Ler
                                            </a>
                                        ) : (
                                            <span className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-white/5 text-gray-500 text-xs font-medium cursor-not-allowed opacity-70">
                                                <ExternalLinkIcon className="w-3.5 h-3.5" />
                                                Ler
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </article>
                            );
                        })}
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
