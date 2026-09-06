import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import AppLayout from '../components/AppLayout.jsx';

export default function Reports() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/reports')
      .then((res) => setData(res.data))
      .catch(() => setError('Failed to load reports.'));
  }, []);

  if (error) {
    return (
      <AppLayout title="Reports">
        <div className="alert alert-error">{error}</div>
      </AppLayout>
    );
  }
  if (!data) {
    return (
      <AppLayout title="Reports">
        <p>Loading reports...</p>
      </AppLayout>
    );
  }

  const maxDaily = Math.max(1, ...data.dailySales.map((d) => d.total));

  return (
    <AppLayout title="Reports">
      <div className="cards-grid">
        <StatCard label="Today's Sales" value={`₹${data.todaysSales.toFixed(2)}`} sub={`${data.todaysBillCount} bills`} color="blue" />
        <StatCard label="This Week" value={`₹${data.weeklySales.toFixed(2)}`} sub={`${data.weeklyBillCount} bills`} color="green" />
        <StatCard label="This Month" value={`₹${data.monthlySales.toFixed(2)}`} sub={`${data.monthlyBillCount} bills`} color="purple" />
      </div>

      <div className="panels-grid">
        <div className="panel">
          <h3>Sales - Last 7 Days</h3>
          <div className="bar-chart">
            {data.dailySales.map((d) => (
              <div className="bar-chart-col" key={d.date}>
                <div
                  className="bar-chart-bar"
                  style={{ height: `${(d.total / maxDaily) * 100}%` }}
                  title={`₹${d.total.toFixed(2)}`}
                />
                <div className="bar-chart-label">{d.date.slice(5)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <h3>Best-Selling Products</h3>
          {data.bestSellers.length === 0 ? (
            <p className="empty-text">No sales recorded yet.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Units Sold</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.bestSellers.map((item) => (
                  <tr key={item.name}>
                    <td>{item.name}</td>
                    <td>{item.quantitySold}</td>
                    <td>₹{item.revenue.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function StatCard({ label, value, sub, color }) {
  return (
    <div className={`stat-card stat-${color}`}>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}
