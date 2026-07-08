import { env } from "../config/env.js";
import { supabase } from "../lib/supabase.js";
import type { MediaDocument, UpdateMediaRequest } from "../models/media.js";
import {
  buildSearchIndex,
  dedupeTags,
  scoreMediaMatch,
  tokenizeText
} from "./search-tokenizer.js";

const tableName = "media";

function toSnakeCase(media: MediaDocument, userId: string): Record<string, any> {
  const result: Record<string, any> = {
    user_id: userId,
    title: media.title,
    description: media.description,
    manual_tags: media.manualTags,
    ai_tags: media.aiTags,
    search_text: media.searchText,
    search_tokens: media.searchTokens,
    resource_type: media.resourceType,
    public_id: media.publicId,
    media_url: media.mediaUrl,
    preview_url: media.previewUrl,
    bytes: media.bytes,
    width: media.width,
    height: media.height,
    duration: media.duration,
    format: media.format,
    folder: media.folder,
    original_filename: media.originalFilename,
    created_at: media.createdAt,
    indexed_at: media.indexedAt,
    storage_path: media.mediaUrl, // Satisfies not-null constraint for storage_path
    upload_date: media.createdAt  // Satisfies not-null constraint for upload_date
  };
  // Explicitly do not include 'id' so the DB can auto-generate the integer.
  return result;
}

function toCamelCase(row: Record<string, any>): MediaDocument {
  return {
    id: String(row.id),
    title: row.title,
    description: row.description,
    manualTags: row.manual_tags ?? [],
    aiTags: row.ai_tags ?? [],
    searchText: row.search_text ?? "",
    searchTokens: row.search_tokens ?? [],
    resourceType: row.resource_type,
    publicId: row.public_id,
    mediaUrl: row.media_url,
    previewUrl: row.preview_url,
    bytes: row.bytes ?? null,
    width: row.width ?? null,
    height: row.height ?? null,
    duration: row.duration ?? null,
    format: row.format ?? null,
    folder: row.folder ?? null,
    originalFilename: row.original_filename ?? null,
    createdAt: row.created_at,
    indexedAt: row.indexed_at
  };
}

function sortMediaRecords(a: MediaDocument, b: MediaDocument): number {
  return b.indexedAt.localeCompare(a.indexedAt);
}

export async function getMediaRecord(id: string, userId: string): Promise<MediaDocument | null> {
  const { data, error } = await supabase.from(tableName).select('*').eq('id', id).eq('user_id', userId).single();
  if (error || !data) return null;
  return toCamelCase(data);
}

export async function saveMediaRecord(media: MediaDocument, userId: string): Promise<MediaDocument> {
  const { data, error } = await supabase.from(tableName).insert([toSnakeCase(media, userId)]).select().single();
  if (error) throw new Error(error.message);
  return toCamelCase(data);
}

export async function updateMediaRecord(
  id: string,
  updates: UpdateMediaRequest,
  userId: string
): Promise<MediaDocument> {
  const existing = await getMediaRecord(id, userId);

  if (!existing) {
    throw new Error("Media record not found.");
  }

  const updated: MediaDocument = {
    ...existing,
    ...updates,
    manualTags: updates.manualTags
      ? dedupeTags(updates.manualTags)
      : existing.manualTags,
    indexedAt: new Date().toISOString()
  };

  const searchIndex = buildSearchIndex({
    title: updated.title,
    description: updated.description,
    manualTags: updated.manualTags,
    aiTags: updated.aiTags,
    fileName: updated.originalFilename ?? updated.publicId
  });

  updated.searchText = searchIndex.text;
  updated.searchTokens = searchIndex.tokens;

  const { data, error } = await supabase.from(tableName).update(toSnakeCase(updated, userId)).eq('id', id).eq('user_id', userId).select().single();
  if (error) throw new Error(error.message);
  return toCamelCase(data);
}

export async function listRecentMedia(limit = 24, userId: string): Promise<MediaDocument[]> {
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .eq('user_id', userId)
    .order('indexed_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data.map(toCamelCase);
}

export async function searchMedia(
  query: string,
  limit = 24,
  userId: string
): Promise<MediaDocument[]> {
  const tokens = tokenizeText(query).slice(0, 10);

  if (tokens.length === 0) {
    return listRecentMedia(limit, userId);
  }

  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .eq('user_id', userId)
    .overlaps('search_tokens', tokens)
    .limit(Math.min(Math.max(limit * 3, 24), 100));

  if (error) throw new Error(error.message);

  const docs = data.map(toCamelCase);

  return docs
    .map((item) => ({
      item,
      score: scoreMediaMatch(item, query)
    }))
    .filter((candidate) => candidate.score > 0)
    .sort((left, right) => {
      if (left.score !== right.score) {
        return right.score - left.score;
      }

      return sortMediaRecords(left.item, right.item);
    })
    .slice(0, limit)
    .map((candidate) => candidate.item);
}

export async function deleteMediaRecord(id: string, userId: string): Promise<void> {
  const { error } = await supabase.from(tableName).delete().eq('id', id).eq('user_id', userId);
  if (error) throw new Error(error.message);
}

export async function deleteFolderMedia(folderName: string, userId: string): Promise<void> {
  const { error } = await supabase.from(tableName).delete().eq('folder', folderName).eq('user_id', userId);
  if (error) throw new Error(error.message);
}

export async function renameFolder(oldName: string, newName: string, userId: string): Promise<void> {
  const { error } = await supabase.from(tableName).update({ folder: newName }).eq('folder', oldName).eq('user_id', userId);
  if (error) throw new Error(error.message);
}
