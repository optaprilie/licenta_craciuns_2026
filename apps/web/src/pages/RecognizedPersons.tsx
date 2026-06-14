import { startTransition, useEffect, useState } from "react";
import { Plus, ArrowLeft, User, CheckCircle2, Trash2 } from "lucide-react";
import { GalleryGrid } from "../components/GalleryGrid";
import { SearchBar } from "../components/SearchBar";
import { fetchMedia, updateMedia } from "../lib/api";
import type { MediaRecord, UpdateMediaDraft } from "../types/media";

const PERSON_TAGS = ["person", "people", "man", "woman", "boy", "girl", "child", "face", "portrait", "group", "family"];

export function RecognizedPersons() {
  const [items, setItems] = useState<MediaRecord[]>([]);
  const [personProfiles, setPersonProfiles] = useState<string[]>([]);
  const [activePerson, setActivePerson] = useState<string | null>(null);
  const [isAssignMode, setIsAssignMode] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const autoDetectPeople = localStorage.getItem("autoDetectPeople") !== "false";

  useEffect(() => {
    const saved = localStorage.getItem("personProfiles");
    if (saved) {
      try { setPersonProfiles(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  useEffect(() => {
    let isActive = true;

    async function loadPersons() {
      setIsLoading(true);
      try {
        const results = await fetchMedia("");
        if (!isActive) return;

        const personMedia = results.filter(item => 
          item.aiTags.some(tag => PERSON_TAGS.includes(tag.toLowerCase())) ||
          item.manualTags.some(tag => PERSON_TAGS.includes(tag.toLowerCase()))
        );

        startTransition(() => {
          setItems(personMedia);
        });
        setError(null);
      } catch (loadError) {
        if (!isActive) return;
        setError(loadError instanceof Error ? loadError.message : "The media could not be loaded.");
      } finally {
        if (isActive) setIsLoading(false);
      }
    }

    void loadPersons();

    return () => { isActive = false; };
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
      })
    );
  }

  function handleNewPerson() {
    const name = prompt("Enter person's name:");
    if (!name || !name.trim()) return;
    
    const personName = name.trim();
    if (!personProfiles.includes(personName)) {
      const newProfiles = [...personProfiles, personName];
      setPersonProfiles(newProfiles);
      localStorage.setItem("personProfiles", JSON.stringify(newProfiles));
    }
  }

  async function handleDeletePerson() {
    if (!activePerson) return;
    if (!confirm(`Are you sure you want to delete the profile "${activePerson}"? This will untag all photos assigned to them.`)) return;

    const lowerPerson = activePerson.toLowerCase();
    const personPhotos = items.filter(i => i.manualTags.some(t => t.toLowerCase() === lowerPerson));

    const newProfiles = personProfiles.filter(p => p !== activePerson);
    setPersonProfiles(newProfiles);
    localStorage.setItem("personProfiles", JSON.stringify(newProfiles));

    setItems(prev => prev.map(item => {
      if (item.manualTags.some(t => t.toLowerCase() === lowerPerson)) {
        return {
          ...item,
          manualTags: item.manualTags.filter(t => t.toLowerCase() !== lowerPerson)
        };
      }
      return item;
    }));

    const deletedPerson = activePerson;
    setActivePerson(null);
    setIsAssignMode(false);
    setSearchQuery("");

    for (const photo of personPhotos) {
      try {
        const newTags = photo.manualTags.filter(t => t.toLowerCase() !== lowerPerson);
        await updateMedia(photo.id, {
          manualTags: newTags,
          title: photo.title,
          description: photo.description,
          folder: photo.folder || undefined
        });
      } catch (err) {
        console.error(`Failed to untag photo ${photo.id} from ${deletedPerson}`);
      }
    }
  }

  async function handleAssignToggle(item: MediaRecord) {
    if (!activePerson) return;
    const lowerPerson = activePerson.toLowerCase();
    const hasPerson = item.manualTags.some(t => t.toLowerCase() === lowerPerson);
    const newTags = hasPerson 
      ? item.manualTags.filter(t => t.toLowerCase() !== lowerPerson)
      : [...item.manualTags, activePerson];
    
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, manualTags: newTags } : i));
    
    try {
      await updateMedia(item.id, { 
        manualTags: newTags, 
        title: item.title, 
        description: item.description,
        folder: item.folder || undefined
      });
    } catch (err) {
      console.error(err);
      alert("Failed to assign person.");
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, manualTags: item.manualTags } : i));
    }
  }

  const currentItems = activePerson && !isAssignMode
    ? items.filter(i => i.manualTags.some(t => t.toLowerCase() === activePerson.toLowerCase()))
    : items;

  const filteredItems = currentItems.filter(item => {
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
          {activePerson ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button 
                onClick={() => {
                  setActivePerson(null);
                  setIsAssignMode(false);
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
                {activePerson}
              </h1>
            </div>
          ) : (
            <>
              <h1>Recognized Persons</h1>
              <p className="subtitle">Media containing people</p>
            </>
          )}
        </div>
        <div className="header-actions" style={{ flexGrow: 1, justifyContent: 'flex-end' }}>
          <SearchBar 
            query={searchQuery}
            onQueryChange={setSearchQuery}
            isLoading={isLoading}
            placeholder={activePerson ? `Search ${activePerson}'s photos...` : "Search people..."}
          />
          {!activePerson && (
            <button className="primary-button icon-button" onClick={handleNewPerson} style={{ whiteSpace: 'nowrap' }}>
              <Plus size={20} />
              <span>New Person</span>
            </button>
          )}
          {activePerson && (
            <>
              <button 
                className="icon-button" 
                onClick={handleDeletePerson}
                style={{ 
                  background: 'var(--surface)', 
                  border: '1px solid var(--border)', 
                  color: 'var(--text-main)', 
                  marginRight: '8px' 
                }}
                title="Delete Profile"
              >
                <Trash2 size={20} />
              </button>
              <button 
                className={`primary-button icon-button ${isAssignMode ? 'active' : ''}`}
                onClick={() => {
                setIsAssignMode(!isAssignMode);
                setSearchQuery("");
              }}
              style={{ 
                whiteSpace: 'nowrap', 
                backgroundColor: isAssignMode ? 'var(--primary-dark)' : 'var(--primary)',
                color: 'white'
              }}
            >
              <CheckCircle2 size={20} />
              <span>{isAssignMode ? 'Done Assigning' : 'Assign Photos'}</span>
            </button>
            </>
          )}
        </div>
      </header>
      
      {error && <div className="error-message">{error}</div>}

      {!activePerson && (
        <div className="folder-section" style={{ marginTop: '0', marginBottom: '40px' }}>
          <div className="section-heading" style={{ marginBottom: '16px' }}>
            <p className="eyebrow">Profiles</p>
            <h2 style={{ fontSize: '1.2rem', margin: 0 }}>People</h2>
          </div>
          {personProfiles.length > 0 ? (
            <div className="album-grid" style={{ marginBottom: '24px' }}>
              {personProfiles.filter(p => p.toLowerCase().includes(searchQuery.toLowerCase())).map((person) => {
                const personPhotos = items.filter(i => i.manualTags.some(t => t.toLowerCase() === person.toLowerCase()));
                const previews = personPhotos.slice(0, 4);

                return (
                  <div key={person} className="album-card" onClick={() => { setActivePerson(person); setSearchQuery(""); }}>
                    <div className="album-preview-container">
                      <div className="album-preview-grid">
                        {previews.length > 0 ? (
                          previews.map((item, idx) => (
                            item.resourceType === 'video' ? (
                              <video key={idx} src={item.mediaUrl} className="album-preview-item" muted playsInline />
                            ) : (
                              <img key={idx} src={item.previewUrl || item.mediaUrl} className="album-preview-item" alt="" loading="lazy" />
                            )
                          ))
                        ) : (
                          <div className="album-preview-empty" style={{ gridColumn: '1 / -1', gridRow: '1 / -1' }}>
                            <User size={32} style={{ opacity: 0.2 }} />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="album-info">
                      <h3 className="album-title">{person}</h3>
                      <p className="album-count">{personPhotos.length} item{personPhotos.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="panel" style={{ textAlign: 'center', padding: '24px', marginBottom: '24px', background: 'var(--surface)' }}>
              <p style={{ color: 'var(--text-muted)' }}>You haven't added any person profiles yet.</p>
              <p className="subtitle" style={{ fontSize: '0.9rem', marginTop: '4px' }}>Click "New Person" to start organizing faces.</p>
            </div>
          )}

          {autoDetectPeople && (
            <div className="section-heading" style={{ marginBottom: '16px' }}>
              <p className="eyebrow">Auto-Detected</p>
              <h2 style={{ fontSize: '1.2rem', margin: 0 }}>All Photos with People</h2>
            </div>
          )}
        </div>
      )}

      {activePerson && isAssignMode && (
        <div className="banner" style={{ marginBottom: '24px', backgroundColor: 'var(--surface-hover)', borderRadius: '8px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <CheckCircle2 size={24} style={{ color: 'var(--primary)' }} />
          <div>
            <strong style={{ display: 'block', fontSize: '1.1rem', marginBottom: '4px' }}>Assign Mode Active</strong>
            <span style={{ color: 'var(--text-muted)' }}>Click on any photo below to quickly tag or untag <strong>{activePerson}</strong>. When finished, click 'Done Assigning'.</span>
          </div>
        </div>
      )}

      {(activePerson || autoDetectPeople) && (
        <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr', height: '100%', overflowY: 'auto' }}>
          {!isLoading && filteredItems.length === 0 ? (
            <div className="panel" style={{ textAlign: 'center', padding: '40px' }}>
              <p style={{ color: 'var(--text-muted)' }}>No matches found.</p>
              {activePerson && !isAssignMode && (
                <p className="subtitle">Click "Assign Photos" to add some pictures of {activePerson}!</p>
              )}
            </div>
          ) : (
            <GalleryGrid
              items={filteredItems}
              isLoading={isLoading}
              onUpdate={handleUpdate}
              assignModeContext={isAssignMode ? activePerson : null}
              onAssignToggle={isAssignMode ? handleAssignToggle : undefined}
            />
          )}
        </div>
      )}
    </div>
  );
}
