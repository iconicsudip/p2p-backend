import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { UserRole } from '../types';
import bcrypt from 'bcrypt';

async function createSuperAdmin() {
    try {
        await AppDataSource.initialize();
        console.log('✅ Database connected');

        const userRepository = AppDataSource.getRepository(User);

        // Check if super admin already exists
        const existingAdmin = await userRepository.findOne({
            where: { email: 'admin@cashtrack.com' }
        });

        if (existingAdmin) {
            console.log('ℹ️  Super admin already exists');
            process.exit(0);
        }

        // Create super admin
        const hashedPassword = await bcrypt.hash('Admin@123', 10);
        const superAdmin = userRepository.create({
            email: 'admin@cashtrack.com',
            password: hashedPassword,
            name: 'Super Admin',
            role: UserRole.SUPER_ADMIN,
        });

        await userRepository.save(superAdmin);
        console.log('✅ Super admin created successfully!');
        console.log('📧 Email: admin@cashtrack.com');
        console.log('🔑 Password: Admin@123');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating super admin:', error);
        process.exit(1);
    }
}

createSuperAdmin();
