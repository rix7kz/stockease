import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import AppLayout from '../components/AppLayout.jsx';

export default function Sales() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/sales')
      .then((res) => setBills(res.data))
      .catch(() => setError('Failed to load sales.'))
      .finally(() => setLoading(false));
  }, []);

  function handleExport() {
    window.open('/api/export/sales', '_blank');
  }

  return (
    <AppLayout title="Sales">
      <div className="toolbar">
        <div />
        <div className="toolbar-actions">
          <button className="btn btn-outline" onClick={handleExport}>
            Export Excel
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="panel">
        {loading ? (
          <p>Loading sales...</p>
        ) : bills.length === 0 ? (
          <p className="empty-text">No bills yet. Create one from Billing.</p>
        ) : (
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Bill #</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {bills.map((bill) => (
                  <tr key={bill._id}>
                    <td>{bill.billNumber}</td>
                    <td>{new Date(bill.createdAt).toLocaleString()}</td>
                    <td>{bill.customerName}</td>
                    <td>₹{bill.total.toFixed(2)}</td>
                    <td>{bill.paymentMethod}</td>
                    <td>
                      <Link className="btn-link" to={`/sales/${bill._id}`}>
                        View
                      </Link>
                    </td>
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
