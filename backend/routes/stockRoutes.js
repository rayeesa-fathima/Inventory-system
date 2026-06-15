const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.post('/adjust', authenticate, requireAdmin, stockController.adjustStock);
router.get('/history', authenticate, requireAdmin, stockController.getStockHistory);

module.exports = router;