const bcrypt = require("bcryptjs");
const User = require("../models/User");

const DEMO_ADMIN_EMAIL = "admin@stockease.com";
const DEMO_ADMIN_PASSWORD = "admin@123";

// Creates the built-in demo/admin account the very first time the
// backend connects to MongoDB. Safe to call on every startup - it
// checks for an existing account first, so it never creates a
// duplicate and never re-hashes/overwrites the existing one.
async function seedDemoAdmin() {
  try {
    const existing = await User.findOne({ email: DEMO_ADMIN_EMAIL });

    if (existing) {
      console.log("Demo admin account already exists - skipping seed.");
      return;
    }

    // Password is hashed with bcrypt before it ever reaches MongoDB.
    // The plain-text password is only ever printed to the server
    // console for the developer's reference - it is never stored.
    const hashedPassword = await bcrypt.hash(DEMO_ADMIN_PASSWORD, 10);

    await User.create({
      name: "Demo Admin",
      email: DEMO_ADMIN_EMAIL,
      password: hashedPassword,
      shopName: "StockEase Demo Store",
      role: "admin",
      isDemo: true,
    });

    console.log("Demo admin account created:");
    console.log(`  Email:    ${DEMO_ADMIN_EMAIL}`);
    console.log(`  Password: ${DEMO_ADMIN_PASSWORD}`);
  } catch (err) {
    console.error("Failed to seed demo admin account:", err.message);
  }
}

module.exports = seedDemoAdmin;
