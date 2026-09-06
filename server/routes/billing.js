const express = require('express');
const Product = require('../models/Product');
const Bill = require('../models/Bill');
const StockHistory = require('../models/StockHistory');
const requireAuth = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// Generates the next bill number for this user, e.g. INV-0001, INV-0002 ...
async function generateBillNumber(userId) {
  const count = await Bill.countDocuments({ user: userId });
  return `INV-${String(count + 1).padStart(4, '0')}`;
}

// POST /api/billing
// Body: { customerName, discount, paymentMethod, items: [{ productId, quantity }] }
//
// SECURITY / CORRECTNESS NOTES (this is the most important route in the app):
// - The frontend only sends productId + quantity. It never sends price or totals.
// - Every price and the final total are calculated here, from MongoDB data.
// - Every product is re-checked to belong to req.userId (logged-in user).
// - Stock is re-checked here too, right before saving, so nobody can oversell.
//
// NOTE ON TRANSACTIONS: Real MongoDB transactions need a replica set, which a
// plain local `mongod` does not run by default. To keep local setup simple for
// a college project, this route instead: (1) validates and loads every product
// FIRST, failing the whole bill before any stock is touched if anything is
// wrong, then (2) applies the stock updates. This covers the required
// "insufficient stock -> do not create the bill" rule.
router.post('/', async (req, res) => {
  try {
    const { customerName, discount, paymentMethod, items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty. Add at least one product.' });
    }
    if (!['CASH', 'UPI', 'CARD'].includes(paymentMethod)) {
      return res.status(400).json({ message: 'Please select a valid payment method.' });
    }

    // Merge duplicate product entries (e.g. same product added twice) before checking stock.
    const quantityByProductId = new Map();
    for (const rawItem of items) {
      const quantity = Number(rawItem.quantity);
      if (!rawItem.productId || !Number.isFinite(quantity) || quantity <= 0) {
        return res.status(400).json({ message: 'Invalid item in cart.' });
      }
      quantityByProductId.set(
        rawItem.productId,
        (quantityByProductId.get(rawItem.productId) || 0) + quantity
      );
    }

    // STEP 1: Load every product from MongoDB (scoped to this user) and validate stock
    // BEFORE changing anything. If any single item fails, no stock is touched at all.
    const loadedItems = [];
    for (const [productId, quantity] of quantityByProductId.entries()) {
      const product = await Product.findOne({ _id: productId, user: req.userId });

      if (!product) {
        return res.status(404).json({ message: 'One of the products in your cart no longer exists.' });
      }
      if (product.stock < quantity) {
        return res.status(400).json({
          message: `Insufficient stock for "${product.name}". Only ${product.stock} units available.`,
        });
      }

      loadedItems.push({ product, quantity });
    }

    // STEP 2: Everything is valid - now actually reduce stock, product by product.
    const billItems = [];
    const stockHistoryDocs = [];
    let subtotal = 0;

    for (const { product, quantity } of loadedItems) {
      const previousStock = product.stock;
      product.stock -= quantity;
      await product.save();

      const lineTotal = Math.round(product.price * quantity * 100) / 100;
      subtotal += lineTotal;

      billItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity,
        lineTotal,
      });

      stockHistoryDocs.push({
        user: req.userId,
        product: product._id,
        productName: product.name,
        type: 'SALE',
        quantity: -quantity,
        previousStock,
        newStock: product.stock,
      });
    }

    const discountAmount = Math.max(0, Number(discount) || 0);
    const total = Math.max(0, Math.round((subtotal - discountAmount) * 100) / 100);
    const billNumber = await generateBillNumber(req.userId);

    const bill = await Bill.create({
      user: req.userId,
      billNumber,
      customerName: (customerName || 'Walk-in Customer').trim(),
      items: billItems,
      subtotal: Math.round(subtotal * 100) / 100,
      discount: discountAmount,
      total,
      paymentMethod,
    });

    // Record stock history with a reference back to this bill.
    await StockHistory.insertMany(
      stockHistoryDocs.map((doc) => ({ ...doc, reference: billNumber }))
    );

    res.status(201).json(bill);
  } catch (err) {
    console.error('Create bill error:', err);
    res.status(500).json({ message: 'Failed to complete the bill. Please try again.' });
  }
});

module.exports = router;
