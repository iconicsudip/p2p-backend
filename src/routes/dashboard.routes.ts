import { Router } from 'express';
import {
    getVendorStats,
    getVendorMonthlyStats,
    getAllVendorsStats,
    getSystemOverview,
    getSystemMonthlyStats,
    exportSettlementStats,
} from '../controllers/dashboard.controller';
import { authenticate, requireRole } from '../middlewares/auth';
import { UserRole } from '../types';

const router = Router();

router.use(authenticate);

// Export route (accessible to both, filters applied in controller)
router.get('/export', exportSettlementStats);

// Vendor routes
router.get('/vendor/stats', requireRole(UserRole.VENDOR), getVendorStats);
router.get('/vendor/monthly', requireRole(UserRole.VENDOR), getVendorMonthlyStats);

// Super admin routes
router.get('/admin/vendors', requireRole(UserRole.SUPER_ADMIN), getAllVendorsStats);
router.get('/admin/overview', requireRole(UserRole.SUPER_ADMIN), getSystemOverview);
router.get('/admin/monthly', requireRole(UserRole.SUPER_ADMIN), getSystemMonthlyStats);

export default router;
