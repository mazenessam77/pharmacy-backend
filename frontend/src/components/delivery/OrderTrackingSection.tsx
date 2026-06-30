'use client';

import dynamic from 'next/dynamic';
import { Truck, AlertCircle, PackageX } from 'lucide-react';
import { useDeliveryTracking } from '@/hooks/useDeliveryTracking';
import { DeliveryProgress } from './DeliveryProgress';
import { DeliveryTimeline } from './DeliveryTimeline';
import { ETAWidget } from './ETAWidget';
import { DriverCard } from './DriverCard';
import { LiveTrackingInfo } from './LiveTrackingInfo';
import { STATUS_LABELS } from './steps';

// Map libs are heavy → load only on the client, only when actually rendered.
const TrackingMap = dynamic(() => import('./TrackingMap'), {
  ssr: false,
  loading: () => <div className="w-full h-[320px] sm:h-[380px] rounded-[20px] bg-neutral-100 animate-pulse" />,
});

function Shell({ children }: { children: React.ReactNode }) {
  return <section className="mb-6 space-y-4">{children}</section>;
}

export default function OrderTrackingSection({ orderId }: { orderId: string }) {
  const { state, snapshot, connected, driverPosition } = useDeliveryTracking(orderId);

  if (state === 'loading') {
    return (
      <Shell>
        <div className="h-20 rounded-[20px] bg-neutral-100 animate-pulse" />
        <div className="h-[380px] rounded-[20px] bg-neutral-100 animate-pulse" />
      </Shell>
    );
  }

  // No delivery created yet — a gentle hint so the patient knows tracking is coming.
  if (state === 'none') {
    return (
      <Shell>
        <div className="flex items-center gap-3 bg-white border border-neutral-100 rounded-[20px] shadow-md p-5">
          <div className="w-10 h-10 rounded-[12px] bg-blue-50 flex items-center justify-center shrink-0">
            <Truck className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-[13px] text-neutral-500">
            Live tracking will appear here once a driver is assigned to your order.
          </p>
        </div>
      </Shell>
    );
  }

  if (state === 'error' || !snapshot) {
    return (
      <Shell>
        <div className="flex items-center gap-3 bg-rose-50 border border-rose-100 rounded-[20px] p-5">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          <p className="text-[13px] text-rose-700">Couldn&apos;t load live tracking. Retrying automatically…</p>
        </div>
      </Shell>
    );
  }

  if (snapshot.status === 'cancelled') {
    return (
      <Shell>
        <div className="flex items-center gap-3 bg-white border border-neutral-100 rounded-[20px] shadow-md p-5">
          <PackageX className="w-5 h-5 text-neutral-400 shrink-0" />
          <p className="text-[13px] text-neutral-600">This delivery was cancelled.</p>
        </div>
      </Shell>
    );
  }

  const live = ['picked_up', 'in_transit', 'nearby'].includes(snapshot.status);

  return (
    <Shell>
      {/* Status header */}
      <div className="flex items-center justify-between gap-3 bg-white border border-neutral-100 rounded-[20px] shadow-md px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[12px] bg-gradient-to-br from-blue-600 to-sky-500 flex items-center justify-center shrink-0">
            <Truck className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">Delivery status</p>
            <p className="text-[16px] font-bold text-neutral-900">{STATUS_LABELS[snapshot.status]}</p>
          </div>
        </div>
        {live && (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {connected ? 'LIVE' : 'RECONNECTING'}
          </span>
        )}
      </div>

      <DeliveryProgress status={snapshot.status} />

      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-4 items-start">
        <div className="space-y-4">
          <TrackingMap snapshot={snapshot} driverPosition={driverPosition} />
          <ETAWidget eta={snapshot.eta} status={snapshot.status} />
        </div>
        <div className="space-y-4">
          <DriverCard driver={snapshot.driver} orderId={orderId} />
          <LiveTrackingInfo location={snapshot.driverLocation} connected={connected} />
          <DeliveryTimeline status={snapshot.status} timeline={snapshot.timeline} />
        </div>
      </div>
    </Shell>
  );
}
