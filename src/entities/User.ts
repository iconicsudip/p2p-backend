import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
} from 'typeorm';
import { UserRole } from '../types';
import { Request } from './Request';
import { Transaction } from './Transaction';
import { Notification } from './Notification';
import { PaymentSlip } from './PaymentSlip';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    email: string;

    @Column()
    password: string;

    @Column({ nullable: true, select: false })
    tempPassword: string;

    @Column()
    name: string;

    @Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.VENDOR,
    })
    role: UserRole;

    @Column({ type: 'jsonb', nullable: true })
    bankDetails: {
        accountNumber?: string;
        ifscCode?: string;
        bankName?: string;
        accountHolderName?: string;
    };

    @Column({ nullable: true })
    upiId: string;

    @OneToMany(() => Request, (request) => request.createdBy)
    createdRequests: Request[];

    @OneToMany(() => Request, (request) => request.pickedBy)
    pickedRequests: Request[];

    @OneToMany(() => Transaction, (transaction) => transaction.vendor)
    transactions: Transaction[];

    @OneToMany(() => Notification, (notification) => notification.user)
    notifications: Notification[];

    @OneToMany(() => PaymentSlip, (slip) => slip.uploadedBy)
    paymentSlips: PaymentSlip[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
