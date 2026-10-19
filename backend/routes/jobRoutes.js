import express from 'express';
import { getAllJobs, createJob, checkEligibility } from '../controllers/jobController.js';
import { verifyToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getAllJobs);
router.get('/eligibility', checkEligibility);
router.post('/', verifyToken, requireRole('admin', 'company'), createJob);

export default router;
