
import type { AllWeatherData, SearchResultItem, ChatMessage, AiMetadata } from '../types';
import type { Content } from '@google/genai';
import { getSearchResults } from './searchService';
import { fetchAllWeatherData } from './weatherService';

// Removed Daily Limit Logic entirely for now
const MAX_RECURSION_DEPTH = 3;

interface GeminiResponse {
    text: string;
    metadata?: AiMetadata;
    command?: {
        type: 'search' | 'weather' | 'theme' | 'app';
        payload: string;
    };
}

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
    
    if (depth >= MAX_RECURSION_DEPTH) {
        yield { text: "\n[Sistema: Limite de recursão da IA atingido.]", isFinal: true };
        return;
    }

    // Convert history to Gemini format
    // Filter out system messages used for tools in previous turns if they are too old, but keep recent ones
    const geminiHistory: Content[] = history.map(msg => ({
        role: msg.role === 'model' ? 'model' : 'user', // Map system role to user for simplicity or filter
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
        // Example: CMD:SEARCH|previsão do tempo amanhã
        const commandRegex = /CMD:([A-Z]+)\|(.+)/;
        const match = text.match(commandRegex);

        if (match) {
            const cmdType = match[1];
            const cmdPayload = match[2].trim();
            
            // Yield the command execution status to UI
            yield { text: "", commandExecuted: `Executando: ${cmdType} - ${cmdPayload}` };

            // 1. WEB SEARCH
            if (cmdType === 'SEARCH') {
                let searchResults: SearchResultItem[] = [];
                try {
                    searchResults = await getSearchResults(cmdPayload);
                } catch (e) {
                    console.error("Auto-search failed", e);
                }

                // Recursively call AI with the search results
                // We treat the search results as a "System Data" injection
                const newHistory = [...history, { 
                    id: Date.now().toString(), 
                    role: 'system', // Internal role 
                    text: `RESULTADOS DA PESQUISA (${cmdPayload}):\n${JSON.stringify(searchResults.slice(0,3))}` 
                } as ChatMessage];

                yield* streamChatResponse(
                    "Continue a resposta usando os dados acima.", 
                    newHistory, 
                    weatherContext, 
                    searchResults, // Pass explicit search results structure too
                    timeContext, 
                    appSettings,
                    appActions,
                    depth + 1
                );
                return;
            }

            // 2. WEATHER LOOKUP (Open-Meteo)
            if (cmdType === 'WEATHER') {
                // Payload expected: "Lat,Lon" or "CityName"
                // If city name, we need to geocode first. For simplicity, assume the AI extracts Lat/Lon if it can, or we search.
                // Let's assume the AI sends "City Name" or "lat,lon"
                let weatherData = null;
                
                try {
                    if (cmdPayload.includes(',')) {
                         const [lat, lon] = cmdPayload.split(',').map(n => parseFloat(n.trim()));
                         if (!isNaN(lat) && !isNaN(lon)) {
                             weatherData = await fetchAllWeatherData(lat, lon, undefined, 'open-meteo');
                         }
                    } else {
                         // Search city first
                         // This is a bit heavy for frontend service, but let's try
                         // Ideally, this logic lives in the backend, but we are keeping intelligence in the service layer
                         // Skipping Geocoding here to keep it simple, better to force AI to ask user or use what it has.
                         // Or use existing searchCities service?
                         // Let's just fail gracefully if not coords.
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
                 
                 // After action, tell AI it's done
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

        // If no command, yield the text result
        if (text) {
            yield { text, metadata, isFinal: true };
        }

    } catch (error) {
        console.error("Error fetching Gemini response:", error);
        yield { text: `Erro: ${error instanceof Error ? error.message : "Desconhecido"}`, isFinal: true };
    }
}
