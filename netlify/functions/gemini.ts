

import { GoogleGenAI, Content } from "@google/genai";
import { type Handler, type HandlerEvent } from "@netlify/functions";

const MAX_PROMPT_LENGTH = 8000;
const MAX_HISTORY_MESSAGES = 20;
const MAX_HISTORY_TEXT_LENGTH = 4000;
const MAX_SEARCH_RESULTS = 8;
const MAX_USER_INSTRUCTIONS_LENGTH = 500;
const MAX_TIME_CONTEXT_LENGTH = 120;

const isRecord = (value: unknown): value is Record<string, unknown> => (
    typeof value === 'object' && value !== null && !Array.isArray(value)
);

const clampString = (value: unknown, maxLength: number): string => {
    if (typeof value !== 'string') return '';
    return value.slice(0, maxLength);
};

const sanitizeHistory = (history: unknown): Content[] => {
    if (!Array.isArray(history)) return [];

    return history
        .slice(-MAX_HISTORY_MESSAGES)
        .map((entry) => {
            if (!isRecord(entry)) return null;

            const role = entry.role === 'user' || entry.role === 'model' ? entry.role : null;
            const parts = Array.isArray(entry.parts) ? entry.parts : null;
            const text = typeof entry.text === 'string'
                ? entry.text
                : typeof parts?.[0] === 'object' && parts?.[0] !== null && typeof (parts[0] as Record<string, unknown>).text === 'string'
                    ? (parts[0] as Record<string, string>).text
                    : '';

            if (!role || !text) return null;

            return {
                role,
                parts: [{ text: text.slice(0, MAX_HISTORY_TEXT_LENGTH) }],
            } satisfies Content;
        })
        .filter((entry): entry is Content => entry !== null);
};

const sanitizeSearchResults = (results: unknown): any[] => {
    if (!Array.isArray(results)) return [];

    return results.slice(0, MAX_SEARCH_RESULTS).map((item) => {
        if (!isRecord(item)) return null;

        const title = clampString(item.title, 300);
        const link = clampString(item.link, 500);
        if (!title || !link) return null;

        return {
            title,
            link,
            snippet: clampString(item.snippet, 1000),
        };
    }).filter((item): item is { title: string; link: string; snippet: string } => item !== null);
};

const sanitizeWeatherContext = (weatherContext: unknown): any | null => {
    return isRecord(weatherContext) ? weatherContext : null;
};

// Enhanced system instructions with Stealth Tools and Formatting Rules
const buildContextualContent = (
    weatherInfo: any | null, 
    searchResults: any[] | null,
    weatherToolResult: any | null,
    timeContext: string,
    userInstructions: string = '',
    isSearchEnabled: boolean
): Content[] => {
    
    let systemInstruction = `DIRETRIZES MESTRAS (METEOR AI):\n\n`;
    
    systemInstruction += `1. **IDENTIDADE E TOM**:\n`;
    systemInstruction += `   - Você é a IA do Meteor. Seja **DIRETA** e **OBJETIVA**, evitando rodeios.\n`;
    systemInstruction += `   - Personalidade: **CARISMÁTICA**, simpática e útil.\n`;
    systemInstruction += `   - **FORMATAÇÃO VISUAL (CRÍTICO)**:\n`;
    systemInstruction += `     - **NUNCA** use listas (bullet points) para Títulos de Seção. Isso quebra a leitura e parece bagunçado.\n`;
    systemInstruction += `     - **SEMPRE** use Headers Markdown para separar seções (Ex: ### Em casa, ### No carro).\n`;
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

    const content: Content[] = [{
        role: 'user',
        parts: [{ text: systemInstruction }]
    }, {
        role: 'model',
        parts: [{ text: `Entendido. Usarei ### para títulos, garantindo espaçamento amplo e evitando listas aninhadas excessivas.` }]
    }];

    // 1. Contexto Climático (Cache/Local Atual)
    if (weatherInfo && weatherInfo.weatherData) {
        const { weatherData, dailyForecast, alerts } = weatherInfo;
        let weatherContextText = `## DADOS CLIMÁTICOS ATUAIS (Local do Usuário: ${weatherData.city})\n`;
        weatherContextText += `- Condição: ${weatherData.condition} (${weatherData.temperature}°C)\n`;
        weatherContextText += `- Sensação: ${weatherData.feels_like}°C | Vento: ${weatherData.windSpeed} km/h | Umidade: ${weatherData.humidity}%\n`;
        if (dailyForecast) weatherContextText += `- Previsão: ${dailyForecast.slice(0, 3).map((d: any) => `${new Date(d.dt * 1000).toLocaleDateString('pt-BR', { weekday: 'short' })}: ${Math.round(d.temperature)}°C`).join(', ')}\n`;
        if (alerts?.length) weatherContextText += `- ALERTAS VIGENTES: ${alerts.map((a: any) => a.event).join(', ')}\n`;
        
        content.push({ role: 'user', parts: [{ text: weatherContextText }]});
    }

    // 2. Resultados de Ferramentas (Inseridos dinamicamente)
    if (weatherToolResult) {
        if (weatherToolResult.error) {
             content.push({ role: 'user', parts: [{ text: `## ERRO NA CONSULTA CLIMÁTICA:\n${weatherToolResult.error}. Avise o usuário.` }]});
        } else {
             content.push({ role: 'user', parts: [{ text: `## RESULTADO DA CONSULTA CLIMÁTICA (Open-Meteo):\n${JSON.stringify(weatherToolResult)}` }]});
        }
    }

    if (searchResults && searchResults.length > 0) {
        let searchContextText = `## RESULTADOS DA WEB (Use para responder à pergunta atual):\n`;
        searchContextText += searchResults.map((r: any) => `> [${r.title}]: ${r.snippet}`).join('\n\n');
        content.push({ role: 'user', parts: [{ text: searchContextText }]});
    }

    // 3. Instruções do Usuário (Separate Context to prevent overriding Safety)
    if (userInstructions && userInstructions.trim() !== '') {
        content.push({ 
            role: 'user', 
            parts: [{ text: `## PREFERÊNCIAS DO USUÁRIO (Injeção de Estilo):\nO usuário solicitou: "${userInstructions}".\nTente adaptar seu estilo a isso, DESDE QUE não viole as diretrizes de segurança, utilidade ou uso das ferramentas.` }]
        });
    }

    return content;
};

/**
 * Tenta gerar conteúdo usando Open Router (modelo gratuito)
 * Fallback quando Google Gemini falha
 */
const tryOpenRouter = async (
    openRouterKey: string,
    contents: any[],
    prompt: string
): Promise<{ text: string; model: string } | null> => {
    try {
        const messages = contents.map((content: any) => ({
            role: content.role === 'model' ? 'assistant' : content.role,
            content: content.parts?.[0]?.text || ''
        }));
        
        // Adicionar a mensagem do usuário atual
        messages.push({
            role: 'user',
            content: prompt
        });

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openRouterKey}`,
                'HTTP-Referer': 'https://meteor-ai.netlify.app',
                'X-Title': 'Meteor AI'
            },
            body: JSON.stringify({
                model: 'openrouter/free', // Modelo gratuito
                messages: messages,
                temperature: 0.7,
                max_tokens: 2048
            })
        });

        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        const text = data.choices?.[0]?.message?.content;
        const model = data.model || 'openrouter/free';

        if (text) {
            return { text, model };
        }

        return null;
    } catch (error) {
        return null;
    }
};

const handler: Handler = async (event: HandlerEvent) => {
    const geminiKey = process.env.GEMINI_API;
    const openRouterKey = process.env.OPENROUTER_API;
    const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };

    if (!geminiKey && !openRouterKey) {
        return { 
            statusCode: 500, 
            headers,
            body: JSON.stringify({ message: "Nenhuma chave de API configurada (Gemini ou OpenRouter)." }) 
        };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: JSON.stringify({ message: 'Method Not Allowed' }) };
    }

    const startTime = Date.now();

    try {
        const body = JSON.parse(event.body || '{}');
        const prompt = clampString(body.prompt, MAX_PROMPT_LENGTH).trim();
        const history = sanitizeHistory(body.history);
        const weatherContext = sanitizeWeatherContext(body.weatherContext);
        const searchResults = sanitizeSearchResults(body.searchResults);
        const weatherToolResult = isRecord(body.weatherToolResult) ? body.weatherToolResult : null;
        const timeContext = clampString(body.timeContext, MAX_TIME_CONTEXT_LENGTH) || new Date().toLocaleString('pt-BR');
        const userInstructions = clampString(body.userInstructions, MAX_USER_INSTRUCTIONS_LENGTH);
        const isSearchEnabled = Boolean(body.isSearchEnabled);

        if (!prompt) {
            return { statusCode: 400, headers, body: JSON.stringify({ message: "Prompt obrigatório." }) };
        }

        const effectiveTimeContext = timeContext;
        
        const contextualContent = buildContextualContent(
            weatherContext, 
            searchResults, 
            weatherToolResult, 
            effectiveTimeContext, 
            userInstructions,
            isSearchEnabled
        );
        
        const contents = [
            ...contextualContent, 
            ...(Array.isArray(history) ? history : []), 
            { role: 'user', parts: [{ text: prompt }] }
        ];
        
        let text = '';
        let usedModel = '';
        let usedFallback = false;

        // TENTAR GOOGLE GEMINI PRIMEIRO
        if (geminiKey) {
            const modelsToTry = ['gemini-3.1-flash-lite-preview', 'gemini-2.5-flash-lite']; 
            const ai = new GoogleGenAI({ apiKey: geminiKey });
            
            for (const model of modelsToTry) {
                try {
                    usedModel = model;
                    const result = await ai.models.generateContent({ model, contents });
                    text = result.text;
                    if (text) break;
                } catch (error) {
                    // Silently try next model
                }
            }
        }

        // FALLBACK PARA OPEN ROUTER
        if (!text && openRouterKey) {
            const openRouterResult = await tryOpenRouter(openRouterKey, contents, prompt);
            
            if (openRouterResult) {
                text = openRouterResult.text;
                usedModel = openRouterResult.model;
                usedFallback = true;
            }
        }

        if (!text) {
            throw new Error("Todos os provedores de IA falharam. Tente novamente mais tarde.");
        }

        const processingTime = Date.now() - startTime;

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                text, 
                model: usedModel,
                processingTime,
                usedFallback
            }),
        };

    } catch (error) {
        console.error("[Handler] Erro Fatal:", error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                message: error instanceof Error ? error.message : "Erro ao processar resposta da IA." 
            }),
        };
    }
};

export { handler };
