import type { FormEvent } from "react";
import { useState } from "react";

import type { UploadDraft } from "../types/media";

interface UploadPanelProps {
  isSubmitting: boolean;
  onSubmit: (draft: UploadDraft) => Promise<void>;
}

function parseTags(value: string): string[] {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function UploadPanel({ isSubmitting, onSubmit }: UploadPanelProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file) {
      setLocalError("Please choose an image or video before uploading");
      return;
    }

    if (!title.trim()) {
      setLocalError("Please add a title for the media item");
      return;
    }

    setLocalError(null);

    await onSubmit({
      title: title.trim(),
      description: description.trim(),
      manualTags: parseTags(tags),
      file
    });

    setTitle("");
    setDescription("");
    setTags("");
    setFile(null);
  }

  return (
    <section className="panel upload-panel">
      <div className="section-heading">
        <p className="eyebrow">Upload</p>
        <h2>Add a new file</h2>
      </div>

      <form
        className="upload-form"
        onSubmit={handleSubmit}
      >
        <label className="field">
          <span>Title</span>
          <input
            type="text"
            value={title}
            placeholder="Your title here..."
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>

        <label className="field">
          <span>Description</span>
          <textarea
            rows={4}
            value={description}
            placeholder="Something about your media file..."
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>

        <label className="field">
          <span>Manual tags</span>
          <input
            type="text"
            value={tags}
            placeholder="reel, meme, family, friends, homework etc..."
            onChange={(event) => setTags(event.target.value)}
          />
        </label>

        <label className="field">
          <span>Media file</span>
          <input
            type="file"
            accept="image/*,video/*"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
        </label>

        {file ? <p className="file-chip">Selected: {file.name}</p> : null}
        {localError ? <p className="error-text">{localError}</p> : null}

        <button
          className="primary-button"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Uploading..." : "Upload"}
        </button>
      </form>
    </section>
  );
}
