import { Router } from 'express';
import { getNotifications, getUnreadNotifications, getUnreadCount, markAsRead, markAllAsRead } from '../controllers/notification.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

router.get('/', getNotifications);
router.get('/unread', getUnreadNotifications);
router.get('/unread-count', getUnreadCount);
router.put('/:id/read', markAsRead);
router.put('/read-all', markAllAsRead);

export default router;
