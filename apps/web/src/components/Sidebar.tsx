import { NavLink } from "react-router-dom";
import {
  Home,
  FolderLock,
  Users,
  ScanFace,
  Settings,
  LogOut,
  GalleryVerticalEnd
} from "lucide-react";

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <GalleryVerticalEnd className="logo-icon" />
        <span className="logo-text">SmartGallery</span>
      </div>

      <nav className="sidebar-nav">
        <NavLink
          to="/"
          className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
        >
          <Home className="nav-icon" />
          Home
        </NavLink>
        <NavLink
          to="/private-library"
          className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
        >
          <FolderLock className="nav-icon" />
          Private Library
        </NavLink>
        <NavLink
          to="/shared-albums"
          className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
        >
          <Users className="nav-icon" />
          Shared Albums
        </NavLink>
        <NavLink
          to="/recognized-persons"
          className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
        >
          <ScanFace className="nav-icon" />
          Recognized Persons
        </NavLink>

        <div className="nav-section-title">System</div>
        <NavLink
          to="/settings"
          className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
        >
          <Settings className="nav-icon" />
          Settings
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <button className="sign-out-btn">
          <LogOut className="nav-icon" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
