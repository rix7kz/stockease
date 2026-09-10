const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    // Always a bcrypt hash - never the plain-text password.
    password: { type: String, required: true },
    shopName: { type: String, required: true, trim: true },
    role: { type: String, enum: ["admin", "owner"], default: "owner" },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
