import type { MediaDocument } from "../models/media.js";

const tokenSplitPattern = /[^\p{L}\p{N}]+/gu;

export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

export function tokenizeText(value: string): string[] {
  return Array.from(
    new Set(
      normalizeText(value)
        .split(tokenSplitPattern)
        .map((token) => token.trim())
        .filter((token) => token.length > 1)
    )
  );
}

export function generatePrefixes(tokens: string[], minLength = 2): string[] {
  const prefixes = new Set<string>();
  for (const token of tokens) {
    for (let i = minLength; i <= token.length; i++) {
      prefixes.add(token.slice(0, i));
    }
  }
  return Array.from(prefixes);
}

export function dedupeTags(tags: string[]): string[] {
  return Array.from(
    new Set(
      tags
        .map((tag) => normalizeText(tag))
        .filter((tag) => tag.length > 0)
    )
  );
}

export function buildSearchIndex(input: {
  title: string;
  description: string;
  manualTags: string[];
  aiTags: string[];
  fileName?: string | null;
}) {
  const rawText = [
    input.title,
    input.description,
    input.fileName ?? "",
    ...input.manualTags,
    ...input.aiTags
  ]
    .filter(Boolean)
    .join(" ");

  const baseTokens = tokenizeText(rawText);
  const prefixTokens = generatePrefixes(baseTokens, 2);

  return {
    text: normalizeText(rawText),
    tokens: prefixTokens
  };
}

export function scoreMediaMatch(item: MediaDocument, query: string): number {
  const normalizedQuery = normalizeText(query);
  const queryTokens = tokenizeText(query);

  if (!normalizedQuery || queryTokens.length === 0) {
    return 0;
  }

  let score = 0;
  const title = normalizeText(item.title);
  const description = normalizeText(item.description);
  const manualTags = new Set(item.manualTags);
  const aiTags = new Set(item.aiTags);
  const searchTokens = new Set(item.searchTokens);

  if (title.includes(normalizedQuery)) {
    score += 8;
  }

  if (description.includes(normalizedQuery)) {
    score += 4;
  }

  for (const token of queryTokens) {
    let matchedManual = false;
    for (const tag of manualTags) {
      if (tag.includes(token)) matchedManual = true;
    }
    if (matchedManual) {
      score += 5;
    }

    let matchedAi = false;
    for (const tag of aiTags) {
      if (tag.includes(token)) matchedAi = true;
    }
    if (matchedAi) {
      score += 6;
    }

    if (searchTokens.has(token)) {
      score += 1;
    }
  }

  return score;
}

