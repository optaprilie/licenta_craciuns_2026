import dotenv from "dotenv";

dotenv.config();

function readRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function readOptionalEnv(name: string, fallback = ""): string {
  return process.env[name] ?? fallback;
}

function readNumberEnv(name: string, fallback: number): number {
  const value = process.env[name];

  if (!value) {
    return fallback;
  }

  const parsed = Number(value);

  if (Number.isNaN(parsed)) {
    throw new Error(`Environment variable ${name} must be a number.`);
  }

  return parsed;
}

function readBooleanEnv(name: string, fallback: boolean): boolean {
  const value = process.env[name];

  if (!value) {
    return fallback;
  }

  return value.toLowerCase() === "true";
}

export const env = {
  port: readNumberEnv("PORT", 4000),
  clientOrigin: readOptionalEnv("CLIENT_ORIGIN", "http://localhost:5173"),
  firestore: {
    projectId: readRequiredEnv("FIREBASE_PROJECT_ID"),
    clientEmail: readRequiredEnv("FIREBASE_CLIENT_EMAIL"),
    privateKey: readRequiredEnv("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n"),
    collectionName: readOptionalEnv("FIRESTORE_MEDIA_COLLECTION", "media"),
    databaseId: readOptionalEnv("FIRESTORE_DATABASE_ID", "(default)")
  },
  cloudinary: {
    cloudName: readRequiredEnv("CLOUDINARY_CLOUD_NAME"),
    apiKey: readRequiredEnv("CLOUDINARY_API_KEY"),
    apiSecret: readRequiredEnv("CLOUDINARY_API_SECRET"),
    folder: readOptionalEnv("CLOUDINARY_FOLDER", "licenta-gallery"),
    aiTaggingProvider: readOptionalEnv("CLOUDINARY_AI_TAGGING_PROVIDER", ""),
    autoTaggingThreshold: readNumberEnv("CLOUDINARY_AUTO_TAGGING_THRESHOLD", 0.65),
    enableVideoDetails: readBooleanEnv("CLOUDINARY_ENABLE_VIDEO_DETAILS", false)
  }
};

