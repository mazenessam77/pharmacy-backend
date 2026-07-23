import { Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt';
import { getUserCached } from '../services/userCache.service';
import { logger } from '../utils/logger';

export const socketAuth = async (socket: Socket, next: (err?: Error) => void): Promise<void> => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication token required'));
    }

    const decoded = verifyAccessToken(token);
    const user = await getUserCached(decoded.id);

    if (!user || user.isBanned) {
      return next(new Error('User not found or banned'));
    }

    socket.user = user;
    next();
  } catch (error) {
    logger.warn('Socket auth failed:', (error as Error).message);
    next(new Error('Invalid authentication token'));
  }
};
