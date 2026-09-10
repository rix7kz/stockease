const express = require("express");
const Product = require("../models/Product");
const StockMovement = require("../models/StockMovement");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();
router.use(authMiddleware);

// GET /api/products - list the logged-in user's products, with
// optional search / category / status filters.
router.get("/", async (req, res) => {
  try {
    const { search, category, status } = req.query;
    const filter = { userId: req.userId };

    if (search) {
      filter.$or = [
        { name: new RegExp(search, "i") },
        { barcode: new RegExp(search, "i") },
      ];
    }
    if (category && category !== "all") {
      filter.category = category;
    }

    let products = await Product.find(filter).sort({ createdAt: -1 });

    if (status && status !== "all") {
      products = products.filter((p) => p.status === status);
    }

    return res.json({ products });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch products.", error: err.message });
  }
});

function parseCsv(csv) {
  const rows = []; let row = []; let value = ""; let quoted = false;
  for (let i = 0; i < csv.length; i += 1) { const char = csv[i]; if (char === '"') { if (quoted && csv[i + 1] === '"') { value += '"'; i += 1; } else quoted = !quoted; } else if (char === "," && !quoted) { row.push(value.trim()); value = ""; } else if ((char === "\n" || char === "\r") && !quoted) { if (char === "\r" && csv[i + 1] === "\n") i += 1; row.push(value.trim()); if (row.some(Boolean)) rows.push(row); row = []; value = ""; } else value += char; }
  if (quoted) throw new Error("A quoted value in the CSV is not closed."); row.push(value.trim()); if (row.some(Boolean)) rows.push(row); return rows;
}
const headerAliases = { name:"name", productname:"name", category:"category", price:"price", sellingprice:"price", purchaseprice:"purchasePrice", costprice:"purchasePrice", stock:"stock", quantity:"stock", minimumstock:"minimumStock", minstock:"minimumStock", barcode:"barcode" };
const headerKey = (header) => header.toLowerCase().replace(/^\uFEFF/, "").replace(/[ _-]/g, "");
router.post("/import", async (req, res) => {
  try {
    const { csv } = req.body;
    if (typeof csv !== "string" || !csv.trim()) return res.status(400).json({ message: "Please choose a non-empty CSV file." });
    const rows = parseCsv(csv);
    if (rows.length < 2) return res.status(400).json({ message: "The CSV needs a header row and at least one product." });
    if (rows.length - 1 > 500) return res.status(400).json({ message: "Import up to 500 products at a time." });
    const columns = rows[0].map((header) => headerAliases[headerKey(header)] || null);
    const missing = ["name", "category", "price", "purchasePrice"].filter((field) => !columns.includes(field));
    if (missing.length) return res.status(400).json({ message: "Missing required column(s): " + missing.join(", ") + "." });
    const errors = [];
    const products = rows.slice(1).map((row, index) => {
      const data = {}; columns.forEach((column, columnIndex) => { if (column) data[column] = row[columnIndex] || ""; });
      const line = index + 2; const price = Number(data.price); const purchasePrice = Number(data.purchasePrice); const stock = data.stock === "" || data.stock === undefined ? 0 : Number(data.stock); const minimumStock = data.minimumStock === "" || data.minimumStock === undefined ? 5 : Number(data.minimumStock);
      if (!data.name.trim() || !data.category.trim()) errors.push("Row " + line + ": name and category are required."); if (!Number.isFinite(price) || price < 0) errors.push("Row " + line + ": price must be a non-negative number."); if (!Number.isFinite(purchasePrice) || purchasePrice < 0) errors.push("Row " + line + ": purchasePrice must be a non-negative number."); if (!Number.isFinite(stock) || stock < 0) errors.push("Row " + line + ": stock must be a non-negative number."); if (!Number.isFinite(minimumStock) || minimumStock < 0) errors.push("Row " + line + ": minimumStock must be a non-negative number.");
      return { userId: req.userId, name: (data.name || "").trim(), category: (data.category || "").trim(), price, purchasePrice, stock, minimumStock, barcode: (data.barcode || "").trim() };
    });
    if (errors.length) return res.status(400).json({ message: "The CSV has invalid rows. Nothing was imported.", errors: errors.slice(0, 10) });
    const createdProducts = await Product.insertMany(products);
    const movements = createdProducts.filter((product) => product.stock > 0).map((product) => ({ userId: req.userId, productId: product._id, productName: product.name, type: "PURCHASE", quantity: product.stock, previousStock: 0, newStock: product.stock, reference: "Initial stock from CSV import" }));
    if (movements.length) await StockMovement.insertMany(movements);
    return res.status(201).json({ message: "Products imported successfully.", imported: createdProducts.length });
  } catch (err) { return res.status(400).json({ message: err.message || "Failed to import CSV." }); }
});

// GET /api/products/:id
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, userId: req.userId });
    if (!product) return res.status(404).json({ message: "Product not found." });
    return res.json({ product });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch product.", error: err.message });
  }
});

// POST /api/products - create a new product for the logged-in user.
router.post("/", async (req, res) => {
  try {
    const { name, category, price, purchasePrice, stock, minimumStock, barcode } = req.body;

    if (!name || !category || price === undefined || purchasePrice === undefined) {
      return res.status(400).json({ message: "Name, category, price and purchase price are required." });
    }
    if (Number(price) < 0 || Number(purchasePrice) < 0) {
      return res.status(400).json({ message: "Prices cannot be negative." });
    }

    const initialStock = Number(stock) || 0;

    const product = await Product.create({
      userId: req.userId,
      name: name.trim(),
      category: category.trim(),
      price: Number(price),
      purchasePrice: Number(purchasePrice),
      stock: initialStock,
      minimumStock: Number(minimumStock) || 5,
      barcode: (barcode || "").trim(),
    });

    // If the product starts with stock on hand, log it as a PURCHASE
    // movement so the stock history stays complete from day one.
    if (initialStock > 0) {
      await StockMovement.create({
        userId: req.userId,
        productId: product._id,
        productName: product.name,
        type: "PURCHASE",
        quantity: initialStock,
        previousStock: 0,
        newStock: initialStock,
        reference: "Initial stock on product creation",
      });
    }

    return res.status(201).json({ message: "Product added successfully.", product });
  } catch (err) {
    return res.status(500).json({ message: "Failed to create product.", error: err.message });
  }
});

// PUT /api/products/:id - edit a product (only if it belongs to this user).
router.put("/:id", async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, userId: req.userId });
    if (!product) return res.status(404).json({ message: "Product not found." });

    const { name, category, price, purchasePrice, minimumStock, barcode, stock } = req.body;

    if (name !== undefined) product.name = name.trim();
    if (category !== undefined) product.category = category.trim();
    if (price !== undefined) product.price = Number(price);
    if (purchasePrice !== undefined) product.purchasePrice = Number(purchasePrice);
    if (minimumStock !== undefined) product.minimumStock = Number(minimumStock);
    if (barcode !== undefined) product.barcode = barcode.trim();

    // A manual stock adjustment (not via billing) is logged as ADJUSTMENT.
    if (stock !== undefined && Number(stock) !== product.stock) {
      const previousStock = product.stock;
      const newStock = Number(stock);

      if (newStock < 0) {
        return res.status(400).json({ message: "Stock cannot be negative." });
      }

      product.stock = newStock;

      await StockMovement.create({
        userId: req.userId,
        productId: product._id,
        productName: product.name,
        type: "ADJUSTMENT",
        quantity: newStock - previousStock,
        previousStock,
        newStock,
        reference: "Manual stock adjustment",
      });
    }

    await product.save();
    return res.json({ message: "Product updated successfully.", product });
  } catch (err) {
    return res.status(500).json({ message: "Failed to update product.", error: err.message });
  }
});

// DELETE /api/products/:id
router.delete("/:id", async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!product) return res.status(404).json({ message: "Product not found." });
    return res.json({ message: "Product deleted successfully." });
  } catch (err) {
    return res.status(500).json({ message: "Failed to delete product.", error: err.message });
  }
});

module.exports = router;
