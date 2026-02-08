import { Router } from 'express';
import {
    createRequest,
    getAvailableRequests,
    getMyRequests,
    getMyRequestsCounts,
    pickRequest,
    getRequestDetails,
    uploadPaymentSlip,
    verifyPayment,
    getRequestLogs,
    reportPaymentFailure,
    revertRequest,
    getAllRequestsForAdmin,
    getRequestPaymentSlips,
    deleteRequest,
} from '../controllers/request.controller';
import { authenticate, requireRole } from '../middlewares/auth';
import { upload } from '../middlewares/upload';
import { UserRole } from '../types';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.post('/', createRequest);
router.get('/available', getAvailableRequests);
router.get('/my-requests/counts', getMyRequestsCounts);
router.get('/my-requests', getMyRequests);
router.post('/:id/pick', pickRequest);
router.get('/:id/details', getRequestDetails);
router.get('/:id/logs', getRequestLogs);
router.get('/:id/slips', getRequestPaymentSlips);
router.post('/:id/upload-slip', upload.single('paymentSlip'), uploadPaymentSlip);
router.post('/:id/verify', verifyPayment);
router.post('/:id/fail-payment', reportPaymentFailure);
router.delete('/:id', deleteRequest);

router.post('/:id/revert', revertRequest);
router.get('/admin/all', requireRole(UserRole.SUPER_ADMIN), getAllRequestsForAdmin);

export default router;
