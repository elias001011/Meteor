
import { GoogleGenAI, Content } from "@google/genai";
import { type Handler, type HandlerEvent } from "@netlify/functions";

const buildContextualContent = (
    weatherInfo: any | null, 
    searchResults: any[] | null,
    timeContext: string
): Content[] => {
    
    let systemInstruction = `DIRETRIZES RÍGIDAS DE COMPORTAMENTO:\n`;
    systemInstruction += `1. **IDENTIDADE**: Você é a IA do Meteor. Seja prestativa, simpática, mas **EXTREMAMENTE DIRETA**. Evite introduções longas.\n`;
    
    // INJECTED TIME CONTEXT - SOLVES "WHAT DAY IS IT"
    systemInstruction += `2. **CONTEXTO TEMPORAL (CRÍTICO)**: A data e hora atual é: **${timeContext}**. USE ESTA INFORMAÇÃO para responder perguntas sobre "que dia é hoje", "que horas são" ou referências temporais. NÃO DIGA QUE NÃO SABE A DATA.\n`;
    
    systemInstruction += `3. **DECISÃO DE BUSCA (AUTO-TOOL)**:\n`;
    systemInstruction += `   - Você tem acesso a: Data atual, Clima local (se fornecido) e Histórico de chat.\n`;
    systemInstruction += `   - **SE** a pergunta do usuário exigir informações externas que você NÃO possui (ex: notícias recentes, placar de jogos, curiosidades, eventos futuros específicos, cotações) **E** você não recebeu "Resultados da Pesquisa na Web" ainda:\n`;
    systemInstruction += `   - **SUA ÚNICA RESPOSTA DEVE SER O COMANDO**: [SEARCH_REQUIRED]\n`;
    systemInstruction += `   - Não peça desculpas, não explique. Apenas responda: [SEARCH_REQUIRED]. O sistema fará a busca automaticamente e te enviará os dados.\n`;
    
    systemInstruction += `4. **USO DE DADOS**:\n`;
    systemInstruction += `   - **SE** você recebeu "Resultados da Pesquisa na Web": Use-os para responder à pergunta original. Cite as fontes implicitamente.\n`;
    systemInstruction += `   - **SE** for sobre clima: Use o contexto climático fornecido abaixo.\n`;
    
    systemInstruction += `5. **FORMATAÇÃO**: Use Markdown (negrito, itálico) com moderação.\n`;
    
    const content: Content[] = [{
        role: 'user',
        parts: [{ text: systemInstruction }]
    }, {
        role: 'model',
        parts: [{ text: `Entendido. Sei que hoje é ${timeContext}. Se precisar de info externa, responderei apenas [SEARCH_REQUIRED].` }]
    }];

    if (weatherInfo && weatherInfo.weatherData) {
        const { weatherData, airQualityData, dailyForecast, alerts } = weatherInfo;
        let weatherContextText = `## Contexto do Clima Atual para ${weatherData.city}, ${weatherData.country}\n- Temperatura: ${weatherData.temperature}°C, ${weatherData.condition}\n- Vento: ${weatherData.windSpeed} km/h, Umidade: ${weatherData.humidity}%\n`;
        if (airQualityData) weatherContextText += `- IQAR: ${airQualityData.aqi} (${['Boa', 'Razoável', 'Moderada', 'Ruim', 'Muito Ruim'][airQualityData.aqi - 1]})\n`;
        if (dailyForecast && dailyForecast.length > 0) weatherContextText += `- Previsão: ${dailyForecast.slice(0, 3).map((d: any) => `${new Date(d.dt * 1000).toLocaleDateString('pt-BR', { weekday: 'short' })} ${d.temperature}°C`).join(', ')}\n`;
        if (alerts && alerts.length > 0) weatherContextText += `- Alertas: ${alerts.map((a: any) => a.event).join(', ')}\n`;
        
        content.push({ role: 'user', parts: [{ text: weatherContextText }]});
        content.push({ role: 'model', parts: [{ text: "Ok, tenho o contexto climático." }]});
    }

    if (searchResults && searchResults.length > 0) {
        let searchContextText = `## Resultados da Pesquisa na Web\n(Use estes trechos para responder à pergunta do usuário)\n\n`;
        searchContextText += searchResults.map((r: any) => `- Fonte: ${r.title}\n- Conteúdo: ${r.snippet}`).join('\n\n');
        
        content.push({ role: 'user', parts: [{ text: searchContextText }]});
        content.push({ role: 'model', parts: [{ text: "Recebi os resultados da busca. Vou responder à pergunta original do usuário com base neles." }]});
    }

    return content;
};


const handler: Handler = async (event: HandlerEvent) => {
    const apiKey = process.env.GEMINI_API;

    if (!apiKey) {
        console.error("Erro Crítico: A variável de ambiente GEMINI_API não está configurada no painel do Netlify.");
        return { statusCode: 500, body: JSON.stringify({ message: "Erro de configuração no servidor (Chave de IA ausente)." }) };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { prompt, history, weatherContext, searchResults, timeContext } = JSON.parse(event.body || '{}');

        if (!prompt) {
            return { statusCode: 400, body: JSON.stringify({ message: "O prompt é obrigatório." }) };
        }

        // Fallback if frontend didn't send time (backward compatibility)
        const effectiveTimeContext = timeContext || new Date().toLocaleString('pt-BR');

        const ai = new GoogleGenAI({ apiKey });
        const model = 'gemini-flash-lite-latest';
        
        const contextualContent = buildContextualContent(weatherContext, searchResults, effectiveTimeContext);
        
        const contents = [
            ...contextualContent, 
            ...(Array.isArray(history) ? history : []), 
            { role: 'user', parts: [{ text: prompt }] }
        ];
        
        const result = await ai.models.generateContent({ model, contents });
        const text = result.text;

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text }),
        };

    } catch (error) {
        console.error("Erro na função Gemini:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Ocorreu um erro ao processar sua solicitação na IA." }),
        };
    }
};

export { handler };
