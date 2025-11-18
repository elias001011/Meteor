import type { SearchResultItem } from '../types';

export const getSearchResults = async (query: string): Promise<SearchResultItem[]> => {
    try {
        const response = await fetch(`/.netlify/functions/search?q=${encodeURIComponent(query)}`);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'A pesquisa na web falhou.' }));
            throw new Error(errorData.message || 'A pesquisa na web falhou.');
        }
        const data: SearchResultItem[] = await response.json();
        return data;
    } catch (error) {
        console.error("Search service error:", error);
        // Retorna um array vazio em caso de falha para não quebrar a aplicação.
        return []; 
    }
};
