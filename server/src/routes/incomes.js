const express = require('express');
const router = express.Router();
const {
    createIncome,
    getIncomes,
    deleteIncome,
    getIncomeCategories
} = require('../controllers/incomes');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.post('/', createIncome);
router.get('/', getIncomes);
router.delete('/:id', deleteIncome);
router.get('/categories', getIncomeCategories);

module.exports = router;
