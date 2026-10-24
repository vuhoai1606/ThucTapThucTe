const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/dashboardController');
const { verifyToken, requireRoles } = require('../middlewares/authMiddleware');

router.use(verifyToken);

router.get('/hr', requireRoles('Admin', 'HR'), DashboardController.getHrDashboard);
router.get('/pm', requireRoles('Admin', 'Project Manager', 'Team Leader'), DashboardController.getPmDashboard);
router.get('/employee', DashboardController.getEmployeeDashboard);

module.exports = router;
