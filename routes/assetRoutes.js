const express = require('express');
const router = express.Router();
const AssetController = require('../controllers/assetController');
const { verifyToken, requireRoles } = require('../middlewares/authMiddleware');

router.use(verifyToken);
router.use(requireRoles('Admin', 'HR'));

router.get('/', AssetController.getAll);
router.post('/', AssetController.create);
router.post('/assign', AssetController.assignAsset);
router.put('/return/:id', AssetController.returnAsset);

module.exports = router;
