import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

export function Settings() {
  const { user } = useAuth();
  
  const initialFirstName = user?.user_metadata?.first_name || "";
  const initialLastName = user?.user_metadata?.last_name || "";
  
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error", text: string } | null>(null);

  const [enableAI, setEnableAI] = useState(() => localStorage.getItem("enableAI") !== "false");
  const [autoDetectPeople, setAutoDetectPeople] = useState(() => localStorage.getItem("autoDetectPeople") !== "false");
  const [gridDensity, setGridDensity] = useState(() => localStorage.getItem("gridDensity") || "comfortable");
  
  const [avatarUrl, setAvatarUrl] = useState(user?.user_metadata?.avatar_url || "");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  function handleEnableAIChange(e: React.ChangeEvent<HTMLInputElement>) {
    setEnableAI(e.target.checked);
    localStorage.setItem("enableAI", e.target.checked.toString());
  }

  function handleAutoDetectPeopleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setAutoDetectPeople(e.target.checked);
    localStorage.setItem("autoDetectPeople", e.target.checked.toString());
  }

  function handleGridDensityChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setGridDensity(e.target.value);
    localStorage.setItem("gridDensity", e.target.value);
    // Optional: reload to apply immediately if components don't listen to localStorage directly
    window.location.reload();
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    setIsUploadingAvatar(true);
    setProfileMessage(null);
    try {
      // 1. Get signature
      const { createUploadSignature, uploadFileToCloudinary } = await import("../lib/api");
      const signature = await createUploadSignature();
      
      // 2. Upload to Cloudinary
      const upload = await uploadFileToCloudinary(file, signature);
      
      // 3. Construct URL and save to Supabase Auth
      // The public_id allows us to construct the secure URL manually
      const url = `https://res.cloudinary.com/${signature.cloudName}/image/upload/${upload.public_id}`;
      
      const { error } = await supabase.auth.updateUser({
        data: { avatar_url: url }
      });
      if (error) throw error;
      
      setAvatarUrl(url);
      setProfileMessage({ type: "success", text: "Profile picture updated!" });
    } catch (err: any) {
      setProfileMessage({ type: "error", text: err.message || "Failed to upload avatar." });
    } finally {
      setIsUploadingAvatar(false);
    }
  }

  async function handleRemoveAvatar() {
    setIsUploadingAvatar(true);
    setProfileMessage(null);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { avatar_url: "" }
      });
      if (error) throw error;
      setAvatarUrl("");
      setProfileMessage({ type: "success", text: "Profile picture removed!" });
    } catch (err: any) {
      setProfileMessage({ type: "error", text: err.message || "Failed to remove avatar." });
    } finally {
      setIsUploadingAvatar(false);
    }
  }

  async function handleSaveProfile() {
    setIsSavingProfile(true);
    setProfileMessage(null);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          first_name: firstName,
          last_name: lastName,
          full_name: `${firstName} ${lastName}`.trim()
        }
      });
      if (error) throw error;
      setProfileMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (err: any) {
      setProfileMessage({ type: "error", text: err.message || "Failed to update profile." });
    } finally {
      setIsSavingProfile(false);
    }
  }

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1>Settings</h1>
          <p className="subtitle">Manage your gallery preferences</p>
        </div>
      </header>
      <div className="settings-content">
        <section className="settings-section panel">
          <h3>Account Profile</h3>
          
          <div style={{ display: 'flex', gap: '24px', marginBottom: '24px', alignItems: 'center' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--surface-hover)', border: '1px solid var(--border)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '2rem', color: 'var(--text-muted)' }}>{firstName.charAt(0) || user?.email?.charAt(0) || '?'}</span>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <label className="primary-button" style={{ cursor: 'pointer', display: 'inline-block', margin: 0 }}>
                  {isUploadingAvatar ? "Uploading..." : "Change Picture"}
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} disabled={isUploadingAvatar} style={{ display: 'none' }} />
                </label>
                {avatarUrl && (
                  <button 
                    className="icon-button" 
                    onClick={handleRemoveAvatar} 
                    disabled={isUploadingAvatar}
                    style={{ background: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '8px 12px', borderRadius: '6px' }}
                  >
                    Remove
                  </button>
                )}
              </div>
              <p className="muted-text" style={{ marginTop: '8px', fontSize: '0.8rem' }}>Recommended: Square image, max 2MB.</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <div className="field" style={{ flex: 1 }}>
              <span>First Name</span>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
              />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <span>Last Name</span>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
              />
            </div>
          </div>

          <div className="field" style={{ marginBottom: '24px' }}>
            <span>Email Address</span>
            <input type="email" value={user?.email || ""} disabled style={{ opacity: 0.7 }} />
          </div>
          <button 
            className="primary-button" 
            onClick={handleSaveProfile} 
            disabled={isSavingProfile}
          >
            {isSavingProfile ? "Saving..." : "Save Profile"}
          </button>
          {profileMessage && (
            <p className={`banner ${profileMessage.type === "success" ? "success-banner" : "error-banner"}`} style={{ marginTop: '16px', marginBottom: 0 }}>
              {profileMessage.text}
            </p>
          )}
        </section>

        <section className="settings-section panel">
          <h3>Indexing & Storage</h3>
          <div className="setting-item">
            <label>Auto-index new uploads</label>
            <input type="checkbox" defaultChecked />
          </div>
          <div className="setting-item">
            <label>Storage Location</label>
            <span className="muted-text">Cloudinary (Default)</span>
          </div>
        </section>

        <section className="settings-section panel">
          <h3>Display & Layout</h3>
          <div className="setting-item">
            <label>Photo Grid Density</label>
            <select 
              value={gridDensity} 
              onChange={handleGridDensityChange}
              style={{
                background: 'var(--surface-hover)',
                border: '1px solid var(--border)',
                color: 'var(--text-main)',
                padding: '8px 12px',
                borderRadius: '6px',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="compact">Compact</option>
              <option value="comfortable">Comfortable</option>
              <option value="large">Large</option>
            </select>
          </div>
        </section>

        <section className="settings-section panel">
          <h3>AI Features</h3>
          <p className="muted-text" style={{marginBottom: "16px"}}>Configure artificial intelligence features for your gallery.</p>
          <div className="setting-item">
            <label>Enable AI Metadata Generation (Title, Description, Tags)</label>
            <input 
              type="checkbox" 
              checked={enableAI} 
              onChange={handleEnableAIChange} 
            />
          </div>
          <div className="setting-item">
            <label>Enable Auto-Detection of People</label>
            <input 
              type="checkbox" 
              checked={autoDetectPeople} 
              onChange={handleAutoDetectPeopleChange} 
            />
          </div>
        </section>
      </div>
    </div>
  );
}
