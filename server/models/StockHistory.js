const mongoose = require('mongoose');

const stockHistorySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true }, // snapshot, in case product is later deleted
    type: {
      type: String,
      enum: ['SALE', 'RESTOCK', 'ADJUSTMENT', 'CREATE', 'DELETE'],
      required: true,
    },
    quantity: { type: Number, required: true }, // positive = added, negative = removed
    previousStock: { type: Number, required: true },
    newStock: { type: Number, required: true },
    reference: { type: String, default: '' }, // e.g. bill number
  },
  { timestamps: true }
);

module.exports = mongoose.model('StockHistory', stockHistorySchema);
