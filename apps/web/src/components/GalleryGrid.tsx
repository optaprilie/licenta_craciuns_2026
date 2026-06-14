import type { MediaRecord, UpdateMediaDraft } from "../types/media";
import { useState } from "react";

interface GalleryGridProps {
  items: MediaRecord[];
  isLoading: boolean;
  onUpdate?: (id: string, draft: UpdateMediaDraft) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  availableFolders?: string[];
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

import { X } from "lucide-react";

function MediaCard({
  item,
  onUpdate,
  onDelete,
  availableFolders
}: {
  item: MediaRecord;
  onUpdate?: (id: string, draft: UpdateMediaDraft) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  availableFolders?: string[];
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description);
  const [tags, setTags] = useState(item.manualTags.join(", "));
  const [folder, setFolder] = useState(item.folder || "Uncategorized");
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

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
          .filter(Boolean),
        folder: folder === "Uncategorized" ? "" : folder
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
    setFolder(item.folder || "Uncategorized");
    setIsEditing(false);
  }

  async function handleDelete() {
    if (!onDelete) return;
    if (!confirm("Are you sure you want to permanently delete this media file?")) return;
    
    setIsSubmitting(true);
    try {
      await onDelete(item.id);
    } catch (err) {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      {isFullscreen && (
        <div className="modal-overlay" onClick={() => setIsFullscreen(false)} style={{ zIndex: 9999 }}>
          <div className="fullscreen-content" onClick={(e) => e.stopPropagation()} style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
            <button className="close-modal-btn" onClick={() => setIsFullscreen(false)} style={{ top: '-40px', right: '-40px', color: 'white', background: 'rgba(0,0,0,0.5)', padding: '8px', borderRadius: '50%' }}>
              <X size={24} />
            </button>
            {item.resourceType === "video" ? (
              <video controls autoPlay src={item.mediaUrl} style={{ maxWidth: '100%', maxHeight: '90vh', display: 'block' }} />
            ) : (
              <img src={item.mediaUrl} alt={item.title} style={{ maxWidth: '100%', maxHeight: '90vh', display: 'block', objectFit: 'contain' }} />
            )}
          </div>
        </div>
      )}
      <article className="media-card">
        <div className="media-frame" onClick={() => !isEditing && setIsFullscreen(true)} style={{ cursor: isEditing ? 'default' : 'zoom-in' }}>
          {item.resourceType === "video" ? (
            <video
              controls={false}
              preload="metadata"
              poster={item.previewUrl}
              src={item.mediaUrl}
              style={{ pointerEvents: 'none' }}
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
            {availableFolders && availableFolders.length > 0 && (
              <select
                value={folder}
                onChange={(e) => setFolder(e.target.value)}
                className="edit-input"
              >
                {availableFolders.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            )}
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
            {item.description ? (
              <div className="description-container">
                <p className={`media-description ${isDescExpanded ? 'expanded' : 'collapsed'}`}>
                  {item.description}
                </p>
                <button 
                  className="expand-btn" 
                  onClick={() => setIsDescExpanded(!isDescExpanded)}
                  aria-label={isDescExpanded ? "Compress description" : "Expand description"}
                >
                  {isDescExpanded ? "▲" : "▼"}
                </button>
              </div>
            ) : (
              <p className="media-description">No description</p>
            )}

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
                Move / Edit
              </button>
            )}
            {!isEditing && onDelete && (
              <button onClick={handleDelete} className="edit-btn" style={{ color: "var(--danger)" }}>
                Delete
              </button>
            )}
            <span>{item.format?.toUpperCase() ?? "Unknown format"}</span>
          </div>
        </div>
      </div>
    </article>
    </>
  );
}

export function GalleryGrid({ items, isLoading, onUpdate, onDelete, availableFolders }: GalleryGridProps) {
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
          <MediaCard 
            key={item.id} 
            item={item} 
            onUpdate={onUpdate} 
            onDelete={onDelete} 
            availableFolders={availableFolders} 
          />
        ))}
      </div>
    </section>
  );
}
