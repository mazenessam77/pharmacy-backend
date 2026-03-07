import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { socketAuth } from './auth.socket';
import { registerChatHandlers } from './chat.handler';
import { registerOrderHandlers } from './order.handler';
import { registerPharmacyHandlers } from './pharmacy.handler';
import { Pharmacy } from '../models/Pharmacy';
import { logger } from '../utils/logger';
import { env } from '../config/env';

let io: Server | null = null;

export const initSocket = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: env.FRONTEND_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Authentication middleware
  io.use(socketAuth);

  io.on('connection', async (socket) => {
    const user = socket.user!;
    logger.info(`Socket connected: ${user.name} (${user.role}) - ${socket.id}`);

    // Join user's personal room
    socket.join(`user:${user._id}`);

    // If pharmacy, auto-join pharmacy room
    if (user.role === 'pharmacy') {
      const pharmacy = await Pharmacy.findOne({ userId: user._id });
      if (pharmacy) {
        socket.join(`pharmacy:${pharmacy._id}`);
      }
    }

    // Register event handlers
    registerChatHandlers(io!, socket);
    registerOrderHandlers(io!, socket);
    registerPharmacyHandlers(io!, socket);

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${user.name} - ${socket.id}`);
    });
  });

  logger.info('Socket.io initialized');
  return io;
};

export const getIO = (): Server | null => io;
