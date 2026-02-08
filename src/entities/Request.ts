import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    OneToMany,
    Index,
    DeleteDateColumn,
} from 'typeorm';
import { RequestType, RequestStatus } from '../types';
import { User } from './User';
import { Transaction } from './Transaction';
import { PaymentSlip } from './PaymentSlip';
import { Notification } from './Notification';

@Entity('requests')
@Index('idx_requests_created_by_created_at', ['createdById', 'createdAt'])
@Index('idx_requests_picked_by_created_at', ['pickedById', 'createdAt'])
export class Request {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        type: 'enum',
        enum: RequestType,
    })
    type: RequestType;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    amount: number;

    @Index('idx_requests_status')
    @Column({
        type: 'enum',
        enum: RequestStatus,
        default: RequestStatus.PENDING,
    })
    status: RequestStatus;

    @Column({ type: 'jsonb', nullable: true })
    bankDetails: {
        accountNumber?: string;
        ifscCode?: string;
        bankName?: string;
        accountHolderName?: string;
    };

    @Column({ type: 'text', nullable: true })
    upiId: string;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    paidAmount: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    pendingAmount: number;

    @Column({ type: 'text', nullable: true })
    rejectionReason: string | null;

    @Column({ type: 'text', nullable: true })
    paymentFailureReason: string | null;

    @Column({ type: 'text', nullable: true })
    cancellationReason: string | null;

    @ManyToOne(() => User, (user) => user.createdRequests, { eager: true })
    @JoinColumn({ name: 'createdById' })
    createdBy: User;

    @Index('idx_requests_created_by')
    @Column()
    createdById: string;

    @ManyToOne(() => User, (user) => user.pickedRequests, { eager: true, nullable: true })
    @JoinColumn({ name: 'pickedById' })
    pickedBy: User | null;

    @Index('idx_requests_picked_by')
    @Column({ nullable: true })
    pickedById: string | null;

    @OneToMany(() => Transaction, (transaction) => transaction.request)
    transactions: Transaction[];

    @OneToMany(() => PaymentSlip, (slip) => slip.request)
    paymentSlips: PaymentSlip[];

    @OneToMany(() => Notification, (notification) => notification.request)
    notifications: Notification[];

    @Index('idx_requests_created_at')
    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date;
}
