import { GoogleGenAI, Content } from '@google/genai';
import { type Handler, type HandlerEvent } from '@netlify/functions';

type AiProvider = 'gemini' | 'gpt';

const GROQ_MODEL = 'openai/gpt-oss-20b';
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';
const GROQ_API_KEY = process.env.GROQ_API_KEY || process.env.GROQ_API;

const mapOpenMeteoCodeToEmoji = (code: number, isDay: boolean = true): string => {
    const codeMap: { [key: number]: [string, string] } = {
        0: ['☀️', '🌙'], 1: ['🌤️', '☁️'], 2: ['🌥️', '☁️'], 3: ['☁️', '☁️'], 45: ['🌫️', '🌫️'], 48: ['🌫️', '🌫️'],
        51: ['🌦️', '🌦️'], 53: ['🌦️', '🌦️'], 55: ['🌦️', '🌦️'], 56: ['🌨️', '🌨️'], 57: ['🌨️', '🌨️'],
        61: ['🌧️', '🌧️'], 63: ['🌧️', '🌧️'], 65: ['🌧️', '🌧️'], 66: ['🌧️❄️', '🌧️❄️'], 67: ['🌧️❄️', '🌧️❄️'],
        71: ['❄️', '❄️'], 73: ['❄️', '❄️'], 75: ['❄️', '❄️'], 77: ['❄️', '❄️'],
        80: ['🌧️', '🌧️'], 81: ['🌧️', '🌧️'], 82: ['🌧️', '🌧️'], 85: ['❄️', '❄️'], 86: ['❄️', '❄️'],
        95: ['⛈️', '⛈️'], 96: ['⛈️', '⛈️'], 99: ['⛈️', '⛈️'],
    };
    const icons = codeMap[code] || ['-', '-'];
    return isDay ? icons[0] : icons[1];
};

const mapWmoCodeToDescription = (code: number): string => {
    const descriptionMap: { [key: number]: string } = {
        0: 'Céu limpo', 1: 'Principalmente limpo', 2: 'Parcialmente nublado', 3: 'Nublado', 45: 'Nevoeiro', 48: 'Nevoeiro com geada',
        51: 'Garoa leve', 53: 'Garoa moderada', 55: 'Garoa densa', 56: 'Garoa gelada leve', 57: 'Garoa gelada densa',
        61: 'Chuva fraca', 63: 'Chuva moderada', 65: 'Chuva forte', 66: 'Chuva gelada leve', 67: 'Chuva gelada forte',
        71: 'Neve fraca', 73: 'Neve moderada', 75: 'Neve forte', 77: 'Grãos de neve',
        80: 'Pancadas de chuva fracas', 81: 'Pancadas de chuva moderadas', 82: 'Pancadas de chuva violentas',
        85: 'Pancadas de neve fracas', 86: 'Pancadas de neve fortes',
        95: 'Trovoada', 96: 'Trovoada com granizo fraco', 99: 'Trovoada com granizo forte',
    };
    return descriptionMap[code] || 'Condição desconhecida';
};

const buildSystemPrompt = (timeContext: string, isSearchEnabled: boolean): string => {
    let systemInstruction = `DIRETRIZES MESTRAS (METEOR AI):\n\n`;

    systemInstruction += `1. **IDENTIDADE E TOM**:\n`;
    systemInstruction += `   - Você é a IA do Meteor. Seja **DIRETA** e **OBJETIVA**, evitando rodeios.\n`;
    systemInstruction += `   - Personalidade: **CARISMÁTICA**, simpática e útil.\n`;
    systemInstruction += `   - **FORMATAÇÃO VISUAL (CRÍTICO)**:\n`;
    systemInstruction += `     - **NUNCA** use listas (bullet points) para Títulos de Seção. Isso quebra a leitura e parece bagunçado.\n`;
    systemInstruction += `     - **SEMPRE** use Headers Markdown para separar seções (Ex: ### Em casa, ### No carro).\n`;
    systemInstruction += `     - Use no máximo ### para títulos de seção; evite #### ou níveis mais profundos.\n`;
    systemInstruction += `     - **ESPAÇAMENTO**: Pule uma linha em branco entre cada item de lista, título ou parágrafo.\n`;
    systemInstruction += `     - Use negrito (**texto**) apenas para destacar palavras-chave dentro de frases, nunca como substituto de título.\n`;

    systemInstruction += `2. **MEMÓRIA E CONTEXTO**:\n`;
    systemInstruction += `   - LEIA o histórico de mensagens. Se o usuário continuar um assunto, mantenha o contexto.\n`;
    systemInstruction += `   - Data/Hora atual: **${timeContext}**.\n`;

    systemInstruction += `3. **USO DE FERRAMENTAS (STEALTH MODE)**:\n`;
    systemInstruction += `   - Você tem acesso a ferramentas via COMANDOS ESPECIAIS (invisíveis ao usuário).\n`;
    systemInstruction += `   - **Busca Web**: [${isSearchEnabled ? 'LIGADA' : 'DESLIGADA'}].\n`;
    systemInstruction += `     - Se precisar de informação externa (notícias, datas, fatos recentes), responda ESTRITAMENTE: [SEARCH_REQUIRED]\n`;
    systemInstruction += `     - Se já houver resultados abaixo, NÃO use o comando novamente.\n`;
    systemInstruction += `   - **Consulta Climática Global**: Dados do local *atual* estão abaixo.\n`;
    systemInstruction += `     - Se o usuário perguntar de **OUTRA** cidade (não presente no contexto), responda ESTRITAMENTE: [WEATHER_QUERY=NomeDaCidade]\n`;

    systemInstruction += `4. **TRATAMENTO DE ERROS**:\n`;
    systemInstruction += `   - Se uma ferramenta falhou, peça desculpas educadamente e sugira verificar a conexão.\n`;

    return systemInstruction;
};

const buildContextualContent = (
    weatherInfo: any | null,
    searchResults: any[] | null,
    weatherToolResult: any | null,
    timeContext: string,
    userInstructions: string = '',
    isSearchEnabled: boolean
): Content[] => {
    const systemInstruction = buildSystemPrompt(timeContext, isSearchEnabled);

    const content: Content[] = [{
        role: 'user',
        parts: [{ text: systemInstruction }]
    }, {
        role: 'model',
        parts: [{ text: `Entendido. Usarei ### para títulos, garantindo espaçamento amplo e evitando listas aninhadas excessivas.` }]
    }];

    if (weatherInfo && weatherInfo.weatherData) {
        const { weatherData, dailyForecast, alerts } = weatherInfo;
        let weatherContextText = `## DADOS CLIMÁTICOS ATUAIS (Local do Usuário: ${weatherData.city})\n`;
        weatherContextText += `- Condição: ${weatherData.condition} (${weatherData.temperature}°C)\n`;
        weatherContextText += `- Sensação: ${weatherData.feels_like}°C | Vento: ${weatherData.windSpeed} km/h | Umidade: ${weatherData.humidity}%\n`;
        if (dailyForecast) weatherContextText += `- Previsão: ${dailyForecast.slice(0, 3).map((d: any) => `${new Date(d.dt * 1000).toLocaleDateString('pt-BR', { weekday: 'short' })}: ${Math.round(d.temperature)}°C`).join(', ')}\n`;
        if (alerts?.length) weatherContextText += `- ALERTAS VIGENTES: ${alerts.map((a: any) => a.event).join(', ')}\n`;

        content.push({ role: 'user', parts: [{ text: weatherContextText }] });
    }

    if (weatherToolResult) {
        if (weatherToolResult.error) {
            content.push({ role: 'user', parts: [{ text: `## ERRO NA CONSULTA CLIMÁTICA:\n${weatherToolResult.error}. Avise o usuário.` }] });
        } else {
            content.push({ role: 'user', parts: [{ text: `## RESULTADO DA CONSULTA CLIMÁTICA (Open-Meteo):\n${JSON.stringify(weatherToolResult)}` }] });
        }
    }

    if (searchResults && searchResults.length > 0) {
        let searchContextText = `## RESULTADOS DA WEB (Use para responder à pergunta atual):\n`;
        searchContextText += searchResults.map((r: any) => `> [${r.title}]: ${r.snippet}`).join('\n\n');
        content.push({ role: 'user', parts: [{ text: searchContextText }] });
    }

    if (userInstructions && userInstructions.trim() !== '') {
        content.push({
            role: 'user',
            parts: [{ text: `## PREFERÊNCIAS DO USUÁRIO (Injeção de Estilo):\nO usuário solicitou: "${userInstructions}".\nTente adaptar seu estilo a isso, DESDE QUE não viole as diretrizes de segurança, utilidade ou uso das ferramentas.` }]
        });
    }

    return content;
};

const toPlainText = (content: Content): string => {
    return content.parts
        ?.map((part: any) => part?.text || '')
        .filter(Boolean)
        .join('\n\n')
        .trim() || '';
};

const buildGroqMessages = (
    weatherInfo: any | null,
    history: Content[],
    prompt: string,
    timeContext: string,
    userInstructions: string,
    isSearchEnabled: boolean
) => {
    const contextualContent = buildContextualContent(
        weatherInfo,
        null,
        null,
        timeContext,
        userInstructions,
        isSearchEnabled
    );

    const [systemContent, , ...additionalContext] = contextualContent;
    const messages: any[] = [];

    if (systemContent) {
        messages.push({
            role: 'system',
            content: toPlainText(systemContent),
        });
    }

    for (const content of additionalContext) {
        const text = toPlainText(content);
        if (!text) continue;
        messages.push({
            role: content.role === 'model' ? 'assistant' : 'user',
            content: text,
        });
    }

    for (const item of Array.isArray(history) ? history : []) {
        const text = toPlainText(item);
        if (!text) continue;
        messages.push({
            role: item.role === 'model' ? 'assistant' : 'user',
            content: text,
        });
    }

    messages.push({
        role: 'user',
        content: prompt,
    });

    return messages;
};

const searchCityOnOpenMeteo = async (location: string) => {
    if (!location.trim()) {
        return null;
    }

    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=5&language=pt&format=json`;
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error('Falha ao localizar a cidade.');
    }

    const data = await response.json();
    return data.results?.[0] || null;
};

const resolveWeatherSnapshot = async (location: string) => {
    if (!location.trim()) {
        return { error: 'Cidade não encontrada.' };
    }

    const city = await searchCityOnOpenMeteo(location);

    if (!city) {
        return { error: 'Cidade não encontrada.' };
    }

    const forecastParams = new URLSearchParams({
        latitude: String(city.latitude),
        longitude: String(city.longitude),
        current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m',
        daily: 'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset',
        timezone: 'auto',
        forecast_days: '3',
    });

    const forecastRes = await fetch(`https://api.open-meteo.com/v1/forecast?${forecastParams.toString()}`);

    if (!forecastRes.ok) {
        throw new Error('Falha ao buscar o clima.');
    }

    const forecastData = await forecastRes.json();
    const current = forecastData.current || {};
    const daily = forecastData.daily || {};

    return {
        location: `${city.name}${city.admin1 ? `, ${city.admin1}` : ''}, ${city.country}`,
        current: {
            temperature: current.temperature_2m,
            feelsLike: current.apparent_temperature,
            humidity: current.relative_humidity_2m,
            wind: current.wind_speed_10m ? Math.round(current.wind_speed_10m) : 0,
            condition: mapWmoCodeToDescription(current.weather_code),
            icon: mapOpenMeteoCodeToEmoji(current.weather_code, current.is_day !== 0),
        },
        forecast: Array.isArray(daily.time)
            ? daily.time.slice(0, 3).map((date: string, index: number) => ({
                date,
                max: daily.temperature_2m_max?.[index],
                min: daily.temperature_2m_min?.[index],
                condition: mapWmoCodeToDescription(daily.weather_code?.[index]),
                icon: mapOpenMeteoCodeToEmoji(daily.weather_code?.[index]),
            }))
            : [],
        source: 'open-meteo',
    };
};

const runGeminiProvider = async (
    weatherInfo: any | null,
    history: Content[],
    prompt: string,
    timeContext: string,
    userInstructions: string,
    isSearchEnabled: boolean,
    searchResults: any[] | null,
    weatherToolResult: any | null
): Promise<{ text: string; model: string; sources: any[]; toolUsed?: string } | null> => {
    const geminiKey = process.env.GEMINI_API;

    if (!geminiKey) {
        return null;
    }

    const ai = new GoogleGenAI({ apiKey: geminiKey });
    const contents = [
        ...buildContextualContent(
            weatherInfo,
            searchResults,
            weatherToolResult,
            timeContext,
            userInstructions,
            isSearchEnabled
        ),
        ...(Array.isArray(history) ? history : []),
        { role: 'user', parts: [{ text: prompt }] } as Content,
    ];

    const modelsToTry = ['gemini-3.1-flash-lite-preview', 'gemini-2.5-flash-lite', 'gemini-3-flash-preview'];

    for (const model of modelsToTry) {
        try {
            const result = await ai.models.generateContent({ model, contents });
            const text = result.text || '';
            if (!text) continue;

            return {
                text,
                model,
                sources: Array.isArray(searchResults)
                    ? searchResults.map((result) => ({ uri: result.link, title: result.title }))
                    : [],
            };
        } catch (error) {
            // Try the next Gemini model.
        }
    }

    return null;
};

const runGroqProvider = async (
    weatherInfo: any | null,
    history: Content[],
    prompt: string,
    timeContext: string,
    userInstructions: string,
    isSearchEnabled: boolean
): Promise<{ text: string; model: string; toolUsed?: string } | null> => {
    if (!GROQ_API_KEY) {
        return null;
    }

    const messages = buildGroqMessages(
        weatherInfo,
        history,
        prompt,
        timeContext,
        userInstructions,
        isSearchEnabled
    );

    const tools: any[] = [];
    if (isSearchEnabled) {
        tools.push({ type: 'browser_search' });
    }
    tools.push({
        type: 'function',
        function: {
            name: 'get_weather',
            description: 'Busca o clima atual e uma previsão curta para uma cidade informada pelo usuário.',
            parameters: {
                type: 'object',
                properties: {
                    location: {
                        type: 'string',
                        description: 'Nome da cidade ou localidade, por exemplo "Porto Alegre" ou "Buenos Aires".',
                    },
                },
                required: ['location'],
            },
        },
    });

    let toolUsedLabel = isSearchEnabled ? 'Busca Web Nativa' : undefined;
    let weatherToolUsed = false;

    for (let attempt = 0; attempt < 4; attempt++) {
        const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'HTTP-Referer': 'https://meteor-ai.netlify.app',
                'X-Title': 'Meteor AI',
            },
            body: JSON.stringify({
                model: GROQ_MODEL,
                messages,
                tools,
                tool_choice: 'auto',
                temperature: 0.4,
                max_completion_tokens: 2048,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => '');
            throw new Error(errorText || 'Falha ao comunicar com Groq.');
        }

        const data = await response.json();
        const message = data.choices?.[0]?.message || {};
        const toolCalls = Array.isArray(message.tool_calls) ? message.tool_calls : [];

        if (toolCalls.length === 0) {
            const finalToolLabel = weatherToolUsed
                ? (toolUsedLabel ? `${toolUsedLabel} + Clima` : 'Consulta Clima Nativa')
                : toolUsedLabel;

            return {
                text: message.content || '',
                model: data.model || GROQ_MODEL,
                toolUsed: finalToolLabel,
            };
        }

        messages.push(message);

        let handledTool = false;
        for (const toolCall of toolCalls) {
            if (toolCall?.type !== 'function' || toolCall?.function?.name !== 'get_weather') {
                continue;
            }

            handledTool = true;
            weatherToolUsed = true;

            let args: { location?: string } = {};
            try {
                args = JSON.parse(toolCall.function.arguments || '{}');
            } catch (error) {
                args = {};
            }

            const snapshot = await resolveWeatherSnapshot(args.location || '');
            messages.push({
                role: 'tool',
                tool_call_id: toolCall.id,
                name: 'get_weather',
                content: JSON.stringify(snapshot),
            });
        }

        if (!handledTool) {
            break;
        }
    }

    return null;
};

const handler: Handler = async (event: HandlerEvent) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const startTime = Date.now();

    try {
        const {
            provider,
            prompt,
            history,
            weatherContext,
            searchResults,
            weatherToolResult,
            timeContext,
            userInstructions,
            isSearchEnabled,
        } = JSON.parse(event.body || '{}');

        if (!prompt) {
            return { statusCode: 400, body: JSON.stringify({ message: 'Prompt obrigatório.' }) };
        }

        const effectiveTimeContext = timeContext || new Date().toLocaleString('pt-BR');
        const selectedProvider: AiProvider = provider === 'gpt' ? 'gpt' : 'gemini';

        const primaryRunner = selectedProvider === 'gpt'
            ? () => runGroqProvider(weatherContext, history, prompt, effectiveTimeContext, userInstructions || '', isSearchEnabled)
            : () => runGeminiProvider(weatherContext, history, prompt, effectiveTimeContext, userInstructions || '', isSearchEnabled, searchResults, weatherToolResult);

        const fallbackRunner = selectedProvider === 'gpt'
            ? () => runGeminiProvider(weatherContext, history, prompt, effectiveTimeContext, userInstructions || '', isSearchEnabled, searchResults, weatherToolResult)
            : () => runGroqProvider(weatherContext, history, prompt, effectiveTimeContext, userInstructions || '', isSearchEnabled);

        let result: { text: string; model: string; sources?: any[]; toolUsed?: string } | null = null;
        let usedFallback = false;

        try {
            result = await primaryRunner();
        } catch (primaryError) {
            console.warn('[Handler] Provider primário falhou:', primaryError);
        }

        if (!result) {
            try {
                result = await fallbackRunner();
                usedFallback = true;
            } catch (fallbackError) {
                console.warn('[Handler] Provider de fallback falhou:', fallbackError);
            }
        }

        if (!result) {
            throw new Error('Todos os provedores de IA falharam. Tente novamente mais tarde.');
        }

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: result.text,
                model: result.model,
                processingTime: Date.now() - startTime,
                usedFallback,
                toolUsed: result.toolUsed,
                sources: result.sources || [],
            }),
        };
    } catch (error) {
        console.error('[Handler] Erro Fatal:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: error instanceof Error ? error.message : 'Erro ao processar resposta da IA.',
            }),
        };
    }
};

export { handler };
