import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import AppLayout from '../components/AppLayout.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function BillView() {
  const { id } = useParams();
  const [bill, setBill] = useState(null);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    api
      .get(`/sales/${id}`)
      .then((res) => setBill(res.data))
      .catch(() => setError('Bill not found.'));
  }, [id]);

  return (
    <AppLayout title="Invoice">
      {error && <div className="alert alert-error">{error}</div>}
      {!bill && !error && <p>Loading invoice...</p>}

      {bill && (
        <div className="panel invoice-panel">
          <div className="invoice-actions no-print">
            <Link to="/sales" className="btn btn-outline">
              &larr; Back to Sales
            </Link>
            <button className="btn btn-primary" onClick={() => window.print()}>
              Print Invoice
            </button>
          </div>

          <div className="invoice" id="invoice">
            <div className="invoice-header">
              <div>
                <h2>{user?.shopName || 'StockEase Shop'}</h2>
                <p>Invoice</p>
              </div>
              <div className="invoice-meta">
                <div>
                  <strong>Bill #:</strong> {bill.billNumber}
                </div>
                <div>
                  <strong>Date:</strong> {new Date(bill.createdAt).toLocaleString()}
                </div>
                <div>
                  <strong>Customer:</strong> {bill.customerName}
                </div>
              </div>
            </div>

            <table className="table invoice-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Qty</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {bill.items.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.name}</td>
                    <td>₹{item.price.toFixed(2)}</td>
                    <td>{item.quantity}</td>
                    <td>₹{item.lineTotal.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="invoice-totals">
              <div>
                <span>Subtotal</span>
                <span>₹{bill.subtotal.toFixed(2)}</span>
              </div>
              <div>
                <span>Discount</span>
                <span>₹{bill.discount.toFixed(2)}</span>
              </div>
              <div className="invoice-grand-total">
                <span>Total</span>
                <span>₹{bill.total.toFixed(2)}</span>
              </div>
              <div>
                <span>Payment Method</span>
                <span>{bill.paymentMethod}</span>
              </div>
            </div>

            <p className="invoice-footer">Thank you for your business!</p>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
