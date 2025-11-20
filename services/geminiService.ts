
import type { AllWeatherData, SearchResultItem, ChatMessage, AiMetadata } from '../types';
import type { Content } from '@google/genai';
import { getSearchResults } from './searchService';
import { fetchAllWeatherData } from './weatherService';

const MAX_RECURSION_DEPTH = 3;
const DAILY_REQUEST_LIMIT = 5;
const USAGE_PREFIX = 'meteor_ai_usage_';

interface GeminiResponse {
    text: string;
    metadata?: AiMetadata;
    command?: {
        type: 'search' | 'weather' | 'theme' | 'app';
        payload: string;
    };
}

const checkAndIncrementLimit = (): boolean => {
    const today = new Date().toISOString().split('T')[0];
    const key = `${USAGE_PREFIX}${today}`;
    const usageStr = localStorage.getItem(key);
    const usage = usageStr ? parseInt(usageStr, 10) : 0;

    if (usage >= DAILY_REQUEST_LIMIT) {
        return false;
    }

    localStorage.setItem(key, (usage + 1).toString());
    return true;
};

/**
 * Recursively calls the AI, handling commands/tools internally.
 */
export async function* streamChatResponse(
    prompt: string, 
    history: ChatMessage[],
    weatherContext: Partial<AllWeatherData> | null,
    initialSearchResults: SearchResultItem[] | null,
    timeContext: string,
    appSettings: { userName?: string; aiInstructions?: string },
    appActions?: { 
        setTheme?: (theme: string) => void;
        setWeatherSource?: (source: string) => void;
    },
    depth: number = 0
): AsyncGenerator<{ text: string; isFinal?: boolean; metadata?: AiMetadata; commandExecuted?: string }, void, unknown> {
    
    // Check limit only on the first call (depth 0), recursive calls (tools) don't count towards user quota
    if (depth === 0) {
        const allowed = checkAndIncrementLimit();
        if (!allowed) {
            yield { text: "Você atingiu o limite diário de 5 requisições à IA na versão gratuita. Volte amanhã!", isFinal: true };
            return;
        }
    }

    if (depth >= MAX_RECURSION_DEPTH) {
        yield { text: "\n[Sistema: Limite de recursão da IA atingido.]", isFinal: true };
        return;
    }

    // Convert history to Gemini format
    const geminiHistory: Content[] = history.map(msg => ({
        role: msg.role === 'model' ? 'model' : 'user', 
        parts: [{ text: msg.text }]
    }));

    try {
        const response = await fetch('/.netlify/functions/gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt,
                history: geminiHistory,
                weatherContext,
                searchResults: initialSearchResults,
                timeContext,
                userPreferences: {
                    name: appSettings.userName,
                    instructions: appSettings.aiInstructions
                }
            }),
        });

        if (!response.ok) {
            throw new Error('Falha na comunicação com a IA.');
        }
        
        const data = await response.json();
        const text = data.text || "";
        const metadata = data.metadata;

        // --- COMMAND PARSING ---
        // Syntax: CMD:TYPE|PAYLOAD
        const commandRegex = /CMD:([A-Z]+)\|(.+)/;
        const match = text.match(commandRegex);

        if (match) {
            const cmdType = match[1];
            const cmdPayload = match[2].trim();
            
            yield { text: "", commandExecuted: `Executando: ${cmdType} - ${cmdPayload}` };

            // 1. WEB SEARCH
            if (cmdType === 'SEARCH') {
                let searchResults: SearchResultItem[] = [];
                try {
                    // Add Current Date to search query to avoid outdated results
                    const dateQuery = `${cmdPayload} ${new Date().getFullYear()}`;
                    searchResults = await getSearchResults(dateQuery);
                } catch (e) {
                    console.error("Auto-search failed", e);
                }

                const newHistory = [...history, { 
                    id: Date.now().toString(), 
                    role: 'system', 
                    text: `RESULTADOS DA PESQUISA (${cmdPayload}):\n${JSON.stringify(searchResults.slice(0,3))}` 
                } as ChatMessage];

                yield* streamChatResponse(
                    "Continue a resposta usando os dados acima.", 
                    newHistory, 
                    weatherContext, 
                    searchResults, 
                    timeContext, 
                    appSettings,
                    appActions,
                    depth + 1
                );
                return;
            }

            // 2. WEATHER LOOKUP (Open-Meteo)
            if (cmdType === 'WEATHER') {
                let weatherData = null;
                try {
                    if (cmdPayload.includes(',')) {
                         const [lat, lon] = cmdPayload.split(',').map(n => parseFloat(n.trim()));
                         if (!isNaN(lat) && !isNaN(lon)) {
                             weatherData = await fetchAllWeatherData(lat, lon, undefined, 'open-meteo');
                         }
                    }
                } catch(e) {
                    console.error("Weather lookup failed", e);
                }

                const newHistory = [...history, { 
                    id: Date.now().toString(), 
                    role: 'system', 
                    text: `DADOS DO CLIMA (${cmdPayload}):\n${weatherData ? JSON.stringify(weatherData.weatherData) : 'Falha ao buscar dados.'}` 
                } as ChatMessage];

                yield* streamChatResponse(
                    "Analise os dados climáticos acima.", 
                    newHistory, 
                    weatherContext, 
                    null, 
                    timeContext, 
                    appSettings,
                    appActions,
                    depth + 1
                );
                return;
            }

            // 3. APP CONTROL
            if (cmdType === 'THEME' && appActions?.setTheme) {
                 const color = cmdPayload.toLowerCase();
                 appActions.setTheme(color);
                 
                 const newHistory = [...history, { 
                    id: Date.now().toString(), 
                    role: 'system', 
                    text: `Ação do Sistema: Tema alterado para ${color}.` 
                } as ChatMessage];

                yield* streamChatResponse(
                    "Confirme a mudança para o usuário.", 
                    newHistory, 
                    weatherContext, 
                    null, 
                    timeContext, 
                    appSettings,
                    appActions,
                    depth + 1
                );
                return;
            }
        }

        if (text) {
            yield { text, metadata, isFinal: true };
        }

    } catch (error) {
        console.error("Error fetching Gemini response:", error);
        yield { text: `Erro: ${error instanceof Error ? error.message : "Desconhecido"}`, isFinal: true };
    }
}
