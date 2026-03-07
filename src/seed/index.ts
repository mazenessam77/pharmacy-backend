import { connectDB } from '../config/db';
import { seedMedicines } from './medicines.seed';
import { seedAdmin } from './admin.seed';
import { logger } from '../utils/logger';
import mongoose from 'mongoose';

const runSeeds = async (): Promise<void> => {
  try {
    await connectDB();
    logger.info('Running seeds...');

    await seedAdmin();
    await seedMedicines();

    logger.info('All seeds completed.');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    logger.error('Seed error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

runSeeds();
