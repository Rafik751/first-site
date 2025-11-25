import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GEMINI_MODEL, INITIAL_SYSTEM_INSTRUCTION } from "../constants";
import { Message, Role } from "../types";

// Initialize the client strictly using the environment variable
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Sends a message to the Gemini model and streams the response.
 */
export const streamChatResponse = async function* (
  history: Message[],
  newMessage: string
): AsyncGenerator<string, void, unknown> {
  
  try {
    // 1. Prepare history for the chat context
    // We filter out system messages from the history array passed to sendMessageStream
    // because system instructions are handled via config.
    const validHistory = history
      .filter(m => m.role !== Role.System)
      .map(m => ({
        role: m.role === Role.User ? 'user' : 'model',
        parts: [{ text: m.content }],
      }));

    // 2. Create the chat session
    const chat = ai.chats.create({
      model: GEMINI_MODEL,
      config: {
        systemInstruction: INITIAL_SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
      history: validHistory,
    });

    // 3. Send the message and get the stream
    const resultStream = await chat.sendMessageStream({
      message: newMessage,
    });

    // 4. Yield chunks as they arrive
    for await (const chunk of resultStream) {
      const c = chunk as GenerateContentResponse;
      if (c.text) {
        yield c.text;
      }
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
    yield "\n\n**Error:** Unable to connect to Gemini. Please check your API Key configuration.";
  }
};
