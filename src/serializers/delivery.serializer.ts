/**
 * Output shaping (API "Resources"). Centralising serialization guarantees that
 * sensitive data never leaks accidentally from a controller:
 *  - the driver's live location is only ever included while the delivery is in a
 *    trackable state (picked_up / in_transit / nearby) — never before pickup or
 *    after it's delivered/cancelled.
 *  - only public driver-card fields are exposed (no userId/internal flags).
 */
import { DeliveryDocument } from '../models/Delivery';
import { DriverDocument } from '../models/Driver';
import { DELIVERY_TRACKABLE_STATUSES } from '../utils/constants';

export function toDriverCard(driver: DriverDocument) {
  return {
    name: driver.name,
    phone: driver.phone,
    photoUrl: driver.photoUrl ?? null,
    vehicleType: driver.vehicleType,
    vehiclePlate: driver.vehiclePlate,
    rating: driver.rating,
  };
}

function point(coords: number[]) {
  return { lng: coords[0], lat: coords[1] };
}

export function toTrackingResource(delivery: DeliveryDocument, driver?: DriverDocument | null) {
  const trackable = DELIVERY_TRACKABLE_STATUSES.includes(delivery.status);
  const loc = delivery.lastLocation;

  return {
    deliveryId: delivery._id,
    orderId: delivery.orderId,
    status: delivery.status,
    timeline: delivery.timeline.map((t) => ({ status: t.status, at: t.at })),
    pickup: { ...point(delivery.pickup.point.coordinates), address: delivery.pickup.address ?? null },
    dropoff: { ...point(delivery.dropoff.point.coordinates), address: delivery.dropoff.address ?? null },
    route: delivery.route?.polyline
      ? {
          polyline: delivery.route.polyline,
          distanceM: delivery.route.distanceM,
          durationS: delivery.route.durationS,
        }
      : null,
    eta: delivery.eta?.updatedAt
      ? { seconds: delivery.eta.seconds, distanceM: delivery.eta.distanceM, updatedAt: delivery.eta.updatedAt }
      : null,
    // Location leakage guard.
    driverLocation:
      trackable && loc
        ? {
            lng: loc.lng,
            lat: loc.lat,
            heading: loc.heading ?? null,
            speed: loc.speed ?? null,
            accuracy: loc.accuracy ?? null,
            recordedAt: loc.recordedAt,
          }
        : null,
    driver: driver ? toDriverCard(driver) : null,
    assignedAt: delivery.assignedAt ?? null,
    pickedUpAt: delivery.pickedUpAt ?? null,
    deliveredAt: delivery.deliveredAt ?? null,
    updatedAt: delivery.updatedAt,
  };
}
