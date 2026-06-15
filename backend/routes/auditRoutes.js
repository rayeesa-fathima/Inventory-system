const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.get('/', authenticate, requireAdmin, auditController.getAuditLogs);

module.exports = router;