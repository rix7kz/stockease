const mongoose = require("mongoose");

const stockMovementSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    productName: { type: String, required: true },
    type: {
      type: String,
      enum: ["PURCHASE", "SALE", "RETURN", "ADJUSTMENT"],
      required: true,
    },
    // Positive for stock added (purchase/return), negative for stock
    // removed (sale). Adjustment can be either.
    quantity: { type: Number, required: true },
    previousStock: { type: Number, required: true },
    newStock: { type: Number, required: true },
    // e.g. a bill number for SALE movements, or a note for ADJUSTMENT.
    reference: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("StockMovement", stockMovementSchema);
