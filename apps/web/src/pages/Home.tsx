import { startTransition, useDeferredValue, useEffect, useState } from "react";
import { Plus, X } from "lucide-react";

import { GalleryGrid } from "../components/GalleryGrid";
import { SearchBar } from "../components/SearchBar";
import { UploadPanel } from "../components/UploadPanel";
import {
  createUploadSignature,
  fetchMedia,
  registerMediaUpload,
  uploadFileToCloudinary
} from "../lib/api";
import type { MediaRecord, UploadDraft } from "../types/media";

export function Home() {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [items, setItems] = useState<MediaRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function loadMedia() {
      setIsLoading(true);

      try {
        const results = await fetchMedia(deferredQuery);

        if (!isActive) {
          return;
        }

        startTransition(() => {
          setItems(results);
        });
        setError(null);
      } catch (loadError) {
        if (!isActive) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "The gallery could not be loaded."
        );
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadMedia();

    return () => {
      isActive = false;
    };
  }, [deferredQuery]);

  const images = items.filter((item) => item.resourceType === "image").length;
  const videos = items.length - images;

  async function handleUpload(drafts: UploadDraft[]) {
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const signature = await createUploadSignature();
      let count = 0;
      for (const draft of drafts) {
        const uploadedMedia = await uploadFileToCloudinary(draft.file, signature);
        await registerMediaUpload(draft, uploadedMedia);
        count++;
      }

      setSuccessMessage(`${count} file(s) uploaded and indexed successfully.`);
      setIsUploadModalOpen(false); // Close modal on success
      const refreshedItems = await fetchMedia("");

      startTransition(() => {
        setItems(refreshedItems);
      });
      setQuery("");
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "The upload flow failed."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdate(id: string, draft: import("../types/media").UpdateMediaDraft) {
    try {
      const { updateMedia } = await import("../lib/api");
      const updatedMedia = await updateMedia(id, draft);
      
      startTransition(() => {
        setItems(prev => prev.map(item => item.id === id ? updatedMedia : item));
      });
      setSuccessMessage(`"${updatedMedia.title}" was updated successfully.`);
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "The update failed."
      );
    }
  }

  return (
    <div className="page-container">
      <header className="page-header" style={{ justifyContent: 'center', width: '100%' }}>
        <div className="header-actions" style={{ width: '100%', maxWidth: '600px', display: 'flex', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <SearchBar
              query={query}
              onQueryChange={setQuery}
              isLoading={isLoading}
            />
          </div>
          <button 
            className="primary-button icon-button"
            onClick={() => setIsUploadModalOpen(true)}
            style={{ whiteSpace: 'nowrap' }}
          >
            <Plus size={20} />
            <span>Upload</span>
          </button>
        </div>
      </header>

      {error ? <p className="banner error-banner">{error}</p> : null}
      {successMessage ? <p className="banner success-banner">{successMessage}</p> : null}

      <div className="gallery-container">
        <GalleryGrid
          items={items}
          isLoading={isLoading}
          onUpdate={handleUpdate}
          onDelete={async (id) => {
            try {
              const { deleteMedia } = await import("../lib/api");
              await deleteMedia(id);
              startTransition(() => {
                setItems(prev => prev.filter(item => item.id !== id));
              });
            } catch (err) {
              console.error(err);
              alert("Failed to delete media.");
            }
          }}
          availableFolders={Array.from(new Set([
            ...items.map(i => i.folder || "Uncategorized"),
            ...(() => {
              try { return JSON.parse(localStorage.getItem("customFolders") || "[]"); }
              catch { return []; }
            })()
          ])).sort()}
        />
      </div>

      {isUploadModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button 
              className="close-modal-btn"
              onClick={() => setIsUploadModalOpen(false)}
            >
              <X size={20} />
            </button>
            <UploadPanel
              isSubmitting={isSubmitting}
              onSubmit={handleUpload}
            />
          </div>
        </div>
      )}
    </div>
  );
}
