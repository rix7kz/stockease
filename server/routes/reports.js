const express = require('express');
const mongoose = require('mongoose');
const Bill = require('../models/Bill');
const requireAuth = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

// GET /api/reports - sales totals + best sellers, computed live from MongoDB
router.get('/', async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);

    const now = new Date();
    const todayStart = startOfDay(now);
    const weekStart = startOfDay(new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000));
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [todaysBills, weeklyBills, monthlyBills, allBills] = await Promise.all([
      Bill.find({ user: userId, createdAt: { $gte: todayStart } }),
      Bill.find({ user: userId, createdAt: { $gte: weekStart } }),
      Bill.find({ user: userId, createdAt: { $gte: monthStart } }),
      Bill.find({ user: userId }),
    ]);

    const sum = (bills) => bills.reduce((total, b) => total + b.total, 0);

    // Best-selling products by total quantity sold, computed from bill line items.
    const salesByProduct = new Map();
    for (const bill of allBills) {
      for (const item of bill.items) {
        const key = item.name;
        const existing = salesByProduct.get(key) || { name: item.name, quantitySold: 0, revenue: 0 };
        existing.quantitySold += item.quantity;
        existing.revenue += item.lineTotal;
        salesByProduct.set(key, existing);
      }
    }
    const bestSellers = Array.from(salesByProduct.values())
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 5);

    // Last 7 days of sales, for a simple bar chart on the frontend (local data only).
    const dailySales = [];
    for (let i = 6; i >= 0; i -= 1) {
      const dayStart = startOfDay(new Date(now.getTime() - i * 24 * 60 * 60 * 1000));
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      const total = allBills
        .filter((b) => b.createdAt >= dayStart && b.createdAt < dayEnd)
        .reduce((s, b) => s + b.total, 0);
      dailySales.push({
        date: dayStart.toISOString().slice(0, 10),
        total,
      });
    }

    res.json({
      todaysSales: sum(todaysBills),
      todaysBillCount: todaysBills.length,
      weeklySales: sum(weeklyBills),
      weeklyBillCount: weeklyBills.length,
      monthlySales: sum(monthlyBills),
      monthlyBillCount: monthlyBills.length,
      bestSellers,
      dailySales,
    });
  } catch (err) {
    console.error('Reports error:', err);
    res.status(500).json({ message: 'Failed to load reports.' });
  }
});

module.exports = router;
