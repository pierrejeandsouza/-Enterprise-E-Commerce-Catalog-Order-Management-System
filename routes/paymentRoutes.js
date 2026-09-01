const express = require('express');
const router = express.Router();

const ctrl = require('../controllers/paymentController');
const validate = require('../middleware/validate');
const { updatePaymentSchema } = require('../utils/validators/paymentValidators');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/:orderId', ctrl.getPaymentStatus);
router.post('/:orderId/mock-charge', authorize('customer'), ctrl.mockCharge);
router.put('/:orderId', authorize('seller', 'admin'), validate(updatePaymentSchema), ctrl.updatePaymentStatus);

module.exports = router;
