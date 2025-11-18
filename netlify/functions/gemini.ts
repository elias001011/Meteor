import { GoogleGenAI, Content } from "@google/genai";
import { type Handler, type HandlerEvent } from "@netlify/functions";

const buildContextualContent = (
    weatherInfo: any | null, 
    searchResults: any[] | null
): Content[] => {
    const systemInstruction = `Você é a IA do Meteor, a ferramenta sucessora do RS Alerta. Responda da forma mais curta possível e em texto corrido.`;

    const content: Content[] = [{
        role: 'user',
        parts: [{ text: systemInstruction }]
    }, {
        role: 'model',
        parts: [{ text: "Entendido. Serei a IA do Meteor, sucessora do RS Alerta, e responderei de forma breve e direta." }]
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
    } else {
         content.push({ role: 'user', parts: [{ text: "INSTRUÇÃO: Se você não souber a resposta com base no seu conhecimento e no contexto climático fornecido, instrua o usuário a ativar a pesquisa na web para obter informações em tempo real." }]});
         content.push({ role: 'model', parts: [{ text: "Entendido. Se eu não souber, pedirei para o usuário ativar a pesquisa." }]});
    }

    return content;
};


const handler: Handler = async (event: HandlerEvent) => {
    // SEGURANÇA: Esta chave é acessada apenas no servidor (Netlify Functions).
    // Ela NUNCA é enviada para o navegador do usuário.
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
        // Usando o modelo Flash Lite para respostas rápidas e eficientes
        const model = 'gemini-2.5-flash-lite';
        
        const contextualContent = buildContextualContent(weatherContext, searchResults);
        
        // Construção segura do histórico
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