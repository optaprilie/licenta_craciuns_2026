import { env } from "../config/env.js";
import { db } from "../lib/firebase.js";
import type { MediaDocument, UpdateMediaRequest } from "../models/media.js";
import {
  buildSearchIndex,
  dedupeTags,
  scoreMediaMatch,
  tokenizeText
} from "./search-tokenizer.js";

const mediaCollection = db.collection(env.firestore.collectionName);

function sortMediaRecords(a: MediaDocument, b: MediaDocument): number {
  return b.indexedAt.localeCompare(a.indexedAt);
}

export async function getMediaRecord(id: string): Promise<MediaDocument | null> {
  const doc = await mediaCollection.doc(id).get();
  return doc.exists ? (doc.data() as MediaDocument) : null;
}

export async function saveMediaRecord(media: MediaDocument): Promise<MediaDocument> {
  await mediaCollection.doc(media.id).set(media);
  return media;
}

export async function updateMediaRecord(
  id: string,
  updates: UpdateMediaRequest
): Promise<MediaDocument> {
  const existing = await getMediaRecord(id);

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

  await mediaCollection.doc(id).set(updated);
  return updated;
}

export async function listRecentMedia(limit = 24): Promise<MediaDocument[]> {
  const snapshot = await mediaCollection
    .orderBy("indexedAt", "desc")
    .limit(limit)
    .get();

  return snapshot.docs.map((doc) => doc.data() as MediaDocument);
}

export async function searchMedia(
  query: string,
  limit = 24
): Promise<MediaDocument[]> {
  const tokens = tokenizeText(query).slice(0, 10);

  if (tokens.length === 0) {
    return listRecentMedia(limit);
  }

  const snapshot = await mediaCollection
    .where("searchTokens", "array-contains-any", tokens)
    .limit(Math.min(Math.max(limit * 3, 24), 100))
    .get();

  return snapshot.docs
    .map((doc) => doc.data() as MediaDocument)
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
