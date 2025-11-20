

import { GoogleGenAI, Content } from "@google/genai";
import { type Handler, type HandlerEvent } from "@netlify/functions";

const buildContextualContent = (
    weatherInfo: any | null, 
    searchResults: any[] | null
): Content[] => {
    
    // 1. Identidade Central e Regras de Comportamento
    let systemInstruction = `DIRETRIZES ESSENCIAIS:\n`;
    systemInstruction += `1. Você é a IA do Meteor. Seja prestativo, simpático e direto. Suas respostas devem ser curtas e em texto corrido, sem formatação (como negrito ou listas), a menos que estritamente necessário.\n`;
    systemInstruction += `2. MEMÓRIA: Lembre-se do histórico do chat para entender o contexto de perguntas contínuas.\n`;
    systemInstruction += `3. BUSCA WEB: Se o usuário perguntar algo que você não sabe, instrua-o a ativar a busca na web. Não invente respostas. Se resultados da busca forem fornecidos, use-os para responder.`;
    
    const content: Content[] = [{
        role: 'user',
        parts: [{ text: systemInstruction }]
    }, {
        role: 'model',
        parts: [{ text: `Entendido. Sou o Meteor. Serei breve, simpático, lembrarei do histórico da conversa e sugerirei a busca web quando necessário.` }]
    }];

    if (weatherInfo && weatherInfo.weatherData) {
        const now = new Date();
        const formattedDate = now.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const formattedTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        const { weatherData, airQualityData, dailyForecast, alerts } = weatherInfo;
        let weatherContextText = `## Contexto do Clima Atual (Hoje é ${formattedDate}, ${formattedTime} em ${weatherData.city}, ${weatherData.country})\n- Temperatura: ${weatherData.temperature}°C, ${weatherData.condition}\n- Vento: ${weatherData.windSpeed} km/h, Umidade: ${weatherData.humidity}%\n`;
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
        content.push({ role: 'model', parts: [{ text: "Ok, tenho os resultados da busca." }]});
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
        const { prompt, history, weatherContext, searchResults } = JSON.parse(event.body || '{}');

        if (!prompt) {
            return { statusCode: 400, body: JSON.stringify({ message: "O prompt é obrigatório." }) };
        }

        const ai = new GoogleGenAI({ apiKey });
        const model = 'gemini-2.5-flash-lite';
        
        const contextualContent = buildContextualContent(weatherContext, searchResults);
        
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