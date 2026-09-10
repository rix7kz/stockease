import React, { useEffect, useState } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";

export default function Settings() {
  const [form, setForm] = useState({ shopName: "", name: "", email: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { setUser, user } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    api
      .get("/settings")
      .then((res) => setForm(res.data.settings))
      .catch(() => showToast("Failed to load settings.", "error"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put("/settings", form);
      setForm(data.settings);
      const updatedUser = { ...user, ...data.settings };
      localStorage.setItem("stockease_user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      showToast("Settings updated.", "success");
    } catch {
      showToast("Failed to update settings.", "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="page-loading">Loading settings...</div>;

  return (
    <div className="page">
      <h1 className="page-title">Settings</h1>
      <div className="card" style={{ maxWidth: 480 }}>
        <form onSubmit={handleSubmit} className="form-grid">
          <label className="span-2">
            Shop Name
            <input name="shopName" value={form.shopName} onChange={handleChange} />
          </label>
          <label className="span-2">
            Owner Name
            <input name="name" value={form.name} onChange={handleChange} />
          </label>
          <label className="span-2">
            Email
            <input name="email" type="email" value={form.email} onChange={handleChange} />
          </label>
          <div className="span-2">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
