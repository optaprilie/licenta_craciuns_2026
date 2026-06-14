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
    const prompt = "Analyze this image and generate a concise title, a description (if the image contains any text, please transcribe it completely and include it at the end of the description), a list of relevant tags, and a generic folder name for categorizing it (example: 'Nature', 'Pets', 'Documents', 'Vacation', 'Portraits'). The folder name should be a maximum of 2 words.";

    // 3. Call Gemini
    const result = await ai.models.generateContent({
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
            title: {
              type: Type.STRING,
              description: "A short, engaging title for the media file (example: 'Sunset over the mountains')."
            },
            description: {
              type: Type.STRING,
              description: "A detailed description of the media file, explaining what is happening or what is shown."
            },
            tags: {
              type: Type.ARRAY,
              description: "A list of relevant keywords or tags (example: 'nature', 'landscape', 'sunset').",
              items: {
                type: Type.STRING
              }
            },
            folder: {
              type: Type.STRING,
              description: "A generic folder name for categorizing this image (example: 'Nature', 'Pets', 'Documents')."
            }
          },
          required: ["title", "description", "tags", "folder"]
        }
      }
    });

    if (!result.text) {
      throw new Error("Gemini returned an empty response.");
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
