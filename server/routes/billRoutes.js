const express = require("express");
const mongoose = require("mongoose");
const Product = require("../models/Product");
const Bill = require("../models/Bill");
const StockMovement = require("../models/StockMovement");
const authMiddleware = require("../middleware/authMiddleware");
const generateBillNumber = require("../utils/generateBillNumber");

const router = express.Router();
router.use(authMiddleware);

// GET /api/bills - the logged-in user's sales history.
router.get("/", async (req, res) => {
  try {
    const bills = await Bill.find({ userId: req.userId }).sort({ createdAt: -1 });
    return res.json({ bills });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch bills.", error: err.message });
  }
});

// GET /api/bills/:id
router.get("/:id", async (req, res) => {
  try {
    const bill = await Bill.findOne({ _id: req.params.id, userId: req.userId });
    if (!bill) return res.status(404).json({ message: "Bill not found." });
    return res.json({ bill });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch bill.", error: err.message });
  }
});

// Runs the actual billing + stock-deduction logic. Shared by both the
// transactional and non-transactional code paths below so the business
// logic itself never has to change based on which path was taken.
async function processBill({ userId, customerName, items, discount, paymentMethod, session }) {
  const opts = session ? { session } : {};

  // 1. Validate and load every product from MongoDB - never trust
  //    anything about price or availability sent from the frontend.
  const billItems = [];
  let subtotal = 0;

  for (const requested of items) {
    const { productId, quantity } = requested;
    const qty = Number(quantity);

    if (!productId || !qty || qty <= 0) {
      throw { status: 400, message: "Each item needs a valid productId and a positive quantity." };
    }

    // Ownership check happens right here in the query itself.
    const product = await Product.findOne({ _id: productId, userId }).session(session || null);

    if (!product) {
      throw { status: 404, message: `Product not found: ${productId}` };
    }
    if (product.stock < qty) {
      throw {
        status: 400,
        message: `Insufficient stock for "${product.name}". Only ${product.stock} unit(s) available.`,
      };
    }

    // Price and total are always computed from the DB record, never
    // from the frontend.
    const lineTotal = product.price * qty;
    subtotal += lineTotal;

    billItems.push({
      product,
      billItem: {
        productId: product._id,
        productName: product.name,
        quantity: qty,
        price: product.price,
        costPrice: product.purchasePrice,
        total: lineTotal,
      },
    });
  }

  const discountAmount = Number(discount) || 0;
  const total = Math.max(subtotal - discountAmount, 0);

  const billNumber = await generateBillNumber();

  const [bill] = await Bill.create(
    [
      {
        userId,
        billNumber,
        customerName: customerName?.trim() || "Walk-in Customer",
        items: billItems.map((i) => i.billItem),
        subtotal,
        discount: discountAmount,
        total,
        paymentMethod: paymentMethod || "CASH",
      },
    ],
    opts
  );

  // 2. Deduct stock and 3. write a stock movement per product.
  for (const { product, billItem } of billItems) {
    const previousStock = product.stock;
    const newStock = previousStock - billItem.quantity;

    product.stock = newStock;
    await product.save(opts);

    await StockMovement.create(
      [
        {
          userId,
          productId: product._id,
          productName: product.name,
          type: "SALE",
          quantity: -billItem.quantity,
          previousStock,
          newStock,
          reference: billNumber,
        },
      ],
      opts
    );
  }

  return bill;
}

// POST /api/bills - complete a sale. Uses a MongoDB transaction when
// the deployment supports one (e.g. a replica set); a local single-node
// mongod does not support transactions, so we transparently fall back
// to sequential operations in that case. Either way the validation
// logic (ownership, price, stock) above never trusts the frontend.
router.post("/", async (req, res) => {
  const { customerName, items, discount, paymentMethod } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "A bill must contain at least one item." });
  }

  const session = await mongoose.startSession();
  try {
    let bill;
    try {
      await session.withTransaction(async () => {
        bill = await processBill({ userId: req.userId, customerName, items, discount, paymentMethod, session });
      });
    } catch (txErr) {
      // Standalone MongoDB instances (no replica set) reject
      // transactions outright - fall back to a non-transactional run.
      if (txErr.status) throw txErr; // our own validation error, don't retry
      bill = await processBill({ userId: req.userId, customerName, items, discount, paymentMethod, session: null });
    }

    return res.status(201).json({ message: "Bill completed successfully.", bill });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ message: err.message || "Failed to complete bill.", error: err.error });
  } finally {
    session.endSession();
  }
});

module.exports = router;
