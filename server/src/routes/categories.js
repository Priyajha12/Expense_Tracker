const express = require('express');
const router = express.Router();
const {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    setCategoryBudget
} = require('../controllers/categories');
const authMiddleware = require('../middleware/auth');

// All routes here require authentication (mocked for now)
router.use(authMiddleware);

router.get('/', getCategories);
router.post('/', createCategory);
router.post('/budget', setCategoryBudget);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);

module.exports = router;
