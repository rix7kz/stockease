import React, { useEffect, useState } from "react";

const emptyForm = {
  name: "",
  category: "",
  price: "",
  purchasePrice: "",
  stock: "",
  minimumStock: "",
  barcode: "",
};

export default function ProductModal({ open, onClose, onSubmit, initialProduct }) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialProduct) {
      setForm({
        name: initialProduct.name || "",
        category: initialProduct.category || "",
        price: initialProduct.price ?? "",
        purchasePrice: initialProduct.purchasePrice ?? "",
        stock: initialProduct.stock ?? "",
        minimumStock: initialProduct.minimumStock ?? "",
        barcode: initialProduct.barcode || "",
      });
    } else {
      setForm(emptyForm);
    }
    setError("");
  }, [initialProduct, open]);

  if (!open) return null;

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.name || !form.category || form.price === "" || form.purchasePrice === "") {
      setError("Please fill in name, category, selling price and purchase price.");
      return;
    }

    setSaving(true);
    try {
      await onSubmit(form);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{initialProduct ? "Edit Product" : "Add Product"}</h2>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit} className="form-grid">
          <label>
            Product Name
            <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Maggi" />
          </label>
          <label>
            Category
            <input name="category" value={form.category} onChange={handleChange} placeholder="e.g. Groceries" />
          </label>
          <label>
            Selling Price (₹)
            <input type="number" min="0" step="0.01" name="price" value={form.price} onChange={handleChange} />
          </label>
          <label>
            Purchase Price (₹)
            <input
              type="number"
              min="0"
              step="0.01"
              name="purchasePrice"
              value={form.purchasePrice}
              onChange={handleChange}
            />
          </label>
          <label>
            Stock Quantity
            <input type="number" min="0" name="stock" value={form.stock} onChange={handleChange} />
          </label>
          <label>
            Minimum Stock
            <input type="number" min="0" name="minimumStock" value={form.minimumStock} onChange={handleChange} />
          </label>
          <label className="span-2">
            Barcode (optional)
            <input name="barcode" value={form.barcode} onChange={handleChange} placeholder="e.g. 8901234567" />
          </label>

          <div className="modal-actions span-2">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving..." : initialProduct ? "Save Changes" : "Add Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
