import express from 'express';
import { getAllCompanies, createCompany, updateCompany, deleteCompany } from '../controllers/companyController.js';
import { verifyToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getAllCompanies);
router.post('/', verifyToken, requireRole('admin', 'company'), createCompany);
router.put('/:id', verifyToken, requireRole('admin', 'company'), updateCompany);
router.delete('/:id', verifyToken, requireRole('admin'), deleteCompany);

export default router;
