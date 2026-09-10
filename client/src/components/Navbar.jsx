import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className="navbar">
      <button className="hamburger" onClick={onToggleSidebar} aria-label="Toggle menu">
        ☰
      </button>
      <div className="navbar-right">
        <div className="navbar-shop">{user?.shopName}</div>
        <div className="navbar-user">
          <span className="user-avatar">{user?.name?.charAt(0).toUpperCase()}</span>
          <span className="user-name">{user?.name}</span>
        </div>
        <button className="btn btn-ghost" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}
