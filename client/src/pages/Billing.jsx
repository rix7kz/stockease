import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import AppLayout from '../components/AppLayout.jsx';

export default function Billing() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]); // [{ productId, name, price, stock, quantity }]
  const [customerName, setCustomerName] = useState('');
  const [discount, setDiscount] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/products').then((res) => setProducts(res.data));
  }, []);

  const filteredProducts = products.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || (p.barcode || '').toLowerCase().includes(q);
  });

  function addToCart(product) {
    if (product.stock <= 0) return;
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product._id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev; // don't exceed known stock
        return prev.map((item) =>
          item.productId === product._id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        { productId: product._id, name: product.name, price: product.price, stock: product.stock, quantity: 1 },
      ];
    });
  }

  function changeQuantity(productId, delta) {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productId !== productId) return item;
          const nextQty = Math.min(item.stock, Math.max(1, item.quantity + delta));
          return { ...item, quantity: nextQty };
        })
        .filter(Boolean)
    );
  }

  function removeFromCart(productId) {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountValue = Math.max(0, Number(discount) || 0);
  const total = Math.max(0, subtotal - discountValue);

  async function completeBill() {
    setError('');
    if (cart.length === 0) {
      setError('Cart is empty. Add at least one product.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post('/billing', {
        customerName,
        discount: discountValue,
        paymentMethod,
        items: cart.map((item) => ({ productId: item.productId, quantity: item.quantity })),
      });
      navigate(`/sales/${res.data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete bill.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppLayout title="Billing">
      <div className="billing-layout">
        <div className="panel billing-products">
          <input
            className="search-input"
            type="text"
            placeholder="Search products by name or barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="product-grid">
            {filteredProducts.map((p) => (
              <button
                key={p._id}
                className="product-tile"
                onClick={() => addToCart(p)}
                disabled={p.stock <= 0}
              >
                <div className="product-tile-name">{p.name}</div>
                <div className="product-tile-price">₹{p.price.toFixed(2)}</div>
                <div className="product-tile-stock">
                  {p.stock <= 0 ? 'Out of stock' : `${p.stock} in stock`}
                </div>
              </button>
            ))}
            {filteredProducts.length === 0 && <p className="empty-text">No products match your search.</p>}
          </div>
        </div>

        <div className="panel billing-cart">
          <h3>Current Bill</h3>

          <input
            type="text"
            placeholder="Customer name (optional)"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="cart-customer-input"
          />

          {cart.length === 0 ? (
            <p className="empty-text">Cart is empty. Click a product to add it.</p>
          ) : (
            <div className="cart-items">
              {cart.map((item) => (
                <div className="cart-item" key={item.productId}>
                  <div className="cart-item-info">
                    <div>{item.name}</div>
                    <div className="cart-item-price">₹{item.price.toFixed(2)} each</div>
                  </div>
                  <div className="cart-item-qty">
                    <button onClick={() => changeQuantity(item.productId, -1)}>-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => changeQuantity(item.productId, 1)}>+</button>
                  </div>
                  <div className="cart-item-total">₹{(item.price * item.quantity).toFixed(2)}</div>
                  <button className="cart-item-remove" onClick={() => removeFromCart(item.productId)}>
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="cart-summary">
            <div className="cart-summary-row">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="cart-summary-row">
              <span>Discount</span>
              <input
                type="number"
                min="0"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="discount-input"
              />
            </div>
            <div className="cart-summary-row cart-summary-total">
              <span>Total</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
          </div>

          <label>Payment Method</label>
          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
            <option value="CASH">Cash</option>
            <option value="UPI">UPI</option>
            <option value="CARD">Card</option>
          </select>

          {error && <div className="alert alert-error">{error}</div>}

          <button className="btn btn-primary btn-block" onClick={completeBill} disabled={submitting}>
            {submitting ? 'Processing...' : 'Complete Bill'}
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
