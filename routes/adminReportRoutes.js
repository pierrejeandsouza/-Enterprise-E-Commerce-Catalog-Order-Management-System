const express = require('express');
const router = express.Router();

const ctrl = require('../controllers/adminReportController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate, authorize('admin'));

router.get('/reports/sales', ctrl.salesSummary);
router.get('/reports/users', ctrl.userStats);
router.get('/reports/top-products', ctrl.topProducts);
router.put('/sellers/:id/approve', ctrl.approveSeller);

module.exports = router;
