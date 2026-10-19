import express from 'express';
import { getInterviews, scheduleInterview } from '../controllers/interviewController.js';
import { verifyToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getInterviews);
router.post('/schedule', verifyToken, requireRole('admin', 'company'), scheduleInterview);

export default router;
