import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";

const initialForm = { name: "", email: "", password: "", confirmPassword: "", shopName: "" };

export default function Register() {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (Object.values(form).some((v) => !v)) {
      setError("Please fill in every field.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await register(form);
      showToast("Registration successful. Please log in.", "success");
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
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
        <p className="auth-subtitle">Create your shop account.</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Full Name
            <input name="name" value={form.name} onChange={handleChange} placeholder="Your name" />
          </label>
          <label>
            Shop Name
            <input name="shopName" value={form.shopName} onChange={handleChange} placeholder="Your shop's name" />
          </label>
          <label>
            Email
            <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@example.com" />
          </label>
          <label>
            Password
            <input type="password" name="password" value={form.password} onChange={handleChange} placeholder="At least 6 characters" />
          </label>
          <label>
            Confirm Password
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter password"
            />
          </label>
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>

        <p className="auth-alt-link">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}
