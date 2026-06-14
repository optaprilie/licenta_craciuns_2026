import { useEffect, useState, startTransition } from "react";
import { Folder, Plus, Trash2, Edit2, Check, X } from "lucide-react";
import { GalleryGrid } from "../components/GalleryGrid";
import { fetchMedia, deleteFolder, renameFolderApi } from "../lib/api";
import type { MediaRecord } from "../types/media";

export function Library() {
  const [items, setItems] = useState<MediaRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customFolders, setCustomFolders] = useState<string[]>([]);
  const [folderDescriptions, setFolderDescriptions] = useState<Record<string, string>>({});
  
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [editFolderName, setEditFolderName] = useState("");
  const [editFolderDesc, setEditFolderDesc] = useState("");
  const [isSavingFolder, setIsSavingFolder] = useState(false);

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
  const folders = Array.from(foldersSet).sort();

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1>Library</h1>
          <p className="subtitle">Your organized media</p>
        </div>
        <div className="header-actions">
          <button 
            className="primary-button icon-button"
            onClick={handleNewFolder}
          >
            <Plus size={20} />
            <span>New Folder</span>
          </button>
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
      ) : folders.length === 0 ? (
        <section className="panel gallery-panel">
          <div className="section-heading">
            <p className="eyebrow">Library</p>
            <h2>No media found</h2>
          </div>
          <p className="muted-text">Upload some media to see them organized by folder here.</p>
        </section>
      ) : (
        folders.map((folder) => (
          <div key={folder} className="folder-section">
            <div className="folder-heading" style={{ justifyContent: "space-between" }}>
              {editingFolder === folder ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", flexGrow: 1, paddingRight: "16px" }}>
                  <input 
                    type="text" 
                    value={editFolderName} 
                    onChange={e => setEditFolderName(e.target.value)} 
                    className="edit-input" 
                    placeholder="Folder name"
                    style={{ fontSize: "1.25rem", fontWeight: "bold" }}
                  />
                  <textarea 
                    value={editFolderDesc} 
                    onChange={e => setEditFolderDesc(e.target.value)} 
                    className="edit-input" 
                    placeholder="Folder description (optional)"
                    rows={2}
                  />
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  <Folder className="folder-heading-icon" size={24} />
                  <span>{folder}</span>
                  {folderDescriptions[folder] && (
                    <span style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginLeft: "8px", fontWeight: "normal" }}>
                      — {folderDescriptions[folder]}
                    </span>
                  )}
                </div>
              )}
              
              <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                {editingFolder === folder ? (
                  <>
                    <button 
                      className="icon-button"
                      style={{ background: "transparent", border: "none", color: "var(--success)", cursor: "pointer", padding: "4px" }}
                      onClick={() => saveFolderEdit(folder)}
                      disabled={isSavingFolder}
                    >
                      <Check size={18} />
                    </button>
                    <button 
                      className="icon-button"
                      style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "4px" }}
                      onClick={() => setEditingFolder(null)}
                      disabled={isSavingFolder}
                    >
                      <X size={18} />
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      className="icon-button"
                      style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "4px" }}
                      onClick={() => startEditingFolder(folder)}
                      aria-label={`Edit ${folder}`}
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      className="icon-button"
                      style={{ background: "transparent", border: "none", color: "var(--danger)", cursor: "pointer", padding: "4px" }}
                      onClick={() => handleDeleteFolder(folder)}
                      aria-label={`Delete ${folder}`}
                    >
                      <Trash2 size={18} />
                    </button>
                  </>
                )}
              </div>
            </div>
            {groupedItems[folder] && groupedItems[folder].length > 0 ? (
              <GalleryGrid
                items={groupedItems[folder]}
                isLoading={false}
                onUpdate={handleUpdate}
                onDelete={handleDeleteMedia}
                availableFolders={folders}
              />
            ) : (
              <p className="muted-text" style={{ padding: "0 12px" }}>This folder is empty.</p>
            )}
          </div>
        ))
      )}
    </div>
  );
}
