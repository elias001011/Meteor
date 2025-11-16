import { GoogleGenAI, Chat } from "@google/genai";

let chat: Chat | null = null;

// Initialize the Gemini client only if the API key is available.
// This prevents the app from crashing if the key is not configured.
if (process.env.API_KEY) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      // System instructions can be added here if needed
      // config: {
      //   systemInstruction: 'You are a helpful weather assistant.',
      // },
    });
  } catch (error) {
    console.error("Failed to initialize Gemini AI:", error);
  }
} else {
  console.warn("Gemini API key not found. AI functionality will be disabled.");
}

/**
 * Gets a streaming chat response from the Gemini API.
 * @param prompt The user's input prompt.
 */
export async function* streamChatResponse(prompt: string): AsyncGenerator<string, void, unknown> {
  if (!chat) {
    yield "A funcionalidade de IA está desativada pois a chave da API não foi configurada.";
    return;
  }
  
  try {
    const result = await chat.sendMessageStream({ message: prompt });
    for await (const chunk of result) {
      yield chunk.text;
    }
  } catch (error) {
    console.error("Error fetching Gemini response:", error);
    yield "Desculpe, ocorreu um erro ao me comunicar. Por favor, tente novamente.";
  }
}
