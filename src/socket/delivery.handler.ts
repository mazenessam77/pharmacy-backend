import { Server, Socket } from 'socket.io';
import { Delivery } from '../models/Delivery';
import { canAccessDelivery, isDeliveryDriver } from '../middleware/authorizeDelivery';
import { gpsFixSchema } from '../validations/delivery.validation';
import * as deliveryService from '../services/delivery.service';
import { logger } from '../utils/logger';

// Per-socket GPS rate limit (~2 fixes/sec). For multi-instance scale this moves
// to a Redis token bucket; in-process is sufficient per connection.
const lastPing = new Map<string, number>();

export const registerDeliveryHandlers = (_io: Server, socket: Socket): void => {
  // Patient/pharmacy/driver subscribes to a delivery's private room. The room is
  // ALWAYS authorized server-side — we never trust a client-supplied room name.
  socket.on('delivery:subscribe', async (data: { orderId?: string }) => {
    try {
      if (!data?.orderId) return;
      const delivery = await Delivery.findOne({ orderId: data.orderId });
      if (!delivery) return;
      if (!(await canAccessDelivery(socket.user as any, delivery))) {
        socket.emit('delivery:error', { message: 'Forbidden' });
        return;
      }
      socket.join(deliveryService.deliveryRoom(delivery._id));
    } catch (err) {
      logger.warn('delivery:subscribe failed:', err);
    }
  });

  socket.on('delivery:unsubscribe', async (data: { orderId?: string }) => {
    try {
      if (!data?.orderId) return;
      const delivery = await Delivery.findOne({ orderId: data.orderId }).select('_id');
      if (delivery) socket.leave(deliveryService.deliveryRoom(delivery._id));
    } catch {
      /* ignore */
    }
  });

  // Driver streams GPS over the socket — the preferred hot path (lower overhead
  // than a REST POST per fix). Validated, rate-limited, and authorized.
  socket.on('driver:location', async (data: any) => {
    try {
      const now = Date.now();
      if (now - (lastPing.get(socket.id) ?? 0) < 450) return;
      lastPing.set(socket.id, now);

      const parsed = gpsFixSchema.safeParse(data);
      if (!parsed.success || !data?.orderId) return;

      const delivery = await Delivery.findOne({ orderId: data.orderId });
      if (!delivery) return;
      if (!(await isDeliveryDriver(socket.user as any, delivery))) return;

      await deliveryService.ingestLocation(delivery, {
        lng: parsed.data.lng,
        lat: parsed.data.lat,
        heading: parsed.data.heading,
        speed: parsed.data.speed,
        accuracy: parsed.data.accuracy,
        recordedAt: parsed.data.recordedAt ?? new Date(),
      });
    } catch (err) {
      logger.warn('driver:location failed:', err);
    }
  });

  socket.on('disconnect', () => {
    lastPing.delete(socket.id);
  });
};
