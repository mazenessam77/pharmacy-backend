import type { DeliveryStatus } from '@/types/delivery';

/** The visible delivery lifecycle (the progress bar + timeline order). */
export const DELIVERY_STEPS: { key: DeliveryStatus; label: string }[] = [
  { key: 'assigned', label: 'Driver Assigned' },
  { key: 'picked_up', label: 'Picked Up' },
  { key: 'in_transit', label: 'On The Way' },
  { key: 'nearby', label: 'Nearby' },
  { key: 'delivered', label: 'Delivered' },
];

export const STATUS_LABELS: Record<DeliveryStatus, string> = {
  assigned: 'Driver Assigned',
  picked_up: 'Picked Up',
  in_transit: 'On The Way',
  nearby: 'Almost There',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export function stepIndex(status: DeliveryStatus): number {
  const i = DELIVERY_STEPS.findIndex((s) => s.key === status);
  return i; // -1 for cancelled
}

export function formatEta(seconds?: number | null): string {
  if (seconds == null) return '—';
  const m = Math.max(1, Math.round(seconds / 60));
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${m % 60}m`;
}

export function formatDistance(metres?: number | null): string {
  if (metres == null) return '—';
  return metres < 1000 ? `${Math.round(metres)} m` : `${(metres / 1000).toFixed(1)} km`;
}

export function timeAgo(iso?: string | null): string {
  if (!iso) return '—';
  const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 5) return 'just now';
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  return m < 60 ? `${m}m ago` : `${Math.floor(m / 60)}h ago`;
}
