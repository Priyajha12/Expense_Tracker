const express = require('express');
const router = express.Router();
const {
    getPaymentMethods,
    createPaymentMethod,
    deletePaymentMethod,
    updatePaymentMethod
} = require('../controllers/paymentMethods');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', getPaymentMethods);
router.post('/', createPaymentMethod);
router.put('/:id', updatePaymentMethod);
router.delete('/:id', deletePaymentMethod);

module.exports = router;
