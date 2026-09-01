const express = require('express');
const router = express.Router();

const ctrl = require('../controllers/orderController');
const validate = require('../middleware/validate');
const { placeOrderSchema, updateStatusSchema } = require('../utils/validators/orderValidators');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.post('/', authorize('customer'), validate(placeOrderSchema), ctrl.placeOrder);
router.get('/', ctrl.listOrders); // scoped by role inside controller
router.get('/:id', ctrl.getOrder);
router.put('/:id/status', authorize('seller', 'admin'), validate(updateStatusSchema), ctrl.updateStatus);

module.exports = router;
