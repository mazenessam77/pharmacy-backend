/**
 * Development/staging driver simulator. It feeds the EXACT same service pipeline
 * (`ingestLocation` / `updateStatus`) that a real driver app or 3PL webhook will
 * call — so the whole realtime path (DB → ETA → Socket.IO → client) is testable
 * end-to-end today, and swapping in a real GPS source later changes nothing here.
 */
import { Delivery } from '../models/Delivery';
import {
  decodePolyline,
  interpolate,
  bearingDeg,
  type LngLat,
} from '../utils/geo';
import * as deliveryService from './delivery.service';
import { DELIVERY_TERMINAL_STATUSES } from '../utils/constants';
import { logger } from '../utils/logger';

const running = new Map<string, NodeJS.Timeout>();

export function startSimulation(deliveryId: string, stepMs = 3_000): void {
  if (running.has(deliveryId)) return;

  let path: LngLat[] = [];
  let i = 0;

  const tick = async (): Promise<void> => {
    try {
      const delivery = await Delivery.findById(deliveryId);
      if (!delivery || DELIVERY_TERMINAL_STATUSES.includes(delivery.status)) {
        stopSimulation(deliveryId);
        return;
      }

      // Build the path once — prefer the real cached route, else a straight line.
      if (path.length === 0) {
        if (delivery.route?.polyline) {
          path = decodePolyline(delivery.route.polyline);
        } else {
          const p = delivery.pickup.point.coordinates;
          const d = delivery.dropoff.point.coordinates;
          const a: LngLat = { lng: p[0], lat: p[1] };
          const b: LngLat = { lng: d[0], lat: d[1] };
          path = Array.from({ length: 60 }, (_, k) => interpolate(a, b, k / 59));
        }
      }

      // Advance the lifecycle: assigned -> picked_up -> in_transit (nearby is
      // auto-promoted by ingestLocation when close; delivered fires at the end).
      if (delivery.status === 'assigned') {
        await deliveryService.updateStatus(delivery, 'picked_up');
      } else if (delivery.status === 'picked_up') {
        await deliveryService.updateStatus(delivery, 'in_transit');
      }

      const cur = path[Math.min(i, path.length - 1)];
      const nxt = path[Math.min(i + 1, path.length - 1)];
      await deliveryService.ingestLocation(delivery, {
        lng: cur.lng,
        lat: cur.lat,
        heading: bearingDeg(cur, nxt),
        speed: 8, // ~29 km/h
        accuracy: 5,
        recordedAt: new Date(),
      });

      i += 1;
      if (i >= path.length) {
        const fresh = await Delivery.findById(deliveryId);
        if (fresh && !DELIVERY_TERMINAL_STATUSES.includes(fresh.status)) {
          try {
            await deliveryService.updateStatus(fresh, 'delivered');
          } catch (e) {
            logger.warn('simulator final delivered failed:', e);
          }
        }
        stopSimulation(deliveryId);
      }
    } catch (err) {
      logger.warn('simulation tick failed:', err);
    }
  };

  running.set(deliveryId, setInterval(tick, stepMs));
  logger.info(`Delivery simulation started: ${deliveryId}`);
}

export function stopSimulation(deliveryId: string): void {
  const handle = running.get(deliveryId);
  if (handle) {
    clearInterval(handle);
    running.delete(deliveryId);
    logger.info(`Delivery simulation stopped: ${deliveryId}`);
  }
}
