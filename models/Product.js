const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    // Referenced (not embedded): sellerId points at a User that is large,
    // shared across many products, and updated independently of any one
    // product — the textbook case for a reference over an embed.
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    stock: { type: Number, required: true, min: 0, default: 0 },
    images: [{ type: String }],
    ratingAvg: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

productSchema.index({ categoryId: 1 });
productSchema.index({ sellerId: 1 });
// Text index backs keyword search (Module 5: Product Search & Filtering)
productSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Product', productSchema);
