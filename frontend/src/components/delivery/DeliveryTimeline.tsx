'use client';

import { memo } from 'react';
import { Check } from 'lucide-react';
import type { DeliveryStatus } from '@/types/delivery';
import { DELIVERY_STEPS, stepIndex } from './steps';

function fmt(at?: string) {
  if (!at) return '';
  return new Date(at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function DeliveryTimelineBase({
  status,
  timeline,
}: {
  status: DeliveryStatus;
  timeline: { status: DeliveryStatus; at: string }[];
}) {
  const active = stepIndex(status);
  const lastAt = (key: DeliveryStatus) =>
    timeline.filter((t) => t.status === key).slice(-1)[0]?.at;

  return (
    <div className="bg-white border border-neutral-100 rounded-[20px] shadow-md p-6">
      <h3 className="text-[13px] font-bold text-neutral-900 mb-5">Delivery Timeline</h3>
      <ol className="relative ps-1">
        {DELIVERY_STEPS.map((step, i) => {
          const done = i < active;
          const current = i === active;
          const at = lastAt(step.key);
          return (
            <li key={step.key} className="relative flex gap-3 pb-5 last:pb-0">
              {/* connector */}
              {i < DELIVERY_STEPS.length - 1 && (
                <span
                  className={`absolute start-[11px] top-6 bottom-0 w-px ${done ? 'bg-blue-600' : 'bg-neutral-200'}`}
                />
              )}
              <span
                className={`relative z-10 mt-0.5 w-[23px] h-[23px] shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  done
                    ? 'bg-blue-600 text-white'
                    : current
                      ? 'bg-blue-50 text-blue-600 ring-2 ring-blue-600 animate-pulse'
                      : 'bg-white text-neutral-300 ring-2 ring-neutral-200'
                }`}
              >
                {done ? <Check className="w-3 h-3" /> : ''}
              </span>
              <div className="flex-1 flex items-center justify-between gap-2">
                <p
                  className={`text-[13px] ${current ? 'font-bold text-neutral-900' : done ? 'font-medium text-neutral-700' : 'text-neutral-400'}`}
                >
                  {step.label}
                </p>
                {at && <span className="text-[11px] text-neutral-400 tabular-nums">{fmt(at)}</span>}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export const DeliveryTimeline = memo(DeliveryTimelineBase);
