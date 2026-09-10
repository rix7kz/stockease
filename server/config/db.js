const mongoose = require("mongoose");
const seedDemoAdmin = require("../utils/seedAdmin");

// Connects to MongoDB and seeds the demo admin account once the
// connection is live. This is called once from server.js on startup.
async function connectDB() {
  const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/stockease";

  try {
    await mongoose.connect(uri);
    console.log(`MongoDB connected: ${uri}`);

    // Create the built-in demo/admin account if it does not already exist.
    await seedDemoAdmin();
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
