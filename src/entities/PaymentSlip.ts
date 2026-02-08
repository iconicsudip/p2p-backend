import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { Request } from './Request';
import { User } from './User';

@Entity('payment_slips')
export class PaymentSlip {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Request, (request) => request.paymentSlips)
    @JoinColumn({ name: 'requestId' })
    request: Request;

    @Index('idx_payment_slips_request_id')
    @Column()
    requestId: string;

    @ManyToOne(() => User, (user) => user.paymentSlips, { eager: true })
    @JoinColumn({ name: 'uploadedById' })
    uploadedBy: User;

    @Column()
    uploadedById: string;

    @Column({ type: 'text', nullable: true })
    fileUrl: string;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    amount: number;

    @CreateDateColumn()
    createdAt: Date;
}
