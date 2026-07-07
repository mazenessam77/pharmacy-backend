'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
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
} from 'lucide-react';
import api from '@/lib/api';
import { timeAgo } from '@/components/delivery/steps';

type EventType =
  | 'PRESCRIPTION_UPLOADED' | 'ORDER_CREATED' | 'ORDER_DELIVERED' | 'ORDER_CANCELLED'
  | 'OFFER_RECEIVED' | 'OFFER_ACCEPTED' | 'ORDER_PREPARING' | 'ORDER_OUT_FOR_DELIVERY'
  | 'ORDER_STATUS' | 'FAVORITE_ADDED' | 'BASKET_CREATED';

interface TimelineEvent {
  id: string;
  type: EventType;
  title: string;
  description: string;
  timestamp: string;
  orderId?: string;
  prescriptionId?: string;
  basketId?: string;
}

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
    if (ev.orderId)
      return (
        <Link href={`/patient/orders/${ev.orderId}`} className="text-[11px] font-bold text-blue-600 hover:text-blue-700">
          View Order →
        </Link>
      );
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
        {events.map((ev, i) => {
          const meta = META[ev.type] ?? META.ORDER_STATUS;
          const Icon = meta.icon;
          const last = i === events.length - 1 && !hasMore;
          return (
            <li key={ev.id} className="relative flex gap-4">
              {/* rail */}
              {!last && <span className="absolute start-[17px] top-9 bottom-0 w-px bg-neutral-200" />}
              <span
                className={`relative z-10 w-9 h-9 shrink-0 rounded-full bg-gradient-to-br ${meta.cls} flex items-center justify-center shadow-sm`}
              >
                <Icon className="w-4 h-4 text-white" />
              </span>
              <div className="flex-1 min-w-0 pb-8">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-[13.5px] font-semibold text-neutral-900">{ev.title}</p>
                  <span
                    className="text-[11px] text-neutral-400 shrink-0 tabular-nums"
                    title={new Date(ev.timestamp).toLocaleString()}
                  >
                    {timeAgo(ev.timestamp)}
                  </span>
                </div>
                {ev.description && (
                  <p className="text-[12.5px] text-neutral-500 mt-0.5 leading-relaxed">{ev.description}</p>
                )}
                <div className="mt-1.5">{cta(ev)}</div>
              </div>
            </li>
          );
        })}
      </ol>

      {/* Skeletons (initial + page loads) */}
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
