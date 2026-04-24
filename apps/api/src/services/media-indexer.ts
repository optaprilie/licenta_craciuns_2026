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

  const manualTags = dedupeTags(request.manualTags);
  const aiTags = dedupeTags(asset.tags ?? []);
  const searchIndex = buildSearchIndex({
    title: request.title,
    description: request.description,
    manualTags,
    aiTags,
    fileName: asset.original_filename ?? request.publicId
  });
  const indexedAt = new Date().toISOString();

  return {
    id: encodeMediaId(asset.public_id),
    title: request.title.trim(),
    description: request.description.trim(),
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
    folder: asset.folder ?? null,
    originalFilename: asset.original_filename ?? null,
    createdAt: asset.created_at ?? indexedAt,
    indexedAt
  };
}

