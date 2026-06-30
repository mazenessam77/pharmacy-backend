'use client';

import { memo } from 'react';
import Link from 'next/link';
import { Phone, MessageCircle, Star, Car } from 'lucide-react';
import type { DriverCard as DriverCardData } from '@/types/delivery';

function DriverCardBase({ driver, orderId }: { driver: DriverCardData | null; orderId: string }) {
  if (!driver) {
    return (
      <div className="bg-white border border-neutral-100 rounded-[20px] shadow-md p-6">
        <p className="text-[13px] text-neutral-400">Waiting for a driver to be assigned…</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-neutral-100 rounded-[20px] shadow-md p-6">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-blue-600 to-sky-500 flex items-center justify-center text-white text-lg font-bold shrink-0">
          {driver.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={driver.photoUrl} alt={driver.name} className="w-full h-full object-cover" />
          ) : (
            driver.name.charAt(0).toUpperCase()
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-bold text-neutral-900 truncate">{driver.name}</p>
          <div className="flex items-center gap-3 mt-0.5 text-[12px] text-neutral-500">
            <span className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              {driver.rating.toFixed(1)}
            </span>
            <span className="flex items-center gap-1">
              <Car className="w-3.5 h-3.5" />
              {driver.vehicleType}
            </span>
          </div>
          <p className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 mt-1">
            {driver.vehiclePlate}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-5">
        <a
          href={`tel:${driver.phone}`}
          className="inline-flex items-center justify-center gap-2 py-2.5 rounded-full bg-neutral-900 text-white text-[13px] font-semibold hover:bg-neutral-800 active:scale-[0.98] transition-all"
        >
          <Phone className="w-4 h-4" /> Call
        </a>
        <Link
          href={`/patient/chat/${orderId}`}
          className="inline-flex items-center justify-center gap-2 py-2.5 rounded-full border border-neutral-200 text-neutral-800 text-[13px] font-semibold hover:border-neutral-300 hover:bg-neutral-50 active:scale-[0.98] transition-all"
        >
          <MessageCircle className="w-4 h-4" /> Chat
        </Link>
      </div>
    </div>
  );
}

export const DriverCard = memo(DriverCardBase);
