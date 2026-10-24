const express = require('express');
const router = express.Router();
const DepartmentController = require('../controllers/departmentController');
const { verifyToken, requireRoles, requireAdmin } = require('../middlewares/authMiddleware');

router.use(verifyToken);
router.use(requireRoles('Admin', 'HR'));

router.get('/', DepartmentController.getAll);
router.get('/:id/details', DepartmentController.getDetails);
router.get('/:id', DepartmentController.getById);
router.post('/', DepartmentController.create);
router.put('/:id', DepartmentController.update);
router.delete('/:id', requireAdmin, DepartmentController.delete);

module.exports = router;
