import type { FormEvent } from "react";
import { useState } from "react";

import type { UploadDraft } from "../types/media";

interface UploadPanelProps {
  isSubmitting: boolean;
  onSubmit: (drafts: UploadDraft[]) => Promise<void>;
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
  const [folder, setFolder] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (files.length === 0) {
      setLocalError("Please choose at least one image or video before uploading");
      return;
    }

    setLocalError(null);

    const drafts = files.map(file => ({
      title: title.trim(),
      description: description.trim(),
      manualTags: parseTags(tags),
      folder: folder.trim(),
      file
    }));

    await onSubmit(drafts);

    setTitle("");
    setDescription("");
    setTags("");
    setFolder("");
    setFiles([]);
  }

  return (
    <section className="panel upload-panel">
      <div className="section-heading">
        <p className="eyebrow">Upload</p>
        <h2>Add new files</h2>
      </div>

      <form
        className="upload-form"
        onSubmit={handleSubmit}
      >
        <label className="field">
          <span>Title (Optional)</span>
          <input
            type="text"
            value={title}
            placeholder="AI will generate this if left empty"
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>

        <label className="field">
          <span>Description (Optional)</span>
          <textarea
            rows={4}
            value={description}
            placeholder="AI will generate this if left empty"
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>

        <label className="field">
          <span>Manual tags (Optional)</span>
          <input
            type="text"
            value={tags}
            placeholder="reel, meme, family, friends, homework etc..."
            onChange={(event) => setTags(event.target.value)}
          />
        </label>

        <label className="field">
          <span>Folder (Optional)</span>
          <input
            type="text"
            value={folder}
            placeholder="AI will categorize this if left empty"
            onChange={(event) => setFolder(event.target.value)}
          />
        </label>

        <label className="field">
          <span>Media files</span>
          <input
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={(event) => setFiles(Array.from(event.target.files || []))}
          />
        </label>

        {files.length > 0 ? (
          <p className="file-chip">Selected: {files.length} file(s)</p>
        ) : null}
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
