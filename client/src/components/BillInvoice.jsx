import React from "react";
import { useAuth } from "../context/AuthContext";

export default function BillInvoice({ bill, onClose }) {
  const { user } = useAuth();

  if (!bill) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal invoice-modal" onClick={(e) => e.stopPropagation()}>
        <div className="invoice" id="invoice-print">
          <div className="invoice-header">
            <h2>STOCKEASE</h2>
            <p>{user?.shopName}</p>
          </div>
          <div className="invoice-meta">
            <span>Bill No: {bill.billNumber}</span>
            <span>Date: {new Date(bill.createdAt).toLocaleString()}</span>
            <span>Customer: {bill.customerName}</span>
          </div>
          <table className="invoice-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {bill.items.map((item) => (
                <tr key={item.productId}>
                  <td>{item.productName}</td>
                  <td>{item.quantity}</td>
                  <td>₹{item.price.toFixed(2)}</td>
                  <td>₹{item.total.toFixed(2)}</td>
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
              <span>TOTAL</span>
              <span>₹{bill.total.toFixed(2)}</span>
            </div>
            <div>
              <span>Payment</span>
              <span>{bill.paymentMethod}</span>
            </div>
          </div>
        </div>
        <div className="modal-actions no-print">
          <button className="btn btn-ghost" onClick={onClose}>
            Close
          </button>
          <button className="btn btn-primary" onClick={() => window.print()}>
            Print Invoice
          </button>
        </div>
      </div>
    </div>
  );
}
