import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { NotificationType } from '../types';
import { User } from './User';
import { Request } from './Request';

@Entity('notifications')
export class Notification {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, (user) => user.notifications, { eager: true })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Index('idx_notifications_user_id')
    @Column()
    userId: string;

    @Column({ type: 'text' })
    message: string;

    @Column({
        type: 'enum',
        enum: NotificationType,
    })
    type: NotificationType;

    @Index('idx_notifications_is_read')
    @Column({ default: false })
    isRead: boolean;

    @ManyToOne(() => Request, (request) => request.notifications, { nullable: true })
    @JoinColumn({ name: 'requestId' })
    request: Request;

    @Column({ nullable: true })
    requestId: string;

    @Index('idx_notifications_created_at')
    @CreateDateColumn()
    createdAt: Date;
}
