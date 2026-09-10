import React from "react";
import { NavLink } from "react-router-dom";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: "📊" },
  { to: "/inventory", label: "Inventory", icon: "📦" },
  { to: "/billing", label: "Billing", icon: "🧾" },
  { to: "/sales", label: "Sales", icon: "💰" },
  { to: "/stock-history", label: "Stock History", icon: "📈" },
  { to: "/reports", label: "Reports", icon: "📑" },
  { to: "/settings", label: "Settings", icon: "⚙️" },
];

export default function Sidebar({ open, onNavigate }) {
  return (
    <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
      <div className="sidebar-brand">
        <span className="brand-mark">SE</span>
        <span className="brand-name">StockEase</span>
      </div>
      <nav className="sidebar-nav">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
            onClick={onNavigate}
          >
            <span className="sidebar-icon">{link.icon}</span>
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
