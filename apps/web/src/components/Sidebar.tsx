import { NavLink, useNavigate } from "react-router-dom";
import {
  Home,
  FolderLock,
  Users,
  ScanFace,
  Settings,
  LogOut,
  GalleryVerticalEnd,
  Sun,
  Moon
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";

export function Sidebar({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/login");
    } catch (error) {
      console.error("Failed to sign out", error);
    }
  };

  const accountName = user?.user_metadata?.full_name || user?.email || "Account";

  return (
    <aside className={`sidebar ${isOpen ? "open" : ""}`}>
      <div className="sidebar-header">
        <GalleryVerticalEnd className="logo-icon" />
        <span className="logo-text">SmartGallery</span>
      </div>

      <nav className="sidebar-nav">
        <NavLink
          to="/"
          onClick={onClose}
          className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
        >
          <Home className="nav-icon" />
          Home
        </NavLink>
        <NavLink
          to="/library"
          onClick={onClose}
          className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
        >
          <FolderLock className="nav-icon" />
          Library
        </NavLink>
        <NavLink
          to="/shared-albums"
          onClick={onClose}
          className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
        >
          <Users className="nav-icon" />
          Shared Albums
        </NavLink>
        <NavLink
          to="/recognized-persons"
          onClick={onClose}
          className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
        >
          <ScanFace className="nav-icon" />
          Recognized Persons
        </NavLink>

        <div className="nav-section-title">System</div>
        <NavLink
          to="/settings"
          onClick={onClose}
          className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
        >
          <Settings className="nav-icon" />
          Settings
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <div className="account-info">
          <span className="account-name">{accountName}</span>
        </div>
        <button className="sign-out-btn" onClick={toggleTheme} style={{ marginBottom: '8px' }}>
          {theme === "light" ? (
            <Moon className="nav-icon" />
          ) : (
            <Sun className="nav-icon" />
          )}
          {theme === "light" ? "Dark Mode" : "Light Mode"}
        </button>
        <button className="sign-out-btn" onClick={handleSignOut}>
          <LogOut className="nav-icon" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
