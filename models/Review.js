const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    orderId: {
      // used to enforce "only rate/review products you've actually
      // received" (Module 12 business rule)
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true },
  },
  { timestamps: true }
);

// A customer may review a given product once per delivered order.
reviewSchema.index({ productId: 1, userId: 1, orderId: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
