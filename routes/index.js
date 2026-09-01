const express = require('express');
const router = express.Router();

router.use('/auth', require('./authRoutes'));
router.use('/categories', require('./categoryRoutes'));
router.use('/products', require('./productRoutes'));
router.use('/cart', require('./cartRoutes'));
router.use('/orders', require('./orderRoutes'));
router.use('/coupons', require('./couponRoutes'));
router.use('/payments', require('./paymentRoutes'));
router.use('/inventory', require('./inventoryRoutes'));
router.use('/seller/dashboard', require('./sellerDashboardRoutes'));
router.use('/admin', require('./adminReportRoutes'));

module.exports = router;
