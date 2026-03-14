const express = require('express');
const router = express.Router();
const {
    getExpenses,
    createExpense,
    createBulkExpenses,
    updateExpense,
    deleteExpense
} = require('../controllers/expenses');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', getExpenses);
router.post('/', createExpense);
router.post('/bulk', createBulkExpenses);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);

module.exports = router;
