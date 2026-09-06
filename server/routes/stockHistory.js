const express = require('express');
const StockHistory = require('../models/StockHistory');
const requireAuth = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// GET /api/stock-history?productId=&type=
router.get('/', async (req, res) => {
  try {
    const { productId, type } = req.query;
    const filter = { user: req.userId };
    if (productId) filter.product = productId;
    if (type) filter.type = type;

    const history = await StockHistory.find(filter).sort({ createdAt: -1 }).limit(500);
    res.json(history);
  } catch (err) {
    console.error('List stock history error:', err);
    res.status(500).json({ message: 'Failed to load stock history.' });
  }
});

module.exports = router;
