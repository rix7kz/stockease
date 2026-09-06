const express = require('express');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Bill = require('../models/Bill');
const requireAuth = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// GET /api/dashboard - all the numbers the Dashboard page needs, computed live from MongoDB
router.get('/', async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);

    const products = await Product.find({ user: userId });
    const totalProducts = products.length;
    let availableProducts = 0;
    let lowStockProducts = 0;
    let outOfStockProducts = 0;
    const lowStockList = [];

    for (const p of products) {
      if (p.stock <= 0) {
        outOfStockProducts += 1;
      } else if (p.stock <= p.minimumStock) {
        lowStockProducts += 1;
        lowStockList.push(p);
      } else {
        availableProducts += 1;
      }
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todaysBills = await Bill.find({ user: userId, createdAt: { $gte: startOfToday } });
    const todaysSales = todaysBills.reduce((sum, b) => sum + b.total, 0);

    const recentBills = await Bill.find({ user: userId }).sort({ createdAt: -1 }).limit(5);

    res.json({
      totalProducts,
      availableProducts,
      lowStockProducts,
      outOfStockProducts,
      todaysSales,
      todaysBills: todaysBills.length,
      recentBills,
      lowStockList: lowStockList.slice(0, 8),
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ message: 'Failed to load dashboard data.' });
  }
});

module.exports = router;
