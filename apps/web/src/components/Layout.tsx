import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu } from "lucide-react";
import { Sidebar } from "./Sidebar";

export function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="app-layout">
      {/* Mobile Sidebar Overlay */}
      <div 
        className={`sidebar-overlay ${isSidebarOpen ? "open" : ""}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <main className="main-content">
        <button 
          className="mobile-menu-btn" 
          onClick={() => setIsSidebarOpen(true)}
          style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 10 }}
        >
          <Menu size={24} />
        </button>
        <Outlet />
      </main>
    </div>
  );
}
