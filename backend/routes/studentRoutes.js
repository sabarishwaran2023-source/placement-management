import express from 'express';
import { getStudentProfile, updateStudentProfile, uploadResumeFile, getAllStudents } from '../controllers/studentController.js';
import { verifyToken, requireRole } from '../middleware/authMiddleware.js';
import { uploadResume } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.get('/profile', verifyToken, getStudentProfile);
router.put('/profile', verifyToken, updateStudentProfile);
router.post('/resume', verifyToken, uploadResume.single('resume'), uploadResumeFile);
router.get('/', verifyToken, requireRole('admin', 'company'), getAllStudents);

export default router;
