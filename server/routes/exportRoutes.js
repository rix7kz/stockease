const express = require("express");
const ExcelJS = require("exceljs");
const Product = require("../models/Product");
const Bill = require("../models/Bill");
const StockMovement = require("../models/StockMovement");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();
router.use(authMiddleware);

async function sendWorkbook(res, workbook, filename) {
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  await workbook.xlsx.write(res);
  res.end();
}

// GET /api/export/inventory
router.get("/inventory", async (req, res) => {
  try {
    const products = await Product.find({ userId: req.userId }).sort({ name: 1 });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Inventory");

    sheet.columns = [
      { header: "Product", key: "name", width: 25 },
      { header: "Category", key: "category", width: 18 },
      { header: "Barcode", key: "barcode", width: 18 },
      { header: "Purchase Price", key: "purchasePrice", width: 16 },
      { header: "Selling Price", key: "price", width: 16 },
      { header: "Current Stock", key: "stock", width: 14 },
      { header: "Minimum Stock", key: "minimumStock", width: 16 },
      { header: "Status", key: "status", width: 14 },
    ];
    sheet.getRow(1).font = { bold: true };

    products.forEach((p) => {
      sheet.addRow({
        name: p.name,
        category: p.category,
        barcode: p.barcode,
        purchasePrice: p.purchasePrice,
        price: p.price,
        stock: p.stock,
        minimumStock: p.minimumStock,
        status: p.status,
      });
    });

    await sendWorkbook(res, workbook, "stockease-inventory.xlsx");
  } catch (err) {
    return res.status(500).json({ message: "Failed to export inventory.", error: err.message });
  }
});

// GET /api/export/sales
router.get("/sales", async (req, res) => {
  try {
    const bills = await Bill.find({ userId: req.userId }).sort({ createdAt: -1 });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Sales");

    sheet.columns = [
      { header: "Bill Number", key: "billNumber", width: 20 },
      { header: "Date", key: "date", width: 22 },
      { header: "Customer", key: "customer", width: 20 },
      { header: "Product", key: "product", width: 22 },
      { header: "Quantity", key: "quantity", width: 12 },
      { header: "Price", key: "price", width: 12 },
      { header: "Total", key: "total", width: 14 },
      { header: "Payment Method", key: "paymentMethod", width: 16 },
    ];
    sheet.getRow(1).font = { bold: true };

    bills.forEach((bill) => {
      bill.items.forEach((item) => {
        sheet.addRow({
          billNumber: bill.billNumber,
          date: bill.createdAt.toLocaleString(),
          customer: bill.customerName,
          product: item.productName,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
          paymentMethod: bill.paymentMethod,
        });
      });
    });

    await sendWorkbook(res, workbook, "stockease-sales.xlsx");
  } catch (err) {
    return res.status(500).json({ message: "Failed to export sales.", error: err.message });
  }
});

// GET /api/export/stock
router.get("/stock", async (req, res) => {
  try {
    const movements = await StockMovement.find({ userId: req.userId }).sort({ createdAt: -1 });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Stock History");

    sheet.columns = [
      { header: "Date", key: "date", width: 22 },
      { header: "Product", key: "product", width: 22 },
      { header: "Movement Type", key: "type", width: 16 },
      { header: "Quantity", key: "quantity", width: 12 },
      { header: "Previous Stock", key: "previousStock", width: 16 },
      { header: "New Stock", key: "newStock", width: 14 },
      { header: "Reference", key: "reference", width: 20 },
    ];
    sheet.getRow(1).font = { bold: true };

    movements.forEach((m) => {
      sheet.addRow({
        date: m.createdAt.toLocaleString(),
        product: m.productName,
        type: m.type,
        quantity: m.quantity,
        previousStock: m.previousStock,
        newStock: m.newStock,
        reference: m.reference,
      });
    });

    await sendWorkbook(res, workbook, "stockease-stock-history.xlsx");
  } catch (err) {
    return res.status(500).json({ message: "Failed to export stock history.", error: err.message });
  }
});

module.exports = router;
