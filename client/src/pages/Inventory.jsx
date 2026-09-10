import React, { useEffect, useState } from "react";
import api from "../api";
import ProductModal from "../components/ProductModal";
import { useToast } from "../components/Toast";

const statusBadge = {
  AVAILABLE: { label: "AVAILABLE", cls: "badge-success" },
  LOW_STOCK: { label: "LOW STOCK", cls: "badge-warning" },
  OUT_OF_STOCK: { label: "OUT OF STOCK", cls: "badge-danger" },
};

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [categories, setCategories] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [importing, setImporting] = useState(false);
  const { showToast } = useToast();

  async function loadProducts() {
    setLoading(true);
    try {
      const { data } = await api.get("/products", { params: { search, status: statusFilter, category: categoryFilter } });
      setProducts(data.products);
      if (categoryFilter === "all" && !search) setCategories([...new Set(data.products.map((p) => p.category))].sort());
    } catch {
      showToast("Failed to load inventory.", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(loadProducts, 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter, categoryFilter]);

  async function handleAddOrEdit(form) {
    if (editingProduct) {
      await api.put(`/products/${editingProduct._id}`, form);
      showToast("Product updated successfully.", "success");
    } else {
      await api.post("/products", form);
      showToast("Product added successfully.", "success");
    }
    setModalOpen(false);
    setEditingProduct(null);
    loadProducts();
  }

  async function handleDelete() {
    try {
      await api.delete(`/products/${confirmDelete._id}`);
      showToast("Product deleted successfully.", "success");
      setConfirmDelete(null);
      loadProducts();
    } catch {
      showToast("Failed to delete product.", "error");
    }
  }

  async function handleCsvImport(event) {
    const file = event.target.files?.[0]; event.target.value = "";
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) return showToast("Please select a .csv file.", "error");
    if (file.size > 2 * 1024 * 1024) return showToast("CSV files must be 2 MB or smaller.", "error");
    setImporting(true);
    try { const { data } = await api.post("/products/import", { csv: await file.text() }); showToast(data.imported + " product" + (data.imported === 1 ? "" : "s") + " imported successfully.", "success"); loadProducts(); }
    catch (error) { showToast(error.response?.data?.errors?.[0] || error.response?.data?.message || "Failed to import CSV.", "error"); }
    finally { setImporting(false); }
  }
  function downloadCsvTemplate() {
    const csv = "name,category,price,purchasePrice,stock,minimumStock,barcode\nExample Product,General,99.99,60,10,5,123456789";
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" })); const link = document.createElement("a"); link.href = url; link.download = "stockease-products-template.csv"; link.click(); URL.revokeObjectURL(url);
  }



  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Inventory</h1>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={downloadCsvTemplate}>Download CSV Template</button>
          <label className="btn btn-secondary file-upload-btn">
            {importing ? "Importing..." : "Import CSV"}
            <input type="file" accept=".csv,text/csv" onChange={handleCsvImport} disabled={importing} />
          </label>
          <button className="btn btn-primary" onClick={() => { setEditingProduct(null); setModalOpen(true); }}>+ Add Product</button>
        </div>
      </div>

      <p className="import-hint">CSV columns: name, category, price, purchasePrice, stock, minimumStock, barcode. Only the first four are required.</p>

      <div className="toolbar">
        <input
          className="search-input"
          placeholder="Search by name or barcode..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All Status</option>
          <option value="AVAILABLE">Available</option>
          <option value="LOW_STOCK">Low Stock</option>
          <option value="OUT_OF_STOCK">Out of Stock</option>
        </select>
      </div>

      <div className="category-select-row">
        <label htmlFor="inventory-category">Category</label>
        <select id="inventory-category" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="all">All Products</option>
          {categories.map((category) => <option key={category} value={category}>{category}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="page-loading">Loading inventory...</div>
      ) : products.length === 0 ? (
        <div className="empty-state">No products yet. Click "Add Product" to get started.</div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Selling Price</th>
                <th>Purchase Price</th>
                <th>Stock</th>
                <th>Min Stock</th>
                <th>Barcode</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p._id}>
                  <td>{p.name}</td>
                  <td>{p.category}</td>
                  <td>₹{p.price.toFixed(2)}</td>
                  <td>₹{p.purchasePrice.toFixed(2)}</td>
                  <td>{p.stock}</td>
                  <td>{p.minimumStock}</td>
                  <td>{p.barcode || "-"}</td>
                  <td>
                    <span className={`badge ${statusBadge[p.status].cls}`}>{statusBadge[p.status].label}</span>
                  </td>
                  <td className="actions-cell">
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        setEditingProduct(p);
                        setModalOpen(true);
                      }}
                    >
                      Edit
                    </button>
                    <button className="btn btn-ghost btn-sm btn-danger-text" onClick={() => setConfirmDelete(p)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ProductModal
        open={modalOpen}
        initialProduct={editingProduct}
        onClose={() => {
          setModalOpen(false);
          setEditingProduct(null);
        }}
        onSubmit={handleAddOrEdit}
      />

      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Product</h3>
            <p>
              Are you sure you want to delete <strong>{confirmDelete.name}</strong>? This cannot be undone.
            </p>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setConfirmDelete(null)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
