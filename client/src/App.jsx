import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./components/Toast";
import ProtectedRoute from "./components/ProtectedRoute";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import Billing from "./pages/Billing";
import Sales from "./pages/Sales";
import StockHistory from "./pages/StockHistory";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";

function AppLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />
      {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}
      <div className="app-main">
        <Navbar onToggleSidebar={() => setSidebarOpen((o) => !o)} />
        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}

function AuthedRoute({ children }) {
  return (
    <ProtectedRoute>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  );
}

function RootRedirect() {
  const { user } = useAuth();
  return <Navigate to={user ? "/dashboard" : "/login"} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route path="/dashboard" element={<AuthedRoute><Dashboard /></AuthedRoute>} />
            <Route path="/inventory" element={<AuthedRoute><Inventory /></AuthedRoute>} />
            <Route path="/billing" element={<AuthedRoute><Billing /></AuthedRoute>} />
            <Route path="/sales" element={<AuthedRoute><Sales /></AuthedRoute>} />
            <Route path="/stock-history" element={<AuthedRoute><StockHistory /></AuthedRoute>} />
            <Route path="/reports" element={<AuthedRoute><Reports /></AuthedRoute>} />
            <Route path="/settings" element={<AuthedRoute><Settings /></AuthedRoute>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
