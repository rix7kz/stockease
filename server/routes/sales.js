const express = require('express');
const Bill = require('../models/Bill');
const requireAuth = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// GET /api/sales - list all bills for the logged-in user, most recent first
router.get('/', async (req, res) => {
  try {
    const bills = await Bill.find({ user: req.userId }).sort({ createdAt: -1 });
    res.json(bills);
  } catch (err) {
    console.error('List sales error:', err);
    res.status(500).json({ message: 'Failed to load sales.' });
  }
});

// GET /api/sales/:id - view a single bill (for the print invoice page)
router.get('/:id', async (req, res) => {
  try {
    const bill = await Bill.findOne({ _id: req.params.id, user: req.userId });
    if (!bill) return res.status(404).json({ message: 'Bill not found.' });
    res.json(bill);
  } catch (err) {
    console.error('Get bill error:', err);
    res.status(500).json({ message: 'Failed to load bill.' });
  }
});

module.exports = router;
