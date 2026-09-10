import React, { useEffect, useMemo, useState } from "react";
import api from "../api";
import { useToast } from "../components/Toast";
import BillInvoice from "../components/BillInvoice";
import BarcodeScanner from "../components/BarcodeScanner";

export default function Billing() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [cart, setCart] = useState([]); // { product, quantity }
  const [customerName, setCustomerName] = useState("");
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [completedBill, setCompletedBill] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      const { data } = await api.get("/products");
      setProducts(data.products);
    } catch {
      showToast("Failed to load products.", "error");
    }
  }

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || (p.barcode || "").toLowerCase().includes(q)
    );
  }, [products, search]);

  function addBarcodeToCart(value) {
    const barcode = value.trim();
    if (!barcode) return;
    const product = products.find((p) => (p.barcode || "").trim().toLowerCase() === barcode.toLowerCase());
    if (!product) { showToast("Product not found.", "error"); return; }
    addToCart(product);
    setBarcodeInput("");
  }

  function addToCart(product) {
    if (product.stock <= 0) {
      showToast(`${product.name} is out of stock.`, "error");
      return;
    }
    setCart((prev) => {
      const existing = prev.find((c) => c.product._id === product._id);
      if (existing) {
        if (existing.quantity + 1 > product.stock) {
          showToast(`Only ${product.stock} unit(s) of ${product.name} available.`, "error");
          return prev;
        }
        return prev.map((c) =>
          c.product._id === product._id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  }

  function updateQuantity(productId, quantity) {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.product._id !== productId) return c;
          const qty = Math.max(0, Math.min(quantity, c.product.stock));
          return { ...c, quantity: qty };
        })
        .filter((c) => c.quantity > 0)
    );
  }

  function removeFromCart(productId) {
    setCart((prev) => prev.filter((c) => c.product._id !== productId));
  }

  const subtotal = cart.reduce((sum, c) => sum + c.product.price * c.quantity, 0);
  const discountValue = Number(discount) || 0;
  const total = Math.max(subtotal - discountValue, 0);

  async function completeBill() {
    setError("");
    if (cart.length === 0) {
      setError("Add at least one product to the cart first.");
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await api.post("/bills", {
        customerName,
        items: cart.map((c) => ({ productId: c.product._id, quantity: c.quantity })),
        discount: discountValue,
        paymentMethod,
      });
      showToast("Bill completed successfully.", "success");
      setCompletedBill(data.bill);
      setCart([]);
      setCustomerName("");
      setDiscount(0);
      loadProducts(); // refresh stock levels shown on the left
    } catch (err) {
      setError(err.response?.data?.message || "Failed to complete bill.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page">
      <h1 className="page-title">Billing</h1>

      <div className="pos-layout">
        <div className="pos-products card">
                    <div className="billing-scanner">
            <input className="search-input" placeholder="Enter barcode..." value={barcodeInput} onChange={(e) => setBarcodeInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addBarcodeToCart(barcodeInput); } }} />
            <button type="button" className="btn btn-secondary" onClick={() => addBarcodeToCart(barcodeInput)}>Add by Barcode</button>
            <button type="button" className="btn btn-primary" onClick={() => setScannerOpen((open) => !open)}>{scannerOpen ? "Close Scanner" : "Scan Barcode"}</button>
          </div>
          {scannerOpen && <BarcodeScanner onDetected={(barcode) => { setScannerOpen(false); addBarcodeToCart(barcode); }} onClose={() => setScannerOpen(false)} />}
          <input
            className="search-input"
            placeholder="Search product by name or barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="pos-product-list">
            {filteredProducts.length === 0 ? (
              <div className="empty-state">No products found.</div>
            ) : (
              filteredProducts.map((p) => (
                <button
                  key={p._id}
                  className={`pos-product-item ${p.stock <= 0 ? "disabled" : ""}`}
                  onClick={() => addToCart(p)}
                  disabled={p.stock <= 0}
                >
                  <span className="pos-product-name">{p.name}</span>
                  <span className="pos-product-meta">
                    ₹{p.price.toFixed(2)} · {p.stock > 0 ? `${p.stock} in stock` : "Out of stock"}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="pos-cart card">
          <h3>Cart</h3>
          {cart.length === 0 ? (
            <div className="empty-state">Cart is empty. Select products on the left.</div>
          ) : (
            <div className="cart-items">
              {cart.map((c) => (
                <div key={c.product._id} className="cart-item">
                  <div className="cart-item-info">
                    <span>{c.product.name}</span>
                    <span className="cart-item-price">₹{c.product.price.toFixed(2)} each</span>
                  </div>
                  <div className="cart-item-controls">
                    <button onClick={() => updateQuantity(c.product._id, c.quantity - 1)}>-</button>
                    <input
                      type="number"
                      min="1"
                      max={c.product.stock}
                      value={c.quantity}
                      onChange={(e) => updateQuantity(c.product._id, Number(e.target.value))}
                    />
                    <button onClick={() => updateQuantity(c.product._id, c.quantity + 1)}>+</button>
                  </div>
                  <span className="cart-item-total">₹{(c.product.price * c.quantity).toFixed(2)}</span>
                  <button className="cart-item-remove" onClick={() => removeFromCart(c.product._id)}>
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="pos-form">
            <label>
              Customer Name
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Walk-in Customer"
              />
            </label>
            <label>
              Discount (₹)
              <input type="number" min="0" value={discount} onChange={(e) => setDiscount(e.target.value)} />
            </label>
            <label>
              Payment Method
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <option value="CASH">Cash</option>
                <option value="UPI">UPI</option>
                <option value="CARD">Card</option>
              </select>
            </label>
          </div>

          <div className="pos-totals">
            <div>
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div>
              <span>Discount</span>
              <span>-₹{discountValue.toFixed(2)}</span>
            </div>
            <div className="pos-grand-total">
              <span>Total</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <button className="btn btn-primary btn-block" onClick={completeBill} disabled={submitting}>
            {submitting ? "Processing..." : "Complete Bill"}
          </button>
        </div>
      </div>

      {completedBill && <BillInvoice bill={completedBill} onClose={() => setCompletedBill(null)} />}
    </div>
  );
}
