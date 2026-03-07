import { Server, Socket } from 'socket.io';
import { logger } from '../utils/logger';

export const registerOrderHandlers = (_io: Server, socket: Socket): void => {
  // Join order room for updates and chat
  socket.on('order:join', (data: { orderId: string }) => {
    socket.join(`order:${data.orderId}`);
    logger.debug(`User ${socket.user!._id} joined order room: ${data.orderId}`);
  });

  // Leave order room
  socket.on('order:leave', (data: { orderId: string }) => {
    socket.leave(`order:${data.orderId}`);
    logger.debug(`User ${socket.user!._id} left order room: ${data.orderId}`);
  });
};
