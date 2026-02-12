import { Router } from 'express';
import { login, createVendor, getMe, getAllVendors, getVendorCredentials, getAdminBankDetails, updateAdminBankDetails, resetPassword, checkUsernameAvailability, updateProfile } from '../controllers/auth.controller';
import { authenticate, requireRole } from '../middlewares/auth';
import { UserRole } from '../types';

const router = Router();

router.post('/login', login);
router.post('/create-vendor', authenticate, requireRole(UserRole.SUPER_ADMIN), createVendor);
router.get('/me', authenticate, getMe);
router.get('/vendors', authenticate, requireRole(UserRole.SUPER_ADMIN), getAllVendors);
router.get('/vendors/:id/credentials', authenticate, requireRole(UserRole.SUPER_ADMIN), getVendorCredentials);
router.get('/admin/bank-details', authenticate, getAdminBankDetails);
router.put('/admin/bank-details', authenticate, requireRole(UserRole.SUPER_ADMIN), updateAdminBankDetails);
router.post('/reset-password', authenticate, resetPassword);
router.get('/check-username/:username', checkUsernameAvailability);
router.put('/profile', authenticate, updateProfile);

export default router;
