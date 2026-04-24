export type MediaResourceType = "image" | "video";

export interface MediaRecord {
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

export interface UploadDraft {
  title: string;
  description: string;
  manualTags: string[];
  file: File;
}

export interface UpdateMediaDraft {
  title: string;
  description: string;
  manualTags: string[];
}

