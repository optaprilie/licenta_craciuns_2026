import { GoogleGenAI, Type } from "@google/genai";

// We keep a single instance of the client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "YOUR_GEMINI_API_KEY"
});

export interface GeneratedMetadata {
  title: string;
  description: string;
  tags: string[];
  folder: string;
}

export async function generateMediaMetadata(
  imageUrl: string,
  mimeType: string = "image/jpeg"
): Promise<GeneratedMetadata> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY is not set. Skipping AI generation.");
      return {
        title: "",
        description: "",
        tags: [],
        folder: ""
      };
    }

    // 1. Fetch the image from Cloudinary
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image from ${imageUrl}: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString("base64");

    // 2. Prepare the prompt and schema
    const prompt = "Analyze this media file and generate a concise title, a detailed description (if it contains any text or speech, please transcribe it completely and include it at the end of the description), a list of relevant tags, and a generic folder name for categorizing it (e.g. 'Nature', 'Pets', 'Documents', 'Vacation', 'Portraits'). The folder name should be a maximum of 2 words.";

    // 3. Call Gemini with retry logic for 429/503 errors
    let result;
    let retries = 3;
    let delay = 2000; // Start with 2 second delay

    while (retries > 0) {
      try {
        result = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [
            {
              role: "user",
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    data: base64Data,
                    mimeType: mimeType
                  }
                }
              ]
            }
          ],
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                folder: { type: Type.STRING }
              },
              required: ["title", "description", "tags", "folder"]
            }
          }
        });
        break; // Success
      } catch (err: any) {
        if ((err.status === 429 || err.status === 503) && retries > 1) {
          retries--;
          console.warn(`Gemini API rate limit hit (${err.status}). Retrying in ${delay}ms...`);
          await new Promise(res => setTimeout(res, delay));
          delay *= 2; // Exponential backoff
        } else {
          throw err;
        }
      }
    }

    if (!result || !result.text) {
      throw new Error("Gemini returned empty response");
    }

    const parsed = JSON.parse(result.text) as GeneratedMetadata;
    return parsed;
  } catch (error) {
    console.error("Error generating metadata with AI:", error);
    return {
      title: "",
      description: "",
      tags: [],
      folder: ""
    };
  }
}
