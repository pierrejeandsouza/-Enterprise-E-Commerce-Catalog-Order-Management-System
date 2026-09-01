const express = require('express');
const router = express.Router();

const ctrl = require('../controllers/sellerDashboardController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate, authorize('seller'));

router.get('/summary', ctrl.summary);
router.get('/orders-by-status', ctrl.ordersByStatus);

module.exports = router;
