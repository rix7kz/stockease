const express = require("express");
const mongoose = require("mongoose");
const Product = require("../models/Product");
const Bill = require("../models/Bill");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();
router.use(authMiddleware);
const DAY = 24 * 60 * 60 * 1000;
function startOfDay(date = new Date()) { const d = new Date(date); d.setHours(0, 0, 0, 0); return d; }
function expiryStatus(expiryDate) {
  if (!expiryDate) return "NO_EXPIRY";
  const days = Math.ceil((startOfDay(expiryDate) - startOfDay()) / DAY);
  if (days < 0) return "EXPIRED";
  if (days <= 7) return "EXPIRING_SOON";
  return "GOOD";
}
function trendFor(current, previous) {
  if (!previous && !current) return "NO_DATA";
  if (!previous) return "INCREASING";
  const change = (current - previous) / previous;
  if (change > 0.1) return "INCREASING";
  if (change < -0.1) return "DECREASING";
  return "STABLE";
}
async function buildAnalytics(userId) {
  const today = startOfDay();
  const thirtyDaysAgo = new Date(today); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  const fourteenDaysAgo = new Date(today); fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
  const products = await Product.find({ userId }).lean();
  const bills = await Bill.find({ userId, createdAt: { $gte: thirtyDaysAgo } }).lean();
  const productMap = new Map(products.map((p) => [String(p._id), p]));
  const sales = new Map();
  let revenue = 0; let cost = 0;
  bills.forEach((bill) => bill.items.forEach((item) => {
    const id = String(item.productId); const row = sales.get(id) || { total: 0, last7: 0, previous7: 0, revenue: 0, cost: 0 };
    const age = Math.floor((today - startOfDay(bill.createdAt)) / DAY);
    row.total += item.quantity; row.revenue += item.total; row.cost += (item.costPrice ?? productMap.get(id)?.purchasePrice ?? 0) * item.quantity;
    if (age >= 0 && age < 7) row.last7 += item.quantity;
    else if (age >= 7 && age < 14) row.previous7 += item.quantity;
    sales.set(id, row); revenue += item.total; cost += (item.costPrice ?? productMap.get(id)?.purchasePrice ?? 0) * item.quantity;
  }));
  const productInsights = products.map((product) => {
    const row = sales.get(String(product._id)) || { total: 0, last7: 0, previous7: 0, revenue: 0, cost: 0 };
    const averageDailySales = row.total ? row.total / 30 : 0;
    const daysRemaining = averageDailySales > 0 ? product.stock / averageDailySales : null;
    const recommendedRestock = averageDailySales > 0 ? Math.max(0, Math.ceil(averageDailySales * 7 + product.minimumStock - product.stock)) : 0;
    const expiryStatusValue = expiryStatus(product.expiryDate);
    const stockStatus = product.stock <= 0 ? "OUT_OF_STOCK" : product.stock <= product.minimumStock ? "LOW_STOCK" : "AVAILABLE";
    return { ...product, unitsSold: row.total, weeklySales: row.last7, averageDailySales, daysRemaining, recommendedRestock, trend: trendFor(row.last7, row.previous7), revenue: row.revenue, cost: row.cost, profit: row.revenue - row.cost, expiryStatus: expiryStatusValue, status: stockStatus };
  });
  const restockRecommendations = productInsights.filter((p) => p.averageDailySales > 0 && (p.stock <= p.minimumStock || p.daysRemaining <= 7)).sort((a,b) => (a.daysRemaining ?? Infinity) - (b.daysRemaining ?? Infinity));
  const expiringProducts = productInsights.filter((p) => p.expiryStatus === "EXPIRING_SOON" || p.expiryStatus === "EXPIRED").sort((a,b) => new Date(a.expiryDate) - new Date(b.expiryDate));
  const categories = {};
  productInsights.forEach((p) => { const category = categories[p.category] || { category: p.category, revenue: 0, cost: 0, profit: 0 }; category.revenue += p.revenue; category.cost += p.cost; category.profit += p.profit; categories[p.category] = category; });
  const insights = [];
  const critical = productInsights.filter((p) => p.status !== "AVAILABLE");
  if (critical.length) insights.push({ tone: "warning", text: `${critical.length} product${critical.length === 1 ? " is" : "s are"} low or out of stock.` });
  restockRecommendations.slice(0, 2).forEach((p) => insights.push({ tone: "warning", text: `${p.name} may run out in approximately ${Math.max(1, Math.ceil(p.daysRemaining))} day(s). Consider restocking ${p.recommendedRestock} unit(s).` }));
  productInsights.filter((p) => p.trend === "INCREASING").slice(0, 1).forEach((p) => insights.push({ tone: "info", text: `${p.name} sales are increasing compared with the previous week.` }));
  productInsights.filter((p) => p.trend === "DECREASING").slice(0, 1).forEach((p) => insights.push({ tone: "info", text: `${p.name} sales have decreased this week.` }));
  if (expiringProducts.length) insights.push({ tone: "danger", text: `${expiringProducts.length} product${expiringProducts.length === 1 ? " is" : "s are"} expiring within 7 days or already expired.` });
  const bestProfit = [...productInsights].sort((a,b) => b.profit - a.profit)[0];
  if (bestProfit?.profit > 0) insights.push({ tone: "success", text: `${bestProfit.name} generated the highest estimated profit in the last 30 days.` });
  return { productInsights, restockRecommendations, expiringProducts, insights, profit: { revenue, cost, estimatedProfit: revenue - cost, byProduct: productInsights.filter((p) => p.unitsSold).sort((a,b) => b.profit-a.profit), byCategory: Object.values(categories).sort((a,b) => b.profit-a.profit) } };
}

router.get("/dashboard", async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId); const analytics = await buildAnalytics(userId); const todayStart = startOfDay();
    const todaysBills = await Bill.find({ userId, createdAt: { $gte: todayStart } }).sort({ createdAt: -1 }); const recentBills = await Bill.find({ userId }).sort({ createdAt: -1 }).limit(5);
    const lowStockProducts = analytics.productInsights.filter((p) => p.status === "LOW_STOCK").slice(0, 10);
    res.json({ stats: { totalProducts: analytics.productInsights.length, availableProducts: analytics.productInsights.filter((p) => p.status === "AVAILABLE").length, lowStockCount: lowStockProducts.length, outOfStockCount: analytics.productInsights.filter((p) => p.status === "OUT_OF_STOCK").length, todaysSales: todaysBills.reduce((sum,b) => sum+b.total,0), todaysBillsCount: todaysBills.length }, recentBills, lowStockProducts, ...analytics });
  } catch (err) { res.status(500).json({ message: "Failed to load dashboard.", error: err.message }); }
});
router.get("/", async (req, res) => {
  try { const userId = new mongoose.Types.ObjectId(req.userId); const analytics = await buildAnalytics(userId); const today = startOfDay(); const week = new Date(today); week.setDate(week.getDate()-6); const month = new Date(today); month.setDate(month.getDate()-29); const bills = await Bill.find({userId, createdAt: {$gte: month}}).lean(); const daily = {}; bills.forEach(b => { const key = startOfDay(b.createdAt).toISOString().slice(0,10); daily[key] = (daily[key] || 0) + b.total; }); const dailySales = Object.entries(daily).filter(([date]) => new Date(date) >= week).map(([ _id, total ]) => ({ _id, total })).sort((a,b) => a._id.localeCompare(b._id)); res.json({ todaysSales: bills.filter(b => b.createdAt >= today).reduce((s,b)=>s+b.total,0), weeklySales: bills.filter(b => b.createdAt >= week).reduce((s,b)=>s+b.total,0), monthlySales: bills.reduce((s,b)=>s+b.total,0), totalBills: await Bill.countDocuments({userId}), dailySales, bestSellers: analytics.productInsights.filter(p=>p.unitsSold).sort((a,b)=>b.unitsSold-a.unitsSold).slice(0,5).map(p=>({_id:p.name,quantitySold:p.unitsSold,revenue:p.revenue})), ...analytics }); } catch (err) { res.status(500).json({message:"Failed to load reports.",error:err.message}); }
});
module.exports = router;