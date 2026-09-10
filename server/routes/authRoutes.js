const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

function sanitizeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    shopName: user.shopName,
    role: user.role,
    isDemo: user.isDemo,
  };
}

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, confirmPassword, shopName } = req.body;

    if (!name || !email || !password || !confirmPassword || !shopName) {
      return res.status(400).json({ message: "All fields are required." });
    }
    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ message: "Please enter a valid email address." });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match." });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      shopName: shopName.trim(),
    });

    return res.status(201).json({
      message: "Registration successful. Please log in.",
      user: sanitizeUser(user),
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error during registration.", error: err.message });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ message: "No account found with this email." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect password." });
    }

    const token = signToken(user._id);

    return res.json({
      message: "Login successful.",
      token,
      user: sanitizeUser(user),
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error during login.", error: err.message });
  }
});

// GET /api/auth/me
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found." });
    return res.json({ user: sanitizeUser(user) });
  } catch (err) {
    return res.status(500).json({ message: "Server error.", error: err.message });
  }
});

module.exports = router;
