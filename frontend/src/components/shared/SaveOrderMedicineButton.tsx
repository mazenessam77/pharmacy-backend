'use client';

import { useState } from 'react';
import { Heart, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSavedMedicationStore } from '@/store/savedMedicationStore';

/**
 * Compact heart for saving a medicine straight from an order. Orders store
 * free-text names, so this saves by name (the API resolves it to a catalog
 * medicine). If the name isn't in the catalog, it tells the user kindly.
 */
export default function SaveOrderMedicineButton({ name }: { name: string }) {
  const item = useSavedMedicationStore((s) =>
    s.items.find((i) => i.medicineId?.name?.toLowerCase() === name.trim().toLowerCase())
  );
  const saveByName = useSavedMedicationStore((s) => s.saveByName);
  const removeById = useSavedMedicationStore((s) => s.removeById);
  const [busy, setBusy] = useState(false);
  const saved = !!item;

  const onClick = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (item) {
        await removeById(item._id);
        toast.success('Removed from saved');
      } else {
        await saveByName(name);
        toast.success('Saved for quick reorder');
      }
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 404) toast.error("This medicine isn't in our catalog yet");
      else if (status === 409) toast('Already in your saved list');
      else toast.error(err?.response?.data?.error?.message || 'Could not update saved list');
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      aria-pressed={saved}
      title={saved ? 'Remove from saved' : 'Save for quick reorder'}
      className={`ml-auto inline-flex items-center justify-center w-7 h-7 rounded-none transition-all duration-200 active:scale-90 disabled:opacity-50 ${
        saved ? 'text-neutral-900' : 'text-neutral-300  hover:text-neutral-900'
      }`}
    >
      {busy ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Heart className={`w-3.5 h-3.5 ${saved ? 'fill-current' : ''}`} />
      )}
    </button>
  );
}
