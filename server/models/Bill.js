const mongoose = require('mongoose');

const billItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true }, // snapshot of product name at sale time
    price: { type: Number, required: true }, // snapshot of unit price at sale time
    quantity: { type: Number, required: true },
    lineTotal: { type: Number, required: true },
  },
  { _id: false }
);

const billSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    billNumber: { type: String, required: true },
    customerName: { type: String, default: 'Walk-in Customer' },
    items: { type: [billItemSchema], required: true },
    subtotal: { type: Number, required: true },
    discount: { type: Number, required: true, default: 0 },
    total: { type: Number, required: true },
    paymentMethod: { type: String, enum: ['CASH', 'UPI', 'CARD'], required: true },
  },
  { timestamps: true }
);

billSchema.index({ user: 1, billNumber: 1 }, { unique: true });

module.exports = mongoose.model('Bill', billSchema);
