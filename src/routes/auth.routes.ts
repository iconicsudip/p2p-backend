import { Router } from 'express';
import { login, createVendor, getMe, getAllVendors, getVendorCredentials } from '../controllers/auth.controller';
import { authenticate, requireRole } from '../middlewares/auth';
import { UserRole } from '../types';

const router = Router();

router.post('/login', login);
router.post('/create-vendor', authenticate, requireRole(UserRole.SUPER_ADMIN), createVendor);
router.get('/me', authenticate, getMe);
router.get('/vendors', authenticate, requireRole(UserRole.SUPER_ADMIN), getAllVendors);
router.get('/vendors/:id/credentials', authenticate, requireRole(UserRole.SUPER_ADMIN), getVendorCredentials);

export default router;
