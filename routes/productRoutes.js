const express = require('express');
const router = express.Router();

const ctrl = require('../controllers/productController');
const validate = require('../middleware/validate');
const {
  createProductSchema,
  updateProductSchema,
  listProductsQuerySchema,
} = require('../utils/validators/productValidators');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', validate(listProductsQuerySchema, 'query'), ctrl.listProducts);
router.get('/:id', ctrl.getProduct);
router.post('/', authenticate, authorize('seller', 'admin'), validate(createProductSchema), ctrl.createProduct);
router.put('/:id', authenticate, authorize('seller', 'admin'), validate(updateProductSchema), ctrl.updateProduct);
router.delete('/:id', authenticate, authorize('seller', 'admin'), ctrl.deleteProduct);

// Module 12: reviews are nested under a product
router.use('/:productId/reviews', require('./reviewRoutes'));

module.exports = router;
