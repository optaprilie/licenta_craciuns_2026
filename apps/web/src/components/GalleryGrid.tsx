import type { MediaRecord, UpdateMediaDraft } from "../types/media";
import { useState, useEffect, useCallback } from "react";
import { X, Save, Edit2, Folder, Trash2, Maximize2, Tag, Wand2, Star, Check, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize } from "lucide-react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

interface GalleryGridProps {
  items: MediaRecord[];
  isLoading: boolean;
  onUpdate?: (id: string, draft: UpdateMediaDraft) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  availableFolders?: string[];
  assignModeContext?: string | null;
  onAssignToggle?: (item: MediaRecord) => Promise<void>;
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
  onUpdate,
  onDelete,
  availableFolders,
  assignModeContext,
  onAssignToggle,
  onOpenFullscreen
}: {
  item: MediaRecord;
  onUpdate?: (id: string, draft: UpdateMediaDraft) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  availableFolders?: string[];
  assignModeContext?: string | null;
  onAssignToggle?: (item: MediaRecord) => Promise<void>;
  onOpenFullscreen?: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description);
  const [tags, setTags] = useState(item.manualTags.filter(t => t !== "__favorite__").join(", "));
  const [folder, setFolder] = useState(item.folder || "Uncategorized");
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [isTagsExpanded, setIsTagsExpanded] = useState(false);

  async function handleSave() {
    if (!onUpdate) return;
    setIsSubmitting(true);
    try {
      await onUpdate(item.id, {
        title,
        description,
        manualTags: (() => {
          const parsedTags = tags.split(",").map((t) => t.trim()).filter(Boolean);
          if (item.manualTags.includes("__favorite__")) parsedTags.push("__favorite__");
          return parsedTags;
        })(),
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
    setTags(item.manualTags.filter(t => t !== "__favorite__").join(", "));
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

  async function handleFavorite(e: React.MouseEvent) {
    e.stopPropagation();
    if (!onUpdate) return;
    const isFav = item.manualTags.includes("__favorite__");
    const newTags = isFav 
      ? item.manualTags.filter(t => t !== "__favorite__") 
      : [...item.manualTags, "__favorite__"];
      
    try {
      await onUpdate(item.id, { 
        manualTags: newTags,
        title: item.title,
        description: item.description
      });
    } catch (err) {
      console.error(err);
      alert("Failed to update favorite status.");
    }
  }

  const isFavorite = item.manualTags.includes("__favorite__");

  return (
    <>
      <article className={`media-card ${assignModeContext ? (item.manualTags.some(t => t.toLowerCase() === assignModeContext.toLowerCase()) ? 'assigned' : '') : ''}`}>
        <div  
          className="media-frame" 
          onClick={(e) => {
            if (assignModeContext && onAssignToggle) {
              e.preventDefault();
              onAssignToggle(item);
            } else if (!isEditing) {
              onOpenFullscreen?.();
            }
          }} 
          style={{ cursor: assignModeContext ? 'pointer' : (isEditing ? 'default' : 'zoom-in') }}
        >
          {assignModeContext && (
            <div style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              zIndex: 10,
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: item.manualTags.some(t => t.toLowerCase() === assignModeContext.toLowerCase()) ? 'var(--primary)' : 'rgba(0,0,0,0.5)',
              border: '2px solid white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
            }}>
              {item.manualTags.some(t => t.toLowerCase() === assignModeContext.toLowerCase()) && <Check size={14} strokeWidth={3} />}
            </div>
          )}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>{formatDate(item.createdAt)}</span>
            {onUpdate && !isEditing && (
              <button 
                onClick={handleFavorite} 
                className="favorite-btn" 
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer', 
                  padding: '2px', 
                  display: 'flex', 
                  alignItems: 'center',
                  color: isFavorite ? '#FACC15' : 'var(--text-muted)'
                }}
                title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
              >
                <Star size={16} fill={isFavorite ? "#FACC15" : "none"} />
              </button>
            )}
          </div>
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

            {(() => {
              const allTags = [
                ...item.manualTags.filter(t => t !== "__favorite__").map(tag => ({ text: tag, type: 'manual' })),
                ...item.aiTags.map(tag => ({ text: tag, type: 'ai' }))
              ];
              if (allTags.length === 0) return null;
              
              const visibleTags = isTagsExpanded ? allTags : allTags.slice(0, 5);
              const hasMore = allTags.length > 5;

              return (
                <div className="tag-list" style={{ alignItems: 'center' }}>
                  {visibleTags.map((tag, i) => (
                    <span
                      className={`tag ${tag.type}-tag`}
                      key={`${tag.type}-${item.id}-${tag.text}-${i}`}
                    >
                      {tag.text}
                    </span>
                  ))}
                  {hasMore && (
                    <button 
                      className="expand-btn" 
                      onClick={() => setIsTagsExpanded(!isTagsExpanded)}
                      style={{ margin: 0, padding: '4px', height: 'fit-content' }}
                      title={isTagsExpanded ? "Show fewer tags" : "Show more tags"}
                    >
                      {isTagsExpanded ? "▲" : `+${allTags.length - 5} ▼`}
                    </button>
                  )}
                </div>
              );
            })()}
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

export function GalleryGrid({ 
  items, 
  isLoading, 
  onUpdate, 
  onDelete, 
  availableFolders,
  assignModeContext,
  onAssignToggle
}: GalleryGridProps) {
  const density = localStorage.getItem("gridDensity") || "comfortable";
  const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null);

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

      <div className={`gallery-grid density-${density}`}>
        {items.map((item, index) => (
          <MediaCard 
            key={item.id} 
            item={item} 
            onUpdate={onUpdate} 
            onDelete={onDelete} 
            availableFolders={availableFolders} 
            assignModeContext={assignModeContext}
            onAssignToggle={onAssignToggle}
            onOpenFullscreen={() => setFullscreenIndex(index)}
          />
        ))}
      </div>

      {fullscreenIndex !== null && (
        <FullscreenViewer 
          items={items} 
          initialIndex={fullscreenIndex} 
          onClose={() => setFullscreenIndex(null)} 
        />
      )}
    </section>
  );
}

function FullscreenViewer({ items, initialIndex, onClose }: { items: MediaRecord[], initialIndex: number, onClose: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const handleNext = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (currentIndex < items.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex, items.length]);

  const handlePrev = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, onClose]);

  const item = items[currentIndex];
  if (!item) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.95)' }}>
      <button className="close-modal-btn" onClick={onClose} style={{ position: 'absolute', top: '24px', right: '24px', color: 'white', background: 'rgba(0,0,0,0.5)', padding: '8px', borderRadius: '50%', zIndex: 10000, border: 'none', cursor: 'pointer' }}>
        <X size={24} />
      </button>

      {currentIndex > 0 && (
        <button onClick={handlePrev} style={{ position: 'absolute', left: '24px', color: 'white', background: 'rgba(0,0,0,0.5)', padding: '12px', borderRadius: '50%', border: 'none', cursor: 'pointer', zIndex: 10000 }}>
          <ChevronLeft size={32} />
        </button>
      )}

      <div className="fullscreen-content" onClick={(e) => e.stopPropagation()} style={{ position: 'relative', width: '80vw', height: '90vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {item.resourceType === "video" ? (
          <video controls autoPlay src={item.mediaUrl} style={{ maxWidth: '100%', maxHeight: '90vh', display: 'block', objectFit: 'contain' }} />
        ) : (
          <TransformWrapper
            initialScale={1}
            minScale={0.5}
            maxScale={8}
            centerOnInit
            wheel={{ step: 0.1 }}
          >
            {({ zoomIn, zoomOut, resetTransform, ...rest }) => (
              <>
                <div className="zoom-controls" style={{ position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '12px', background: 'rgba(0,0,0,0.6)', padding: '8px', borderRadius: '12px', zIndex: 10000 }}>
                  <button onClick={() => zoomOut()} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Zoom Out"><ZoomOut size={20} /></button>
                  <button onClick={() => resetTransform()} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Reset Zoom"><Maximize size={20} /></button>
                  <button onClick={() => zoomIn()} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Zoom In"><ZoomIn size={20} /></button>
                </div>
                <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }} contentStyle={{ width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
                  <img src={item.mediaUrl} alt={item.title} style={{ maxWidth: '100%', maxHeight: '100%', display: 'block', objectFit: 'contain' }} />
                </TransformComponent>
              </>
            )}
          </TransformWrapper>
        )}
      </div>

      {currentIndex < items.length - 1 && (
        <button onClick={handleNext} style={{ position: 'absolute', right: '24px', color: 'white', background: 'rgba(0,0,0,0.5)', padding: '12px', borderRadius: '50%', border: 'none', cursor: 'pointer', zIndex: 10000 }}>
          <ChevronRight size={32} />
        </button>
      )}
    </div>
  );
}
