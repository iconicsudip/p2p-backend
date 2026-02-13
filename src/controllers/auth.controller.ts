import { Response, NextFunction } from 'express';
import { getPagination, getPaginationMeta } from '../utils/pagination';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { UserActivity, UserActivityType } from '../entities/UserActivity';
import { AuthRequest, UserRole } from '../types';
import bcrypt from 'bcrypt';
import { generateToken, generateRefreshToken, verifyRefreshToken } from '../middlewares/auth';
import { AppError } from '../middlewares/errorHandler';

const userRepository = AppDataSource.getRepository(User);
const userActivityRepository = AppDataSource.getRepository(UserActivity);

export const login = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            throw new AppError('Username and password are required', 400);
        }

        const user = await userRepository.findOne({ where: { username } });

        if (!user) {
            throw new AppError('Invalid credentials', 401);
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            throw new AppError('Invalid credentials', 401);
        }

        const token = generateToken({
            id: user.id,
            username: user.username,
            role: user.role,
        });

        const refreshToken = generateRefreshToken({
            id: user.id,
            username: user.username,
            role: user.role,
        });

        // Log Login Activity
        const activity = userActivityRepository.create({
            user,
            action: UserActivityType.LOGIN,
            ipAddress: req.ip || req.socket.remoteAddress,
            userAgent: req.headers['user-agent'],
        });
        await userActivityRepository.save(activity);

        res.json({
            token,
            refreshToken,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                name: user.name,
                role: user.role,
                bankDetails: user.bankDetails,
                upiId: user.upiId,
                mustResetPassword: user.mustResetPassword,
            },
        });
    } catch (error) {
        next(error);
    }
};

export const createVendor = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { username, password, name, email, bankDetails, upiId } = req.body;

        if (!username || !password || !name) {
            throw new AppError('Username, password, and name are required', 400);
        }

        const existingUser = await userRepository.findOne({ where: { username } });

        if (existingUser) {
            throw new AppError('User with this username already exists', 400);
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const vendor = userRepository.create({
            username,
            email,
            password: hashedPassword,
            tempPassword: password, // Store plain text for initial retrieval
            name,
            role: UserRole.VENDOR,
            bankDetails,
            upiId,
            mustResetPassword: true, // Force password reset on first login
        });

        await userRepository.save(vendor);

        const token = generateToken({
            id: vendor.id,
            username: vendor.username,
            role: vendor.role,
        });

        const refreshToken = generateRefreshToken({
            id: vendor.id,
            username: vendor.username,
            role: vendor.role,
        });

        res.status(201).json({
            message: 'Vendor created successfully',
            token,
            refreshToken,
            vendor: {
                id: vendor.id,
                username: vendor.username,
                email: vendor.email,
                name: vendor.name,
                role: vendor.role,
            },
        });
    } catch (error) {
        next(error);
    }
};

export const getVendorCredentials = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const vendor = await userRepository
            .createQueryBuilder('user')
            .addSelect('user.password')
            .where('user.id = :id', { id })
            .andWhere('user.role = :role', { role: UserRole.VENDOR })
            .getOne();

        if (!vendor) {
            throw new AppError('Vendor not found', 404);
        }

        res.json({
            password: vendor.password || null
        });
    } catch (error) {
        next(error);
    }
};

export const getMe = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        if (!req.user) {
            throw new AppError('User not authenticated', 401);
        }

        const user = await userRepository.findOne({
            where: { id: req.user.id },
            select: ['id', 'username', 'email', 'name', 'role', 'bankDetails', 'upiId', 'createdAt'],
        });

        if (!user) {
            throw new AppError('User not found', 404);
        }

        res.json({ user });
    } catch (error) {
        next(error);
    }
};



export const getAllVendors = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { page, limit, skip, take } = getPagination(req.query);

        const [vendors, total] = await userRepository.findAndCount({
            where: { role: UserRole.VENDOR },
            select: ['id', 'email', 'name', 'bankDetails', 'upiId', 'createdAt'],
            order: { createdAt: 'DESC' },
            skip,
            take,
        });

        res.json({
            vendors: {
                data: vendors,
                meta: getPaginationMeta(total, page, limit),
            }
        });
    } catch (error) {
        next(error);
    }
};

export const getAdminBankDetails = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        // Fetch super admin user
        const admin = await userRepository.findOne({
            where: { role: UserRole.SUPER_ADMIN },
            select: ['id', 'name', 'bankDetails', 'upiId'],
        });

        if (!admin) {
            throw new AppError('Admin not found', 404);
        }

        // Return only public payment information
        res.json({
            admin: {
                name: admin.name,
                bankDetails: admin.bankDetails,
                upiId: admin.upiId,
            }
        });
    } catch (error) {
        next(error);
    }
};

export const updateAdminBankDetails = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { bankDetails, upiId } = req.body;

        if (!userId) {
            throw new AppError('Unauthorized', 401);
        }

        // Fetch the user and verify they are super admin
        const user = await userRepository.findOne({ where: { id: userId } });

        if (!user || user.role !== UserRole.SUPER_ADMIN) {
            throw new AppError('Only super admin can update bank details', 403);
        }

        // Update bank details
        user.bankDetails = bankDetails;
        user.upiId = upiId;

        await userRepository.save(user);

        res.json({
            message: 'Bank details updated successfully',
            admin: {
                name: user.name,
                bankDetails: user.bankDetails,
                upiId: user.upiId,
                mustResetPassword: user.mustResetPassword,
            }
        });
    } catch (error) {
        next(error);
    }
};

export const resetPassword = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { currentPassword, newPassword } = req.body;

        if (!userId) {
            throw new AppError('User not authenticated', 401);
        }

        if (!newPassword) {
            throw new AppError('New password is required', 400);
        }

        if (newPassword.length < 8) {
            throw new AppError('New password must be at least 8 characters long', 400);
        }

        // Fetch user
        const user = await userRepository.findOne({ where: { id: userId } });

        if (!user) {
            throw new AppError('User not found', 404);
        }

        // If current password is provided, verify it
        // If not provided, allow password change (for first-time resets or admin changes)
        if (currentPassword) {
            // Verify current password
            const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

            if (!isPasswordValid) {
                throw new AppError('Current password is incorrect', 401);
            }
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password and reset flag
        user.password = hashedPassword;
        user.mustResetPassword = false;
        user.tempPassword = null as any; // Clear temp password

        await userRepository.save(user);

        res.json({
            message: 'Password reset successfully',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                bankDetails: user.bankDetails,
                upiId: user.upiId,
                mustResetPassword: user.mustResetPassword,
            },
        });
    } catch (error) {
        next(error);
    }
};

// Check username availability
export const checkUsernameAvailability = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { username } = req.params;
        const userId = req.user?.id;

        if (!username) {
            throw new AppError('Username is required', 400);
        }

        // Check if username exists (excluding current user)
        const existingUser = await userRepository.findOne({
            where: { username }
        });

        // Username is available if:
        // 1. No user found with that username, OR
        // 2. The found user is the current user (they're keeping their username)
        const available = !existingUser || existingUser.id === userId;

        res.json({ available });
    } catch (error) {
        next(error);
    }
};

// Update user profile (name and username)
export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { name, username } = req.body;

        if (!userId) {
            throw new AppError('Unauthorized', 401);
        }

        if (!name || !username) {
            throw new AppError('Name and username are required', 400);
        }

        // Fetch user
        const user = await userRepository.findOne({ where: { id: userId } });

        if (!user) {
            throw new AppError('User not found', 404);
        }

        // If username is changing, check if new username is available
        if (username !== user.username) {
            const existingUser = await userRepository.findOne({
                where: { username }
            });

            if (existingUser) {
                throw new AppError('Username already taken', 400);
            }
        }

        // Update user
        user.name = name;
        user.username = username;

        await userRepository.save(user);

        res.json({
            message: 'Profile updated successfully',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                name: user.name,
                role: user.role,
                bankDetails: user.bankDetails,
                upiId: user.upiId,
                mustResetPassword: user.mustResetPassword,
            },
        });
    } catch (error) {
        next(error);
    }
};

export const forgotPassword = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { username, newPassword } = req.body;

        if (!username || !newPassword) {
            throw new AppError('Username and new password are required', 400);
        }

        if (newPassword.length < 8) {
            throw new AppError('New password must be at least 8 characters long', 400);
        }

        const user = await userRepository.findOne({ where: { username } });

        if (!user) {
            throw new AppError('User not found', 404);
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        user.password = hashedPassword;
        user.mustResetPassword = false;
        user.tempPassword = null as any;

        await userRepository.save(user);

        res.json({ message: 'Password reset successfully' });

    } catch (error) {
        next(error);
    }
};

export const refreshToken = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            throw new AppError('Refresh token is required', 400);
        }

        let decoded;
        try {
            decoded = verifyRefreshToken(refreshToken);
        } catch (error) {
            throw new AppError('Invalid or expired refresh token', 401);
        }

        const user = await userRepository.findOne({ where: { id: decoded.id } });

        if (!user) {
            throw new AppError('User not found', 404);
        }

        const token = generateToken({
            id: user.id,
            username: user.username,
            role: user.role,
        });

        res.json({ token });
    } catch (error) {
        next(error);
    }
};

export const logout = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        if (!req.user) {
            throw new AppError('User not authenticated', 401);
        }

        const user = await userRepository.findOne({ where: { id: req.user.id } });

        if (user) {
            const activity = userActivityRepository.create({
                user,
                action: UserActivityType.LOGOUT,
                ipAddress: req.ip || req.socket.remoteAddress,
                userAgent: req.headers['user-agent'],
            });
            await userActivityRepository.save(activity);
        }

        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        next(error);
    }
};

export const getUserActivity = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { userId } = req.params;
        const { page, limit, skip, take } = getPagination(req.query);

        // Allow admin to view any user's activity, or user to view their own
        if (req.user?.role !== UserRole.SUPER_ADMIN && req.user?.id !== userId) {
            throw new AppError('Unauthorized access to user activity', 403);
        }

        const [activities, total] = await userActivityRepository.findAndCount({
            where: { userId },
            order: { timestamp: 'DESC' },
            skip,
            take,
        });

        res.json({
            activities: {
                data: activities,
                meta: getPaginationMeta(total, page, limit),
            }
        });
    } catch (error) {
        next(error);
    }
};
