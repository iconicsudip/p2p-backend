import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { LogActionType } from '../types';
import { Request } from './Request';
import { User } from './User';

@Entity('request_logs')
export class RequestLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Request, { eager: false })
    @JoinColumn({ name: 'requestId' })
    request: Request;

    @Index('idx_request_logs_request_id')
    @Column()
    requestId: string;

    @ManyToOne(() => User, { eager: true })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Index('idx_request_logs_user_id')
    @Column()
    userId: string;

    @Column({
        type: 'enum',
        enum: LogActionType,
    })
    action: LogActionType;

    @Column({ type: 'text', nullable: true })
    comment: string | null;

    @Column({ type: 'jsonb', nullable: true })
    metadata: any;

    @Index('idx_request_logs_created_at')
    @CreateDateColumn()
    createdAt: Date;
}
