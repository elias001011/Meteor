

import { GoogleGenAI, Content } from "@google/genai";
import { type Handler, type HandlerEvent } from "@netlify/functions";

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
        console.log('[OpenRouter] Attempting fallback with free model...');
        
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
            const error = await response.json().catch(() => ({}));
            console.error('[OpenRouter] Error:', error);
            return null;
        }

        const data = await response.json();
        const text = data.choices?.[0]?.message?.content;
        const model = data.model || 'openrouter/free';

        if (text) {
            console.log('[OpenRouter] Successfully generated response');
            return { text, model };
        }

        return null;
    } catch (error) {
        console.error('[OpenRouter] Exception:', error);
        return null;
    }
};

const handler: Handler = async (event: HandlerEvent) => {
    const geminiKey = process.env.GEMINI_API;
    const openRouterKey = process.env.OPENROUTER_API;

    if (!geminiKey && !openRouterKey) {
        return { 
            statusCode: 500, 
            body: JSON.stringify({ message: "Nenhuma chave de API configurada (Gemini ou OpenRouter)." }) 
        };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const startTime = Date.now();

    try {
        const { prompt, history, weatherContext, searchResults, weatherToolResult, timeContext, userInstructions, isSearchEnabled } = JSON.parse(event.body || '{}');

        if (!prompt) {
            return { statusCode: 400, body: JSON.stringify({ message: "Prompt obrigatório." }) };
        }

        const effectiveTimeContext = timeContext || new Date().toLocaleString('pt-BR');
        
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
            const modelsToTry = ['gemini-2.5-flash-lite', 'gemini-2.0-flash-lite']; 
            const ai = new GoogleGenAI({ apiKey: geminiKey });
            
            for (const model of modelsToTry) {
                try {
                    usedModel = model;
                    const result = await ai.models.generateContent({ model, contents });
                    text = result.text;
                    if (text) break;
                } catch (error) {
                    console.warn(`[Gemini] Falha no modelo ${model}.`, error);
                }
            }
        }

        // FALLBACK PARA OPEN ROUTER
        if (!text && openRouterKey) {
            console.log('[Handler] Gemini failed or unavailable, trying Open Router fallback...');
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
        
        console.log(`[Handler] Response generated using ${usedModel}${usedFallback ? ' (fallback)' : ''} in ${processingTime}ms`);

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
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
            body: JSON.stringify({ 
                message: error instanceof Error ? error.message : "Erro ao processar resposta da IA." 
            }),
        };
    }
};

export { handler };
