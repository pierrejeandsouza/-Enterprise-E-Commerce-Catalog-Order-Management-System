const asyncHandler = require('../middleware/asyncHandler');
const { success } = require('../utils/apiResponse');
const { Product } = require('../models');

const LOW_STOCK_THRESHOLD = 5;

// GET /api/inventory/low-stock — Module 9 (also surfaced in the Seller
// Dashboard for a seller's own products, and unfiltered for admin).
const lowStock = asyncHandler(async (req, res) => {
  const filter = { isActive: true, stock: { $lte: LOW_STOCK_THRESHOLD } };
  if (req.user.role === 'seller') filter.sellerId = req.user.id;

  const products = await Product.find(filter).sort({ stock: 1 });
  return success(res, 200, 'Low-stock products fetched', { threshold: LOW_STOCK_THRESHOLD, products });
});

module.exports = { lowStock, LOW_STOCK_THRESHOLD };
