'use client';

import { memo } from 'react';
import { Clock, Navigation } from 'lucide-react';
import type { DeliveryEta, DeliveryStatus } from '@/types/delivery';
import { formatEta, formatDistance } from './steps';

function ETAWidgetBase({ eta, status }: { eta: DeliveryEta | null; status: DeliveryStatus }) {
  const arrived = status === 'delivered';
  const calculating = !eta && !arrived;

  return (
    <div className="relative overflow-hidden rounded-[20px] p-6 text-white bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 shadow-[0_20px_50px_-20px_rgba(79,70,229,0.55)]">
      <div
        className="absolute inset-0 opacity-25 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle at 85% 15%, rgba(255,255,255,0.5) 0%, transparent 45%)' }}
      />
      <div className="relative flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/70 mb-1.5">
            <Clock className="w-3 h-3" />
            {arrived ? 'Delivered' : 'Estimated arrival'}
          </div>
          <p className="text-[30px] font-black leading-none">
            {arrived ? 'Arrived' : calculating ? 'Calculating…' : formatEta(eta?.seconds)}
          </p>
          {!arrived && (
            <p className="text-[12px] text-white/75 mt-1.5 flex items-center gap-1">
              <Navigation className="w-3 h-3" />
              {eta ? `${formatDistance(eta.distanceM)} remaining` : 'updating route…'}
            </p>
          )}
        </div>
        <div className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center shrink-0">
          <span className="text-2xl">🛵</span>
        </div>
      </div>
    </div>
  );
}

export const ETAWidget = memo(ETAWidgetBase);
