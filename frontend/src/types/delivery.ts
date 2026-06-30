// Frontend mirror of the backend delivery tracking resource + socket events.

export type DeliveryStatus =
  | 'assigned'
  | 'picked_up'
  | 'in_transit'
  | 'nearby'
  | 'delivered'
  | 'cancelled';

export interface LngLat {
  lng: number;
  lat: number;
}

export interface DriverCard {
  name: string;
  phone: string;
  photoUrl: string | null;
  vehicleType: string;
  vehiclePlate: string;
  rating: number;
}

export interface DriverLocation extends LngLat {
  heading: number | null;
  speed: number | null;
  accuracy: number | null;
  recordedAt: string;
}

export interface DeliveryEta {
  seconds: number;
  distanceM: number;
  updatedAt: string;
}

export interface TrackingSnapshot {
  deliveryId: string;
  orderId: string;
  status: DeliveryStatus;
  timeline: { status: DeliveryStatus; at: string }[];
  pickup: LngLat & { address: string | null };
  dropoff: LngLat & { address: string | null };
  route: { polyline: string; distanceM: number; durationS: number } | null;
  eta: DeliveryEta | null;
  driverLocation: DriverLocation | null;
  driver: DriverCard | null;
  assignedAt: string | null;
  pickedUpAt: string | null;
  deliveredAt: string | null;
  updatedAt: string;
}

// Socket payloads
export interface LocationEvent extends LngLat {
  heading: number | null;
  speed: number | null;
  accuracy: number | null;
  recordedAt: string;
  distanceM: number;
}
export type EtaEvent = DeliveryEta;
export interface StatusEvent {
  status: DeliveryStatus;
  at: string;
}
