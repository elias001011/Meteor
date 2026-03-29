import { GoogleGenAI } from '@google/genai';
import { type Handler, type HandlerEvent } from '@netlify/functions';

const API_KEY = process.env.GEMINI_API;

const SEARCH_MODELS = [
    'gemini-3.1-flash-lite-preview',
    'gemini-2.5-flash-lite',
    'gemini-3-flash-preview',
];

const buildSearchResults = (response: any, query: string) => {
    const groundingChunks = response?.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const summary = (response?.text || '').trim();
    const seen = new Set<string>();

    const results = groundingChunks
        .map((chunk: any) => chunk?.web)
        .filter((web: any) => web?.uri)
        .filter((web: any) => {
            if (seen.has(web.uri)) return false;
            seen.add(web.uri);
            return true;
        })
        .slice(0, 5)
        .map((web: any) => ({
            title: web.title || new URL(web.uri).hostname,
            link: web.uri,
            snippet: summary ? summary.slice(0, 220) : `Resultado relevante para ${query}`,
        }));

    return results;
};

const handler: Handler = async (event: HandlerEvent) => {
    if (!API_KEY) {
        return { statusCode: 500, body: JSON.stringify({ message: 'Chave do Gemini não configurada no servidor.' }) };
    }

    const query = event.queryStringParameters?.q;

    if (!query) {
        return { statusCode: 400, body: JSON.stringify({ message: "Parâmetro de busca 'q' é obrigatório." }) };
    }

    try {
        const ai = new GoogleGenAI({ apiKey: API_KEY });

        for (const model of SEARCH_MODELS) {
            try {
                const response = await ai.models.generateContent({
                    model,
                    contents: `Pesquise na web sobre: ${query}. Retorne uma resposta curta e informativa.`,
                    config: {
                        tools: [{
                            googleSearch: {},
                        }],
                        temperature: 0.2,
                    },
                });

                const searchResults = buildSearchResults(response, query);
                if (searchResults.length > 0) {
                    return {
                        statusCode: 200,
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(searchResults),
                    };
                }
            } catch (error) {
                // Try the next model.
            }
        }

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify([]),
        };
    } catch (error) {
        console.error('Erro na função de pesquisa Netlify:', error);
        const errorMessage = error instanceof Error ? error.message : 'Um erro interno ocorreu na pesquisa.';
        return { statusCode: 500, body: JSON.stringify({ message: errorMessage }) };
    }
};

export { handler };
