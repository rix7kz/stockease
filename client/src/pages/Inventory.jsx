import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import AppLayout from '../components/AppLayout.jsx';
import Modal from '../components/Modal.jsx';
import StatusBadge from '../components/StatusBadge.jsx';

const EMPTY_FORM = { name: '', category: '', price: '', stock: '', minimumStock: '', barcode: '' };

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  async function loadProducts(query = '') {
    setLoading(true);
    try {
      const res = await api.get('/products', { params: query ? { search: query } : {} });
      setProducts(res.data);
      setError('');
    } catch (err) {
      setError('Failed to load inventory.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => loadProducts(search), 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function openAddModal() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setShowModal(true);
  }

  function openEditModal(product) {
    setEditingId(product._id);
    setForm({
      name: product.name,
      category: product.category,
      price: product.price,
      stock: product.stock,
      minimumStock: product.minimumStock,
      barcode: product.barcode,
    });
    setFormError('');
    setShowModal(true);
  }

  function handleFormChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSave(e) {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        category: form.category,
        price: Number(form.price),
        stock: Number(form.stock),
        minimumStock: Number(form.minimumStock),
        barcode: form.barcode,
      };
      if (editingId) {
        await api.put(`/products/${editingId}`, payload);
      } else {
        await api.post('/products', payload);
      }
      setShowModal(false);
      loadProducts(search);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save product.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(product) {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/products/${product._id}`);
      loadProducts(search);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete product.');
    }
  }

  function handleExport() {
    window.open('/api/export/inventory', '_blank');
  }

  return (
    <AppLayout title="Inventory">
      <div className="toolbar">
        <input
          className="search-input"
          type="text"
          placeholder="Search by name or barcode..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="toolbar-actions">
          <button className="btn btn-outline" onClick={handleExport}>
            Export Excel
          </button>
          <button className="btn btn-primary" onClick={openAddModal}>
            + Add Product
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="panel">
        {loading ? (
          <p>Loading inventory...</p>
        ) : products.length === 0 ? (
          <p className="empty-text">No products found. Add your first product to get started.</p>
        ) : (
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Min. Stock</th>
                  <th>Status</th>
                  <th>Barcode</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p._id}>
                    <td>{p.name}</td>
                    <td>{p.category}</td>
                    <td>₹{p.price.toFixed(2)}</td>
                    <td>{p.stock}</td>
                    <td>{p.minimumStock}</td>
                    <td>
                      <StatusBadge status={p.status} />
                    </td>
                    <td>{p.barcode || '-'}</td>
                    <td className="table-actions">
                      <button className="btn-link" onClick={() => openEditModal(p)}>
                        Edit
                      </button>
                      <button className="btn-link btn-link-danger" onClick={() => handleDelete(p)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <Modal title={editingId ? 'Edit Product' : 'Add Product'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSave} className="modal-form">
            {formError && <div className="alert alert-error">{formError}</div>}

            <label>Product Name</label>
            <input name="name" value={form.name} onChange={handleFormChange} required />

            <label>Category</label>
            <input name="category" value={form.category} onChange={handleFormChange} placeholder="General" />

            <div className="form-row">
              <div>
                <label>Price (₹)</label>
                <input type="number" step="0.01" min="0" name="price" value={form.price} onChange={handleFormChange} required />
              </div>
              <div>
                <label>Stock Quantity</label>
                <input type="number" min="0" name="stock" value={form.stock} onChange={handleFormChange} required />
              </div>
            </div>

            <div className="form-row">
              <div>
                <label>Minimum Stock</label>
                <input type="number" min="0" name="minimumStock" value={form.minimumStock} onChange={handleFormChange} required />
              </div>
              <div>
                <label>Barcode (optional)</label>
                <input name="barcode" value={form.barcode} onChange={handleFormChange} />
              </div>
            </div>

            <button className="btn btn-primary btn-block" type="submit" disabled={saving}>
              {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Add Product'}
            </button>
          </form>
        </Modal>
      )}
    </AppLayout>
  );
}
