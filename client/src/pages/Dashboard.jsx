import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import StatCard from "../components/StatCard";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .get("/reports/dashboard")
      .then((res) => {
        if (active) setData(res.data);
      })
      .catch(() => setError("Failed to load dashboard data."))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <div className="page-loading">Loading dashboard...</div>;
  if (error) return <div className="alert alert-error">{error}</div>;

  const { stats, recentBills, lowStockProducts } = data;

  return (
    <div className="page">
      <h1 className="page-title">Dashboard</h1>

      <div className="stat-grid">
        <StatCard label="Total Products" value={stats.totalProducts} icon="📦" />
        <StatCard label="Available Products" value={stats.availableProducts} icon="✅" tone="success" />
        <StatCard label="Low Stock" value={stats.lowStockCount} icon="⚠️" tone="warning" />
        <StatCard label="Out of Stock" value={stats.outOfStockCount} icon="⛔" tone="danger" />
        <StatCard label="Today's Sales" value={`₹${stats.todaysSales.toFixed(2)}`} icon="💰" tone="success" />
        <StatCard label="Today's Bills" value={stats.todaysBillsCount} icon="🧾" />
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header">
            <h3>Recent Bills</h3>
            <Link to="/sales" className="link">View all</Link>
          </div>
          {recentBills.length === 0 ? (
            <div className="empty-state">No bills yet. Create your first bill from Billing.</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Bill No</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentBills.map((b) => (
                  <tr key={b._id}>
                    <td>{b.billNumber}</td>
                    <td>{b.customerName}</td>
                    <td>₹{b.total.toFixed(2)}</td>
                    <td>{new Date(b.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Low Stock Products</h3>
            <Link to="/inventory" className="link">View inventory</Link>
          </div>
          {lowStockProducts.length === 0 ? (
            <div className="empty-state">Nothing running low right now.</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Current</th>
                  <th>Minimum</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {lowStockProducts.map((p) => (
                  <tr key={p._id}>
                    <td>{p.name}</td>
                    <td>{p.stock}</td>
                    <td>{p.minimumStock}</td>
                    <td>
                      <span className="badge badge-warning">LOW STOCK</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
