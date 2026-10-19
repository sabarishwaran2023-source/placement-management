import express from 'express';
import { applyForJob, getStudentApplications, getAllApplications, updateApplicationStatus } from '../controllers/applicationController.js';
import { verifyToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/apply', verifyToken, requireRole('student'), applyForJob);
router.get('/my-applications', verifyToken, requireRole('student'), getStudentApplications);
router.get('/all', verifyToken, requireRole('admin', 'company'), getAllApplications);
router.put('/:id/status', verifyToken, requireRole('admin', 'company'), updateApplicationStatus);

export default router;
