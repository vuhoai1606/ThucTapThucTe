const express = require('express');
const router = express.Router();
const SkillController = require('../controllers/skillController');
const { verifyToken, requireRoles, requireAdmin } = require('../middlewares/authMiddleware');

router.use(verifyToken);

router.get('/', SkillController.getAll);
router.post('/', requireRoles('Admin', 'HR'), SkillController.create);
router.put('/:id', requireRoles('Admin', 'HR'), SkillController.update);
router.delete('/:id', requireAdmin, SkillController.delete);

router.get('/matrix', SkillController.getMatrix);
router.post('/employee', requireRoles('Admin', 'HR', 'Project Manager', 'Team Leader'), SkillController.assignEmployeeSkill);

module.exports = router;
