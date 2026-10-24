const express = require('express');
const router = express.Router();
const PositionController = require('../controllers/positionController');
const { verifyToken, requireRoles } = require('../middlewares/authMiddleware');

router.use(verifyToken);
router.use(requireRoles('Admin', 'HR'));

router.get('/', PositionController.getAll);
router.post('/', PositionController.create);
router.put('/:id', PositionController.update);
router.delete('/:id', PositionController.delete);

module.exports = router;
