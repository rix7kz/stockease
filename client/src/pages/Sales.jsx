import React, { useEffect, useState } from "react";
import api from "../api";
import BillInvoice from "../components/BillInvoice";
import { useToast } from "../components/Toast";

export default function Sales() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingBill, setViewingBill] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    api
      .get("/bills")
      .then((res) => setBills(res.data.bills))
      .catch(() => showToast("Failed to load sales history.", "error"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="page">
      <h1 className="page-title">Sales</h1>

      {loading ? (
        <div className="page-loading">Loading sales history...</div>
      ) : bills.length === 0 ? (
        <div className="empty-state">No sales yet. Complete a bill from Billing to see it here.</div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Bill Number</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Payment Method</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bills.map((b) => (
                <tr key={b._id}>
                  <td>{b.billNumber}</td>
                  <td>{new Date(b.createdAt).toLocaleString()}</td>
                  <td>{b.customerName}</td>
                  <td>{b.items.length} item(s)</td>
                  <td>₹{b.total.toFixed(2)}</td>
                  <td>{b.paymentMethod}</td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={() => setViewingBill(b)}>
                      View / Print
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {viewingBill && <BillInvoice bill={viewingBill} onClose={() => setViewingBill(null)} />}
    </div>
  );
}
