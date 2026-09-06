const express = require('express');
const ExcelJS = require('exceljs');
const Product = require('../models/Product');
const Bill = require('../models/Bill');
const StockHistory = require('../models/StockHistory');
const requireAuth = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

function statusOf(product) {
  if (product.stock <= 0) return 'OUT OF STOCK';
  if (product.stock <= product.minimumStock) return 'LOW STOCK';
  return 'AVAILABLE';
}

async function sendWorkbook(res, workbook, filename) {
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  await workbook.xlsx.write(res);
  res.end();
}

// GET /api/export/inventory
router.get('/inventory', async (req, res) => {
  try {
    const products = await Product.find({ user: req.userId }).sort({ name: 1 });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Inventory');
    sheet.columns = [
      { header: 'Product Name', key: 'name', width: 28 },
      { header: 'Category', key: 'category', width: 18 },
      { header: 'Price', key: 'price', width: 12 },
      { header: 'Stock', key: 'stock', width: 10 },
      { header: 'Minimum Stock', key: 'minimumStock', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Barcode', key: 'barcode', width: 18 },
    ];
    sheet.getRow(1).font = { bold: true };

    products.forEach((p) => {
      sheet.addRow({
        name: p.name,
        category: p.category,
        price: p.price,
        stock: p.stock,
        minimumStock: p.minimumStock,
        status: statusOf(p),
        barcode: p.barcode,
      });
    });

    await sendWorkbook(res, workbook, 'inventory.xlsx');
  } catch (err) {
    console.error('Export inventory error:', err);
    res.status(500).json({ message: 'Failed to export inventory.' });
  }
});

// GET /api/export/sales
router.get('/sales', async (req, res) => {
  try {
    const bills = await Bill.find({ user: req.userId }).sort({ createdAt: -1 });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Sales');
    sheet.columns = [
      { header: 'Bill Number', key: 'billNumber', width: 15 },
      { header: 'Date', key: 'date', width: 20 },
      { header: 'Customer', key: 'customer', width: 22 },
      { header: 'Items', key: 'items', width: 10 },
      { header: 'Subtotal', key: 'subtotal', width: 12 },
      { header: 'Discount', key: 'discount', width: 12 },
      { header: 'Total', key: 'total', width: 12 },
      { header: 'Payment Method', key: 'paymentMethod', width: 15 },
    ];
    sheet.getRow(1).font = { bold: true };

    bills.forEach((b) => {
      sheet.addRow({
        billNumber: b.billNumber,
        date: b.createdAt.toLocaleString(),
        customer: b.customerName,
        items: b.items.reduce((sum, i) => sum + i.quantity, 0),
        subtotal: b.subtotal,
        discount: b.discount,
        total: b.total,
        paymentMethod: b.paymentMethod,
      });
    });

    await sendWorkbook(res, workbook, 'sales.xlsx');
  } catch (err) {
    console.error('Export sales error:', err);
    res.status(500).json({ message: 'Failed to export sales.' });
  }
});

// GET /api/export/stock-history
router.get('/stock-history', async (req, res) => {
  try {
    const history = await StockHistory.find({ user: req.userId }).sort({ createdAt: -1 }).limit(2000);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Stock History');
    sheet.columns = [
      { header: 'Date', key: 'date', width: 20 },
      { header: 'Product', key: 'product', width: 26 },
      { header: 'Type', key: 'type', width: 14 },
      { header: 'Quantity', key: 'quantity', width: 12 },
      { header: 'Previous Stock', key: 'previousStock', width: 15 },
      { header: 'New Stock', key: 'newStock', width: 12 },
      { header: 'Reference', key: 'reference', width: 18 },
    ];
    sheet.getRow(1).font = { bold: true };

    history.forEach((h) => {
      sheet.addRow({
        date: h.createdAt.toLocaleString(),
        product: h.productName,
        type: h.type,
        quantity: h.quantity,
        previousStock: h.previousStock,
        newStock: h.newStock,
        reference: h.reference,
      });
    });

    await sendWorkbook(res, workbook, 'stock-history.xlsx');
  } catch (err) {
    console.error('Export stock history error:', err);
    res.status(500).json({ message: 'Failed to export stock history.' });
  }
});

module.exports = router;
