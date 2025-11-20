
import type { AllWeatherData, SearchResultItem } from '../types';
import type { Content } from '@google/genai';

const AI_USAGE_KEY = 'meteor_ai_usage';
const DAILY_LIMIT = 5;

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
    timeContext: string
): AsyncGenerator<{ text: string }, void, unknown> {
  
    // --- DAILY LIMIT CHECK START ---
    const today = new Date().toLocaleDateString('pt-BR');
    let usageData = { count: 0, date: today };

    try {
        const stored = localStorage.getItem(AI_USAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.date === today) {
                usageData = parsed;
            } else {
                // New day, reset count, but keep new date
                usageData = { count: 0, date: today };
            }
        }
    } catch (e) {
        console.error("Error reading AI usage", e);
    }

    // Only enforce limit if NOT a search result follow-up (to prevent double counting on auto-search)
    // We detect if it's a follow-up by checking if searchResults are present, meaning the system triggered this, not the user directly.
    // However, to be strict, we limit "interactions". If the user prompts, it counts.
    // If the system does an internal auto-search loop, we should arguably NOT count it as a second request, 
    // but `searchResults` is passed in the second call.
    // Let's count user initiations. If `searchResults` is populated, it's likely the second leg of the SAME user request.
    // So we only increment if searchResults is null/empty.
    
    const isInternalRetry = searchResults && searchResults.length > 0;

    if (!isInternalRetry) {
        if (usageData.count >= DAILY_LIMIT) {
            yield { text: "🛑 **Limite Diário Atingido**\n\nVocê atingiu o limite de 5 requisições diárias à IA. Para garantir a estabilidade do serviço, o uso é limitado.\n\nPor favor, volte amanhã!" };
            return;
        }
    }
    // --- DAILY LIMIT CHECK END ---

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
            timeContext
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'A comunicação com a IA falhou.' }));
        throw new Error(errorData.message || 'A comunicação com a IA falhou.');
    }
    
    // The server now sends the full response as a single JSON object.
    const data = await response.json();

    // Only increment usage if successful and NOT an internal retry
    if (!isInternalRetry && data.text) {
        usageData.count += 1;
        localStorage.setItem(AI_USAGE_KEY, JSON.stringify(usageData));
    }

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
