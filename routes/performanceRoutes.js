const express = require('express');
const router = express.Router();
const PerformanceController = require('../controllers/performanceController');
const { verifyToken, requireRoles } = require('../middlewares/authMiddleware');

router.use(verifyToken);

router.get('/', PerformanceController.getAll);
router.post('/', requireRoles('Admin', 'HR', 'Project Manager'), PerformanceController.create);

module.exports = router;
