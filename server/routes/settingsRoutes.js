const express = require("express");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();
router.use(authMiddleware);

// GET /api/settings
router.get("/", async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found." });
    return res.json({
      settings: { shopName: user.shopName, name: user.name, email: user.email },
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch settings.", error: err.message });
  }
});

// PUT /api/settings
router.put("/", async (req, res) => {
  try {
    const { shopName, name, email } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found." });

    if (shopName !== undefined) user.shopName = shopName.trim();
    if (name !== undefined) user.name = name.trim();
    if (email !== undefined) user.email = email.toLowerCase().trim();

    await user.save();
    return res.json({
      message: "Settings updated.",
      settings: { shopName: user.shopName, name: user.name, email: user.email },
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to update settings.", error: err.message });
  }
});

module.exports = router;
