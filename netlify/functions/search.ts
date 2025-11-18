import { type Handler, type HandlerEvent } from "@netlify/functions";

const API_KEY = process.env.SEARCH_API;
const SEARCH_ID = process.env.SEARCH_ID;

const handler: Handler = async (event: HandlerEvent) => {
    if (!API_KEY || !SEARCH_ID) {
        return { statusCode: 500, body: JSON.stringify({ message: "Chaves da API de pesquisa não configuradas no servidor." }) };
    }

    const query = event.queryStringParameters?.q;

    if (!query) {
        return { statusCode: 400, body: JSON.stringify({ message: "Parâmetro de busca 'q' é obrigatório." }) };
    }

    const url = `https://www.googleapis.com/customsearch/v1?key=${API_KEY}&cx=${SEARCH_ID}&q=${encodeURIComponent(query)}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            const errorData = await response.json();
            console.error("Google Search API Error:", errorData);
            throw new Error(errorData.error?.message || "Erro ao se comunicar com a API de pesquisa.");
        }
        
        const data = await response.json();
        
        // Return top 5 results, or fewer if not available
        const searchResults = data.items?.slice(0, 5).map((item: any) => ({
            title: item.title,
            link: item.link,
            snippet: item.snippet,
        })) || [];

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(searchResults),
        };

    } catch (error) {
        console.error('Erro na função de pesquisa Netlify:', error);
        const errorMessage = error instanceof Error ? error.message : "Um erro interno ocorreu na pesquisa.";
        return { statusCode: 500, body: JSON.stringify({ message: errorMessage }) };
    }
};

export { handler };
