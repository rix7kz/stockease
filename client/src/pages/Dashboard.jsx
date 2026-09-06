import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import AppLayout from '../components/AppLayout.jsx';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/dashboard')
      .then((res) => setData(res.data))
      .catch(() => setError('Failed to load dashboard data.'));
  }, []);

  return (
    <AppLayout title="Dashboard">
      {error && <div className="alert alert-error">{error}</div>}
      {!data && !error && <p>Loading dashboard...</p>}

      {data && (
        <>
          <div className="cards-grid">
            <StatCard label="Total Products" value={data.totalProducts} color="blue" />
            <StatCard label="Available" value={data.availableProducts} color="green" />
            <StatCard label="Low Stock" value={data.lowStockProducts} color="orange" />
            <StatCard label="Out of Stock" value={data.outOfStockProducts} color="red" />
            <StatCard label="Today's Sales" value={`₹${data.todaysSales.toFixed(2)}`} color="purple" />
            <StatCard label="Today's Bills" value={data.todaysBills} color="teal" />
          </div>

          <div className="panels-grid">
            <div className="panel">
              <div className="panel-header">
                <h3>Recent Bills</h3>
                <Link to="/sales" className="link">
                  View all
                </Link>
              </div>
              {data.recentBills.length === 0 ? (
                <p className="empty-text">No bills yet. Create one from Billing.</p>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Bill #</th>
                      <th>Customer</th>
                      <th>Total</th>
                      <th>Payment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentBills.map((bill) => (
                      <tr key={bill._id}>
                        <td>{bill.billNumber}</td>
                        <td>{bill.customerName}</td>
                        <td>₹{bill.total.toFixed(2)}</td>
                        <td>{bill.paymentMethod}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="panel">
              <div className="panel-header">
                <h3>Low Stock Alerts</h3>
                <Link to="/inventory" className="link">
                  View inventory
                </Link>
              </div>
              {data.lowStockList.length === 0 ? (
                <p className="empty-text">All products are sufficiently stocked.</p>
              ) : (
                <ul className="alert-list">
                  {data.lowStockList.map((p) => (
                    <li key={p._id}>
                      <span>{p.name}</span>
                      <span className="alert-list-value">{p.stock} left</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </AppLayout>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className={`stat-card stat-${color}`}>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
