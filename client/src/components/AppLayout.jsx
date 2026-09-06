import React, { useState } from 'react';
import Sidebar from './Sidebar.jsx';

// Shared shell for every logged-in page: sidebar on the left, a small
// top bar with a mobile menu button, and the page content on the right.
export default function AppLayout({ title, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="app-main">
        <header className="topbar">
          <button className="menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
            ☰
          </button>
          <h1 className="topbar-title">{title}</h1>
        </header>
        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}
