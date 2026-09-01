const express = require('express');
const router = express.Router();

const ctrl = require('../controllers/couponController');
const validate = require('../middleware/validate');
const { createCouponSchema, applyCouponSchema } = require('../utils/validators/couponValidators');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/apply', authenticate, validate(applyCouponSchema), ctrl.applyCoupon);
router.get('/', authenticate, authorize('admin'), ctrl.listCoupons);
router.post('/', authenticate, authorize('admin'), validate(createCouponSchema), ctrl.createCoupon);
router.put('/:id', authenticate, authorize('admin'), ctrl.updateCoupon);

module.exports = router;
