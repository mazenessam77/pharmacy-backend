'use client';

import { Heart } from 'lucide-react';
import toast from 'react-hot-toast';
import { Medicine } from '@/types';
import { useSavedMedicationStore } from '@/store/savedMedicationStore';

interface SaveMedicationButtonProps {
  medicine: Medicine;
  /** 'icon' = round icon button (on cards); 'pill' = labelled button. */
  variant?: 'icon' | 'pill';
  className?: string;
}

/**
 * Heart toggle to save/unsave a medication. Optimistic: the store flips the
 * UI immediately and reverts if the API call fails. Safe to drop inside a
 * clickable card — it stops event propagation.
 */
export default function SaveMedicationButton({
  medicine,
  variant = 'icon',
  className = '',
}: SaveMedicationButtonProps) {
  const saved = useSavedMedicationStore((s) => s.items.some((i) => i.medicineId?._id === medicine._id));
  const busy = useSavedMedicationStore((s) => s.busyIds.has(medicine._id));
  const toggle = useSavedMedicationStore((s) => s.toggle);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    const wasSaved = saved;
    try {
      await toggle(medicine);
      toast.success(wasSaved ? 'Removed from saved' : 'Saved to your list');
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Could not update your saved list');
    }
  };

  const heart = (
    <Heart
      className={`transition-all duration-200 ${saved ? 'fill-current scale-110' : ''}`}
      style={{ width: 18, height: 18 }}
    />
  );

  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        aria-pressed={saved}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-semibold transition-all duration-200 active:scale-95 disabled:opacity-50 ${
          saved
            ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300'
            : 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-600 dark:bg-zinc-800 dark:text-zinc-300'
        } ${className}`}
      >
        {heart}
        {saved ? 'Saved' : 'Save'}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      aria-pressed={saved}
      aria-label={saved ? 'Remove from saved medications' : 'Save medication'}
      title={saved ? 'Remove from saved' : 'Save medication'}
      className={`inline-flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200 active:scale-90 disabled:opacity-50 ${
        saved
          ? 'bg-rose-50 text-rose-500 dark:bg-rose-950/40 dark:text-rose-300'
          : 'bg-neutral-100 text-neutral-400 hover:text-rose-500 hover:bg-rose-50 dark:bg-zinc-800 dark:text-zinc-500'
      } ${className}`}
    >
      {heart}
    </button>
  );
}
