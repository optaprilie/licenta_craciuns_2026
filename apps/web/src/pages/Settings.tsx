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
          <h3>AI Features</h3>
          <p className="muted-text" style={{marginBottom: "16px"}}>Configure artificial intelligence features for your gallery.</p>
          <div className="setting-item">
            <label>Enable AI Semantic Search</label>
            <input type="checkbox" defaultChecked />
          </div>
          <div className="setting-item">
            <label>Enable Facial Recognition</label>
            <input type="checkbox" />
          </div>
        </section>
      </div>
    </div>
  );
}
