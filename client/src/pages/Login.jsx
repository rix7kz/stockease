import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";

const DEMO_EMAIL = "admin@stockease.com";
const DEMO_PASSWORD = "admin@123";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  function useDemoAccount() {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      showToast("Login successful.", "success");
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="brand-mark">SE</span>
          <span className="brand-name">StockEase</span>
        </div>
        <p className="auth-subtitle">Inventory & Billing made simple.</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </label>
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="auth-alt-link">
          Don't have an account? <Link to="/register">Register</Link>
        </p>

        <div className="demo-login-box">
          <p className="demo-login-title">Demo Account</p>
          <p className="demo-login-line">Email: {DEMO_EMAIL}</p>
          <p className="demo-login-line">Password: {DEMO_PASSWORD}</p>
          <button type="button" className="btn btn-secondary btn-block" onClick={useDemoAccount}>
            Use Demo Account
          </button>
        </div>
      </div>
    </div>
  );
}
