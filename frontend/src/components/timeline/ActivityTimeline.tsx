'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  ShoppingBag,
  PackageCheck,
  XCircle,
  Tag,
  CheckCircle2,
  ChefHat,
  Truck,
  Bell,
  Heart,
  ShoppingBasket,
  RotateCcw,
  Inbox,
  Package,
  ChevronDown,
  Star,
} from 'lucide-react';
import api from '@/lib/api';
import { relativeTime, fullTimestamp } from '@/lib/relativeTime';
import { buildItems, dateBucket, fmtDuration, type EventType, type Summary, type TimelineEvent, type OrderItem, type Item } from '@/lib/timelineGrouping';

const META: Record<EventType, { icon: React.ElementType; cls: string }> = {
  PRESCRIPTION_UPLOADED: { icon: FileText, cls: 'from-violet-500 to-purple-700' },
  ORDER_CREATED: { icon: ShoppingBag, cls: 'from-sky-400 to-blue-600' },
  ORDER_DELIVERED: { icon: PackageCheck, cls: 'from-emerald-400 to-teal-600' },
  ORDER_CANCELLED: { icon: XCircle, cls: 'from-neutral-400 to-neutral-600' },
  OFFER_RECEIVED: { icon: Tag, cls: 'from-amber-400 to-orange-600' },
  OFFER_ACCEPTED: { icon: CheckCircle2, cls: 'from-emerald-400 to-teal-600' },
  ORDER_PREPARING: { icon: ChefHat, cls: 'from-amber-400 to-orange-600' },
  ORDER_OUT_FOR_DELIVERY: { icon: Truck, cls: 'from-cyan-400 to-sky-600' },
  ORDER_STATUS: { icon: Bell, cls: 'from-blue-400 to-indigo-600' },
  FAVORITE_ADDED: { icon: Heart, cls: 'from-rose-400 to-pink-600' },
  BASKET_CREATED: { icon: ShoppingBasket, cls: 'from-fuchsia-500 to-purple-700' },
};

// Collapsed order-card status derived from the order's newest event.
const ORDER_STATUS: Partial<Record<EventType, { label: string; cls: string }>> = {
  ORDER_DELIVERED: { label: 'Delivered', cls: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  ORDER_CANCELLED: { label: 'Cancelled', cls: 'text-neutral-600 bg-neutral-100 border-neutral-200' },
  ORDER_OUT_FOR_DELIVERY: { label: 'Out for delivery', cls: 'text-cyan-700 bg-cyan-50 border-cyan-200' },
  ORDER_PREPARING: { label: 'Preparing', cls: 'text-amber-700 bg-amber-50 border-amber-200' },
  OFFER_ACCEPTED: { label: 'Confirmed', cls: 'text-blue-700 bg-blue-50 border-blue-200' },
  OFFER_RECEIVED: { label: 'Offers received', cls: 'text-amber-700 bg-amber-50 border-amber-200' },
  ORDER_CREATED: { label: 'Created', cls: 'text-neutral-600 bg-neutral-100 border-neutral-200' },
  ORDER_STATUS: { label: 'Updated', cls: 'text-neutral-600 bg-neutral-100 border-neutral-200' },
};

const FILTERS = [
  { key: undefined, label: 'All' },
  { key: 'orders', label: 'Orders' },
  { key: 'offers', label: 'Offers & updates' },
  { key: 'prescriptions', label: 'Prescriptions' },
  { key: 'favorites', label: 'Favorites' },
  { key: 'baskets', label: 'Baskets' },
] as const;

function SkeletonRow() {
  return (
    <div className="flex gap-4 animate-pulse">
      <div className="w-9 h-9 rounded-full bg-neutral-100 shrink-0" />
      <div className="flex-1 space-y-2 pb-8">
        <div className="h-3.5 bg-neutral-100 rounded w-1/3" />
        <div className="h-3 bg-neutral-100 rounded w-2/3" />
      </div>
    </div>
  );
}

/** Expandable parent card for one order. Expand/collapse is purely local state. */
function OrderCard({ item }: { item: OrderItem }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const newest = item.events[0]; // newest-first
  const status = ORDER_STATUS[newest.type] ?? ORDER_STATUS.ORDER_STATUS!;
  const s = item.summary;
  const duration = fmtDuration(s?.durationMinutes);
  // Chronological (oldest -> newest) for the expanded activity.
  const activity = [...item.events].reverse();

  return (
    <div className="border border-neutral-200 rounded-[14px] p-4 bg-white">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <p className="text-[13.5px] font-bold text-neutral-900">Order #{item.orderId.slice(-6).toUpperCase()}</p>
          <span className={`text-[10px] font-semibold uppercase tracking-widest border px-2 py-0.5 rounded-full ${status.cls}`}>
            {status.label}
          </span>
        </div>
        <span className="text-[11px] text-neutral-400 shrink-0 tabular-nums" title={fullTimestamp(item.ts)}>
          {relativeTime(item.ts)}
        </span>
      </div>

      {/* Rich summary — delivered orders */}
      {s && (
        <div className="mt-3 space-y-1.5">
          {(s.pharmacyName || s.rating) && (
            <p className="text-[12.5px] font-semibold text-neutral-800 flex items-center gap-1.5">
              {s.pharmacyName || 'Pharmacy'}
              {s.rating ? (
                <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-neutral-500">
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" /> {s.rating.toFixed(1)}
                </span>
              ) : null}
            </p>
          )}
          {s.meds.length > 0 && (
            <ul className="space-y-0.5">
              {s.meds.map((m, k) => (
                <li key={k} className="text-[12px] text-neutral-600">
                  {m.name}{m.quantity > 1 ? ` ×${m.quantity}` : ''}
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap gap-x-5 gap-y-0.5 text-[12px] text-neutral-500 pt-0.5">
            <span>{s.medicineCount} medicine{s.medicineCount === 1 ? '' : 's'}</span>
            {s.deliveryFee > 0 && <span>Delivery: <span className="text-neutral-700">{s.deliveryFee.toFixed(2)} EGP</span></span>}
            {s.total > 0 && <span>Total: <span className="font-semibold text-neutral-800">{s.total.toFixed(2)} EGP</span></span>}
            {duration && <span>Completed in <span className="text-neutral-700">{duration}</span></span>}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 mt-3">
        <Link href={`/patient/orders/${item.orderId}`} className="text-[11px] font-bold text-neutral-600 hover:text-neutral-900">
          View Order
        </Link>
        {item.canReorder && (
          <button
            onClick={() => router.push(`/patient/orders/new?reorder=${item.orderId}`)}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-gradient-to-r from-blue-600 to-sky-500 px-3 py-1.5 rounded-full hover:shadow-md active:scale-95 transition-all"
          >
            <RotateCcw className="w-3 h-3" /> Order Again
          </button>
        )}
      </div>

      {/* Expandable activity */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-400 hover:text-neutral-700 transition-colors"
      >
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
        {open ? 'Hide activity' : 'Show activity'}
      </button>
      {open && (
        <ol className="mt-3 ps-1 border-t border-neutral-100 pt-3">
          {activity.map((ev, k) => {
            const m = META[ev.type] ?? META.ORDER_STATUS;
            const Icon = m.icon;
            return (
              <li key={ev.id} className="relative flex gap-3 pb-3 last:pb-0">
                {k < activity.length - 1 && <span className="absolute start-[9px] top-5 bottom-0 w-px bg-neutral-200" />}
                <span className={`relative z-10 w-5 h-5 shrink-0 rounded-full bg-gradient-to-br ${m.cls} flex items-center justify-center`}>
                  <Icon className="w-2.5 h-2.5 text-white" />
                </span>
                <div className="flex-1 flex items-baseline justify-between gap-2">
                  <span className="text-[12px] text-neutral-700">{ev.title}</span>
                  <span className="text-[10.5px] text-neutral-400 tabular-nums shrink-0" title={fullTimestamp(ev.timestamp)}>{relativeTime(ev.timestamp)}</span>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

export default function ActivityTimeline({ onViewBasket }: { onViewBasket?: () => void }) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState<string | undefined>(undefined);
  const [initialised, setInitialised] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  const loadPage = useCallback(
    async (reset: boolean, activeFilter: string | undefined, activeCursor: string | null) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      setLoading(true);
      setError(false);
      try {
        const params: Record<string, string> = { limit: '20' };
        if (activeFilter) params.type = activeFilter;
        if (activeCursor && !reset) params.cursor = activeCursor;
        const res = await api.get('/timeline', { params });
        const data = res.data.data;
        setEvents((prev) => (reset ? data.events : [...prev, ...data.events]));
        setCursor(data.nextCursor);
        setHasMore(data.hasMore);
      } catch {
        setError(true);
      } finally {
        loadingRef.current = false;
        setLoading(false);
        setInitialised(true);
      }
    },
    []
  );

  // initial + filter change
  useEffect(() => {
    setEvents([]);
    setCursor(null);
    setHasMore(true);
    setInitialised(false);
    loadPage(true, filter, null);
  }, [filter, loadPage]);

  // infinite scroll
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingRef.current && initialised) {
          loadPage(false, filter, cursor);
        }
      },
      { rootMargin: '300px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, cursor, filter, initialised, loadPage]);

  const cta = (ev: TimelineEvent) => {
    if (ev.prescriptionId)
      return (
        <Link href={`/patient/prescriptions/${ev.prescriptionId}`} className="text-[11px] font-bold text-blue-600 hover:text-blue-700">
          View Prescription →
        </Link>
      );
    if (ev.basketId && onViewBasket)
      return (
        <button onClick={onViewBasket} className="text-[11px] font-bold text-blue-600 hover:text-blue-700">
          View Basket →
        </button>
      );
    return null;
  };

  const items = buildItems(events);

  return (
    <div>
      {/* Filter chips */}
      <div className="flex gap-2 flex-wrap mb-6">
        {FILTERS.map((f) => (
          <button
            key={f.label}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-wide border transition-colors ${
              filter === f.key
                ? 'bg-neutral-900 text-white border-neutral-900'
                : 'bg-white text-neutral-500 border-neutral-200 hover:border-neutral-400'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Error state */}
      {error && events.length === 0 && (
        <div className="border border-neutral-200 p-10 text-center">
          <p className="text-[13px] text-neutral-500 mb-3">Couldn&apos;t load your activity.</p>
          <button
            onClick={() => loadPage(true, filter, null)}
            className="inline-flex items-center gap-1.5 text-[12px] font-bold text-blue-600 hover:text-blue-700"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Try again
          </button>
        </div>
      )}

      {/* Empty state */}
      {initialised && !error && events.length === 0 && (
        <div className="border border-neutral-200 p-14 text-center">
          <Inbox className="w-8 h-8 text-neutral-300 mx-auto mb-3" />
          <p className="text-[13px] text-neutral-500">No activity yet</p>
          <p className="text-[11px] text-neutral-400 mt-1">
            Your orders, offers, prescriptions and favorites will show up here.
          </p>
        </div>
      )}

      {/* The timeline */}
      <ol className="relative">
        {items.map((item, i) => {
          const isOrder = item.kind === 'order';
          const meta = isOrder ? { icon: Package, cls: 'from-blue-500 to-indigo-600' } : (META[item.event.type] ?? META.ORDER_STATUS);
          const Icon = meta.icon;
          const last = i === items.length - 1 && !hasMore;
          const bucket = dateBucket(item.ts);
          const showHeader = i === 0 || bucket !== dateBucket(items[i - 1].ts);
          return (
            <div key={isOrder ? `order:${item.orderId}` : item.event.id}>
              {showHeader && (
                <li className="list-none">
                  <p className={`text-[11px] font-bold uppercase tracking-widest text-neutral-400 ${i === 0 ? '' : 'mt-2'} mb-4`}>
                    {bucket}
                  </p>
                </li>
              )}
              <li className="relative flex gap-4">
                {!last && <span className="absolute start-[17px] top-9 bottom-0 w-px bg-neutral-200" />}
                <span className={`relative z-10 w-9 h-9 shrink-0 rounded-full bg-gradient-to-br ${meta.cls} flex items-center justify-center shadow-sm`}>
                  <Icon className="w-4 h-4 text-white" />
                </span>
                <div className="flex-1 min-w-0 pb-8">
                  {isOrder ? (
                    <OrderCard item={item} />
                  ) : (
                    <>
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="text-[13.5px] font-semibold text-neutral-900">{item.event.title}</p>
                        <span className="text-[11px] text-neutral-400 shrink-0 tabular-nums" title={fullTimestamp(item.event.timestamp)}>
                          {relativeTime(item.event.timestamp)}
                        </span>
                      </div>
                      {item.event.description && (
                        <p className="text-[12.5px] text-neutral-500 mt-0.5 leading-relaxed">{item.event.description}</p>
                      )}
                      <div className="mt-1.5">{cta(item.event)}</div>
                    </>
                  )}
                </div>
              </li>
            </div>
          );
        })}
      </ol>

      {/* Skeletons */}
      {loading && (
        <div className="space-y-2">
          <SkeletonRow />
          <SkeletonRow />
          {events.length === 0 && <SkeletonRow />}
        </div>
      )}

      {/* Infinite-scroll sentinel */}
      <div ref={sentinelRef} className="h-1" />

      {initialised && !hasMore && events.length > 0 && (
        <p className="text-center text-[11px] uppercase tracking-widest text-neutral-300 py-6">
          — Beginning of your story —
        </p>
      )}
    </div>
  );
}
