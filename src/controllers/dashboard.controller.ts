import { Response, NextFunction } from 'express';
import { getPagination, getPaginationMeta } from '../utils/pagination';
import { Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Transaction } from '../entities/Transaction';
import { User } from '../entities/User';
import { AuthRequest, UserRole, TransactionType } from '../types';
import { AppError } from '../middlewares/errorHandler';

const transactionRepository = AppDataSource.getRepository(Transaction);
const userRepository = AppDataSource.getRepository(User);

export const getVendorStats = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const vendorId = req.user!.id;
        const { startDate, endDate } = req.query;

        const where: any = { vendorId };

        if (startDate && endDate) {
            where.createdAt = Between(new Date(startDate as string), new Date(endDate as string));
        }

        const transactions = await transactionRepository.find({ where });

        const totalWithdrawal = transactions
            .filter((t) => t.type === TransactionType.WITHDRAWAL)
            .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

        const totalDeposit = transactions
            .filter((t) => t.type === TransactionType.DEPOSIT)
            .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

        const netBalance = totalDeposit - totalWithdrawal;

        res.json({
            totalWithdrawal,
            totalDeposit,
            netBalance,
        });
    } catch (error) {
        throw error;
    }
};

export const getVendorMonthlyStats = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const vendorId = req.user!.id;
        const { startDate, endDate } = req.query;

        let query = transactionRepository.createQueryBuilder('transaction')
            .where('transaction.vendorId = :vendorId', { vendorId })
            .orderBy('transaction.createdAt', 'ASC');

        let isDaily = false;
        if (startDate && endDate) {
            query.andWhere('transaction.createdAt BETWEEN :start AND :end', {
                start: new Date(startDate as string),
                end: new Date(endDate as string)
            });
            const start = new Date(startDate as string);
            const end = new Date(endDate as string);
            const diffTime = Math.abs(end.getTime() - start.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            isDaily = diffDays <= 35;
        } else {
            // Default to last 12 months
            const twelveMonthsAgo = new Date();
            twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
            query.andWhere('transaction.createdAt >= :date', { date: twelveMonthsAgo });
        }

        const transactions = await query.getMany();

        // Group by month or day
        const dataMap: { [key: string]: { withdrawal: number; deposit: number } } = {};

        transactions.forEach((transaction) => {
            const key = isDaily
                ? transaction.createdAt.toISOString().substring(0, 10) // YYYY-MM-DD
                : transaction.createdAt.toISOString().substring(0, 7); // YYYY-MM

            if (!dataMap[key]) {
                dataMap[key] = { withdrawal: 0, deposit: 0 };
            }

            if (transaction.type === TransactionType.WITHDRAWAL) {
                dataMap[key].withdrawal += parseFloat(transaction.amount.toString());
            } else {
                dataMap[key].deposit += parseFloat(transaction.amount.toString());
            }
        });

        // Convert to array format
        const monthlyStats = Object.entries(dataMap).map(([date, data]) => ({
            month: date, // Using 'month' key for compatibility, but it could be a day
            withdrawal: data.withdrawal,
            deposit: data.deposit,
            netBalance: data.deposit - data.withdrawal,
        })).sort((a, b) => a.month.localeCompare(b.month));

        res.json({ monthlyStats });
    } catch (error) {
        throw error;
    }
};



export const getAllVendorsStats = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { page, limit, skip, take } = getPagination(req.query);
        const { startDate, endDate, search } = req.query;

        // 1. Get paginated vendors (optionally filtered by name/email)
        const vendorQuery = userRepository.createQueryBuilder('user')
            .where('user.role = :role', { role: UserRole.VENDOR });

        if (search) {
            vendorQuery.andWhere('(user.name ILIKE :search OR user.email ILIKE :search)', { search: `%${search}%` });
        }

        const [vendors, total] = await vendorQuery
            .orderBy('user.createdAt', 'DESC')
            .skip(skip)
            .take(take)
            .getManyAndCount();

        if (vendors.length === 0) {
            res.json({
                vendorStats: {
                    data: [],
                    meta: getPaginationMeta(total, page, limit),
                }
            });
            return;
        }

        // 2. Aggregate stats for these vendors in ONE query
        const vendorIds = vendors.map(v => v.id);
        const query = transactionRepository
            .createQueryBuilder('t')
            .select('t.vendorId', 'vendorId')
            .addSelect('t.type', 'type')
            .addSelect('SUM(t.amount)', 'total')
            .where('t.vendorId IN (:...ids)', { ids: vendorIds });

        if (startDate && endDate) {
            query.andWhere('t.createdAt BETWEEN :start AND :end', {
                start: new Date(startDate as string),
                end: new Date(endDate as string)
            });
        }

        const stats = await query
            .groupBy('t.vendorId')
            .addGroupBy('t.type')
            .getRawMany();

        // 3. Map stats to structure
        const statsMap = new Map<string, { deposit: number, withdrawal: number }>();

        stats.forEach((row) => {
            const current = statsMap.get(row.vendorId) || { deposit: 0, withdrawal: 0 };
            const amount = parseFloat(row.total || '0');
            if (row.type === TransactionType.DEPOSIT) {
                current.deposit += amount;
            } else {
                current.withdrawal += amount;
            }
            statsMap.set(row.vendorId, current);
        });

        const data = vendors.map((vendor) => {
            const s = statsMap.get(vendor.id) || { deposit: 0, withdrawal: 0 };
            return {
                vendor: {
                    id: vendor.id,
                    name: vendor.name,
                    username: vendor.username,
                },
                totalWithdrawal: s.withdrawal,
                totalDeposit: s.deposit,
                netBalance: s.deposit - s.withdrawal,
            };
        });

        res.json({
            vendorStats: {
                data,
                meta: getPaginationMeta(total, page, limit),
            }
        });
    } catch (error) {
        next(error);
    }
};

export const getSystemOverview = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { startDate, endDate, vendorId } = req.query;

        const query = transactionRepository.createQueryBuilder('t');

        if (vendorId) {
            query.andWhere('t.vendorId = :vendorId', { vendorId });
        }

        if (startDate && endDate) {
            query.andWhere('t.createdAt BETWEEN :start AND :end', {
                start: new Date(startDate as string),
                end: new Date(endDate as string)
            });
        }

        const transactions = await query.getMany();

        const totalWithdrawal = transactions
            .filter((t) => t.type === TransactionType.WITHDRAWAL)
            .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

        const totalDeposit = transactions
            .filter((t) => t.type === TransactionType.DEPOSIT)
            .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

        const totalVendors = await userRepository.count({
            where: { role: UserRole.VENDOR },
        });

        const totalTransactions = transactions.length;

        res.json({
            totalWithdrawal,
            totalDeposit,
            totalVendors,
            totalTransactions,
        });
    } catch (error) {
        throw error;
    }
};

export const exportSettlementStats = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { startDate, endDate, vendorId } = req.query;
        const isSuperAdmin = req.user!.role === UserRole.SUPER_ADMIN;
        const targetVendorId = isSuperAdmin ? (vendorId as string) : req.user!.id;

        const query = transactionRepository
            .createQueryBuilder('t')
            .leftJoinAndSelect('t.vendor', 'vendor')
            .orderBy('t.createdAt', 'DESC');

        if (targetVendorId) {
            query.andWhere('t.vendorId = :vendorId', { vendorId: targetVendorId });
        }

        if (startDate && endDate) {
            query.andWhere('t.createdAt BETWEEN :start AND :end', {
                start: new Date(startDate as string),
                end: new Date(endDate as string)
            });
        }

        const transactions = await query.getMany();

        // Convert to CSV
        const headers = ['Date', 'Vendor Name', 'Email', 'Type', 'Amount', 'Status'];
        const rows = transactions.map(t => [
            new Date(t.createdAt).toLocaleDateString(),
            t.vendor?.name || 'Unknown',
            t.vendor?.email || 'Unknown',
            t.type,
            t.amount,
            t.status
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=settlement-report-${Date.now()}.csv`);
        res.send(csvContent);

    } catch (error) {
        throw error;
    }
};

export const getSystemMonthlyStats = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { startDate, endDate } = req.query;

        let query = transactionRepository.createQueryBuilder('transaction')
            .orderBy('transaction.createdAt', 'ASC');

        let isDaily = false;
        if (startDate && endDate) {
            query.andWhere('transaction.createdAt BETWEEN :start AND :end', {
                start: new Date(startDate as string),
                end: new Date(endDate as string)
            });
            const start = new Date(startDate as string);
            const end = new Date(endDate as string);
            const diffTime = Math.abs(end.getTime() - start.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            isDaily = diffDays <= 35;
        } else {
            const twelveMonthsAgo = new Date();
            twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
            query.andWhere('transaction.createdAt >= :date', { date: twelveMonthsAgo });
        }

        const transactions = await query.getMany();

        const dataMap: { [key: string]: { withdrawal: number; deposit: number } } = {};

        transactions.forEach((transaction) => {
            const key = isDaily
                ? transaction.createdAt.toISOString().substring(0, 10) // YYYY-MM-DD
                : transaction.createdAt.toISOString().substring(0, 7); // YYYY-MM

            if (!dataMap[key]) {
                dataMap[key] = { withdrawal: 0, deposit: 0 };
            }

            if (transaction.type === TransactionType.WITHDRAWAL) {
                dataMap[key].withdrawal += parseFloat(transaction.amount.toString());
            } else {
                dataMap[key].deposit += parseFloat(transaction.amount.toString());
            }
        });

        const monthlyStats = Object.entries(dataMap).map(([date, data]) => ({
            month: date,
            withdrawal: data.withdrawal,
            deposit: data.deposit,
            totalVolume: data.deposit + data.withdrawal,
        })).sort((a, b) => a.month.localeCompare(b.month));

        res.json({ monthlyStats });
    } catch (error) {
        throw error;
    }
};
