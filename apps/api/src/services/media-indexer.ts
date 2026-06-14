import { cloudinary } from "../lib/cloudinary.js";
import type {
  MediaDocument,
  MediaResourceType,
  RegisterMediaRequest
} from "../models/media.js";
import {
  buildSearchIndex,
  dedupeTags
} from "./search-tokenizer.js";
import { generateMediaMetadata } from "./ai-service.js";

interface CloudinaryAssetResponse {
  public_id: string;
  secure_url: string;
  resource_type: MediaResourceType;
  width?: number;
  height?: number;
  bytes?: number;
  duration?: number;
  format?: string;
  folder?: string;
  original_filename?: string;
  created_at?: string;
  tags?: string[];
}

function encodeMediaId(publicId: string): string {
  return Buffer.from(publicId, "utf8").toString("base64url");
}

function buildPreviewUrl(publicId: string, resourceType: MediaResourceType): string {
  if (resourceType === "video") {
    return cloudinary.url(publicId, {
      resource_type: "video",
      format: "jpg",
      transformation: [
        {
          start_offset: "0"
        }
      ]
    });
  }

  return cloudinary.url(publicId, {
    resource_type: "image"
  });
}

export async function indexUploadedMedia(
  request: RegisterMediaRequest
): Promise<MediaDocument> {
  const asset = (await cloudinary.api.resource(request.publicId, {
    resource_type: request.resourceType,
    image_metadata: true,
    media_metadata: true
  })) as CloudinaryAssetResponse;

  let finalTitle = request.title.trim();
  let finalDescription = request.description.trim();
  let aiTags = dedupeTags(asset.tags ?? []);
  let generatedFolder = "";

  // Use Gemini to generate missing metadata if the user didn't provide a title or folder
  if ((!finalTitle || !request.folder) && asset.secure_url && !request.skipAI) {
    const generated = await generateMediaMetadata(asset.secure_url, `image/${asset.format || "jpeg"}`);
    if (!finalTitle && generated.title) finalTitle = generated.title;
    if (generated.description) finalDescription = generated.description;
    if (generated.tags && generated.tags.length > 0) {
      aiTags = dedupeTags([...aiTags, ...generated.tags]);
    }
    if (!request.folder && generated.folder) generatedFolder = generated.folder;
  }

  // Ensure title is not totally empty after AI attempt
  if (!finalTitle) {
    finalTitle = asset.original_filename || "Untitled Image";
  }

  const manualTags = dedupeTags(request.manualTags);
  const searchIndex = buildSearchIndex({
    title: finalTitle,
    description: finalDescription,
    manualTags,
    aiTags,
    fileName: asset.original_filename ?? request.publicId
  });
  const indexedAt = new Date().toISOString();
  const finalFolder = request.folder || generatedFolder || asset.folder || "Uncategorized";

  return {
    id: "", // The database auto-generates the integer ID
    title: finalTitle,
    description: finalDescription,
    manualTags,
    aiTags,
    searchText: searchIndex.text,
    searchTokens: searchIndex.tokens,
    resourceType: asset.resource_type,
    publicId: asset.public_id,
    mediaUrl: asset.secure_url,
    previewUrl: buildPreviewUrl(asset.public_id, asset.resource_type),
    bytes: asset.bytes ?? null,
    width: asset.width ?? null,
    height: asset.height ?? null,
    duration: asset.duration ?? null,
    format: asset.format ?? null,
    folder: finalFolder,
    originalFilename: asset.original_filename ?? null,
    createdAt: asset.created_at ?? indexedAt,
    indexedAt
  };
}

