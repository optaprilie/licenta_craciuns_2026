import { startTransition, useEffect, useState } from "react";
import { GalleryGrid } from "../components/GalleryGrid";
import { SearchBar } from "../components/SearchBar";
import { fetchMedia, updateMedia } from "../lib/api";
import type { MediaRecord, UpdateMediaDraft } from "../types/media";

export function Favorites() {
  const [items, setItems] = useState<MediaRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadFavorites() {
      setIsLoading(true);
      try {
        const results = await fetchMedia("");
        if (!isActive) return;

        const favorites = results.filter(item => 
          item.manualTags.includes("__favorite__")
        );

        startTransition(() => {
          setItems(favorites);
        });
        setError(null);
      } catch (loadError) {
        if (!isActive) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "The favorites could not be loaded."
        );
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadFavorites();

    return () => {
      isActive = false;
    };
  }, []);

  async function handleUpdate(id: string, draft: UpdateMediaDraft) {
    await updateMedia(id, draft);
    
    setItems((prev) => 
      prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            ...draft,
            manualTags: draft.manualTags ?? item.manualTags
          };
        }
        return item;
      }).filter(item => item.manualTags.includes("__favorite__"))
    );
  }

  const filteredItems = items.filter(item => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (item.searchText && item.searchText.toLowerCase().includes(q)) ||
      (item.title && item.title.toLowerCase().includes(q)) || 
      (item.description && item.description.toLowerCase().includes(q)) ||
      (item.manualTags && item.manualTags.some(t => t.toLowerCase().includes(q))) ||
      (item.aiTags && item.aiTags.some(t => t.toLowerCase().includes(q)))
    );
  });

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1>Favorites</h1>
          <p className="subtitle">Your starred media</p>
        </div>
        <div className="header-actions" style={{ flexGrow: 1, justifyContent: 'flex-end' }}>
          <SearchBar 
            query={searchQuery}
            onQueryChange={setSearchQuery}
            isLoading={isLoading}
            placeholder="Search favorites..."
          />
        </div>
      </header>
      
      {error && <div className="error-message">{error}</div>}

      <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr', height: '100%', overflowY: 'auto' }}>
        {!isLoading && filteredItems.length === 0 ? (
          <div className="panel" style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ color: 'var(--text-muted)' }}>No favorites found.</p>
            <p className="subtitle">Try a different search query or add more favorites.</p>
          </div>
        ) : (
          <GalleryGrid
            items={filteredItems}
            isLoading={isLoading}
            onUpdate={handleUpdate}
          />
        )}
      </div>
    </div>
  );
}
