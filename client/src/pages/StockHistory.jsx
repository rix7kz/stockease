import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import AppLayout from '../components/AppLayout.jsx';

const TYPE_LABELS = {
  SALE: 'Sale',
  RESTOCK: 'Restock',
  ADJUSTMENT: 'Adjustment',
  CREATE: 'Created',
  DELETE: 'Deleted',
};

export default function StockHistory() {
  const [history, setHistory] = useState([]);
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    api
      .get('/stock-history', { params: typeFilter ? { type: typeFilter } : {} })
      .then((res) => setHistory(res.data))
      .catch(() => setError('Failed to load stock history.'))
      .finally(() => setLoading(false));
  }, [typeFilter]);

  function handleExport() {
    window.open('/api/export/stock-history', '_blank');
  }

  return (
    <AppLayout title="Stock History">
      <div className="toolbar">
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="filter-select">
          <option value="">All Types</option>
          <option value="SALE">Sale</option>
          <option value="RESTOCK">Restock</option>
          <option value="ADJUSTMENT">Adjustment</option>
          <option value="CREATE">Created</option>
          <option value="DELETE">Deleted</option>
        </select>
        <div className="toolbar-actions">
          <button className="btn btn-outline" onClick={handleExport}>
            Export Excel
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="panel">
        {loading ? (
          <p>Loading stock history...</p>
        ) : history.length === 0 ? (
          <p className="empty-text">No stock movements recorded yet.</p>
        ) : (
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Product</th>
                  <th>Type</th>
                  <th>Quantity</th>
                  <th>Previous</th>
                  <th>New</th>
                  <th>Reference</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h._id}>
                    <td>{new Date(h.createdAt).toLocaleString()}</td>
                    <td>{h.productName}</td>
                    <td>{TYPE_LABELS[h.type] || h.type}</td>
                    <td className={h.quantity < 0 ? 'text-negative' : 'text-positive'}>
                      {h.quantity > 0 ? `+${h.quantity}` : h.quantity}
                    </td>
                    <td>{h.previousStock}</td>
                    <td>{h.newStock}</td>
                    <td>{h.reference || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
