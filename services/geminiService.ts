import type { AllWeatherData, AiProvider, SearchResultItem } from '../types';
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
    sources?: { uri: string; title: string }[];
    provider?: AiProvider;
}

const getTodayKey = () => new Date().toLocaleDateString('pt-BR');

const readUsage = () => {
    const today = getTodayKey();
    let usageData = { count: 0, date: today };

    try {
        const stored = localStorage.getItem(AI_USAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.date === today) usageData = parsed;
        }
    } catch (error) {
        // Ignore malformed local storage data.
    }

    return usageData;
};

const writeUsage = (usageData: { count: number; date: string }) => {
    try {
        localStorage.setItem(AI_USAGE_KEY, JSON.stringify(usageData));
    } catch (error) {
        // Ignore storage quota issues.
    }
};

/**
 * Main orchestration layer for the chat UI.
 * Gemini is the primary path.
 * GPT/Groq remains available as a fallback/provider option.
 */
export async function* streamChatResponse(
    prompt: string,
    history: Content[],
    weatherContext: Partial<AllWeatherData> | null,
    initialSearchResults: SearchResultItem[] | null,
    timeContext: string,
    isSearchEnabled: boolean,
    aiProvider: AiProvider = 'gemini',
    skipUsageIncrement: boolean = false
): AsyncGenerator<StreamResponse, void, unknown> {
    const settings = getSettings();
    const usageData = readUsage();
    const isInternalRetry = initialSearchResults && initialSearchResults.length > 0;

    if (!isInternalRetry && usageData.count >= DAILY_LIMIT) {
        yield {
            text: '**Limite Diário Atingido**\n\nVocê atingiu o limite de 5 requisições diárias para garantir a sustentabilidade do serviço. Volte amanhã!',
            isFinal: true,
            provider: aiProvider,
        };
        return;
    }

    if (aiProvider === 'gpt') {
        try {
            const response = await fetch('/.netlify/functions/gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider: 'gpt',
                    prompt,
                    history,
                    weatherContext,
                    timeContext,
                    userInstructions: settings.userAiInstructions,
                    isSearchEnabled,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Erro na comunicação com a IA.' }));
                throw new Error(errorData.message || 'Erro na comunicação com a IA.');
            }

            const data = await response.json();
            const text = data.text || '';

            if (!isInternalRetry && !skipUsageIncrement) {
                usageData.count += 1;
                writeUsage(usageData);
            }

            if (text.includes('[SEARCH_REQUIRED]') || text.includes('[WEATHER_QUERY=')) {
                yield {
                    text: 'Alternando para o fallback Gemini para concluir a resposta...',
                    isFinal: false,
                    provider: aiProvider,
                };
                yield* streamChatResponse(
                    prompt,
                    history,
                    weatherContext,
                    initialSearchResults,
                    timeContext,
                    isSearchEnabled,
                    'gemini',
                    true
                );
                return;
            }

            yield {
                text: text || 'Desculpe, não consegui processar sua solicitação. Tente novamente.',
                isFinal: true,
                model: data.model ? `${data.model}${data.usedFallback ? ' (fallback)' : ''}` : undefined,
                processingTime: data.processingTime,
                toolUsed: data.toolUsed,
                sources: data.sources || [],
                provider: aiProvider,
            };
            return;
        } catch (error) {
            yield {
                text: `Erro: ${error instanceof Error ? error.message : 'Desconhecido'}`,
                isFinal: true,
                provider: aiProvider,
            };
            return;
        }
    }

    // Gemini path keeps the existing client-side orchestration, but search now uses native Gemini grounding.
    let currentSearchResults = initialSearchResults;
    let weatherToolResult: any = null;
    let toolUsedLabel: string | undefined;
    let loopCount = 0;
    const MAX_LOOPS = 2;

    while (loopCount <= MAX_LOOPS) {
        try {
            const response = await fetch('/.netlify/functions/gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider: 'gemini',
                    prompt,
                    history,
                    weatherContext,
                    searchResults: currentSearchResults,
                    weatherToolResult,
                    timeContext,
                    userInstructions: settings.userAiInstructions,
                    isSearchEnabled,
                }),
            });

            if (!response.ok) {
                throw new Error('Erro na comunicação com a IA.');
            }

            const data = await response.json();
            const rawText = data.text || '';

            if (rawText.includes('[SEARCH_REQUIRED]')) {
                yield { text: 'Buscando informações atualizadas na web...', isFinal: false, provider: aiProvider };

                const dateQuery = `${prompt} ${new Date().toLocaleDateString('pt-BR')}`;
                try {
                    currentSearchResults = await getSearchResults(dateQuery);
                } catch (error) {
                    currentSearchResults = [];
                }

                toolUsedLabel = 'Busca Web Nativa';
                loopCount++;
                continue;
            }

            const weatherMatch = rawText.match(/\[WEATHER_QUERY=(.*?)\]/);
            if (weatherMatch && weatherMatch[1]) {
                const cityQuery = weatherMatch[1];

                yield { text: `Consultando clima de ${cityQuery}...`, isFinal: false, provider: aiProvider };

                try {
                    const cities = await searchCities(cityQuery);
                    if (cities.length > 0) {
                        const wData = await fetchAllWeatherData(
                            cities[0].lat,
                            cities[0].lon,
                            { name: cities[0].name, country: cities[0].country },
                            'open-meteo'
                        );

                        weatherToolResult = {
                            location: `${cities[0].name}, ${cities[0].country}`,
                            temp: wData.weatherData.temperature,
                            condition: wData.weatherData.condition,
                            wind: wData.weatherData.windSpeed,
                            forecast: wData.dailyForecast.slice(0, 3).map((day) => ({
                                date: new Date(day.dt * 1000).toLocaleDateString(),
                                temp: Math.round(day.temperature),
                                condition: day.conditionIcon,
                            })),
                        };
                    } else {
                        weatherToolResult = { error: 'Cidade não encontrada.' };
                    }
                } catch (error) {
                    weatherToolResult = { error: 'Falha ao buscar clima.' };
                }

                toolUsedLabel = 'Consulta Clima Nativa';
                loopCount++;
                continue;
            }

            if (!isInternalRetry && loopCount === 0 && !skipUsageIncrement) {
                usageData.count += 1;
                writeUsage(usageData);
            }

            yield {
                text: rawText || 'Desculpe, não consegui processar sua solicitação. Tente novamente.',
                isFinal: true,
                model: data.model ? `${data.model}${data.usedFallback ? ' (fallback)' : ''}` : undefined,
                processingTime: data.processingTime,
                toolUsed: toolUsedLabel,
                sources: data.sources || [],
                provider: aiProvider,
            };
            return;
        } catch (error) {
            yield {
                text: `Erro: ${error instanceof Error ? error.message : 'Desconhecido'}`,
                isFinal: true,
                provider: aiProvider,
            };
            return;
        }
    }

    yield {
        text: 'Desculpe, a IA atingiu o limite de processamento. Tente simplificar sua pergunta.',
        isFinal: true,
        provider: aiProvider,
    };
}
