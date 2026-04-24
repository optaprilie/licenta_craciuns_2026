import type { MediaRecord, UpdateMediaDraft } from "../types/media";
import { useState } from "react";

interface GalleryGridProps {
  items: MediaRecord[];
  isLoading: boolean;
  onUpdate?: (id: string, draft: UpdateMediaDraft) => Promise<void>;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("ro-RO", {
    dateStyle: "medium"
  }).format(new Date(value));
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) {
    return "Unknown size";
  }

  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(size >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}

function MediaCard({
  item,
  onUpdate
}: {
  item: MediaRecord;
  onUpdate?: (id: string, draft: UpdateMediaDraft) => Promise<void>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description);
  const [tags, setTags] = useState(item.manualTags.join(", "));

  async function handleSave() {
    if (!onUpdate) return;
    setIsSubmitting(true);
    try {
      await onUpdate(item.id, {
        title,
        description,
        manualTags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      });
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      alert("Failed to update.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleCancel() {
    setTitle(item.title);
    setDescription(item.description);
    setTags(item.manualTags.join(", "));
    setIsEditing(false);
  }

  return (
    <article className="media-card">
      <div className="media-frame">
        {item.resourceType === "video" ? (
          <video
            controls
            preload="metadata"
            poster={item.previewUrl}
            src={item.mediaUrl}
          />
        ) : (
          <img
            src={item.mediaUrl}
            alt={item.title}
          />
        )}
      </div>

      <div className="media-content">
        <div className="media-meta-row">
          <span className="media-type">{item.resourceType}</span>
          <span>{formatDate(item.createdAt)}</span>
        </div>

        {isEditing ? (
          <div className="edit-form">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              className="edit-input"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description"
              rows={2}
              className="edit-input"
            />
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Tags (comma separated)"
              className="edit-input"
            />
            <div className="edit-actions">
              <button onClick={handleSave} disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save"}
              </button>
              <button onClick={handleCancel} disabled={isSubmitting} className="cancel-btn">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <h3>{item.title}</h3>
            <p>{item.description || "No description"}</p>

            <div className="tag-list">
              {item.manualTags.map((tag) => (
                <span
                  className="tag manual-tag"
                  key={`manual-${item.id}-${tag}`}
                >
                  {tag}
                </span>
              ))}
              {item.aiTags.map((tag) => (
                <span
                  className="tag ai-tag"
                  key={`ai-${item.id}-${tag}`}
                >
                  {tag}
                </span>
              ))}
            </div>
          </>
        )}

        <div className="media-footer">
          <span>{formatFileSize(item.bytes)}</span>
          <div className="media-actions">
            {!isEditing && onUpdate && (
              <button onClick={() => setIsEditing(true)} className="edit-btn">
                Edit
              </button>
            )}
            <span>{item.format?.toUpperCase() ?? "Unknown format"}</span>
          </div>
        </div>
      </div>
    </article>
  );
}

export function GalleryGrid({ items, isLoading, onUpdate }: GalleryGridProps) {
  if (isLoading) {
    return (
      <section className="panel gallery-panel">
        <div className="section-heading">
          <p className="eyebrow">Gallery</p>
          <h2>Loading indexed media</h2>
        </div>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="panel gallery-panel">
        <div className="section-heading">
          <p className="eyebrow">Gallery</p>
          <h2>No media matched this search</h2>
        </div>
        <p className="muted-text">
          Try again
        </p>
      </section>
    );
  }

  return (
    <section className="panel gallery-panel">
      <div className="section-heading">
        <p className="eyebrow">Gallery</p>
        <h2>{items.length} indexed result{items.length === 1 ? "" : "s"}</h2>
      </div>

      <div className="gallery-grid">
        {items.map((item) => (
          <MediaCard key={item.id} item={item} onUpdate={onUpdate} />
        ))}
      </div>
    </section>
  );
}
