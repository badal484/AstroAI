import mongoose from 'mongoose';
import { env } from '../config/env';
import { logger } from '../shared/logger';

mongoose.set('strictQuery', true);

export async function connectMongo(): Promise<void> {
  mongoose.connection.on('error', (error: Error) => {
    logger.error({ err: error }, 'MongoDB connection error');
  });

  await mongoose.connect(env.MONGODB_URI);
  logger.info({ db: mongoose.connection.name }, 'MongoDB connected');
}

export async function disconnectMongo(): Promise<void> {
  await mongoose.disconnect();
  logger.info('MongoDB disconnected');
}
