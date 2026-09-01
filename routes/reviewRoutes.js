const express = require('express');
const router = express.Router({ mergeParams: true });

const ctrl = require('../controllers/reviewController');
const validate = require('../middleware/validate');
const { createReviewSchema } = require('../utils/validators/reviewValidators');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', ctrl.listReviews);
router.post('/', authenticate, authorize('customer'), validate(createReviewSchema), ctrl.createReview);

module.exports = router;
