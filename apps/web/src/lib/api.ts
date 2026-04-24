import type { MediaRecord, MediaResourceType, UploadDraft } from "../types/media";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

interface UploadSignatureResponse {
  cloudName: string;
  apiKey: string;
  uploadUrl: string;
  params: Record<string, string | number>;
}

interface CloudinaryUploadResponse {
  public_id: string;
  resource_type: MediaResourceType | "raw";
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const fallbackMessage = "The request failed.";

    try {
      const payload = (await response.json()) as { message?: string };
      throw new Error(payload.message ?? fallbackMessage);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }

      throw new Error(fallbackMessage);
    }
  }

  return (await response.json()) as T;
}

export async function fetchMedia(query: string): Promise<MediaRecord[]> {
  const url = new URL("/api/media", API_BASE_URL);

  if (query.trim()) {
    url.searchParams.set("q", query.trim());
  }

  const payload = await handleResponse<{ items: MediaRecord[] }>(await fetch(url));
  return payload.items;
}

export async function createUploadSignature(): Promise<UploadSignatureResponse> {
  return handleResponse<UploadSignatureResponse>(
    await fetch(`${API_BASE_URL}/api/uploads/signature`, {
      method: "POST"
    })
  );
}

export async function uploadFileToCloudinary(
  file: File,
  signature: UploadSignatureResponse
): Promise<CloudinaryUploadResponse> {
  const formData = new FormData();

  formData.append("file", file);
  formData.append("api_key", signature.apiKey);

  for (const [key, value] of Object.entries(signature.params)) {
    formData.append(key, String(value));
  }

  const response = await fetch(signature.uploadUrl, {
    method: "POST",
    body: formData
  });

  return handleResponse<CloudinaryUploadResponse>(response);
}

export async function registerMediaUpload(
  draft: UploadDraft,
  upload: CloudinaryUploadResponse
): Promise<MediaRecord> {
  if (upload.resource_type !== "image" && upload.resource_type !== "video") {
    throw new Error("Only image and video uploads are supported.");
  }

  const payload = await handleResponse<{ item: MediaRecord }>(
    await fetch(`${API_BASE_URL}/api/media/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title: draft.title,
        description: draft.description,
        manualTags: draft.manualTags,
        publicId: upload.public_id,
        resourceType: upload.resource_type
      })
    })
  );

  return payload.item;
}

export async function updateMedia(
  id: string,
  draft: Pick<UploadDraft, "title" | "description" | "manualTags">
): Promise<MediaRecord> {
  const payload = await handleResponse<{ item: MediaRecord }>(
    await fetch(`${API_BASE_URL}/api/media/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title: draft.title,
        description: draft.description,
        manualTags: draft.manualTags
      })
    })
  );

  return payload.item;
}
