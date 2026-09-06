require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const billingRoutes = require('./routes/billing');
const salesRoutes = require('./routes/sales');
const stockHistoryRoutes = require('./routes/stockHistory');
const dashboardRoutes = require('./routes/dashboard');
const reportsRoutes = require('./routes/reports');
const settingsRoutes = require('./routes/settings');
const exportRoutes = require('./routes/export');

const app = express();

app.use(cors());
app.use(express.json());

// Health check - useful to confirm the backend is up while debugging
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'stockease-api' });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/stock-history', stockHistoryRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/export', exportRoutes);

// Fallback for unknown API routes
app.use('/api', (req, res) => {
  res.status(404).json({ message: 'API route not found.' });
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`StockEase API running on http://localhost:${PORT}`);
  });
});
