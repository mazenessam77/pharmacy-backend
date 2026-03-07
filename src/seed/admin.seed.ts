import { User } from '../models/User';
import { logger } from '../utils/logger';

export const seedAdmin = async (): Promise<void> => {
  try {
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      logger.info('Admin user already exists. Skipping seed.');
      return;
    }

    await User.create({
      name: 'Admin',
      email: 'admin@pharmalink.com',
      password: 'admin123456',
      role: 'admin',
      isActive: true,
    });

    logger.info('Default admin user created: admin@pharmalink.com / admin123456');
  } catch (error) {
    logger.error('Admin seed error:', error);
  }
};
