import { useEffect, useState, startTransition } from "react";
import { Folder, Plus, Trash2, Edit2, Check, X, ArrowLeft, Image as ImageIcon } from "lucide-react";
import { GalleryGrid } from "../components/GalleryGrid";
import { SearchBar } from "../components/SearchBar";
import { fetchMedia, deleteFolder, renameFolderApi } from "../lib/api";
import type { MediaRecord } from "../types/media";

export function Library() {
  const [items, setItems] = useState<MediaRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customFolders, setCustomFolders] = useState<string[]>([]);
  const [folderDescriptions, setFolderDescriptions] = useState<Record<string, string>>({});
  
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [editFolderName, setEditFolderName] = useState("");
  const [editFolderDesc, setEditFolderDesc] = useState("");
  const [isSavingFolder, setIsSavingFolder] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("customFolders");
    if (saved) {
      try { setCustomFolders(JSON.parse(saved)); } catch (e) {}
    }
    const savedDesc = localStorage.getItem("folderDescriptions");
    if (savedDesc) {
      try { setFolderDescriptions(JSON.parse(savedDesc)); } catch (e) {}
    }
  }, []);

  useEffect(() => {
    let isActive = true;

    async function loadMedia() {
      setIsLoading(true);

      try {
        const results = await fetchMedia("");

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
            : "The library could not be loaded."
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
  }, []);

  async function handleUpdate(id: string, draft: import("../types/media").UpdateMediaDraft) {
    try {
      const { updateMedia } = await import("../lib/api");
      const updatedMedia = await updateMedia(id, draft);
      
      startTransition(() => {
        setItems(prev => prev.map(item => item.id === id ? updatedMedia : item));
      });
    } catch (updateError) {
      console.error(updateError);
      alert("Failed to update media.");
    }
  }

  async function handleDeleteMedia(id: string) {
    try {
      const { deleteMedia } = await import("../lib/api");
      await deleteMedia(id);
      startTransition(() => {
        setItems(prev => prev.filter(item => item.id !== id));
      });
    } catch (deleteError) {
      console.error(deleteError);
      alert("Failed to delete media.");
    }
  }

  async function handleDeleteFolder(folderName: string) {
    if (!confirm(`Are you sure you want to delete "${folderName}"? All media inside will be permanently deleted.`)) {
      return;
    }
    
    try {
      await deleteFolder(folderName);
      
      startTransition(() => {
        setItems(prev => prev.filter(item => (item.folder || "Uncategorized") !== folderName));
        const newCustom = customFolders.filter(f => f !== folderName);
        setCustomFolders(newCustom);
        localStorage.setItem("customFolders", JSON.stringify(newCustom));
        
        const newDesc = { ...folderDescriptions };
        delete newDesc[folderName];
        setFolderDescriptions(newDesc);
        localStorage.setItem("folderDescriptions", JSON.stringify(newDesc));
      });
    } catch (err) {
      console.error(err);
      alert("Failed to delete folder.");
    }
  }

  function handleNewFolder() {
    const name = prompt("Enter new folder name:");
    if (!name || !name.trim()) return;
    
    const folderName = name.trim();
    if (!customFolders.includes(folderName)) {
      const newCustom = [...customFolders, folderName];
      setCustomFolders(newCustom);
      localStorage.setItem("customFolders", JSON.stringify(newCustom));
    }
  }

  function startEditingFolder(folderName: string) {
    setEditingFolder(folderName);
    setEditFolderName(folderName);
    setEditFolderDesc(folderDescriptions[folderName] || "");
  }

  async function saveFolderEdit(oldName: string) {
    const newName = editFolderName.trim();
    if (!newName) {
      alert("Folder name cannot be empty.");
      return;
    }

    setIsSavingFolder(true);
    try {
      if (newName !== oldName) {
        await renameFolderApi(oldName, newName);
      }

      startTransition(() => {
        if (newName !== oldName) {
          // Update items
          setItems(prev => prev.map(item => {
            const currentFolder = item.folder || "Uncategorized";
            if (currentFolder === oldName) {
              return { ...item, folder: newName };
            }
            return item;
          }));

          // Update custom folders
          const newCustom = customFolders.filter(f => f !== oldName);
          if (!newCustom.includes(newName) && newName !== "Uncategorized") {
            newCustom.push(newName);
          }
          setCustomFolders(newCustom);
          localStorage.setItem("customFolders", JSON.stringify(newCustom));
        }

        // Update descriptions mapping (whether name changed or not)
        const newDesc = { ...folderDescriptions };
        if (newName !== oldName) {
          delete newDesc[oldName];
        }
        if (editFolderDesc.trim()) {
          newDesc[newName] = editFolderDesc.trim();
        } else {
          delete newDesc[newName];
        }
        setFolderDescriptions(newDesc);
        localStorage.setItem("folderDescriptions", JSON.stringify(newDesc));
        
        setEditingFolder(null);
      });
    } catch (err) {
      console.error(err);
      alert("Failed to save folder details.");
    } finally {
      setIsSavingFolder(false);
    }
  }

  // Group items by folder
  const groupedItems = items.reduce<Record<string, MediaRecord[]>>((acc, item) => {
    const folder = item.folder || "Uncategorized";
    if (!acc[folder]) {
      acc[folder] = [];
    }
    acc[folder].push(item);
    return acc;
  }, {});

  const foldersSet = new Set([...Object.keys(groupedItems), ...customFolders]);
  const folders = Array.from(foldersSet)
    .sort()
    .filter(f => f.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          {activeFolder ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button 
                onClick={() => {
                  setActiveFolder(null);
                  setSearchQuery("");
                }}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-main)',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <ArrowLeft size={18} />
              </button>
              <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                {activeFolder}
              </h1>
            </div>
          ) : (
            <>
              <h1>Library</h1>
              <p className="subtitle">Your organized media</p>
            </>
          )}
        </div>
        <div className="header-actions" style={{ flexGrow: 1, justifyContent: 'flex-end' }}>
          <SearchBar 
            query={searchQuery}
            onQueryChange={setSearchQuery}
            isLoading={isLoading}
            placeholder={activeFolder ? `Search in ${activeFolder}...` : "Search albums..."}
          />
          {!activeFolder && (
            <button 
              className="primary-button icon-button"
              onClick={handleNewFolder}
              style={{ whiteSpace: 'nowrap' }}
            >
              <Plus size={20} />
              <span>New Album</span>
            </button>
          )}
        </div>
      </header>

      {error ? <p className="banner error-banner">{error}</p> : null}

      {isLoading ? (
        <section className="panel gallery-panel">
          <div className="section-heading">
            <p className="eyebrow">Library</p>
            <h2>Loading folders...</h2>
          </div>
        </section>
      ) : activeFolder ? (
        // --- ALBUM DETAILS VIEW ---
        <div className="folder-section" style={{ marginTop: '0' }}>
          {folderDescriptions[activeFolder] && (
            <p className="muted-text" style={{ marginBottom: '24px', fontSize: '1rem' }}>
              {folderDescriptions[activeFolder]}
            </p>
          )}
          {(() => {
            const folderItems = (groupedItems[activeFolder] || []).filter(item => {
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

            return folderItems.length > 0 ? (
              <GalleryGrid
                items={folderItems}
                isLoading={false}
                onUpdate={handleUpdate}
                onDelete={handleDeleteMedia}
                availableFolders={Array.from(foldersSet)}
              />
            ) : (
              <div className="placeholder-content">
                <ImageIcon size={48} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
                <h3>This album is empty</h3>
                <p>Upload photos and assign them to this album to see them here.</p>
              </div>
            );
          })()}
        </div>
      ) : folders.length === 0 ? (
        <section className="panel gallery-panel">
          <div className="section-heading">
            <p className="eyebrow">Library</p>
            <h2>No albums found</h2>
          </div>
          <p className="muted-text">Upload some media or create a new album to see them organized here.</p>
        </section>
      ) : (
        // --- ALBUMS OVERVIEW GRID ---
        <div className="album-grid">
          {folders.map((folder) => {
            const folderItems = groupedItems[folder] || [];
            const previews = folderItems.slice(0, 4);
            const isEditing = editingFolder === folder;

            return (
              <div 
                key={folder} 
                className="album-card"
                onClick={() => {
                  if (!isEditing) {
                    setActiveFolder(folder);
                    setSearchQuery("");
                  }
                }}
              >
                <div className="album-preview-container">
                  <div className="album-preview-grid">
                    {previews.length > 0 ? (
                      previews.map((item, idx) => (
                        item.resourceType === 'video' ? (
                          <video 
                            key={idx} 
                            src={item.mediaUrl} 
                            className="album-preview-item" 
                            muted playsInline 
                            style={{ 
                              gridColumn: previews.length === 1 ? '1 / span 2' : 'auto',
                              gridRow: previews.length === 1 ? '1 / span 2' : (previews.length === 2 ? '1 / span 2' : 'auto')
                            }}
                          />
                        ) : (
                          <img 
                            key={idx} 
                            src={item.mediaUrl} 
                            alt={item.title || "Preview"} 
                            className="album-preview-item"
                            style={{ 
                              gridColumn: previews.length === 1 ? '1 / span 2' : 'auto',
                              gridRow: previews.length === 1 ? '1 / span 2' : (previews.length === 2 ? '1 / span 2' : 'auto')
                            }}
                          />
                        )
                      ))
                    ) : (
                      <div className="album-preview-empty" style={{ gridColumn: '1 / span 2', gridRow: '1 / span 2' }}>
                        <ImageIcon size={32} opacity={0.3} />
                      </div>
                    )}
                  </div>
                </div>

                <div className="album-info" onClick={(e) => isEditing && e.stopPropagation()}>
                  {isEditing ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", flexGrow: 1 }}>
                      <input 
                        type="text" 
                        value={editFolderName} 
                        onChange={e => setEditFolderName(e.target.value)} 
                        className="edit-input" 
                        placeholder="Folder name"
                        style={{ fontSize: "1rem", fontWeight: "bold" }}
                        autoFocus
                      />
                      <textarea 
                        value={editFolderDesc} 
                        onChange={e => setEditFolderDesc(e.target.value)} 
                        className="edit-input" 
                        placeholder="Folder description (optional)"
                        rows={2}
                      />
                      <div className="album-actions" style={{ marginTop: '4px' }}>
                        <button 
                          className="icon-button"
                          style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "4px" }}
                          onClick={(e) => { e.stopPropagation(); setEditingFolder(null); }}
                          disabled={isSavingFolder}
                        >
                          <X size={18} />
                        </button>
                        <button 
                          className="icon-button"
                          style={{ background: "transparent", border: "none", color: "var(--success)", cursor: "pointer", padding: "4px" }}
                          onClick={(e) => { e.stopPropagation(); saveFolderEdit(folder); }}
                          disabled={isSavingFolder}
                        >
                          <Check size={18} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="album-header">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: 0 }}>
                          <h3 className="album-title" title={folder}>{folder}</h3>
                          <span className="album-count">
                            {folderItems.length} {folderItems.length === 1 ? 'item' : 'items'}
                          </span>
                        </div>
                      </div>
                      
                      {folderDescriptions[folder] && (
                        <p className="album-desc" title={folderDescriptions[folder]}>
                          {folderDescriptions[folder]}
                        </p>
                      )}

                      <div className="album-actions" onClick={(e) => e.stopPropagation()}>
                        <button 
                          className="icon-button"
                          style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "4px" }}
                          onClick={() => startEditingFolder(folder)}
                          title="Rename/Edit Album"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          className="icon-button"
                          style={{ background: "transparent", border: "none", color: "var(--danger)", cursor: "pointer", padding: "4px" }}
                          onClick={() => handleDeleteFolder(folder)}
                          title="Delete Album"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
