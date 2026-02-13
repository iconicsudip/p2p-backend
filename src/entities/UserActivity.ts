import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { User } from './User';

export enum UserActivityType {
    LOGIN = 'LOGIN',
    LOGOUT = 'LOGOUT',
}

@Entity('user_activities')
export class UserActivity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, { eager: false })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Index('idx_user_activities_user_id')
    @Column()
    userId: string;

    @Column({
        type: 'enum',
        enum: UserActivityType,
    })
    action: UserActivityType;

    @Column({ type: 'varchar', nullable: true })
    ipAddress: string | null;

    @Column({ type: 'text', nullable: true })
    userAgent: string | null;

    @Index('idx_user_activities_created_at')
    @CreateDateColumn()
    timestamp: Date;
}
