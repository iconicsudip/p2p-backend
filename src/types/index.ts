import { Request } from 'express';

export enum UserRole {
    SUPER_ADMIN = 'SUPER_ADMIN',
    VENDOR = 'VENDOR',
}

export enum RequestType {
    WITHDRAWAL = 'WITHDRAWAL',
    DEPOSIT = 'DEPOSIT',
}

export enum RequestStatus {
    PENDING = 'PENDING',
    PICKED = 'PICKED',
    PAID_FULL = 'PAID_FULL',
    PAID_PARTIAL = 'PAID_PARTIAL',
    COMPLETED = 'COMPLETED',
    REJECTED = 'REJECTED',
    PAYMENT_FAILED = 'PAYMENT_FAILED',
}

export enum TransactionType {
    WITHDRAWAL = 'WITHDRAWAL',
    DEPOSIT = 'DEPOSIT',
}

export enum NotificationType {
    REQUEST_PICKED = 'REQUEST_PICKED',
    PAYMENT_UPLOADED = 'PAYMENT_UPLOADED',
    PAYMENT_APPROVED = 'PAYMENT_APPROVED',
    PAYMENT_REJECTED = 'PAYMENT_REJECTED',
    ADMIN_ALERT = 'ADMIN_ALERT',
    PAYMENT_FAILED = 'PAYMENT_FAILED',
    REQUEST_CANCELLED = 'REQUEST_CANCELLED',
}

export enum LogActionType {
    CREATED = 'CREATED',
    PICKED = 'PICKED',
    PAYMENT_UPLOADED = 'PAYMENT_UPLOADED',
    PAYMENT_APPROVED = 'PAYMENT_APPROVED',
    PAYMENT_REJECTED = 'PAYMENT_REJECTED',
    PARTIAL_PAYMENT_APPROVED = 'PARTIAL_PAYMENT_APPROVED',
    COMPLETED = 'COMPLETED',
    PAYMENT_FAILED = 'PAYMENT_FAILED',
    REQUEST_REVERTED = 'REQUEST_REVERTED',
    REQUEST_EDITED = 'REQUEST_EDITED',
    REQUEST_CANCELLED = 'REQUEST_CANCELLED',
}


export interface BankDetails {
    accountNumber?: string;
    ifscCode?: string;
    bankName?: string;
    accountHolderName?: string;
}

export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: UserRole;
    };
}

export interface JWTPayload {
    id: string;
    email: string;
    role: UserRole;
}
