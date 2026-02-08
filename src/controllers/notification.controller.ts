import { Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { Notification } from '../entities/Notification';
import { AuthRequest } from '../types';
import { AppError } from '../middlewares/errorHandler';

const notificationRepository = AppDataSource.getRepository(Notification);

import { getPagination, getPaginationMeta } from '../utils/pagination';

export const getNotifications = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { page, limit, skip, take } = getPagination(req.query);

        const [notifications, total] = await notificationRepository.findAndCount({
            where: { userId: req.user!.id },
            relations: ['request'],
            order: { createdAt: 'DESC' },
            skip,
            take,
        });

        // Optimization: Use DB count, don't filter in memory (which would only count current page)
        const unreadCount = await notificationRepository.count({
            where: {
                userId: req.user!.id,
                isRead: false
            }
        });

        res.json({
            notifications: {
                data: notifications,
                meta: getPaginationMeta(total, page, limit),
            },
            unreadCount,
        });
    } catch (error) {
        next(error); // Assuming explicit error handler is used or add it if strictly needed, but let's stick to existing style if it had try/catch
    }
};

export const getUnreadNotifications = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { page, limit, skip, take } = getPagination(req.query);

        const [notifications, total] = await notificationRepository.findAndCount({
            where: {
                userId: req.user!.id,
                isRead: false
            },
            relations: ['request'],
            order: { createdAt: 'DESC' },
            skip,
            take,
        });

        res.json({
            notifications: {
                data: notifications,
                meta: getPaginationMeta(total, page, limit),
            }
        });
    } catch (error) {
        next(error);
    }


};

export const getUnreadCount = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const count = await notificationRepository.count({
            where: {
                userId: req.user!.id,
                isRead: false
            }
        });

        res.json({ count });
    } catch (error) {
        next(error);
    }
};

export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const notification = await notificationRepository.findOne({
            where: { id },
        });

        if (!notification) {
            throw new AppError('Notification not found', 404);
        }

        if (notification.userId !== req.user!.id) {
            throw new AppError('You are not authorized to mark this notification as read', 403);
        }

        notification.isRead = true;
        await notificationRepository.save(notification);

        res.json({
            message: 'Notification marked as read',
            notification,
        });
    } catch (error) {
        throw error;
    }
};

export const markAllAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        await notificationRepository.update(
            { userId: req.user!.id, isRead: false },
            { isRead: true }
        );

        res.json({
            message: 'All notifications marked as read',
        });
    } catch (error) {
        throw error;
    }
};
