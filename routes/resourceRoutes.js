const express = require('express');
const router = express.Router();
const ResourceController = require('../controllers/resourceController');
const { verifyToken, requireRoles } = require('../middlewares/authMiddleware');

router.use(verifyToken);
router.use(requireRoles('Admin', 'Project Manager'));

router.get('/allocations', ResourceController.getAllocations);
router.post('/assign', ResourceController.assignResource);
router.get('/bench', ResourceController.getBenchResources);
router.delete('/allocations/:id', ResourceController.removeAllocation);

module.exports = router;
