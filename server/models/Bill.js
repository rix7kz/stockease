const mongoose = require("mongoose");

const billItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 }, // price at time of sale
    total: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const billSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    billNumber: { type: String, required: true, unique: true },
    customerName: { type: String, trim: true, default: "Walk-in Customer" },
    items: { type: [billItemSchema], required: true },
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, required: true, min: 0, default: 0 },
    total: { type: Number, required: true, min: 0 },
    paymentMethod: {
      type: String,
      enum: ["CASH", "UPI", "CARD"],
      default: "CASH",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Bill", billSchema);
