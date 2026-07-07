/**
 * Pure timeline grouping + formatting logic (no React) so it can be unit-tested
 * directly. The ActivityTimeline component consumes these.
 */

export type EventType =
  | 'PRESCRIPTION_UPLOADED' | 'ORDER_CREATED' | 'ORDER_DELIVERED' | 'ORDER_CANCELLED'
  | 'OFFER_RECEIVED' | 'OFFER_ACCEPTED' | 'ORDER_PREPARING' | 'ORDER_OUT_FOR_DELIVERY'
  | 'ORDER_STATUS' | 'FAVORITE_ADDED' | 'BASKET_CREATED';

export interface Summary {
  pharmacyName?: string;
  rating?: number;
  meds: { name: string; quantity: number }[];
  medicineCount: number;
  deliveryFee: number;
  total: number;
  durationMinutes?: number;
}

export interface TimelineEvent {
  id: string;
  type: EventType;
  title: string;
  description: string;
  timestamp: string;
  orderId?: string;
  prescriptionId?: string;
  basketId?: string;
  canReorder?: boolean;
  summary?: Summary;
}

export type OrderItem = {
  kind: 'order';
  ts: string;
  orderId: string;
  events: TimelineEvent[];
  summary?: Summary;
  canReorder: boolean;
};
export type SingleItem = { kind: 'single'; ts: string; event: TimelineEvent };
export type Item = OrderItem | SingleItem;

/**
 * Collapse all events of the same order into ONE card, positioned at the order's
 * newest event. Events arrive newest-first, so a group is created at its first
 * occurrence and only accretes older sub-events afterwards — its position never
 * shifts (stable under infinite scroll). Non-order events pass through as singles.
 * Chronological ordering across different orders/singles is preserved because we
 * push items in the (newest-first) order they appear.
 */
export function buildItems(events: TimelineEvent[]): Item[] {
  const orders = new Map<string, OrderItem>();
  const items: Item[] = [];
  for (const ev of events) {
    if (ev.orderId) {
      let g = orders.get(ev.orderId);
      if (!g) {
        g = { kind: 'order', ts: ev.timestamp, orderId: ev.orderId, events: [], summary: undefined, canReorder: false };
        orders.set(ev.orderId, g);
        items.push(g);
      }
      g.events.push(ev);
      if (ev.summary) g.summary = ev.summary;
      if (ev.canReorder) g.canReorder = true;
    } else {
      items.push({ kind: 'single', ts: ev.timestamp, event: ev });
    }
  }
  return items;
}

/** Human date bucket for grouping (Today / Yesterday / 'Jun 30' / 'Jun 30, 2025'). */
export function dateBucket(iso: string, now: Date = new Date()): string {
  const d = new Date(iso);
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((startOf(now) - startOf(d)) / 86_400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  const sameYear = d.getFullYear() === now.getFullYear();
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(sameYear ? {} : { year: 'numeric' }) });
}

export function fmtDuration(mins?: number): string | null {
  if (mins == null) return null;
  if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'}`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}
