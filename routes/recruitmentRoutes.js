const express = require('express');
const router = express.Router();
const RecruitmentController = require('../controllers/recruitmentController');
const { verifyToken, requireRoles } = require('../middlewares/authMiddleware');

router.use(verifyToken);
router.use(requireRoles('Admin', 'HR'));

router.get('/candidates', RecruitmentController.getCandidates);
router.post('/candidates', RecruitmentController.createCandidate);
router.put('/candidates/:id/stage', RecruitmentController.updateStage);

module.exports = router;
