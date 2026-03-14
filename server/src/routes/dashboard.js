const express = require('express');
const router = express.Router();
const { getDashboardData } = require('../controllers/dashboard');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);
router.get('/', getDashboardData);

module.exports = router;
