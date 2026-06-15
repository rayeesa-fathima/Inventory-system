const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate, requireAdmin, requireStaffOrAdmin } = require('../middleware/auth');

router.get('/', authenticate, requireStaffOrAdmin, orderController.getAllOrders);
router.get('/:id', authenticate, requireStaffOrAdmin, orderController.getOrderById);
router.post('/', authenticate, requireStaffOrAdmin, orderController.createOrder);
router.patch('/:id/status', authenticate, requireStaffOrAdmin, orderController.updateOrderStatus);

module.exports = router;