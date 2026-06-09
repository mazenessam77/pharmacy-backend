'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  Heart,
  Pill,
  Repeat,
  Bell,
  ShieldCheck,
  Loader2,
  Plus,
  Save,
} from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Textarea from '@/components/ui/Textarea';
import { CardSkeleton } from '@/components/ui/Skeleton';
import MedicineIcon from '@/components/shared/MedicineIcon';
import SaveMedicationButton from '@/components/shared/SaveMedicationButton';
import { useSavedMedicationStore } from '@/store/savedMedicationStore';
import { useOrderStore } from '@/store/orderStore';
import { SavedMedication, ReminderFrequency } from '@/types';

const REMINDER_OPTIONS: { value: ReminderFrequency; label: string }[] = [
  { value: 'none', label: 'No reminder' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

export default function SavedMedicationsPage() {
  const { items, loading, loaded, fetch } = useSavedMedicationStore();

  useEffect(() => {
    fetch();
  }, [fetch]);

  return (
    <div className="max-w-4xl">
      {/* Hero */}
      <div
        className="rounded-none p-7 mb-7 text-white relative overflow-hidden"
        style={{
          background: '#000000',
          boxShadow: 'none',
        }}
      >
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-none blur-2xl pointer-events-none" />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-white/15 rounded-none px-3 py-1 text-[10px] font-semibold uppercase tracking-widest mb-3">
              <Heart className="w-3 h-3 fill-current" />
              Quick Reorder
            </div>
            <h1 className="text-[26px] font-extrabold leading-tight">Saved Medications</h1>
            <p className="text-neutral-400/90 mt-1.5 text-[13px] font-medium max-w-md">
              Your favourites in one place — add notes, set refill reminders, and reorder instantly.
            </p>
          </div>
          <Link
            href="/patient/medicines"
            className="shrink-0 flex items-center gap-2 bg-white text-neutral-900 font-bold text-[13px] px-5 py-3 rounded-none hover:bg-neutral-100 active:scale-95 transition-all duration-200"
            style={{ boxShadow: 'none' }}
          >
            <Plus className="w-4 h-4" />
            Add More
          </Link>
        </div>
      </div>

      {loading && !loaded ? (
        <div className="space-y-4">{[1, 2, 3].map((i) => <CardSkeleton key={i} />)}</div>
      ) : items.length === 0 ? (
        <div className="glass rounded-none card-shadow py-16 text-center">
          <div className="w-16 h-16 rounded-none flex items-center justify-center mx-auto mb-4 bg-neutral-100">
            <Heart className="w-7 h-7 text-neutral-500" />
          </div>
          <p className="text-[13px] font-medium text-neutral-500 mb-4">
            You haven&apos;t saved any medications yet.
          </p>
          <Link
            href="/patient/medicines"
            className="inline-flex items-center gap-2 bg-black text-white text-[12px] font-bold px-5 py-2.5 rounded-none hover:bg-black active:scale-95 transition-all duration-200"
          >
            <Pill className="w-3.5 h-3.5" />
            Browse Medicines
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <SavedCard key={item._id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

function SavedCard({ item }: { item: SavedMedication }) {
  const router = useRouter();
  const update = useSavedMedicationStore((s) => s.update);
  const createOrder = useOrderStore((s) => s.createOrder);

  const med = item.medicineId;
  const [note, setNote] = useState(item.notes || '');
  const [savingNote, setSavingNote] = useState(false);
  const [reordering, setReordering] = useState(false);

  const noteDirty = note.trim() !== (item.notes || '').trim();

  const saveNote = async () => {
    setSavingNote(true);
    try {
      await update(item._id, { notes: note.trim() });
      toast.success('Note saved');
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Could not save note');
    } finally {
      setSavingNote(false);
    }
  };

  const changeReminder = async (value: ReminderFrequency) => {
    try {
      await update(item._id, { reminderFrequency: value });
      toast.success('Reminder updated');
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Could not update reminder');
    }
  };

  const reorder = async () => {
    setReordering(true);
    try {
      const order = await createOrder({
        medicines: [{ name: med.name, quantity: 1 }],
        governorate: 'Giza',
        deliveryType: 'delivery',
        paymentMethod: 'cash',
      });
      toast.success('Reorder request sent — pharmacies will send offers');
      router.push(`/patient/orders/${order._id}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Could not create reorder');
      setReordering(false);
    }
  };

  return (
    <div className="glass rounded-none card-shadow p-5">
      <div className="flex items-start gap-4">
        <MedicineIcon name={med.name} size="lg" />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[15px] font-bold text-neutral-800 truncate">{med.name}</p>
              {med.genericName && (
                <p className="text-[12px] text-neutral-500 truncate mt-0.5">{med.genericName}</p>
              )}
            </div>
            {/* Filled heart doubles as "remove from saved" */}
            <SaveMedicationButton medicine={med} />
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-2">
            {med.category && (
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-none bg-neutral-100 text-neutral-600">
                {med.category}
              </span>
            )}
            {med.requiresPrescription ? (
              <Badge variant="warning">
                <ShieldCheck className="w-3 h-3 mr-1 inline" />
                Rx required
              </Badge>
            ) : (
              <Badge variant="success">OTC</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="mt-4">
        <Textarea
          label="My Notes"
          rows={2}
          placeholder="e.g. take after breakfast, 1 tablet"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        {noteDirty && (
          <button
            type="button"
            onClick={saveNote}
            disabled={savingNote}
            className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold text-neutral-900 hover:text-neutral-900 disabled:opacity-50 transition-colors"
          >
            {savingNote ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save note
          </button>
        )}
      </div>

      {/* Reminder + Reorder */}
      <div className="mt-4 pt-4 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-[12px] text-neutral-600">
          <Bell className="w-3.5 h-3.5 text-neutral-900" />
          <span className="font-medium">Refill reminder</span>
          <select
            value={item.reminderFrequency}
            onChange={(e) => changeReminder(e.target.value as ReminderFrequency)}
            className="ml-1 px-3 py-1.5 rounded-none bg-neutral-50 border border-neutral-200 text-[12px] font-medium text-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-300"
          >
            {REMINDER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={reorder}
          disabled={reordering}
          className="inline-flex items-center gap-2 bg-black text-white text-[12px] font-bold px-5 py-2.5 rounded-none hover:bg-black active:scale-95 disabled:opacity-60 transition-all duration-200"
        >
          {reordering ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Repeat className="w-3.5 h-3.5" />}
          Reorder
        </button>
      </div>
    </div>
  );
}
