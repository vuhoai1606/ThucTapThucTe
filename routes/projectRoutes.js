const express = require('express');
const router = express.Router();
const ProjectController = require('../controllers/projectController');
const { verifyToken, requireRoles, requireAdmin } = require('../middlewares/authMiddleware');

router.use(verifyToken);

router.get('/', requireRoles('Admin', 'Project Manager', 'Team Leader'), ProjectController.getAll);
router.get('/:id', requireRoles('Admin', 'Project Manager', 'Team Leader'), ProjectController.getById);
router.post('/', requireRoles('Admin', 'Project Manager'), ProjectController.create);
router.put('/:id', requireRoles('Admin', 'Project Manager'), ProjectController.update);
router.delete('/:id', requireRoles('Admin', 'Project Manager'), ProjectController.delete);

module.exports = router;
