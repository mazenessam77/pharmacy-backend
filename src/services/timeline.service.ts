/**
 * Activity Timeline — DERIVED, not stored.
 *
 * There is deliberately no Timeline collection: every event is reconstructed
 * on read from collections that already record the underlying fact, so there
 * are zero extra writes, no duplicated state, and nothing to drift out of sync.
 *
 *   Durable milestones (kept forever)          Source          Sorted on
 *   ─ PRESCRIPTION_UPLOADED                    prescriptions   createdAt   (idx exists)
 *   ─ ORDER_CREATED (incl. broadcast info)     orders          createdAt   (idx exists)
 *   ─ ORDER_DELIVERED                          orders          deliveredAt (NEW partial idx)
 *   ─ ORDER_CANCELLED                          orders          updatedAt   (NEW partial idx —
 *                                              cancelled is terminal, so updatedAt is stable)
 *   ─ FAVORITE_ADDED                           savedmedications createdAt  (idx exists)
 *   ─ BASKET_CREATED                           saved_baskets   createdAt   (idx exists)
 *
 *   Operational detail (recent ~90 days)       notifications   createdAt   (idx exists)
 *   ─ OFFER_RECEIVED / OFFER_ACCEPTED / ORDER_PREPARING / ORDER_OUT_FOR_DELIVERY / ORDER_STATUS
 *   Notifications already ARE the recorded event stream for these; read ones
 *   expire after 90 days (TTL), so old history keeps its durable milestones
 *   while recent activity shows the full story. Delivered/cancelled status
 *   notifications are skipped here to avoid duplicating the durable events.
 *
 * Scale: every sub-query is an index range scan bounded by `limit`, so a page
 * costs O(sources × limit) documents regardless of total history size
 * (10k orders / 100k notifications read at most ~25 docs each per page).
 */
import { Types } from 'mongoose';
import { Order } from '../models/Order';
import { Prescription } from '../models/Prescription';
import { Notification } from '../models/Notification';
import { SavedMedication } from '../models/SavedMedication';
import { SavedBasket } from '../models/SavedBasket';
import { AppError } from '../utils/AppError';
import { ERROR_CODES } from '../utils/constants';

export type TimelineEventType =
  | 'PRESCRIPTION_UPLOADED'
  | 'ORDER_CREATED'
  | 'ORDER_DELIVERED'
  | 'ORDER_CANCELLED'
  | 'OFFER_RECEIVED'
  | 'OFFER_ACCEPTED'
  | 'ORDER_PREPARING'
  | 'ORDER_OUT_FOR_DELIVERY'
  | 'ORDER_STATUS'
  | 'FAVORITE_ADDED'
  | 'BASKET_CREATED';

export interface TimelineEvent {
  /** Stable, unique per event: `${TYPE}:${sourceDocId}` — also the cursor tiebreaker. */
  id: string;
  type: TimelineEventType;
  title: string;
  description: string;
  timestamp: Date;
  orderId?: string;
  prescriptionId?: string;
  basketId?: string;
}

export type TimelineTypeFilter = 'orders' | 'offers' | 'prescriptions' | 'favorites' | 'baskets';

interface Cursor {
  t: string; // ISO timestamp of the last returned event
  k: string; // its event id (tiebreaker for equal timestamps)
}

export function encodeCursor(ev: TimelineEvent): string {
  return Buffer.from(JSON.stringify({ t: ev.timestamp.toISOString(), k: ev.id })).toString('base64url');
}

export function decodeCursor(raw?: string): Cursor | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'));
    if (typeof parsed.t !== 'string' || typeof parsed.k !== 'string' || isNaN(Date.parse(parsed.t))) {
      throw new Error('bad cursor');
    }
    return { t: parsed.t, k: parsed.k };
  } catch {
    throw new AppError('Invalid cursor.', 400, ERROR_CODES.VALIDATION_ERROR);
  }
}

/** Strict (timestamp, id) ordering — newer first; id breaks ties deterministically. */
function isBeforeCursor(ev: TimelineEvent, cursor: Cursor | null): boolean {
  if (!cursor) return true;
  const t = ev.timestamp.toISOString();
  return t < cursor.t || (t === cursor.t && ev.id < cursor.k);
}

const byNewest = (a: TimelineEvent, b: TimelineEvent) =>
  b.timestamp.getTime() - a.timestamp.getTime() || (a.id < b.id ? 1 : -1);

// Status notifications that duplicate a durable milestone are skipped.
const STATUS_EVENT_MAP: Record<string, { type: TimelineEventType; title: string } | null> = {
  confirmed: { type: 'OFFER_ACCEPTED', title: 'Offer accepted' },
  preparing: { type: 'ORDER_PREPARING', title: 'Pharmacy is preparing your order' },
  out_for_delivery: { type: 'ORDER_OUT_FOR_DELIVERY', title: 'Order out for delivery' },
  delivered: null,
  cancelled: null,
};

export async function getTimeline(
  patientId: Types.ObjectId,
  opts: { limit: number; cursor?: string; type?: TimelineTypeFilter }
): Promise<{ events: TimelineEvent[]; nextCursor: string | null; hasMore: boolean }> {
  const cursor = decodeCursor(opts.cursor);
  const limit = opts.limit;
  // Small over-fetch per source: equal-timestamp events at the cursor boundary
  // are re-fetched ($lte) and filtered out by the (t, id) tiebreak.
  const fetch = limit + 5;
  const before = cursor ? { $lte: new Date(cursor.t) } : undefined;
  const stamp = (field: string) => (before ? { [field]: before } : {});
  const want = (f: TimelineTypeFilter) => !opts.type || opts.type === f;

  const tasks: Promise<TimelineEvent[]>[] = [];

  if (want('prescriptions')) {
    tasks.push(
      Prescription.find({ patientId, ...stamp('createdAt') }, { createdAt: 1 })
        .sort({ createdAt: -1 })
        .limit(fetch)
        .lean()
        .then((docs) =>
          docs.map((d) => ({
            id: `PRESCRIPTION_UPLOADED:${d._id}`,
            type: 'PRESCRIPTION_UPLOADED' as const,
            title: 'Prescription uploaded',
            description: 'Stored securely — pharmacies review it with your order.',
            timestamp: d.createdAt as Date,
            prescriptionId: String(d._id),
          }))
        )
    );
  }

  if (want('orders')) {
    // Created — one event per order, at an immutable timestamp.
    tasks.push(
      Order.find(
        { patientId, ...stamp('createdAt') },
        { createdAt: 1, medicines: { name: 1 }, governorate: 1, prescriptionId: 1 }
      )
        .sort({ createdAt: -1 })
        .limit(fetch)
        .lean()
        .then((docs) =>
          docs.map((d: any) => ({
            id: `ORDER_CREATED:${d._id}`,
            type: 'ORDER_CREATED' as const,
            title: d.medicines?.length ? 'Order created' : 'Prescription order created',
            description: `${
              d.medicines?.length
                ? `${d.medicines.length} medicine${d.medicines.length > 1 ? 's' : ''} requested`
                : 'Pharmacists will read your prescription'
            } · broadcast to pharmacies in ${d.governorate}`,
            timestamp: d.createdAt as Date,
            orderId: String(d._id),
            prescriptionId: d.prescriptionId ? String(d.prescriptionId) : undefined,
          }))
        )
    );
    // Delivered — sorted on its own (immutable) timestamp via the new partial index.
    tasks.push(
      Order.find(
        { patientId, deliveredAt: before ? before : { $exists: true } },
        { deliveredAt: 1 }
      )
        .sort({ deliveredAt: -1 })
        .limit(fetch)
        .lean()
        .then((docs) =>
          docs
            .filter((d) => d.deliveredAt)
            .map((d) => ({
              id: `ORDER_DELIVERED:${d._id}`,
              type: 'ORDER_DELIVERED' as const,
              title: 'Order delivered',
              description: 'Your medicines arrived. Hope you feel better soon!',
              timestamp: d.deliveredAt as Date,
              orderId: String(d._id),
            }))
        )
    );
    // Cancelled — terminal status, so updatedAt is the cancellation moment.
    tasks.push(
      Order.find(
        { patientId, status: 'cancelled', ...stamp('updatedAt') },
        { updatedAt: 1, cancelReason: 1 }
      )
        .sort({ updatedAt: -1 })
        .limit(fetch)
        .lean()
        .then((docs) =>
          docs.map((d: any) => ({
            id: `ORDER_CANCELLED:${d._id}`,
            type: 'ORDER_CANCELLED' as const,
            title: 'Order cancelled',
            description: d.cancelReason ? `Reason: ${d.cancelReason}` : 'This order was cancelled.',
            timestamp: d.updatedAt as Date,
            orderId: String(d._id),
          }))
        )
    );
  }

  if (want('offers')) {
    tasks.push(
      Notification.find(
        { userId: patientId, type: { $in: ['new_offer', 'order_status'] }, ...stamp('createdAt') },
        { type: 1, title: 1, body: 1, createdAt: 1, 'data.orderId': 1, 'data.status': 1 }
      )
        .sort({ createdAt: -1 })
        .limit(fetch)
        .lean()
        .then((docs) =>
          docs.flatMap((n: any): TimelineEvent[] => {
            const orderId = n.data?.orderId ? String(n.data.orderId) : undefined;
            if (n.type === 'new_offer') {
              return [{
                id: `OFFER_RECEIVED:${n._id}`,
                type: 'OFFER_RECEIVED',
                title: 'New pharmacy offer',
                description: String(n.body || ''),
                timestamp: n.createdAt as Date,
                orderId,
              }];
            }
            const mapped = n.data?.status !== undefined ? STATUS_EVENT_MAP[String(n.data.status)] : undefined;
            if (mapped === null) return []; // delivered/cancelled → durable events cover it
            return [{
              id: `${mapped ? mapped.type : 'ORDER_STATUS'}:${n._id}`,
              type: mapped ? mapped.type : 'ORDER_STATUS',
              title: mapped ? mapped.title : String(n.title || 'Order update'),
              description: String(n.body || ''),
              timestamp: n.createdAt as Date,
              orderId,
            }];
          })
        )
    );
  }

  if (want('favorites')) {
    tasks.push(
      SavedMedication.find({ patientId, ...stamp('createdAt') }, { createdAt: 1, medicineId: 1 })
        .sort({ createdAt: -1 })
        .limit(fetch)
        .populate('medicineId', 'name') // single indexed $in lookup on ≤`fetch` ids
        .lean()
        .then((docs) =>
          docs.map((d: any) => ({
            id: `FAVORITE_ADDED:${d._id}`,
            type: 'FAVORITE_ADDED' as const,
            title: 'Medicine saved to favorites',
            description: d.medicineId?.name ? `${d.medicineId.name} added to your saved medicines.` : 'Added to your saved medicines.',
            timestamp: d.createdAt as Date,
          }))
        )
    );
  }

  if (want('baskets')) {
    tasks.push(
      SavedBasket.find({ patientId, ...stamp('createdAt') }, { createdAt: 1, name: 1, items: { medicineId: 1 } })
        .sort({ createdAt: -1 })
        .limit(fetch)
        .lean()
        .then((docs) =>
          docs.map((d: any) => ({
            id: `BASKET_CREATED:${d._id}`,
            type: 'BASKET_CREATED' as const,
            title: 'Basket created',
            description: `“${d.name}” with ${d.items?.length ?? 0} item${(d.items?.length ?? 0) === 1 ? '' : 's'}.`,
            timestamp: d.createdAt as Date,
            basketId: String(d._id),
          }))
        )
    );
  }

  const merged = (await Promise.all(tasks))
    .flat()
    .filter((ev) => isBeforeCursor(ev, cursor))
    .sort(byNewest);

  const events = merged.slice(0, limit);
  const hasMore = merged.length > limit;
  return {
    events,
    nextCursor: hasMore && events.length > 0 ? encodeCursor(events[events.length - 1]) : null,
    hasMore,
  };
}
