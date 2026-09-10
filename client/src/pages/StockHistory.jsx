import React, { useEffect, useState } from "react";
import api from "../api";
import { useToast } from "../components/Toast";

const typeBadge = {
  PURCHASE: "badge-success",
  SALE: "badge-info",
  RETURN: "badge-warning",
  ADJUSTMENT: "badge-neutral",
};

export default function StockHistory() {
  const [movements, setMovements] = useState([]);
  const [typeFilter, setTypeFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    setLoading(true);
    api
      .get("/stock", { params: { type: typeFilter } })
      .then((res) => setMovements(res.data.movements))
      .catch(() => showToast("Failed to load stock history.", "error"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter]);

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Stock History</h1>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="all">All Types</option>
          <option value="PURCHASE">Purchase</option>
          <option value="SALE">Sale</option>
          <option value="RETURN">Return</option>
          <option value="ADJUSTMENT">Adjustment</option>
        </select>
      </div>

      {loading ? (
        <div className="page-loading">Loading stock history...</div>
      ) : movements.length === 0 ? (
        <div className="empty-state">No stock movements recorded yet.</div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Product</th>
                <th>Movement Type</th>
                <th>Quantity</th>
                <th>Previous → New Stock</th>
                <th>Reference</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => (
                <tr key={m._id}>
                  <td>{new Date(m.createdAt).toLocaleString()}</td>
                  <td>{m.productName}</td>
                  <td>
                    <span className={`badge ${typeBadge[m.type]}`}>{m.type}</span>
                  </td>
                  <td>{m.quantity > 0 ? `+${m.quantity}` : m.quantity}</td>
                  <td>
                    {m.previousStock} → {m.newStock}
                  </td>
                  <td>{m.reference || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
