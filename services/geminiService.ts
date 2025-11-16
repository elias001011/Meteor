import type { AllWeatherData, SearchResultItem } from '../types';
import type { Content } from '@google/genai';

/**
 * Gets a streaming chat response by calling our secure Netlify function, 
 * which proxies the Gemini API.
 */
export async function* streamChatResponse(
    prompt: string, 
    history: Content[],
    weatherContext: Partial<AllWeatherData> | null,
    searchResults: SearchResultItem[] | null,
): AsyncGenerator<{ text: string }, void, unknown> {
  
  try {
    const response = await fetch('/.netlify/functions/gemini', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            prompt,
            history,
            weatherContext,
            searchResults,
        }),
    });

    if (!response.ok || !response.body) {
        const errorData = await response.json().catch(() => ({ message: 'A comunicação com a IA falhou.' }));
        throw new Error(errorData.message || 'A comunicação com a IA falhou.');
    }
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) {
            break;
        }

        buffer += decoder.decode(value, { stream: true });
        
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || ''; // Keep the last, possibly incomplete line

        for (const line of lines) {
            if (line.startsWith('data: ')) {
                try {
                    const json = JSON.parse(line.substring(6));
                    if (json.text) {
                       yield json;
                    }
                } catch (e) {
                    console.error('Failed to parse SSE chunk:', line);
                }
            }
        }
    }

  } catch (error) {
    console.error("Error fetching Gemini stream:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    const mockErrorResponse = {
      text: `Desculpe, ocorreu um erro ao me comunicar. (${errorMessage})`,
    };
    yield mockErrorResponse;
  }
}