import { Response, NextFunction } from 'express';
import { getPagination, getPaginationMeta } from '../utils/pagination';
import { AppDataSource } from '../config/database';
import { Request as RequestEntity } from '../entities/Request';
import { Transaction } from '../entities/Transaction';
import { Notification } from '../entities/Notification';
import { PaymentSlip } from '../entities/PaymentSlip';
import { User } from '../entities/User';
import { RequestLog } from '../entities/RequestLog';
import { AuthRequest, RequestType, RequestStatus, TransactionType, NotificationType, UserRole, LogActionType } from '../types';
import { AppError } from '../middlewares/errorHandler';
import { Not, In, Between, MoreThanOrEqual } from 'typeorm';

const requestRepository = AppDataSource.getRepository(RequestEntity);
const transactionRepository = AppDataSource.getRepository(Transaction);
const notificationRepository = AppDataSource.getRepository(Notification);
const paymentSlipRepository = AppDataSource.getRepository(PaymentSlip);
const userRepository = AppDataSource.getRepository(User);
const requestLogRepository = AppDataSource.getRepository(RequestLog);

export const createRequest = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { type, amount, bankDetails, upiId, qrCode } = req.body;

        if (!type || !amount) {
            throw new AppError('Type and amount are required', 400);
        }

        if (!Object.values(RequestType).includes(type)) {
            throw new AppError('Invalid request type', 400);
        }

        // Enforce withdrawal limit
        if (type === RequestType.WITHDRAWAL) {
            const user = await userRepository.findOne({
                where: { id: req.user!.id },
                select: ['withdrawalLimitConfig', 'maxWithdrawalLimit']
            });

            if (user?.withdrawalLimitConfig === 'UNLIMITED') {
                // No limit check needed
            } else if (user?.withdrawalLimitConfig === 'CUSTOM') {
                if (user.maxWithdrawalLimit && amount > user.maxWithdrawalLimit) {
                    throw new AppError(`Withdrawal amount cannot exceed your custom limit of ₹${Number(user.maxWithdrawalLimit).toLocaleString('en-IN')}`, 400);
                }
            } else {
                // Fallback to Global Limit
                const admin = await userRepository.findOne({
                    where: { role: UserRole.SUPER_ADMIN },
                    select: ['maxWithdrawalLimit']
                });

                if (admin && admin.maxWithdrawalLimit && amount > admin.maxWithdrawalLimit) {
                    throw new AppError(`Withdrawal amount cannot exceed the limit of ₹${Number(admin.maxWithdrawalLimit).toLocaleString('en-IN')}`, 400);
                }
            }
        }

        const request = requestRepository.create({
            type,
            amount,
            bankDetails,
            upiId,
            qrCode,
            createdById: req.user!.id,
            pendingAmount: amount,
        });

        await requestRepository.save(request);

        // Create log entry
        await requestLogRepository.save({
            requestId: request.id,
            userId: req.user!.id,
            action: LogActionType.CREATED,
            comment: `Request created for ₹${amount.toLocaleString('en-IN')}`,
            metadata: { type, amount },
        });

        res.status(201).json({
            message: 'Request created successfully',
            request,
        });
    } catch (error) {
        next(error);
    }
};

export const createAdminWithdrawal = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { amount } = req.body;

        if (!amount) {
            throw new AppError('Amount is required', 400);
        }

        // Get super admin user
        const admin = await userRepository.findOne({
            where: { role: UserRole.SUPER_ADMIN },
        });

        if (!admin) {
            throw new AppError('Admin not found', 404);
        }

        // Check if admin has bank details or UPI
        if (!admin.bankDetails && !admin.upiId) {
            throw new AppError('Admin bank details not configured', 400);
        }

        // Create withdrawal request on behalf of admin
        const request = requestRepository.create({
            type: RequestType.WITHDRAWAL,
            amount,
            bankDetails: admin.bankDetails,
            upiId: admin.upiId,
            createdById: admin.id,
            pendingAmount: amount,
        });

        await requestRepository.save(request);

        // Create log entry
        await requestLogRepository.save({
            requestId: request.id,
            userId: admin.id,
            action: LogActionType.CREATED,
            comment: `Admin withdrawal request created for ₹${amount.toLocaleString('en-IN')}`,
            metadata: { type: RequestType.WITHDRAWAL, amount, createdBy: 'system' },
        });

        res.status(201).json({
            message: 'Admin withdrawal request created successfully',
            request,
        });
    } catch (error) {
        next(error);
    }
};


export const getAllRequestsForAdmin = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { page, limit, skip, take } = getPagination(req.query);
        const { startDate, endDate, status, type, vendorId, search } = req.query;

        const query = requestRepository.createQueryBuilder('request')
            .leftJoinAndSelect('request.createdBy', 'createdBy')
            .leftJoinAndSelect('request.pickedBy', 'pickedBy')
            // Don't join paymentSlips or logs here to keep list light. Fetch details on demand.
            .orderBy('request.createdAt', 'DESC')
            .skip(skip)
            .take(take);

        if (startDate && endDate) {
            query.andWhere('request.createdAt BETWEEN :start AND :end', {
                start: new Date(startDate as string),
                end: new Date(endDate as string)
            });
        }

        if (status) {
            query.andWhere('request.status = :status', { status });
        }

        if (type) {
            query.andWhere('request.type = :type', { type });
        }

        if (vendorId) {
            query.andWhere('(request.createdById = :vendorId OR request.pickedById = :vendorId)', { vendorId });
        }

        if (search) {
            query.andWhere('(createdBy.name ILIKE :search OR createdBy.email ILIKE :search OR pickedBy.name ILIKE :search)', { search: `%${search}%` });
        }

        const [requests, total] = await query.getManyAndCount();

        res.json({
            requests: {
                data: requests,
                meta: getPaginationMeta(total, page, limit),
            }
        });
    } catch (error) {
        next(error);
    }
};

export const getAvailableRequests = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { page, limit, skip, take } = getPagination(req.query);

        const { amount, minAmount, type } = req.query;

        const where: any = {
            status: RequestStatus.PENDING,
            createdById: Not(req.user!.id),
        };

        if (amount) {
            where.amount = amount;
        }

        if (minAmount) {
            where.amount = MoreThanOrEqual(minAmount);
        }

        if (type) {
            where.type = type;
        }

        // Get all pending requests NOT created by current user
        const [requests, total] = await requestRepository.findAndCount({
            where,
            relations: ['createdBy'],
            order: { createdAt: 'DESC' },
            skip,
            take,
        });

        // Invert the type for display (withdrawal shows as deposit and vice versa)
        const invertedRequests = requests.map((request) => ({
            ...request,
            displayType: request.type === RequestType.WITHDRAWAL ? RequestType.DEPOSIT : RequestType.WITHDRAWAL,
            originalType: request.type,
        }));

        res.json({
            requests: {
                data: invertedRequests,
                meta: getPaginationMeta(total, page, limit),
            }
        });
    } catch (error) {
        next(error);
    }
};

export const getMyRequests = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const limit = parseInt(req.query.limit as string) || 10;
        const createdPage = parseInt(req.query.createdPage as string) || 1;
        const pickedPage = parseInt(req.query.pickedPage as string) || 1;

        const createdSkip = (createdPage - 1) * limit;
        const pickedSkip = (pickedPage - 1) * limit;

        const { startDate, endDate, status } = req.query;
        let dateFilter = {};
        if (startDate && endDate) {
            dateFilter = {
                createdAt: Between(new Date(startDate as string), new Date(endDate as string))
            };
        }

        // Use query builder to select specific fields and avoid fetching large blobs in relations
        const [createdRequests, createdTotal] = await requestRepository.findAndCount({
            where: {
                createdById: req.user!.id,
                ...(status ? { status: status as RequestStatus } : {}),
                ...dateFilter
            },
            relations: ['pickedBy', 'paymentSlips'],
            select: {
                id: true,
                type: true,
                amount: true,
                status: true,
                bankDetails: {
                    accountNumber: true,
                    ifscCode: true,
                    bankName: true,
                    accountHolderName: true
                },
                upiId: true,
                qrCode: true,
                paidAmount: true,
                pendingAmount: true,
                rejectionReason: true,
                paymentFailureReason: true,
                createdById: true,
                createdAt: true,
                pickedBy: {
                    id: true,
                    name: true,
                    email: true
                },
                paymentSlips: {
                    id: true,
                    amount: true,
                    requestId: true,
                    uploadedById: true,
                    createdAt: true
                    // Explicitly NOT selecting fileUrl
                }
            },
            order: { createdAt: 'DESC' },
            skip: createdSkip,
            take: limit,
        });

        const [pickedRequests, pickedTotal] = await requestRepository.findAndCount({
            where: {
                pickedById: req.user!.id,
                ...(status ? { status: status as RequestStatus } : {}),
                ...dateFilter
            },
            relations: ['createdBy', 'paymentSlips'],
            select: {
                id: true,
                type: true,
                amount: true,
                status: true,
                bankDetails: {
                    accountNumber: true,
                    ifscCode: true,
                    bankName: true,
                    accountHolderName: true
                },
                upiId: true,
                qrCode: true,
                paidAmount: true,
                pendingAmount: true,
                rejectionReason: true,
                paymentFailureReason: true,
                pickedById: true, // Needed for createdBy relation check?
                createdAt: true,
                createdBy: {
                    id: true,
                    name: true,
                    email: true
                },
                paymentSlips: {
                    id: true,
                    amount: true,
                    requestId: true,
                    uploadedById: true,
                    createdAt: true
                    // Explicitly NOT selecting fileUrl
                }
            },
            order: { createdAt: 'DESC' },
            skip: pickedSkip,
            take: limit,
        });

        res.json({
            createdRequests: {
                data: createdRequests,
                meta: getPaginationMeta(createdTotal, createdPage, limit),
            },
            pickedRequests: {
                data: pickedRequests,
                meta: getPaginationMeta(pickedTotal, pickedPage, limit),
            },
        });
    } catch (error) {
        next(error);
    }
};

export const getMyRequestsCounts = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const createdCount = await requestRepository.count({
            where: { createdById: req.user!.id },
        });

        const pickedCount = await requestRepository.count({
            where: { pickedById: req.user!.id },
        });

        res.json({
            createdCount,
            pickedCount,
        });
    } catch (error) {
        next(error);
    }
};

export const pickRequest = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const { amount } = req.body;

        const request = await requestRepository.findOne({
            where: { id },
            relations: ['createdBy'],
        });

        if (!request) {
            throw new AppError('Request not found', 404);
        }

        if (request.createdById === req.user!.id) {
            throw new AppError('You cannot pick your own request', 400);
        }

        if (request.status !== RequestStatus.PENDING) {
            throw new AppError('Request is no longer available', 400);
        }

        let pickedAmount = request.amount;
        let newRequest = null;

        // Smart Pick Logic: Handle partial pick
        if (amount && amount > 0 && amount < request.amount) {
            pickedAmount = amount;
            const remainingAmount = request.amount - amount;

            // 1. Create a new request for the remaining amount
            newRequest = requestRepository.create({
                type: request.type,
                amount: remainingAmount,
                bankDetails: request.bankDetails,
                upiId: request.upiId,
                createdById: request.createdById,
                pendingAmount: remainingAmount,
                status: RequestStatus.PENDING, // Remains available for others
            });

            await requestRepository.save(newRequest);

            // 2. Update the current request to the picked amount
            request.amount = pickedAmount;
            request.pendingAmount = pickedAmount; // Reset pending amount for this specific split
        } else if (amount && amount > request.amount) {
            throw new AppError(`Cannot pick more than the available request amount of ₹${request.amount}`, 400);
        }

        request.status = RequestStatus.PICKED;
        request.pickedById = req.user!.id;

        await requestRepository.save(request);

        // Fetch vendor name for log
        const vendor = await userRepository.findOne({ where: { id: req.user!.id } });

        // Create log entry for the picked request
        await requestLogRepository.save({
            requestId: request.id,
            userId: req.user!.id,
            action: LogActionType.PICKED,
            comment: `Request picked by ${vendor?.name || 'vendor'} (Split amount: ₹${pickedAmount})`,
            metadata: { pickedAmount, originalTotal: amount ? amount + (newRequest?.amount || 0) : pickedAmount }
        });

        if (newRequest) {
            // Create log entry for the new remaining request
            await requestLogRepository.save({
                requestId: newRequest.id,
                userId: request.createdById, // Log action on behalf of system/split
                action: LogActionType.CREATED,
                comment: `Auto-created remaining request after split pick of ₹${pickedAmount}`,
                metadata: { type: newRequest.type, amount: newRequest.amount, parentRequestId: request.id },
            });

            // Notify creator about the split (optional but good UX)
            const splitNotification = notificationRepository.create({
                userId: request.createdById,
                message: `Your request was split. ₹${pickedAmount} was picked, and a new request for ₹${newRequest.amount} is now pending.`,
                type: NotificationType.REQUEST_PICKED,
                requestId: newRequest.id,
            });
            await notificationRepository.save(splitNotification);
        }

        // Create notification for request creator regarding the pick
        const notification = notificationRepository.create({
            userId: request.createdById,
            message: `Your ${request.type.toLowerCase()} request of ₹${request.amount} has been picked`,
            type: NotificationType.REQUEST_PICKED,
            requestId: request.id,
        });

        await notificationRepository.save(notification);

        res.json({
            message: newRequest
                ? `Request picked for ₹${pickedAmount}. Remaining ₹${newRequest.amount} is listed as a new request.`
                : 'Request picked successfully',
            request,
            newRequest
        });
    } catch (error) {
        next(error);
    }
};

export const getRequestDetails = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;

        const request = await requestRepository.findOne({
            where: { id },
            relations: ['createdBy', 'pickedBy', 'paymentSlips'],
        });

        if (!request) {
            throw new AppError('Request not found', 404);
        }

        // Only allow creator or picker to view details
        // Only allow creator, picker, or super admin to view details
        if (
            req.user!.role !== UserRole.SUPER_ADMIN &&
            request.createdById !== req.user!.id &&
            request.pickedById !== req.user!.id
        ) {
            throw new AppError('You do not have permission to view this request', 403);
        }

        res.json({ request });
    } catch (error) {
        next(error);
    }
};

export const uploadPaymentSlip = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const { amount } = req.body;
        const file = req.file;

        if (!file) {
            throw new AppError('Payment slip file is required', 400);
        }

        if (!amount) {
            throw new AppError('Amount is required', 400);
        }

        const request = await requestRepository.findOne({
            where: { id },
            relations: ['createdBy'],
        });

        if (!request) {
            throw new AppError('Request not found', 404);
        }

        if (request.pickedById !== req.user!.id) {
            throw new AppError('You are not authorized to upload payment slip for this request', 403);
        }

        if (request.status !== RequestStatus.PICKED && request.status !== RequestStatus.PAID_PARTIAL) {
            throw new AppError('Cannot upload payment slip for this request', 400);
        }

        const paidAmount = parseFloat(amount);
        const totalPaid = parseFloat(request.paidAmount.toString()) + paidAmount;
        const pending = parseFloat(request.amount.toString()) - totalPaid;

        // Create payment slip record
        const b64 = Buffer.from(file.buffer).toString('base64');
        const fileUrl = `data:${file.mimetype};base64,${b64}`;

        const paymentSlip = paymentSlipRepository.create({
            requestId: request.id,
            uploadedById: req.user!.id,
            fileUrl,
            amount: paidAmount,
        });

        await paymentSlipRepository.save(paymentSlip);

        // Update request
        request.paidAmount = totalPaid;
        request.pendingAmount = pending > 0 ? pending : 0;

        if (totalPaid >= parseFloat(request.amount.toString())) {
            request.status = RequestStatus.PAID_FULL;
        } else {
            request.status = RequestStatus.PAID_PARTIAL;
        }

        await requestRepository.save(request);

        // Fetch vendor name for log
        const vendor = await userRepository.findOne({ where: { id: req.user!.id } });

        // Create log entry
        await requestLogRepository.save({
            requestId: request.id,
            userId: req.user!.id,
            action: LogActionType.PAYMENT_UPLOADED,
            comment: `Payment slip uploaded by ${vendor?.name || 'vendor'} for ₹${paidAmount.toLocaleString('en-IN')}`,
            metadata: { amount: paidAmount, totalPaid, pending },
        });

        // Create notification for request creator
        const notification = notificationRepository.create({
            userId: request.createdById,
            message: `Payment slip uploaded for your ${request.type.toLowerCase()} request. Amount: ₹${paidAmount}`,
            type: NotificationType.PAYMENT_UPLOADED,
            requestId: request.id,
        });

        await notificationRepository.save(notification);

        res.json({
            message: 'Payment slip uploaded successfully',
            request,
            paymentSlip: {
                ...paymentSlip,
                fileUrl: undefined // Don't send the large base64 string back
            },
        });
    } catch (error) {
        next(error);
    }
};

export const verifyPayment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const { approved, rejectionReason } = req.body;

        if (approved === undefined) {
            throw new AppError('Approval status is required', 400);
        }

        const request = await requestRepository.findOne({
            where: { id },
            relations: ['createdBy', 'pickedBy'],
        });

        if (!request) {
            throw new AppError('Request not found', 404);
        }

        if (request.createdById !== req.user!.id) {
            throw new AppError('You are not authorized to verify this payment', 403);
        }

        if (request.status !== RequestStatus.PAID_FULL && request.status !== RequestStatus.PAID_PARTIAL) {
            throw new AppError('No payment to verify', 400);
        }

        if (approved) {
            // Approve payment
            const hasPendingAmount = request.pendingAmount > 0;

            request.status = RequestStatus.COMPLETED;

            // Create transactions for both users (for the paid amount)
            const creatorTransaction = transactionRepository.create({
                requestId: request.id,
                vendorId: request.createdById,
                type: request.type === RequestType.WITHDRAWAL ? TransactionType.WITHDRAWAL : TransactionType.DEPOSIT,
                amount: request.paidAmount,
            });

            const pickerTransaction = transactionRepository.create({
                requestId: request.id,
                vendorId: request.pickedById!,
                type: request.type === RequestType.WITHDRAWAL ? TransactionType.DEPOSIT : TransactionType.WITHDRAWAL,
                amount: request.paidAmount,
            });

            await transactionRepository.save([creatorTransaction, pickerTransaction]);

            // Notify picker
            const pickerNotification = notificationRepository.create({
                userId: request.pickedById!,
                message: `Your payment for request #${request.id.substring(0, 8)} has been approved`,
                type: NotificationType.PAYMENT_APPROVED,
                requestId: request.id,
            });

            // Notify super admin
            const superAdmin = await userRepository.findOne({ where: { role: UserRole.SUPER_ADMIN } });

            if (superAdmin) {
                const adminNotification = notificationRepository.create({
                    userId: superAdmin.id,
                    message: `Payment approved for request #${request.id.substring(0, 8)}. Vendor: ${request.pickedBy?.name}`,
                    type: NotificationType.ADMIN_ALERT,
                    requestId: request.id,
                });

                await notificationRepository.save([pickerNotification, adminNotification]);
            } else {
                await notificationRepository.save(pickerNotification);
            }

            await requestRepository.save(request);

            // Create log entry for approval
            await requestLogRepository.save({
                requestId: request.id,
                userId: req.user!.id,
                action: hasPendingAmount ? LogActionType.PARTIAL_PAYMENT_APPROVED : LogActionType.PAYMENT_APPROVED,
                comment: hasPendingAmount
                    ? `Partial payment of ₹${request.paidAmount.toLocaleString('en-IN')} approved. Pending: ₹${request.pendingAmount.toLocaleString('en-IN')}`
                    : `Payment of ₹${request.paidAmount.toLocaleString('en-IN')} approved`,
                metadata: { paidAmount: request.paidAmount, pendingAmount: request.pendingAmount },
            });

            // If there's pending amount, create a new request for it
            let newRequest = null;
            if (hasPendingAmount) {
                newRequest = requestRepository.create({
                    type: request.type,
                    amount: request.pendingAmount,
                    bankDetails: request.bankDetails,
                    upiId: request.upiId,
                    createdById: request.createdById,
                    pendingAmount: request.pendingAmount,
                    status: RequestStatus.PENDING,
                });

                await requestRepository.save(newRequest);

                // Notify creator about the new request
                const creatorNotification = notificationRepository.create({
                    userId: request.createdById,
                    message: `New request created for pending amount ₹${request.pendingAmount} from request #${request.id.substring(0, 8)}`,
                    type: NotificationType.REQUEST_PICKED,
                    requestId: newRequest.id,
                });

                await notificationRepository.save(creatorNotification);
            }

            res.json({
                message: hasPendingAmount
                    ? `Payment approved successfully. New request created for pending amount ₹${request.pendingAmount}`
                    : 'Payment approved successfully',
                request,
                newRequest,
            });
        } else {
            // Reject payment - keep as REJECTED for vendor, create new PENDING request for others
            request.status = RequestStatus.REJECTED;
            request.rejectionReason = rejectionReason || 'Payment rejected';
            // Keep pickedById so vendor can see it in their "Picked by Me" tab

            await requestRepository.save(request);

            // Create log entry for rejection
            await requestLogRepository.save({
                requestId: request.id,
                userId: req.user!.id,
                action: LogActionType.PAYMENT_REJECTED,
                comment: request.rejectionReason,
                metadata: { rejectedAmount: request.amount },
            });

            // Create a new PENDING request for others to pick
            const newRequest = requestRepository.create({
                type: request.type,
                amount: request.amount,
                bankDetails: request.bankDetails,
                upiId: request.upiId,
                createdById: request.createdById,
                pendingAmount: request.amount,
                status: RequestStatus.PENDING,
            });

            await requestRepository.save(newRequest);

            // Notify picker about rejection
            const pickerNotification = notificationRepository.create({
                userId: request.pickedBy!.id,
                message: `Your payment for request #${request.id.substring(0, 8)} has been rejected. Reason: ${request.rejectionReason}`,
                type: NotificationType.PAYMENT_REJECTED,
                requestId: request.id,
            });

            // Notify creator about the new request
            const creatorNotification = notificationRepository.create({
                userId: request.createdById,
                message: `New request created after rejection of request #${request.id.substring(0, 8)}`,
                type: NotificationType.REQUEST_PICKED,
                requestId: newRequest.id,
            });

            // Notify super admin
            const superAdmin = await userRepository.findOne({ where: { role: UserRole.SUPER_ADMIN } });

            if (superAdmin) {
                const adminNotification = notificationRepository.create({
                    userId: superAdmin.id,
                    message: `Payment rejected for request #${request.id.substring(0, 8)}. Vendor: ${request.pickedBy?.name}. New request created.`,
                    type: NotificationType.ADMIN_ALERT,
                    requestId: request.id,
                });

                await notificationRepository.save([pickerNotification, creatorNotification, adminNotification]);
            } else {
                await notificationRepository.save([pickerNotification, creatorNotification]);
            }

            res.json({
                message: 'Payment rejected. New request created and is now available for others to pick.',
                request,
                newRequest,
            });
        }
    } catch (error) {
        next(error);
    }
};

export const getRequestLogs = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;

        const logs = await requestLogRepository.find({
            where: { requestId: id },
            relations: ['user'],
            order: { createdAt: 'DESC' },
        });

        res.json({ logs });
    } catch (error) {
        next(error);
    }
};

export const reportPaymentFailure = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (!reason) {
            throw new AppError('Reason is required', 400);
        }

        const request = await requestRepository.findOne({
            where: { id },
            relations: ['createdBy', 'pickedBy'],
        });

        if (!request) {
            throw new AppError('Request not found', 404);
        }

        if (request.pickedById !== req.user!.id) {
            throw new AppError('You are not authorized to report payment failure for this request', 403);
        }

        if (request.status !== RequestStatus.PICKED && request.status !== RequestStatus.PAID_PARTIAL) {
            throw new AppError('Cannot report payment failure for this request status', 400);
        }

        request.status = RequestStatus.PAYMENT_FAILED;
        request.paymentFailureReason = reason;

        await requestRepository.save(request);

        // Retrieve vendor name for log
        const vendor = await userRepository.findOne({ where: { id: req.user!.id } });

        // Log the failure report
        await requestLogRepository.save({
            requestId: request.id,
            userId: req.user!.id,
            action: LogActionType.PAYMENT_FAILED,
            comment: `Payment failure reported by ${vendor?.name || 'vendor'}: ${reason}`,
            metadata: { reason },
        });

        // Notify the creator
        const notification = notificationRepository.create({
            userId: request.createdById,
            message: `Payment failed for your ${request.type.toLowerCase()} request. Reason: ${reason}`,
            type: NotificationType.PAYMENT_FAILED,
            requestId: request.id,
        });

        await notificationRepository.save(notification);

        res.json({
            message: 'Payment failure reported successfully',
            request,
        });
    } catch (error) {
        next(error);
    }
};

export const revertRequest = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const { bankDetails, upiId, comment } = req.body;

        const request = await requestRepository.findOne({
            where: { id },
            relations: ['pickedBy'],
        });

        if (!request) {
            throw new AppError('Request not found', 404);
        }

        if (request.createdById !== req.user!.id) {
            throw new AppError('You are not authorized to revert this request', 403);
        }

        if (request.status !== RequestStatus.PAYMENT_FAILED) {
            throw new AppError('Only failed payment requests can be reverted', 400);
        }

        const previousPickerId = request.pickedById;

        // Update details if provided
        if (bankDetails) request.bankDetails = bankDetails;
        if (upiId !== undefined) request.upiId = upiId;

        // Revert status
        request.status = RequestStatus.PENDING;
        request.pickedBy = null;
        request.pickedById = null; // Clear foreign key, must check if TypeORM allows null here. Schema usually allows it.
        request.paymentFailureReason = null;

        await requestRepository.save(request);

        // Log the revert action
        await requestLogRepository.save({
            requestId: request.id,
            userId: req.user!.id,
            action: LogActionType.REQUEST_REVERTED,
            comment: comment || 'Request reverted and details updated after payment failure',
            metadata: { bankDetails, upiId },
        });

        // Notify the previous picker
        if (previousPickerId) {
            const pickerNotification = notificationRepository.create({
                userId: previousPickerId,
                message: `Request #${request.id.substring(0, 8)} has been reverted by the creator. You can pick it again if available.`,
                type: NotificationType.PAYMENT_FAILED,
                requestId: request.id,
            });
            await notificationRepository.save(pickerNotification);
        }

        res.json({
            message: 'Request reverted successfully',
            request,
        });
    } catch (error) {
        next(error);
    }
};

export const getRequestPaymentSlips = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;

        const slips = await paymentSlipRepository.find({
            where: { requestId: id },
            relations: ['uploadedBy'],
            order: { createdAt: 'DESC' },
        });

        res.json({ slips });
    } catch (error) {
        next(error);
    }
};

export const getPaymentSlipUrl = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { requestId, slipId } = req.params;

        const slip = await paymentSlipRepository.findOne({
            where: { id: slipId, requestId },
        });

        if (!slip) {
            res.status(404).json({ message: 'Payment slip not found' });
            return;
        }

        const url = slip.fileUrl;

        res.json({ url });
    } catch (error) {
        next(error);
    }
};

export const deleteRequest = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const request = await requestRepository.findOne({
            where: { id },
        });

        if (!request) {
            throw new AppError('Request not found', 404);
        }

        if (request.createdById !== req.user!.id) {
            throw new AppError('You are not authorized to delete this request', 403);
        }

        if (request.status !== RequestStatus.PENDING) {
            throw new AppError('Only pending requests can be deleted', 400);
        }

        // Update cancellation reason
        request.cancellationReason = reason || 'No reason provided';
        await requestRepository.save(request);

        // Fetch user for log name
        const user = await userRepository.findOne({ where: { id: req.user!.id } });

        // Log the cancellation
        await requestLogRepository.save({
            requestId: request.id,
            userId: req.user!.id,
            action: LogActionType.REQUEST_CANCELLED,
            comment: `Request cancelled by user: ${reason || 'No reason provided'}`,
            metadata: { reason },
        });

        // Notify Super Admin
        const superAdmin = await userRepository.findOne({ where: { role: UserRole.SUPER_ADMIN } });
        if (superAdmin) {
            const adminNotification = notificationRepository.create({
                userId: superAdmin.id,
                message: `Request #${request.id.substring(0, 8)} cancelled by ${user?.name || 'vendor'}. Reason: ${reason || 'No reason provided'}`,
                type: NotificationType.REQUEST_CANCELLED,
                requestId: request.id,
            });
            await notificationRepository.save(adminNotification);
        }

        await requestRepository.softRemove(request);

        res.json({
            message: 'Request deleted successfully',
            id
        });
    } catch (error) {
        next(error);
    }
};

