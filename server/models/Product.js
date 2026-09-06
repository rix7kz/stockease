const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, trim: true, default: 'General' },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    minimumStock: { type: Number, required: true, min: 0, default: 5 },
    barcode: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

// A user cannot have two products with the same barcode (only enforced when barcode is set)
productSchema.index(
  { user: 1, barcode: 1 },
  { unique: true, partialFilterExpression: { barcode: { $type: 'string', $ne: '' } } }
);

// Virtual, computed status - not stored, always derived from current stock
productSchema.virtual('status').get(function () {
  if (this.stock <= 0) return 'OUT_OF_STOCK';
  if (this.stock <= this.minimumStock) return 'LOW_STOCK';
  return 'AVAILABLE';
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);
