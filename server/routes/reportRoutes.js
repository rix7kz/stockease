const express = require("express");
const mongoose = require("mongoose");
const Product = require("../models/Product");
const Bill = require("../models/Bill");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();
router.use(authMiddleware);

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

// GET /api/reports/dashboard - stats for the dashboard page.
router.get("/dashboard", async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);
    const products = await Product.find({ userId });

    const totalProducts = products.length;
    const availableProducts = products.filter((p) => p.status === "AVAILABLE").length;
    const lowStock = products.filter((p) => p.status === "LOW_STOCK");
    const outOfStock = products.filter((p) => p.status === "OUT_OF_STOCK").length;

    const todayStart = startOfDay(new Date());
    const todaysBills = await Bill.find({ userId, createdAt: { $gte: todayStart } }).sort({ createdAt: -1 });
    const todaysSales = todaysBills.reduce((sum, b) => sum + b.total, 0);

    const recentBills = await Bill.find({ userId }).sort({ createdAt: -1 }).limit(5);

    return res.json({
      stats: {
        totalProducts,
        availableProducts,
        lowStockCount: lowStock.length,
        outOfStockCount: outOfStock,
        todaysSales,
        todaysBillsCount: todaysBills.length,
      },
      recentBills,
      lowStockProducts: lowStock.slice(0, 10),
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to load dashboard.", error: err.message });
  }
});

// GET /api/reports - sales trends and best sellers for the Reports page.
router.get("/", async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);

    const todayStart = startOfDay(new Date());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 6);
    const monthStart = new Date(todayStart);
    monthStart.setDate(monthStart.getDate() - 29);

    const [todaysAgg, weekAgg, monthAgg, totalBillsCount] = await Promise.all([
      Bill.aggregate([
        { $match: { userId, createdAt: { $gte: todayStart } } },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),
      Bill.aggregate([
        { $match: { userId, createdAt: { $gte: weekStart } } },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),
      Bill.aggregate([
        { $match: { userId, createdAt: { $gte: monthStart } } },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),
      Bill.countDocuments({ userId }),
    ]);

    // Daily sales for the last 7 days - used to drive the simple chart.
    const dailySales = await Bill.aggregate([
      { $match: { userId, createdAt: { $gte: weekStart } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          total: { $sum: "$total" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const bestSellers = await Bill.aggregate([
      { $match: { userId } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productName",
          quantitySold: { $sum: "$items.quantity" },
          revenue: { $sum: "$items.total" },
        },
      },
      { $sort: { quantitySold: -1 } },
      { $limit: 5 },
    ]);

    return res.json({
      todaysSales: todaysAgg[0]?.total || 0,
      weeklySales: weekAgg[0]?.total || 0,
      monthlySales: monthAgg[0]?.total || 0,
      totalBills: totalBillsCount,
      dailySales,
      bestSellers,
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to load reports.", error: err.message });
  }
});

module.exports = router;
