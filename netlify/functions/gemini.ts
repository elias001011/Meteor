

import { GoogleGenAI, Content } from "@google/genai";
import { type Handler, type HandlerEvent } from "@netlify/functions";

const buildContextualContent = (
    weatherInfo: any | null, 
    searchResults: any[] | null
): Content[] => {
    
    // Diretrizes revisadas para garantir que a IA use os resultados da busca quando disponíveis.
    let systemInstruction = `DIRETRIZES RÍGIDAS DE COMPORTAMENTO:\n`;
    systemInstruction += `1. **IDENTIDADE E TOM**: Você é a IA do Meteor. Responda de forma prestativa, simpática e **extremamente direta**. Suas respostas devem ser concisas e em texto corrido.\n`;
    systemInstruction += `2. **REGRA FUNDAMENTAL - NÃO ALUCINE**: Seu conhecimento é limitado. Você **NÃO** sabe a data ou hora atual e não tem acesso a notícias ou eventos em tempo real.\n`;
    systemInstruction += `   - **NÃO INVENTE, NÃO ADIVINHE, NÃO CALCULE DATAS.**\n`;
    systemInstruction += `3. **LÓGICA DE RESPOSTA**: Siga esta ordem de prioridade:\n`;
    systemInstruction += `   a. **SE** o contexto incluir "Resultados da Pesquisa na Web", sua prioridade **MÁXIMA** é analisar os trechos fornecidos e sintetizar uma resposta direta à pergunta do usuário. Se os resultados forem irrelevantes, informe que a busca não ajudou.\n`;
    systemInstruction += `   b. **SENÃO**, se a pergunta do usuário exigir conhecimento atual que você não possui (como "que dia é hoje?", "quais as últimas notícias?"), sua **ÚNICA** ação é responder: "Não tenho essa informação. Para te responder, por favor, ative a busca na web."\n`;
    systemInstruction += `4. **MEMÓRIA DE CONVERSA**: Você **DEVE** se lembrar do histórico de chat anterior. Se o usuário ativar a busca e disser "continue" ou "e agora?", você precisa olhar as mensagens anteriores para saber qual era a pergunta original e respondê-la usando os novos resultados da busca.\n`;
    systemInstruction += `5. **FORMATAÇÃO**: Use Markdown para **negrito** (\`**texto**\`) e *itálico* (\`*texto*\`) somente se for essencial para a clareza. Não use listas ou outros formatos.\n`;
    
    const content: Content[] = [{
        role: 'user',
        parts: [{ text: systemInstruction }]
    }, {
        role: 'model',
        parts: [{ text: `Entendido. Seguirei estritamente estas regras. Não tenho acesso a informações em tempo real, sugerirei a busca web quando necessário e manterei o contexto da conversa.` }]
    }];

    if (weatherInfo && weatherInfo.weatherData) {
        const { weatherData, airQualityData, dailyForecast, alerts } = weatherInfo;
        // Removida a data/hora do servidor para evitar confusão da IA.
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
        const model = 'gemini-flash-lite-latest';
        
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