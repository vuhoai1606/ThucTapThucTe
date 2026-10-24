const express = require('express');
const router = express.Router();
const StatsController = require('../controllers/statsController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.use(verifyToken);

// GET /api/stats
router.get('/', StatsController.getDashboardStats);

module.exports = router;
