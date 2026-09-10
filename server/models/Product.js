const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    // Every product belongs to exactly one user - this is how we
    // isolate each shop owner's inventory from every other owner's.
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 }, // selling price
    purchasePrice: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    minimumStock: { type: Number, required: true, min: 0, default: 5 },
    barcode: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

// A product's status is derived from its stock level - never stored,
// always computed, so it can never go stale.
productSchema.virtual("status").get(function () {
  if (this.stock <= 0) return "OUT_OF_STOCK";
  if (this.stock <= this.minimumStock) return "LOW_STOCK";
  return "AVAILABLE";
});

productSchema.set("toJSON", { virtuals: true });
productSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Product", productSchema);
