const express = require('express');
const router = express.Router();
const SettingController = require('../controllers/settingController');
const { verifyToken, requireRoles } = require('../middlewares/authMiddleware');

// GET /api/settings/db-status
router.get('/db-status', SettingController.checkDbStatus);

// GET /api/settings/audit-logs (Admin only)
router.get('/audit-logs', verifyToken, requireRoles('Admin'), SettingController.getAuditLogs);

module.exports = router;
