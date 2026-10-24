const express = require('express');
const router = express.Router();
const LeaveController = require('../controllers/leaveController');
const { verifyToken, requireRoles } = require('../middlewares/authMiddleware');

router.use(verifyToken);

router.get('/', LeaveController.getAll);
router.post('/', LeaveController.create);
router.put('/:id/approve', requireRoles('Admin', 'HR', 'Project Manager'), LeaveController.approve);
router.put('/:id/reject', requireRoles('Admin', 'HR', 'Project Manager'), LeaveController.reject);

module.exports = router;
