const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true }, // stored as bcrypt hash, never plain text
    shopName: { type: String, required: true, trim: true },
    ownerName: { type: String, trim: true }, // editable later from Settings
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
