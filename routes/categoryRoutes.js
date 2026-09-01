const express = require('express');
const router = express.Router();

const ctrl = require('../controllers/categoryController');
const validate = require('../middleware/validate');
const { createCategorySchema, updateCategorySchema } = require('../utils/validators/categoryValidators');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', ctrl.listCategories);
router.get('/:id', ctrl.getCategory);
router.post('/', authenticate, authorize('admin'), validate(createCategorySchema), ctrl.createCategory);
router.put('/:id', authenticate, authorize('admin'), validate(updateCategorySchema), ctrl.updateCategory);
router.delete('/:id', authenticate, authorize('admin'), ctrl.deleteCategory);

module.exports = router;
