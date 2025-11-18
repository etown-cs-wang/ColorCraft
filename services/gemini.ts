import { GoogleGenAI, Type, Schema } from "@google/genai";

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Models
const MODEL_TEXT_CHAT = 'gemini-3-pro-preview';
const MODEL_IMAGE = 'imagen-4.0-generate-001';

/**
 * Generates 5 distinct scene descriptions based on a theme for a coloring book.
 */
export const generateSceneDescriptions = async (theme: string, childName: string): Promise<string[]> => {
  const prompt = `
    Create 5 distinct, creative, and fun scene descriptions for a children's coloring book based on the theme: "${theme}".
    The scenes should be suitable for a child named "${childName}".
    Keep the descriptions visual and focused on main subjects.
    Do not describe the artistic style (e.g., "black and white lines"), just the scene content.
    Example scene: "A friendly dinosaur wearing a space helmet looking at a floating donut in space."
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_TEXT_CHAT,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
          },
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No text returned from Gemini");
    
    const scenes = JSON.parse(text);
    return scenes;
  } catch (error) {
    console.error("Error generating scene descriptions:", error);
    throw error;
  }
};

/**
 * Generates a single coloring book page image from a prompt.
 */
export const generateColoringPageImage = async (sceneDescription: string): Promise<string> => {
  // We append strict style instructions to the user's scene description
  const styleModifier = "black and white coloring book page, thick clean black vector lines, white background, no shading, no greyscale, high contrast, cute simple children's illustration style, minimalistic details";
  const fullPrompt = `${sceneDescription}. ${styleModifier}`;

  try {
    const response = await ai.models.generateImages({
      model: MODEL_IMAGE,
      prompt: fullPrompt,
      config: {
        numberOfImages: 1,
        aspectRatio: '3:4', // Portrait for book pages
        outputMimeType: 'image/png',
      },
    });

    const imageBytes = response.generatedImages?.[0]?.image?.imageBytes;
    if (!imageBytes) {
      throw new Error("No image generated");
    }
    
    return `data:image/png;base64,${imageBytes}`;
  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
};

/**
 * Chat with the AI assistant.
 */
export const sendChatMessage = async (history: {role: string, parts: {text: string}[]}[], message: string) => {
  try {
    const chat = ai.chats.create({
      model: MODEL_TEXT_CHAT,
      history: history,
      config: {
        systemInstruction: "You are a helpful, cheerful creative assistant for a coloring book app. Help users come up with creative themes for their coloring books. Keep answers short and encouraging.",
      },
    });

    const response = await chat.sendMessage({ message });
    return response.text;
  } catch (error) {
    console.error("Chat error:", error);
    throw error;
  }
};