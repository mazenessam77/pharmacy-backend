'use client';

import { useEffect, useState } from 'react';
import { Wifi, WifiOff, Gauge, Crosshair, Clock3 } from 'lucide-react';
import type { DriverLocation } from '@/types/delivery';
import { timeAgo } from './steps';

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-0">
      <span className="flex items-center gap-2 text-[12px] text-neutral-500">
        {icon}
        {label}
      </span>
      <span className="text-[12px] font-medium text-neutral-800 tabular-nums">{value}</span>
    </div>
  );
}

export function LiveTrackingInfo({
  location,
  connected,
}: {
  location: DriverLocation | null;
  connected: boolean;
}) {
  // Re-render once a second so "last update" stays fresh.
  const [, force] = useState(0);
  useEffect(() => {
    const t = setInterval(() => force((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const kmh = location?.speed != null ? `${Math.round(location.speed * 3.6)} km/h` : '—';

  return (
    <div className="bg-white border border-neutral-100 rounded-[20px] shadow-md p-6">
      <h3 className="text-[13px] font-bold text-neutral-900 mb-3">Live tracking</h3>
      <Row
        icon={connected ? <Wifi className="w-3.5 h-3.5 text-emerald-500" /> : <WifiOff className="w-3.5 h-3.5 text-rose-500" />}
        label="Connection"
        value={connected ? 'Live' : 'Reconnecting…'}
      />
      <Row icon={<Clock3 className="w-3.5 h-3.5" />} label="Last GPS update" value={timeAgo(location?.recordedAt)} />
      <Row icon={<Gauge className="w-3.5 h-3.5" />} label="Speed" value={kmh} />
      <Row
        icon={<Crosshair className="w-3.5 h-3.5" />}
        label="GPS accuracy"
        value={location?.accuracy != null ? `±${Math.round(location.accuracy)} m` : '—'}
      />
    </div>
  );
}
