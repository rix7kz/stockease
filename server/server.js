require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const billRoutes = require("./routes/billRoutes");
const stockRoutes = require("./routes/stockRoutes");
const reportRoutes = require("./routes/reportRoutes");
const exportRoutes = require("./routes/exportRoutes");
const settingsRoutes = require("./routes/settingsRoutes");

const app = express();

app.use(cors());
// CSV imports are sent as text in JSON.
app.use(express.json({ limit: "2mb" }));

// Connect to MongoDB, then seed the demo admin account.
connectDB();

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/bills", billRoutes);
app.use("/api/stock", stockRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/export", exportRoutes);
app.use("/api/settings", settingsRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "StockEase API is running." });
});

// Generic error handler for anything that slips through.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Unexpected server error." });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`StockEase server running on http://localhost:${PORT}`);
});
