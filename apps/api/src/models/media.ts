export type MediaResourceType = "image" | "video";

export interface RegisterMediaRequest {
  title: string;
  description: string;
  manualTags: string[];
  publicId: string;
  resourceType: MediaResourceType;
}

export interface UpdateMediaRequest {
  title?: string;
  description?: string;
  manualTags?: string[];
}

export interface MediaDocument {
  id: string;
  title: string;
  description: string;
  manualTags: string[];
  aiTags: string[];
  searchText: string;
  searchTokens: string[];
  resourceType: MediaResourceType;
  publicId: string;
  mediaUrl: string;
  previewUrl: string;
  bytes: number | null;
  width: number | null;
  height: number | null;
  duration: number | null;
  format: string | null;
  folder: string | null;
  originalFilename: string | null;
  createdAt: string;
  indexedAt: string;
}

