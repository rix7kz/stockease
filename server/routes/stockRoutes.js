const express = require("express");
const StockMovement = require("../models/StockMovement");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();
router.use(authMiddleware);

// GET /api/stock - the logged-in user's stock movement history.
router.get("/", async (req, res) => {
  try {
    const { type } = req.query;
    const filter = { userId: req.userId };
    if (type && type !== "all") filter.type = type;

    const movements = await StockMovement.find(filter).sort({ createdAt: -1 });
    return res.json({ movements });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch stock history.", error: err.message });
  }
});

module.exports = router;
