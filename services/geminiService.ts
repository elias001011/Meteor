import { GoogleGenAI, Chat } from "@google/genai";

// Initialize the Gemini client.
// The API key is assumed to be available in process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const chat: Chat = ai.chats.create({
  model: 'gemini-2.5-flash',
  // System instructions can be added here if needed
  // config: {
  //   systemInstruction: 'You are a helpful weather assistant.',
  // },
});


/**
 * Gets a streaming chat response from the Gemini API.
 * @param prompt The user's input prompt.
 */
export async function* streamChatResponse(prompt: string): AsyncGenerator<string, void, unknown> {
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
