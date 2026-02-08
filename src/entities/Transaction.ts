import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { TransactionType } from '../types';
import { User } from './User';
import { Request } from './Request';

@Entity('transactions')
export class Transaction {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Request, (request) => request.transactions, { eager: true })
    @JoinColumn({ name: 'requestId' })
    request: Request;

    @Index('idx_transactions_request_id')
    @Column()
    requestId: string;

    @ManyToOne(() => User, (user) => user.transactions, { eager: true })
    @JoinColumn({ name: 'vendorId' })
    vendor: User;

    @Index('idx_transactions_vendor_id')
    @Column()
    vendorId: string;

    @Index('idx_transactions_type')
    @Column({
        type: 'enum',
        enum: TransactionType,
    })
    type: TransactionType;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    amount: number;

    @Column({ default: 'COMPLETED' })
    status: string;

    @Index('idx_transactions_created_at')
    @CreateDateColumn()
    createdAt: Date;
}
