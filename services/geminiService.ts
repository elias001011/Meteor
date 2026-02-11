

import type { AllWeatherData, SearchResultItem } from '../types';
import type { Content } from '@google/genai';
import { getSearchResults } from './searchService';
import { searchCities, fetchAllWeatherData } from './weatherService';
import { getSettings } from './settingsService';

const AI_USAGE_KEY = 'meteor_ai_usage';
const DAILY_LIMIT = 5;

interface StreamResponse {
    text: string;
    isFinal?: boolean;
    model?: string;
    processingTime?: number;
    toolUsed?: string;
}

/**
 * Main Orchestrator for Chat
 */
export async function* streamChatResponse(
    prompt: string, 
    history: Content[],
    weatherContext: Partial<AllWeatherData> | null,
    initialSearchResults: SearchResultItem[] | null,
    timeContext: string,
    isSearchEnabled: boolean
): AsyncGenerator<StreamResponse, void, unknown> {
    
    const settings = getSettings();
    
    // --- DAILY LIMIT LOGIC (Simplified) ---
    const today = new Date().toLocaleDateString('pt-BR');
    let usageData = { count: 0, date: today };
    try {
        const stored = localStorage.getItem(AI_USAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.date === today) usageData = parsed;
        }
    } catch (e) {}
    
    // Only count user-initiated triggers (not internal tool loops)
    const isInternalRetry = initialSearchResults && initialSearchResults.length > 0;
    if (!isInternalRetry && usageData.count >= DAILY_LIMIT) {
        yield { text: "🛑 **Limite Diário Atingido**\n\nVocê atingiu o limite de 5 requisições diárias para garantir a sustentabilidade do serviço. Volte amanhã!", isFinal: true };
        return;
    }

    // --- CLIENT SIDE TOOL LOOP ---
    // We manage the loop here: Call AI -> Check for Command -> Exec Tool -> Call AI again
    
    let currentSearchResults = initialSearchResults;
    let weatherToolResult = null;
    let toolUsedLabel = undefined;
    let loopCount = 0;
    const MAX_LOOPS = 2; // Prevent infinite loops

    while (loopCount <= MAX_LOOPS) {
        try {
            const response = await fetch('/.netlify/functions/gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt,
                    history,
                    weatherContext,
                    searchResults: currentSearchResults,
                    weatherToolResult,
                    timeContext,
                    userInstructions: settings.userAiInstructions,
                    isSearchEnabled
                }),
            });

            if (!response.ok) throw new Error('Erro na comunicação com a IA.');
            
            const data = await response.json();
            const rawText = data.text || '';

            // 1. CHECK FOR [SEARCH_REQUIRED]
            if (rawText.includes('[SEARCH_REQUIRED]')) {
                console.log("🤖 AI Requested Search via Stealth Command");
                // Search with date for freshness (as requested in prompt)
                const dateQuery = `${prompt} ${new Date().toLocaleDateString('pt-BR')}`;
                try {
                    currentSearchResults = await getSearchResults(dateQuery);
                } catch (e) {
                    console.error("Auto-search failed");
                    currentSearchResults = []; // Continue loop so AI knows it failed via empty results
                }
                toolUsedLabel = "Busca Web (Auto)";
                loopCount++;
                continue; // Recursive loop
            }

            // 2. CHECK FOR [WEATHER_QUERY=Location]
            const weatherMatch = rawText.match(/\[WEATHER_QUERY=(.*?)\]/);
            if (weatherMatch && weatherMatch[1]) {
                const cityQuery = weatherMatch[1];
                console.log(`🤖 AI Requested Weather for: ${cityQuery}`);
                
                try {
                    const cities = await searchCities(cityQuery);
                    if (cities.length > 0) {
                        // Use Open-Meteo (Free) as requested
                        const wData = await fetchAllWeatherData(cities[0].lat, cities[0].lon, { name: cities[0].name, country: cities[0].country }, 'open-meteo');
                        
                        // Format a minimal string for the AI to read
                        weatherToolResult = {
                            location: `${cities[0].name}, ${cities[0].country}`,
                            temp: wData.weatherData.temperature,
                            condition: wData.weatherData.condition,
                            wind: wData.weatherData.windSpeed,
                            forecast: wData.dailyForecast.slice(0,3).map(d => ({ 
                                date: new Date(d.dt*1000).toLocaleDateString(), 
                                temp: Math.round(d.temperature),
                                condition: d.conditionIcon 
                            }))
                        };
                    } else {
                        weatherToolResult = { error: "Cidade não encontrada." };
                    }
                } catch (e) {
                    weatherToolResult = { error: "Falha ao buscar clima." };
                }
                
                toolUsedLabel = "Consulta Clima (Open-Meteo)";
                loopCount++;
                continue; // Recursive loop
            }

            // 3. FINAL RESPONSE
            if (!isInternalRetry && loopCount === 0) {
                 // Increment only once per real user message
                usageData.count += 1;
                localStorage.setItem(AI_USAGE_KEY, JSON.stringify(usageData));
            }

            yield { 
                text: rawText, 
                isFinal: true, 
                model: data.model + (data.usedFallback ? ' (fallback)' : ''), 
                processingTime: data.processingTime,
                toolUsed: toolUsedLabel 
            };
            return;

        } catch (error) {
            yield { text: `Erro: ${error instanceof Error ? error.message : 'Desconhecido'}`, isFinal: true };
            return;
        }
    }
}