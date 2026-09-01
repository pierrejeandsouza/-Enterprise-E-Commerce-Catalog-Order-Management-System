const express = require('express');
const router = express.Router();

const ctrl = require('../controllers/cartController');
const validate = require('../middleware/validate');
const { addItemSchema, updateItemSchema } = require('../utils/validators/cartValidators');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate, authorize('customer'));

router.get('/', ctrl.getCart);
router.post('/', validate(addItemSchema), ctrl.addItem);
router.put('/:productId', validate(updateItemSchema), ctrl.updateItem);
router.delete('/:productId', ctrl.removeItem);
router.delete('/', ctrl.clearCart);

module.exports = router;
