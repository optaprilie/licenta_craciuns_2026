export function Settings() {
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
          <h3>Appearance</h3>
          <div className="setting-item">
            <label>Theme</label>
            <select className="setting-select" defaultValue="system">
              <option value="system">System Default</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
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
