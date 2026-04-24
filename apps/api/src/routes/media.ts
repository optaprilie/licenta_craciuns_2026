import { Router } from "express";

import type {
  MediaResourceType,
  RegisterMediaRequest
} from "../models/media.js";
import { indexUploadedMedia } from "../services/media-indexer.js";
import {
  listRecentMedia,
  saveMediaRecord,
  searchMedia,
  updateMediaRecord
} from "../services/media-repository.js";

const router = Router();

function isMediaResourceType(value: unknown): value is MediaResourceType {
  return value === "image" || value === "video";
}

function parseRegisterBody(body: unknown): RegisterMediaRequest {
  if (!body || typeof body !== "object") {
    throw new Error("The request body must be an object.");
  }

  const candidate = body as Partial<RegisterMediaRequest>;
  const title = typeof candidate.title === "string" ? candidate.title.trim() : "";
  const description =
    typeof candidate.description === "string" ? candidate.description.trim() : "";
  const publicId =
    typeof candidate.publicId === "string" ? candidate.publicId.trim() : "";
  const manualTags = Array.isArray(candidate.manualTags)
    ? candidate.manualTags.filter((tag): tag is string => typeof tag === "string")
    : [];

  if (!title) {
    throw new Error("A title is required.");
  }

  if (!publicId) {
    throw new Error("A Cloudinary public ID is required.");
  }

  if (!isMediaResourceType(candidate.resourceType)) {
    throw new Error("Only image and video uploads are supported right now.");
  }

  return {
    title,
    description,
    manualTags,
    publicId,
    resourceType: candidate.resourceType
  };
}

router.get("/", async (request, response, next) => {
  try {
    const query = typeof request.query.q === "string" ? request.query.q.trim() : "";
    const limitParam =
      typeof request.query.limit === "string" ? Number(request.query.limit) : 24;
    const limit = Number.isFinite(limitParam)
      ? Math.min(Math.max(limitParam, 1), 50)
      : 24;

    const items = query
      ? await searchMedia(query, limit)
      : await listRecentMedia(limit);

    response.json({
      items
    });
  } catch (error) {
    next(error);
  }
});

router.post("/register", async (request, response, next) => {
  try {
    const payload = parseRegisterBody(request.body);
    const indexedMedia = await indexUploadedMedia(payload);
    const savedMedia = await saveMediaRecord(indexedMedia);

    response.status(201).json({
      item: savedMedia
    });
  } catch (error) {
    if (error instanceof Error) {
      response.status(400).json({
        message: error.message
      });
      return;
    }

    next(error);
  }
});

router.patch("/:id", async (request, response, next) => {
  try {
    const id = request.params.id;
    if (!id) {
      response.status(400).json({ message: "Media ID is required." });
      return;
    }

    const body = request.body || {};
    const updates: Partial<RegisterMediaRequest> = {};

    if (typeof body.title === "string") updates.title = body.title.trim();
    if (typeof body.description === "string") updates.description = body.description.trim();
    if (Array.isArray(body.manualTags)) {
      updates.manualTags = body.manualTags.filter((t: unknown): t is string => typeof t === "string");
    }

    const updatedMedia = await updateMediaRecord(id, updates);

    response.json({
      item: updatedMedia
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Media record not found.") {
      response.status(404).json({ message: error.message });
      return;
    }
    next(error);
  }
});

export { router as mediaRouter };

