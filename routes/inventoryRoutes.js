const express = require('express');
const router = express.Router();

const ctrl = require('../controllers/inventoryController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/low-stock', authenticate, authorize('seller', 'admin'), ctrl.lowStock);

module.exports = router;
