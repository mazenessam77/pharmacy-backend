'use client';

import { memo } from 'react';
import { Check } from 'lucide-react';
import type { DeliveryStatus } from '@/types/delivery';
import { DELIVERY_STEPS, stepIndex } from './steps';

function DeliveryProgressBase({ status }: { status: DeliveryStatus }) {
  const active = stepIndex(status);
  const cancelled = status === 'cancelled';
  const pct = cancelled ? 0 : (active / (DELIVERY_STEPS.length - 1)) * 100;

  return (
    <div className="bg-white border border-neutral-100 rounded-[20px] shadow-md p-6">
      <div className="relative">
        {/* track */}
        <div className="absolute top-3.5 start-0 end-0 h-[3px] bg-neutral-100 rounded-full" />
        {/* fill */}
        <div
          className="absolute top-3.5 start-0 h-[3px] rounded-full bg-gradient-to-r from-blue-600 to-sky-500 transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
        <ol className="relative flex justify-between">
          {DELIVERY_STEPS.map((step, i) => {
            const done = !cancelled && i < active;
            const current = !cancelled && i === active;
            return (
              <li key={step.key} className="flex flex-col items-center gap-2 w-0 flex-1">
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors duration-500 ${
                    done
                      ? 'bg-blue-600 text-white'
                      : current
                        ? 'bg-white text-blue-600 ring-2 ring-blue-600'
                        : 'bg-white text-neutral-300 ring-2 ring-neutral-200'
                  }`}
                >
                  {done ? <Check className="w-3.5 h-3.5" /> : i + 1}
                </span>
                <span
                  className={`text-[10px] font-semibold text-center leading-tight ${
                    current ? 'text-neutral-900' : done ? 'text-neutral-600' : 'text-neutral-400'
                  }`}
                >
                  {step.label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

export const DeliveryProgress = memo(DeliveryProgressBase);
