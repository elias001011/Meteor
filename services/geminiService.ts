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
    return value.slice(0, maxLength);
};

const sanitizeHistory = (history: unknown): Content[] => {
    if (!Array.isArray(history)) return [];

    return history
        .slice(-20)
        .map((entry) => {
            if (!isRecord(entry)) return null;

            const role = entry.role === 'user' || entry.role === 'model' ? entry.role : null;
            const parts = Array.isArray(entry.parts) ? entry.parts : null;
            const text = typeof entry.text === 'string'
                ? entry.text
                : typeof parts?.[0] === 'object' && parts?.[0] !== null && typeof (parts[0] as Record<string, unknown>).text === 'string'
                    ? clampString((parts[0] as Record<string, unknown>).text, 4000)
                    : '';

            if (!role || !text) return null;

            return {
                role,
                parts: [{ text: text.slice(0, 4000) }],
            } satisfies Content;
        })
        .filter((entry): entry is Content => entry !== null);
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
    const response = await fetch('/.netlify/functions/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            prompt: clampString(prompt, 8000).trim(),
            history: sanitizeHistory(history),
            weatherContext: sanitizeWeatherContext(weatherContext),
            timeContext: clampString(timeContext, 120),
            userInstructions: clampString(userInstructions, 500),
        }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(
            typeof data?.message === 'string' && data.message.trim()
                ? data.message
                : 'O modelo falhou. Tente novamente mais tarde'
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
