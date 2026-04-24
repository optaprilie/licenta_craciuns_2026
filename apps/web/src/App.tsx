import { startTransition, useDeferredValue, useEffect, useState } from "react";

import { GalleryGrid } from "./components/GalleryGrid";
import { SearchBar } from "./components/SearchBar";
import { UploadPanel } from "./components/UploadPanel";
import {
  createUploadSignature,
  fetchMedia,
  registerMediaUpload,
  uploadFileToCloudinary
} from "./lib/api";
import type { MediaRecord, UploadDraft } from "./types/media";

function App() {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [items, setItems] = useState<MediaRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  async function handleUpload(draft: UploadDraft) {
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const signature = await createUploadSignature();
      const uploadedMedia = await uploadFileToCloudinary(draft.file, signature);
      const savedMedia = await registerMediaUpload(draft, uploadedMedia);

      setSuccessMessage(`"${savedMedia.title}" was uploaded and indexed successfully.`);
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

  async function handleUpdate(id: string, draft: import("./types/media").UpdateMediaDraft) {
    try {
      const { updateMedia } = await import("./lib/api");
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
    <main className="page-shell">
      <div className="page-background" />

      <section className="hero-card">
        <p className="eyebrow">Bachelor thesis project</p>
        <h2>Photo and Media Album with AI Sorting</h2>
        <p className="hero-copy">
          Lorem ipsum dolor sit amet consectetur, adipisicing elit. Culpa, praesentium quod nesciunt cumque, voluptas, minus sunt amet eos enim veritatis mollitia neque distinctio aliquid. Beatae aspernatur velit pariatur omnis repudiandae.
        </p>

        <div className="stats-row">
          <div className="stat-card">
            <span className="stat-value">{items.length}</span>
            <span className="stat-label">Visible results</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{images}</span>
            <span className="stat-label">Images</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{videos}</span>
            <span className="stat-label">Videos</span>
          </div>
        </div>
      </section>

      {error ? <p className="banner error-banner">{error}</p> : null}
      {successMessage ? <p className="banner success-banner">{successMessage}</p> : null}

      <section className="workspace-grid">
        <div className="left-column">
          <SearchBar
            query={query}
            onQueryChange={setQuery}
            isLoading={isLoading}
          />
          <GalleryGrid
            items={items}
            isLoading={isLoading}
            onUpdate={handleUpdate}
          />
        </div>

        <div className="right-column">
          <UploadPanel
            isSubmitting={isSubmitting}
            onSubmit={handleUpload}
          />
        </div>
      </section>
    </main>
  );
}

export default App;
