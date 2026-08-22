import type { Content } from '@google/genai';
import type { AllWeatherData, GroundingSource } from '../types';

export interface GeminiChatResponse {
    text: string;
    model?: string;
    processingTime?: number;
    toolUsed?: string;
    sources?: GroundingSource[];
}

interface GeminiChatRequest {
    prompt: string;
    history: Content[];
    weatherContext: Partial<AllWeatherData> | null;
    timeContext: string;
    userInstructions?: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> => (
    typeof value === 'object' && value !== null && !Array.isArray(value)
);

const clampString = (value: unknown, maxLength: number): string => {
    if (typeof value !== 'string') return '';
    return value
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
        .trim()
        .slice(0, maxLength);
};

const sanitizeHistory = (history: unknown): Content[] => {
    if (!Array.isArray(history)) return [];

    let remainingCharacters = 18_000;
    const sanitized = history
        .slice(-16)
        .reverse()
        .map((entry): Content | null => {
            if (!isRecord(entry)) return null;

            const role = entry.role === 'user' || entry.role === 'model' ? entry.role : null;
            const parts = Array.isArray(entry.parts) ? entry.parts : null;
            const text = typeof entry.text === 'string'
                ? entry.text
                : typeof parts?.[0] === 'object' && parts?.[0] !== null && typeof (parts[0] as Record<string, unknown>).text === 'string'
                    ? clampString((parts[0] as Record<string, unknown>).text, 3000)
                    : '';

            if (!role || !text) return null;

            const limitedText = text.slice(0, Math.min(3_000, remainingCharacters));
            if (!limitedText) return null;
            remainingCharacters -= limitedText.length;

            return {
                role,
                parts: [{ text: limitedText }],
            } satisfies Content;
        })
        .filter((entry): entry is Content => entry !== null);

    return sanitized.reverse();
};

const sanitizeWeatherContext = (weatherContext: unknown): Partial<AllWeatherData> | null => {
    return isRecord(weatherContext) ? weatherContext as Partial<AllWeatherData> : null;
};

export async function generateChatResponse({
    prompt,
    history,
    weatherContext,
    timeContext,
    userInstructions,
}: GeminiChatRequest): Promise<GeminiChatResponse> {
    const sanitizedPrompt = clampString(prompt, 6000);
    if (!sanitizedPrompt) {
        throw new Error('Escreva uma pergunta para a assistente.');
    }

    const response = await fetch('/.netlify/functions/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(32_000),
        body: JSON.stringify({
            prompt: sanitizedPrompt,
            history: sanitizeHistory(history),
            weatherContext: sanitizeWeatherContext(weatherContext),
            timeContext: clampString(timeContext, 120),
            userInstructions: clampString(userInstructions, 400),
        }),
    }).catch((error) => {
        if (error instanceof DOMException && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
            throw new Error('A resposta demorou mais que o esperado. Tente novamente.');
        }
        throw new Error('Não foi possível conectar à assistente. Verifique sua conexão.');
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        const retryAfter = Number.parseInt(response.headers.get('Retry-After') || '', 10);
        if (response.status === 429) {
            throw new Error(Number.isFinite(retryAfter)
                ? `Limite temporário atingido. Tente novamente em ${retryAfter} segundos.`
                : 'Limite temporário atingido. Aguarde um momento e tente novamente.');
        }
        throw new Error(
            typeof data?.message === 'string' && data.message.trim()
                ? data.message
                : 'A assistente está indisponível no momento. Tente novamente em instantes.'
        );
    }

    const text = clampString(data.text, 20000).trim();
    if (!text) {
        throw new Error('O modelo falhou. Tente novamente mais tarde');
    }

    return {
        text,
        model: typeof data.model === 'string' ? data.model : undefined,
        processingTime: typeof data.processingTime === 'number' ? data.processingTime : undefined,
        toolUsed: typeof data.toolUsed === 'string' ? data.toolUsed : undefined,
        sources: Array.isArray(data.sources)
            ? data.sources
                .filter((item): item is GroundingSource => (
                    isRecord(item) &&
                    typeof item.uri === 'string' &&
                    typeof item.title === 'string'
                ))
                .slice(0, 10)
            : [],
    };
}
