const express = require('express');
const router = express.Router();
const EmployeeController = require('../controllers/employeeController');
const { verifyToken, requireRoles, requireAdmin } = require('../middlewares/authMiddleware');

router.use(verifyToken);

router.get('/', requireRoles('Admin', 'HR', 'Project Manager', 'Team Leader'), EmployeeController.getAll);
router.get('/:id', EmployeeController.getById);
router.post('/', requireRoles('Admin', 'HR'), EmployeeController.create);
router.put('/:id', requireRoles('Admin', 'HR'), EmployeeController.update);
router.delete('/:id', requireAdmin, EmployeeController.delete);

module.exports = router;
