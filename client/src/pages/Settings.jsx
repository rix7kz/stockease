import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import AppLayout from '../components/AppLayout.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Settings() {
  const [form, setForm] = useState({ shopName: '', ownerName: '', email: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { updateUser } = useAuth();

  useEffect(() => {
    api
      .get('/settings')
      .then((res) => setForm(res.data))
      .catch(() => setError('Failed to load settings.'))
      .finally(() => setLoading(false));
  }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    setSaving(true);
    try {
      const res = await api.put('/settings', form);
      setForm(res.data);
      updateUser(res.data);
      setMessage('Settings saved successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppLayout title="Settings">
      <div className="panel settings-panel">
        {loading ? (
          <p>Loading settings...</p>
        ) : (
          <form onSubmit={handleSubmit} className="modal-form">
            {message && <div className="alert alert-success">{message}</div>}
            {error && <div className="alert alert-error">{error}</div>}

            <label>Shop Name</label>
            <input name="shopName" value={form.shopName || ''} onChange={handleChange} required />

            <label>Owner Name</label>
            <input name="ownerName" value={form.ownerName || ''} onChange={handleChange} required />

            <label>Email</label>
            <input type="email" name="email" value={form.email || ''} onChange={handleChange} required />

            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        )}
      </div>
    </AppLayout>
  );
}
