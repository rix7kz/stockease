const express = require('express');
const Product = require('../models/Product');
const StockHistory = require('../models/StockHistory');
const requireAuth = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth); // every route below requires a logged-in user

// GET /api/products?search=&category=
router.get('/', async (req, res) => {
  try {
    const { search, category } = req.query;
    const filter = { user: req.userId };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } },
      ];
    }
    if (category && category !== 'All') {
      filter.category = category;
    }

    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    console.error('List products error:', err);
    res.status(500).json({ message: 'Failed to load inventory.' });
  }
});

// POST /api/products
router.post('/', async (req, res) => {
  try {
    const { name, category, price, stock, minimumStock, barcode } = req.body;

    if (!name || price === undefined || price === null) {
      return res.status(400).json({ message: 'Product name and price are required.' });
    }
    if (Number(price) < 0 || Number(stock) < 0 || Number(minimumStock) < 0) {
      return res.status(400).json({ message: 'Price and stock values cannot be negative.' });
    }

    const product = await Product.create({
      user: req.userId,
      name: name.trim(),
      category: (category || 'General').trim(),
      price: Number(price),
      stock: Number(stock) || 0,
      minimumStock: minimumStock === undefined ? 5 : Number(minimumStock),
      barcode: (barcode || '').trim(),
    });

    if (product.stock > 0) {
      await StockHistory.create({
        user: req.userId,
        product: product._id,
        productName: product.name,
        type: 'CREATE',
        quantity: product.stock,
        previousStock: 0,
        newStock: product.stock,
        reference: 'Initial stock on product creation',
      });
    }

    res.status(201).json(product);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'A product with this barcode already exists.' });
    }
    console.error('Create product error:', err);
    res.status(500).json({ message: 'Failed to create product.' });
  }
});

// PUT /api/products/:id
router.put('/:id', async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, user: req.userId });
    if (!product) return res.status(404).json({ message: 'Product not found.' });

    const { name, category, price, stock, minimumStock, barcode } = req.body;
    const previousStock = product.stock;

    if (name !== undefined) product.name = name.trim();
    if (category !== undefined) product.category = category.trim();
    if (price !== undefined) product.price = Number(price);
    if (minimumStock !== undefined) product.minimumStock = Number(minimumStock);
    if (barcode !== undefined) product.barcode = barcode.trim();

    let stockChanged = false;
    if (stock !== undefined && Number(stock) !== previousStock) {
      if (Number(stock) < 0) {
        return res.status(400).json({ message: 'Stock cannot be negative.' });
      }
      product.stock = Number(stock);
      stockChanged = true;
    }

    await product.save();

    if (stockChanged) {
      await StockHistory.create({
        user: req.userId,
        product: product._id,
        productName: product.name,
        type: 'ADJUSTMENT',
        quantity: product.stock - previousStock,
        previousStock,
        newStock: product.stock,
        reference: 'Manual edit from Inventory page',
      });
    }

    res.json(product);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'A product with this barcode already exists.' });
    }
    console.error('Update product error:', err);
    res.status(500).json({ message: 'Failed to update product.' });
  }
});

// DELETE /api/products/:id
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!product) return res.status(404).json({ message: 'Product not found.' });

    if (product.stock > 0) {
      await StockHistory.create({
        user: req.userId,
        product: product._id,
        productName: product.name,
        type: 'DELETE',
        quantity: -product.stock,
        previousStock: product.stock,
        newStock: 0,
        reference: 'Product deleted from Inventory page',
      });
    }

    res.json({ message: 'Product deleted successfully.' });
  } catch (err) {
    console.error('Delete product error:', err);
    res.status(500).json({ message: 'Failed to delete product.' });
  }
});

module.exports = router;
