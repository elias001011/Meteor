
import type { AllWeatherData, SearchResultItem, AppSettings } from '../types';
import type { Content } from '@google/genai';

/**
 * Gets a chat response by calling our secure Netlify function.
 * This function is an async generator to maintain compatibility with the UI,
 * but it will only yield one value with the full response text.
 */
export async function* streamChatResponse(
    prompt: string, 
    history: Content[],
    weatherContext: Partial<AllWeatherData> | null,
    searchResults: SearchResultItem[] | null,
    settings?: AppSettings
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
            userName: settings?.userName,
            userInstructions: settings?.aiCustomInstructions
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'A comunicação com a IA falhou.' }));
        throw new Error(errorData.message || 'A comunicação com a IA falhou.');
    }
    
    // The server now sends the full response as a single JSON object.
    const data = await response.json();
    if (data.text) {
        yield { text: data.text };
    }

  } catch (error) {
    console.error("Error fetching Gemini response:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    const mockErrorResponse = {
      text: `Desculpe, ocorreu um erro ao me comunicar. (${errorMessage})`,
    };
    yield mockErrorResponse;
  }
}
