const express = require('express');
const router = express.Router();
const PayrollController = require('../controllers/payrollController');
const { verifyToken, requireRoles } = require('../middlewares/authMiddleware');

router.use(verifyToken);

router.get('/', PayrollController.getAll);
router.post('/generate', requireRoles('Admin', 'HR'), PayrollController.generateMonthlyPayroll);
router.get('/:id', PayrollController.getPayslip);

module.exports = router;
