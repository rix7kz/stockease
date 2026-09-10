import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import api from "../api";
import StatCard from "../components/StatCard";
import { useToast } from "../components/Toast";

export default function Reports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState("");
  const { showToast } = useToast();

  useEffect(() => {
    api
      .get("/reports")
      .then((res) => setData(res.data))
      .catch(() => showToast("Failed to load reports.", "error"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleExport(type) {
    setExporting(type);
    try {
      const res = await api.get(`/export/${type}`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `stockease-${type}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showToast(`${type[0].toUpperCase() + type.slice(1)} exported successfully.`, "success");
    } catch {
      showToast(`Failed to export ${type}.`, "error");
    } finally {
      setExporting("");
    }
  }

  if (loading) return <div className="page-loading">Loading reports...</div>;

  const chartData = data.dailySales.map((d) => ({ date: d._id, sales: d.total }));

  return (
    <div className="page">
      <h1 className="page-title">Reports</h1>

      <div className="stat-grid">
        <StatCard label="Today's Sales" value={`₹${data.todaysSales.toFixed(2)}`} icon="💰" />
        <StatCard label="Weekly Sales" value={`₹${data.weeklySales.toFixed(2)}`} icon="📅" />
        <StatCard label="Monthly Sales" value={`₹${data.monthlySales.toFixed(2)}`} icon="🗓️" />
        <StatCard label="Total Bills" value={data.totalBills} icon="🧾" />
      </div>

      <div className="card">
        <h3>Sales - Last 7 Days</h3>
        {chartData.length === 0 ? (
          <div className="empty-state">No sales in the last 7 days yet.</div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData}>
              <defs>
                <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#22d3ee" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(168, 85, 247, 0.18)" />
              <XAxis dataKey="date" stroke="#9b9bb0" />
              <YAxis stroke="#9b9bb0" />
              <Tooltip
                contentStyle={{
                  background: "#0a0a0f",
                  border: "1px solid rgba(168, 85, 247, 0.35)",
                  color: "#f4f4f8",
                }}
              />
              <Bar dataKey="sales" fill="url(#salesGradient)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="card">
        <h3>Best Selling Products</h3>
        {data.bestSellers.length === 0 ? (
          <div className="empty-state">No sales recorded yet.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Quantity Sold</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {data.bestSellers.map((b) => (
                <tr key={b._id}>
                  <td>{b._id}</td>
                  <td>{b.quantitySold}</td>
                  <td>₹{b.revenue.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h3>Export Data</h3>
        <div className="export-buttons">
          <button className="btn btn-secondary" onClick={() => handleExport("inventory")} disabled={exporting === "inventory"}>
            {exporting === "inventory" ? "Exporting..." : "Export Inventory"}
          </button>
          <button className="btn btn-secondary" onClick={() => handleExport("sales")} disabled={exporting === "sales"}>
            {exporting === "sales" ? "Exporting..." : "Export Sales"}
          </button>
          <button className="btn btn-secondary" onClick={() => handleExport("stock")} disabled={exporting === "stock"}>
            {exporting === "stock" ? "Exporting..." : "Export Stock History"}
          </button>
        </div>
      </div>
    </div>
  );
}
