const express = require('express');
const router = express.Router();
const TrainingController = require('../controllers/trainingController');
const { verifyToken, requireRoles } = require('../middlewares/authMiddleware');

router.use(verifyToken);

router.get('/courses', requireRoles('Admin', 'HR', 'Employee'), TrainingController.getCourses);
router.post('/courses', requireRoles('Admin', 'HR'), TrainingController.createCourse);
router.get('/results', requireRoles('Admin', 'HR', 'Employee'), TrainingController.getResults);
router.post('/enroll', requireRoles('Admin', 'HR', 'Employee'), TrainingController.enrollCourse);

module.exports = router;
