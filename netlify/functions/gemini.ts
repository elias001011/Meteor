
import { GoogleGenAI, Content } from "@google/genai";
import { type Handler, type HandlerEvent } from "@netlify/functions";

const buildContextualContent = (
    weatherInfo: any | null, 
    searchResults: any[] | null,
    timeContext: string
): Content[] => {
    
    let systemInstruction = `DIRETRIZES MESTRAS (METEOR AI):\n\n`;
    
    systemInstruction += `1. **MEMÓRIA E CONTEXTO (PRIORIDADE MÁXIMA)**:\n`;
    systemInstruction += `   - Você recebe o HISTÓRICO da conversa. Antes de responder, LEIA-O.\n`;
    systemInstruction += `   - Se o usuário perguntar "o que eu disse antes?", "qual minha primeira mensagem?", ou retomar um assunto anterior, USE O HISTÓRICO. NÃO FAÇA BUSCA NA WEB para isso. Confie na sua memória de contexto fornecida.\n`;
    
    systemInstruction += `2. **CONTEXTO TEMPORAL**:\n`;
    systemInstruction += `   - Agora é: **${timeContext}**.\n`;
    systemInstruction += `   - Use isso para responder sobre datas e horas. NÃO diga que não sabe a data.\n`;
    
    systemInstruction += `3. **AUTO-BUSCA INTELIGENTE ([SEARCH_REQUIRED])**:\n`;
    systemInstruction += `   - Avalie a pergunta. Você precisa de dados externos (Notícias, placar de jogos, eventos futuros, fatos obscuros) que NÃO estão no histórico e nem no clima?\n`;
    systemInstruction += `   - Se a resposta para "Preciso de dados externos?" for SIM, e você NÃO tem esses dados no contexto atual:\n`;
    systemInstruction += `   - Responda APENAS E EXATAMENTE: [SEARCH_REQUIRED]\n`;
    systemInstruction += `   - NÃO use [SEARCH_REQUIRED] para perguntas sobre o histórico da conversa ou perguntas pessoais.\n`;
    systemInstruction += `   - **IMPORTANTE**: Se já recebeu "Resultados da Pesquisa na Web" abaixo, NÃO peça busca novamente para o mesmo assunto. Use os dados fornecidos.\n`;
    
    systemInstruction += `4. **IDENTIDADE E TOM**:\n`;
    systemInstruction += `   - Você é a IA do Meteor. Direta, útil e simpática.\n`;
    systemInstruction += `   - INTEGRAÇÃO NATURAL: Ao usar resultados da web, não diga "Com base nos resultados...". Apenas responda a pergunta naturalmente como se você já soubesse.\n`;
    
    const content: Content[] = [{
        role: 'user',
        parts: [{ text: systemInstruction }]
    }, {
        role: 'model',
        parts: [{ text: `Entendido. Data atual: ${timeContext}. Priorizarei o histórico para memória e usarei [SEARCH_REQUIRED] apenas para dados externos faltantes. Responderei de forma natural.` }]
    }];

    if (weatherInfo && weatherInfo.weatherData) {
        const { weatherData, airQualityData, dailyForecast, alerts } = weatherInfo;
        let weatherContextText = `## DADOS DO CLIMA (${weatherData.city})\n- Temp: ${weatherData.temperature}°C (${weatherData.condition})\n- Vento: ${weatherData.windSpeed} km/h\n- Umidade: ${weatherData.humidity}%\n`;
        if (airQualityData) weatherContextText += `- IQAR: ${airQualityData.aqi}\n`;
        if (dailyForecast && dailyForecast.length > 0) weatherContextText += `- Previsão: ${dailyForecast.slice(0, 3).map((d: any) => `${new Date(d.dt * 1000).toLocaleDateString('pt-BR', { weekday: 'short' })} ${Math.round(d.temperature)}°C`).join(', ')}\n`;
        if (alerts && alerts.length > 0) weatherContextText += `- ALERTAS: ${alerts.map((a: any) => a.event).join(', ')}\n`;
        
        content.push({ role: 'user', parts: [{ text: weatherContextText }]});
        content.push({ role: 'model', parts: [{ text: "Ciente dos dados climáticos." }]});
    }

    if (searchResults && searchResults.length > 0) {
        let searchContextText = `## RESULTADOS DA PESQUISA WEB (Use para responder)\n\n`;
        searchContextText += searchResults.map((r: any) => `[${r.title}]: ${r.snippet}`).join('\n\n');
        
        content.push({ role: 'user', parts: [{ text: searchContextText }]});
        content.push({ role: 'model', parts: [{ text: "Recebi os resultados da web. Vou responder a pergunta do usuário usando essas informações de forma natural." }]});
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
