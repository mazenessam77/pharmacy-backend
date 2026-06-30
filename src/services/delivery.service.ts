/**
 * Delivery domain service — the single place that mutates a Delivery and emits
 * realtime events. Controllers and socket handlers stay thin and call into here
 * (Single Responsibility). All broadcasts go to the private `delivery:<id>` room.
 */
import { Types } from 'mongoose';
import { Delivery, DeliveryDocument } from '../models/Delivery';
import { Driver } from '../models/Driver';
import { DriverLocation } from '../models/DriverLocation';
import { Order } from '../models/Order';
import { Pharmacy } from '../models/Pharmacy';
import { getIO } from '../socket';
import { getRoutingService } from './routing.service';
import { createNotification } from './notification.service';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';
import { haversineMeters, isValidLngLat, type LngLat } from '../utils/geo';
import { toObjectId } from '../utils/objectId';
import {
  DELIVERY_TRANSITIONS,
  DELIVERY_TRACKABLE_STATUSES,
  DELIVERY_TERMINAL_STATUSES,
  ETA_REFRESH_INTERVAL_MS,
  GPS_SAMPLE_INTERVAL_MS,
  NEARBY_THRESHOLD_M,
  ERROR_CODES,
} from '../utils/constants';
import { IDriverLocationFix, DeliveryStatus } from '../types';

export const deliveryRoom = (deliveryId: Types.ObjectId | string) => `delivery:${deliveryId}`;

function broadcast(deliveryId: Types.ObjectId | string, event: string, payload: unknown): void {
  getIO()?.to(deliveryRoom(deliveryId)).emit(event, payload);
}

// Per-process throttle for history sampling. NOTE: for multi-instance scale this
// moves to Redis; ETA throttling already uses the persisted `eta.updatedAt`.
const lastSampleAt = new Map<string, number>();

/** Assign a driver and open the delivery for an order. Idempotent per order. */
export async function assignDriver(params: {
  orderId: string;
  driverId: string;
}): Promise<DeliveryDocument> {
  // Sanitize user-controlled ids into real ObjectIds before ANY query reaches
  // Mongo. Rejects objects/arrays/operators/empty/invalid ids (NoSQL-injection).
  const orderId = toObjectId(params.orderId);
  const driverId = toObjectId(params.driverId);

  const order = await Order.findById(orderId);
  if (!order) throw new AppError('Order not found.', 404, ERROR_CODES.ORDER_NOT_FOUND);
  if (!order.acceptedPharmacy) {
    throw new AppError('Order has no accepted pharmacy.', 400, ERROR_CODES.ORDER_INVALID_STATUS);
  }
  const driver = await Driver.findById(driverId);
  if (!driver) throw new AppError('Driver not found.', 404, ERROR_CODES.DRIVER_NOT_FOUND);

  const existing = await Delivery.findOne({ orderId });
  if (existing) throw new AppError('Delivery already exists for this order.', 409, ERROR_CODES.DELIVERY_EXISTS);

  const pharmacy = await Pharmacy.findById(order.acceptedPharmacy);
  if (!pharmacy) throw new AppError('Pharmacy not found.', 404, ERROR_CODES.PHARMACY_NOT_FOUND);

  const pickupCoords = pharmacy.location.coordinates;
  const dropoffCoords = order.patientLocation?.coordinates ?? [31.2357, 30.0444];

  const delivery = await Delivery.create({
    orderId: order._id,
    patientId: order.patientId,
    pharmacyId: pharmacy._id,
    driverId: driver._id,
    status: 'assigned',
    pickup: { point: { type: 'Point', coordinates: pickupCoords } },
    dropoff: { point: { type: 'Point', coordinates: dropoffCoords } },
    timeline: [{ status: 'assigned', at: new Date() }],
    assignedAt: new Date(),
  });

  driver.status = 'on_delivery';
  await driver.save();

  // Fetch + cache the route once (fire-and-forget; ETA degrades gracefully).
  void cacheRoute(delivery, toLngLat(pickupCoords), toLngLat(dropoffCoords));

  await createNotification({
    userId: order.patientId.toString(),
    type: 'order_status',
    title: 'Driver assigned',
    body: `${driver.name} is on the way to pick up your order.`,
    data: { orderId: order._id.toString(), deliveryId: delivery._id.toString() },
  });

  broadcast(delivery._id, 'delivery:status', { status: 'assigned', at: delivery.assignedAt });
  return delivery;
}

async function cacheRoute(delivery: DeliveryDocument, origin: LngLat, dest: LngLat): Promise<void> {
  try {
    const route = await getRoutingService().getRoute(origin, dest);
    if (!route) return;
    delivery.route = { ...route, fetchedAt: new Date() };
    delivery.eta = { seconds: route.durationS, distanceM: route.distanceM, updatedAt: new Date() };
    await delivery.save();
    broadcast(delivery._id, 'delivery:eta', delivery.eta);
  } catch (err) {
    logger.warn('cacheRoute failed:', err);
  }
}

/**
 * Ingest one GPS fix from the driver. Hot path — keep it cheap:
 *  - validate + reject teleports
 *  - update denormalized lastLocation (single doc)
 *  - sample to history at most every GPS_SAMPLE_INTERVAL_MS
 *  - refresh ETA at most every ETA_REFRESH_INTERVAL_MS
 *  - always broadcast location to the room
 */
export async function ingestLocation(
  delivery: DeliveryDocument,
  fix: IDriverLocationFix
): Promise<void> {
  if (DELIVERY_TERMINAL_STATUSES.includes(delivery.status)) return; // no writes after done
  if (!isValidLngLat(fix.lng, fix.lat)) {
    throw new AppError('Invalid GPS coordinates.', 400, ERROR_CODES.VALIDATION_ERROR);
  }
  // Teleport guard: reject implausible jumps (>2km between consecutive fixes).
  if (delivery.lastLocation) {
    const jump = haversineMeters(
      { lng: delivery.lastLocation.lng, lat: delivery.lastLocation.lat },
      { lng: fix.lng, lat: fix.lat }
    );
    if (jump > 2_000) {
      logger.warn(`Rejected GPS jump of ${Math.round(jump)}m on delivery ${delivery._id}`);
      return;
    }
  }

  delivery.lastLocation = fix;

  const dropoff = toLngLat(delivery.dropoff.point.coordinates);
  const distanceToDropoff = haversineMeters({ lng: fix.lng, lat: fix.lat }, dropoff);

  // Auto-promote to "nearby" once close (one-way; never downgrade).
  if (delivery.status === 'in_transit' && distanceToDropoff <= NEARBY_THRESHOLD_M) {
    delivery.status = 'nearby';
    delivery.timeline.push({ status: 'nearby', at: new Date() });
    broadcast(delivery._id, 'delivery:status', { status: 'nearby', at: new Date() });
  }

  // ETA refresh (throttled, persisted timestamp => multi-instance safe).
  const now = Date.now();
  const etaStale = !delivery.eta || now - new Date(delivery.eta.updatedAt).getTime() > ETA_REFRESH_INTERVAL_MS;
  if (etaStale && DELIVERY_TRACKABLE_STATUSES.includes(delivery.status)) {
    const route = await getRoutingService().getRoute({ lng: fix.lng, lat: fix.lat }, dropoff);
    if (route) {
      delivery.eta = { seconds: route.durationS, distanceM: route.distanceM, updatedAt: new Date() };
      broadcast(delivery._id, 'delivery:eta', delivery.eta);
    }
  }

  await delivery.save();

  // Sample to history at a coarse rate (keeps the high-churn collection bounded).
  const key = delivery._id.toString();
  if (now - (lastSampleAt.get(key) ?? 0) > GPS_SAMPLE_INTERVAL_MS && delivery.driverId) {
    lastSampleAt.set(key, now);
    void DriverLocation.create({
      deliveryId: delivery._id,
      driverId: delivery.driverId,
      point: { type: 'Point', coordinates: [fix.lng, fix.lat] },
      heading: fix.heading,
      speed: fix.speed,
      accuracy: fix.accuracy,
      recordedAt: fix.recordedAt,
    }).catch((e) => logger.warn('DriverLocation sample failed:', e));
  }

  broadcast(delivery._id, 'delivery:location', {
    lng: fix.lng,
    lat: fix.lat,
    heading: fix.heading,
    speed: fix.speed,
    accuracy: fix.accuracy,
    recordedAt: fix.recordedAt,
    distanceM: Math.round(distanceToDropoff),
  });
}

/** Advance the delivery state machine with validation + side effects. */
export async function updateStatus(
  delivery: DeliveryDocument,
  next: DeliveryStatus,
  reason?: string
): Promise<DeliveryDocument> {
  const allowed = DELIVERY_TRANSITIONS[delivery.status] || [];
  if (!allowed.includes(next)) {
    throw new AppError(
      `Cannot transition delivery from ${delivery.status} to ${next}.`,
      400,
      ERROR_CODES.DELIVERY_INVALID_STATUS
    );
  }

  delivery.status = next;
  delivery.timeline.push({ status: next, at: new Date() });
  if (next === 'picked_up') delivery.pickedUpAt = new Date();
  if (next === 'cancelled') delivery.cancelReason = reason;
  if (next === 'delivered') {
    delivery.deliveredAt = new Date();
  }

  if (DELIVERY_TERMINAL_STATUSES.includes(next) && delivery.driverId) {
    await Driver.findByIdAndUpdate(delivery.driverId, { status: 'online' });
  }

  await delivery.save();

  await createNotification({
    userId: delivery.patientId.toString(),
    type: 'order_status',
    title: 'Delivery update',
    body: deliveryStatusMessage(next),
    data: { orderId: delivery.orderId.toString(), deliveryId: delivery._id.toString() },
  });

  broadcast(delivery._id, 'delivery:status', { status: next, at: new Date() });
  return delivery;
}

function deliveryStatusMessage(status: DeliveryStatus): string {
  switch (status) {
    case 'picked_up': return 'Your order has been picked up.';
    case 'in_transit': return 'Your order is on the way.';
    case 'nearby': return 'Your driver is nearby.';
    case 'delivered': return 'Your order has been delivered.';
    case 'cancelled': return 'Your delivery was cancelled.';
    default: return 'Delivery updated.';
  }
}

function toLngLat(coords: number[]): LngLat {
  return { lng: coords[0], lat: coords[1] };
}
