import { Server, Socket } from 'socket.io';
import { Pharmacy } from '../models/Pharmacy';
import { logger } from '../utils/logger';

export const registerPharmacyHandlers = (_io: Server, socket: Socket): void => {
  // Pharmacy comes online
  socket.on('pharmacy:go-online', async () => {
    try {
      if (socket.user!.role !== 'pharmacy') return;

      const pharmacy = await Pharmacy.findOne({ userId: socket.user!._id });
      if (!pharmacy) return;

      pharmacy.isOpen = true;
      await pharmacy.save();

      // Join pharmacy room
      socket.join(`pharmacy:${pharmacy._id}`);
      logger.debug(`Pharmacy ${pharmacy.pharmacyName} is online`);
    } catch (error) {
      logger.error('Pharmacy go-online error:', error);
    }
  });

  // Pharmacy goes offline
  socket.on('pharmacy:go-offline', async () => {
    try {
      if (socket.user!.role !== 'pharmacy') return;

      const pharmacy = await Pharmacy.findOne({ userId: socket.user!._id });
      if (!pharmacy) return;

      pharmacy.isOpen = false;
      await pharmacy.save();

      socket.leave(`pharmacy:${pharmacy._id}`);
      logger.debug(`Pharmacy ${pharmacy.pharmacyName} is offline`);
    } catch (error) {
      logger.error('Pharmacy go-offline error:', error);
    }
  });
};
