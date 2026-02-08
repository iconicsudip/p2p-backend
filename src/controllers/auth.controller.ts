import { Response, NextFunction } from 'express';
import { getPagination, getPaginationMeta } from '../utils/pagination';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { AuthRequest, UserRole } from '../types';
import bcrypt from 'bcrypt';
import { generateToken } from '../middlewares/auth';
import { AppError } from '../middlewares/errorHandler';

const userRepository = AppDataSource.getRepository(User);

export const login = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            throw new AppError('Email and password are required', 400);
        }

        const user = await userRepository.findOne({ where: { email } });

        if (!user) {
            throw new AppError('Invalid credentials', 401);
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            throw new AppError('Invalid credentials', 401);
        }

        const token = generateToken({
            id: user.id,
            email: user.email,
            role: user.role,
        });

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                bankDetails: user.bankDetails,
                upiId: user.upiId,
            },
        });
    } catch (error) {
        next(error);
    }
};

export const createVendor = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { email, password, name, bankDetails, upiId } = req.body;

        if (!email || !password || !name) {
            throw new AppError('Email, password, and name are required', 400);
        }

        const existingUser = await userRepository.findOne({ where: { email } });

        if (existingUser) {
            throw new AppError('User with this email already exists', 400);
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const vendor = userRepository.create({
            email,
            password: hashedPassword,
            tempPassword: password, // Store plain text for initial retrieval
            name,
            role: UserRole.VENDOR,
            bankDetails,
            upiId,
        });

        await userRepository.save(vendor);

        res.status(201).json({
            message: 'Vendor created successfully',
            vendor: {
                id: vendor.id,
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
            select: ['id', 'email', 'name', 'role', 'bankDetails', 'upiId', 'createdAt'],
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
