import { GoogleGenAI, GenerateContentResponse, Content } from "@google/genai";
import type { AllWeatherData, SearchResultItem } from '../types';

let ai: GoogleGenAI | null = null;

// FIX: Use GEMINI_API environment variable as specified in Netlify configuration.
if (process.env.GEMINI_API) {
  try {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API });
  } catch (error) {
    console.error("Failed to initialize Gemini AI:", error);
  }
} else {
  console.warn("Gemini API key not found. AI functionality will be disabled.");
}

const buildContextualContent = (
    weatherInfo: Partial<AllWeatherData> | null, 
    searchResults: SearchResultItem[] | null
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
        if (dailyForecast && dailyForecast.length > 0) weatherContextText += `- Previsão: ${dailyForecast.slice(0, 3).map(d => `${new Date(d.dt * 1000).toLocaleDateString('pt-BR', { weekday: 'short' })} ${d.temperature}°C`).join(', ')}\n`;
        if (alerts && alerts.length > 0) weatherContextText += `- Alertas: ${alerts.map(a => a.event).join(', ')}\n`;
        
        content.push({ role: 'user', parts: [{ text: weatherContextText }]});
        content.push({ role: 'model', parts: [{ text: "Ok, tenho o contexto climático." }]});
    }

    if (searchResults && searchResults.length > 0) {
        let searchContextText = `## Resultados da Pesquisa na Web\n(Use estes trechos para responder à pergunta do usuário)\n\n`;
        searchContextText += searchResults.map(r => `- Fonte: ${r.title}\n- Conteúdo: ${r.snippet}`).join('\n\n');
        
        content.push({ role: 'user', parts: [{ text: searchContextText }]});
        content.push({ role: 'model', parts: [{ text: "Ok, tenho os resultados da busca." }]});
    } else {
         content.push({ role: 'user', parts: [{ text: "INSTRUÇÃO: Se você não souber a resposta com base no seu conhecimento e no contexto climático fornecido, instrua o usuário a ativar a pesquisa na web para obter informações em tempo real." }]});
         content.push({ role: 'model', parts: [{ text: "Entendido. Se eu não souber, pedirei para o usuário ativar a pesquisa." }]});
    }

    return content;
};


/**
 * Gets a streaming chat response from the Gemini API, with context and search grounding.
 */
export async function* streamChatResponse(
    prompt: string, 
    history: Content[],
    weatherContext: Partial<AllWeatherData> | null,
    searchResults: SearchResultItem[] | null,
): AsyncGenerator<GenerateContentResponse, void, unknown> {
  if (!ai) {
    const mockResponse: any = {
      text: "A funcionalidade de IA está desativada pois a chave da API não foi configurada.",
      candidates: [],
    };
    yield mockResponse;
    return;
  }
  
  try {
    const contextualContent = buildContextualContent(weatherContext, searchResults);
    // UPDATE: Changed model as requested
    const model = 'gemini-2.5-flash-lite';
    
    const result = await ai.models.generateContentStream({
        model: model,
        contents: [...contextualContent, ...history, { role: 'user', parts: [{ text: prompt }] }],
    });

    for await (const chunk of result) {
      yield chunk;
    }
  } catch (error) {
    console.error("Error fetching Gemini response:", error);
     const mockErrorResponse: any = {
      text: "Desculpe, ocorreu um erro ao me comunicar. Por favor, tente novamente.",
      candidates: [],
    };
    yield mockErrorResponse;
  }
}