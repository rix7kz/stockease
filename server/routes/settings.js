const express = require('express');
const User = require('../models/User');
const requireAuth = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// GET /api/settings - current shop info
router.get('/', async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({
      shopName: user.shopName,
      ownerName: user.ownerName || user.name,
      email: user.email,
    });
  } catch (err) {
    console.error('Get settings error:', err);
    res.status(500).json({ message: 'Failed to load settings.' });
  }
});

// PUT /api/settings - update shop info
router.put('/', async (req, res) => {
  try {
    const { shopName, ownerName, email } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    if (shopName !== undefined) user.shopName = shopName.trim();
    if (ownerName !== undefined) user.ownerName = ownerName.trim();

    if (email !== undefined && email.toLowerCase().trim() !== user.email) {
      const existing = await User.findOne({ email: email.toLowerCase().trim() });
      if (existing) {
        return res.status(409).json({ message: 'This email is already in use.' });
      }
      user.email = email.toLowerCase().trim();
    }

    await user.save();
    res.json({ shopName: user.shopName, ownerName: user.ownerName, email: user.email });
  } catch (err) {
    console.error('Update settings error:', err);
    res.status(500).json({ message: 'Failed to update settings.' });
  }
});

module.exports = router;
