const asyncHandler = require('../middleware/asyncHandler');
const { success } = require('../utils/apiResponse');
const AppError = require('../utils/AppError');
const errorCodes = require('../utils/errorCodes');
const { Cart, Product } = require('../models');

async function getOrCreateCart(userId) {
  let cart = await Cart.findOne({ userId });
  if (!cart) cart = await Cart.create({ userId, items: [] });
  return cart;
}

// GET /api/cart — Module 6
const getCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user.id);
  const populated = await cart.populate('items.productId', 'name price stock images isActive');
  return success(res, 200, 'Cart fetched', { cart: populated });
});

// POST /api/cart — add item (stock validation against live stock)
const addItem = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;

  const product = await Product.findById(productId);
  if (!product || !product.isActive) throw new AppError('Product not found', 404, errorCodes.NOT_FOUND);
  if (product.stock < quantity) {
    throw new AppError(`Only ${product.stock} unit(s) in stock`, 409, errorCodes.BUSINESS_RULE_VIOLATION);
  }

  const cart = await getOrCreateCart(req.user.id);
  const existing = cart.items.find((i) => i.productId.toString() === productId);

  if (existing) {
    const newQty = existing.quantity + quantity;
    if (product.stock < newQty) {
      throw new AppError(`Only ${product.stock} unit(s) in stock`, 409, errorCodes.BUSINESS_RULE_VIOLATION);
    }
    existing.quantity = newQty;
  } else {
    cart.items.push({ productId, quantity });
  }

  await cart.save();
  return success(res, 200, 'Item added to cart', { cart });
});

// PUT /api/cart/:productId — update quantity
const updateItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { quantity } = req.body;

  const product = await Product.findById(productId);
  if (!product) throw new AppError('Product not found', 404, errorCodes.NOT_FOUND);
  if (product.stock < quantity) {
    throw new AppError(`Only ${product.stock} unit(s) in stock`, 409, errorCodes.BUSINESS_RULE_VIOLATION);
  }

  const cart = await getOrCreateCart(req.user.id);
  const item = cart.items.find((i) => i.productId.toString() === productId);
  if (!item) throw new AppError('Item not in cart', 404, errorCodes.NOT_FOUND);

  item.quantity = quantity;
  await cart.save();
  return success(res, 200, 'Cart item updated', { cart });
});

// DELETE /api/cart/:productId — remove item
const removeItem = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user.id);
  const before = cart.items.length;
  cart.items = cart.items.filter((i) => i.productId.toString() !== req.params.productId);

  if (cart.items.length === before) {
    throw new AppError('Item not in cart', 404, errorCodes.NOT_FOUND);
  }

  await cart.save();
  return success(res, 200, 'Item removed from cart', { cart });
});

// DELETE /api/cart — clear cart (used internally after checkout too)
const clearCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user.id);
  cart.items = [];
  await cart.save();
  return success(res, 200, 'Cart cleared', { cart });
});

module.exports = { getCart, addItem, updateItem, removeItem, clearCart, getOrCreateCart };
