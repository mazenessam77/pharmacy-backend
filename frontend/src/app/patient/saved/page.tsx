'use client';

import { useEffect, useState, useCallback } from 'react';
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
  ShoppingBasket,
  Trash2,
  Search,
  Minus,
  Pencil,
} from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Textarea from '@/components/ui/Textarea';
import { CardSkeleton } from '@/components/ui/Skeleton';
import MedicineIcon from '@/components/shared/MedicineIcon';
import SaveMedicationButton from '@/components/shared/SaveMedicationButton';
import { useSavedMedicationStore } from '@/store/savedMedicationStore';
import { useSavedBasketStore } from '@/store/savedBasketStore';
import { useRequestDraftStore } from '@/store/requestDraftStore';
import { useOrderStore } from '@/store/orderStore';
import { medicineService } from '@/lib/services/medicineService';
import { SavedMedication, SavedBasket, ReminderFrequency } from '@/types';

type Tab = 'medications' | 'baskets';

export default function SavedPage() {
  const [tab, setTab] = useState<Tab>('medications');

  return (
    <div className="max-w-4xl">
      {/* Hero */}
      <div
        className="rounded-3xl p-7 mb-6 text-white relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #e11d48 0%, #f97316 100%)',
          boxShadow: '0 20px 40px -10px rgba(225,29,72,0.45)',
        }}
      >
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative">
          <div className="inline-flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-widest mb-3">
            <Heart className="w-3 h-3 fill-current" />
            Quick Reorder
          </div>
          <h1 className="text-[26px] font-extrabold leading-tight">Saved</h1>
          <p className="text-rose-100/90 mt-1.5 text-[13px] font-medium max-w-md">
            Your favourite medicines and reusable baskets — reorder in one click.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 bg-slate-100 dark:bg-zinc-900 p-1 rounded-2xl w-fit">
        <TabButton active={tab === 'medications'} onClick={() => setTab('medications')} icon={<Heart className="w-3.5 h-3.5" />}>
          Medications
        </TabButton>
        <TabButton active={tab === 'baskets'} onClick={() => setTab('baskets')} icon={<ShoppingBasket className="w-3.5 h-3.5" />}>
          Baskets
        </TabButton>
      </div>

      {tab === 'medications' ? <MedicationsTab /> : <BasketsTab />}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-bold transition-all duration-200 ${
        active
          ? 'bg-white dark:bg-zinc-800 text-rose-600 shadow-sm'
          : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200'
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

/* ──────────────────────────── Medications tab ──────────────────────────── */

const REMINDER_OPTIONS: { value: ReminderFrequency; label: string }[] = [
  { value: 'none', label: 'No reminder' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

function MedicationsTab() {
  const { items, loading, loaded, fetch } = useSavedMedicationStore();

  useEffect(() => {
    fetch();
  }, [fetch]);

  if (loading && !loaded) {
    return <div className="space-y-4">{[1, 2, 3].map((i) => <CardSkeleton key={i} />)}</div>;
  }

  if (items.length === 0) {
    return (
      <div className="glass rounded-3xl card-shadow py-16 text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-rose-50 dark:bg-rose-950/40">
          <Heart className="w-7 h-7 text-rose-400 dark:text-rose-300" />
        </div>
        <p className="text-[13px] font-medium text-slate-500 dark:text-zinc-400 mb-4">
          You haven&apos;t saved any medications yet.
        </p>
        <Link
          href="/patient/medicines"
          className="inline-flex items-center gap-2 bg-rose-500 text-white text-[12px] font-bold px-5 py-2.5 rounded-xl hover:bg-rose-600 active:scale-95 transition-all duration-200"
        >
          <Pill className="w-3.5 h-3.5" />
          Browse Medicines
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <SavedCard key={item._id} item={item} />
      ))}
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
    <div className="glass rounded-3xl card-shadow p-5">
      <div className="flex items-start gap-4">
        <MedicineIcon name={med.name} size="lg" />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[15px] font-bold text-slate-800 dark:text-zinc-100 truncate">{med.name}</p>
              {med.genericName && (
                <p className="text-[12px] text-slate-500 dark:text-zinc-400 truncate mt-0.5">{med.genericName}</p>
              )}
            </div>
            {/* Filled heart doubles as "remove from saved" */}
            <SaveMedicationButton medicine={med} />
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-2">
            {med.category && (
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-300">
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
            className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold text-sky-600 hover:text-sky-800 disabled:opacity-50 transition-colors"
          >
            {savingNote ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save note
          </button>
        )}
      </div>

      {/* Reminder + Reorder */}
      <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-[12px] text-slate-600 dark:text-zinc-300">
          <Bell className="w-3.5 h-3.5 text-amber-500" />
          <span className="font-medium">Refill reminder</span>
          <select
            value={item.reminderFrequency}
            onChange={(e) => changeReminder(e.target.value as ReminderFrequency)}
            className="ml-1 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-neutral-200 dark:border-zinc-700 text-[12px] font-medium text-slate-700 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-sky-300 dark:focus:ring-sky-700"
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
          className="inline-flex items-center gap-2 bg-sky-600 text-white text-[12px] font-bold px-5 py-2.5 rounded-xl hover:bg-sky-700 active:scale-95 disabled:opacity-60 transition-all duration-200"
        >
          {reordering ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Repeat className="w-3.5 h-3.5" />}
          Reorder
        </button>
      </div>
    </div>
  );
}

/* ────────────────────────────── Baskets tab ────────────────────────────── */

function BasketsTab() {
  const { baskets, loading, loaded, fetch, remove } = useSavedBasketStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SavedBasket | null>(null);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (basket: SavedBasket) => {
    setEditing(basket);
    setModalOpen(true);
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[13px] text-slate-500 dark:text-zinc-400">
          Group medicines you order together, then send the whole basket to a request in one click.
        </p>
        <Button variant="indigo" size="sm" onClick={openCreate} className="shrink-0 rounded-xl">
          <Plus className="w-4 h-4" />
          New Basket
        </Button>
      </div>

      {loading && !loaded ? (
        <div className="space-y-4">{[1, 2].map((i) => <CardSkeleton key={i} />)}</div>
      ) : baskets.length === 0 ? (
        <div className="glass rounded-3xl card-shadow py-16 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-indigo-50 dark:bg-indigo-950/40">
            <ShoppingBasket className="w-7 h-7 text-indigo-400 dark:text-indigo-300" />
          </div>
          <p className="text-[13px] font-medium text-slate-500 dark:text-zinc-400 mb-4">
            No baskets yet. Create one to reorder your regular medicines instantly.
          </p>
          <Button variant="indigo" size="sm" onClick={openCreate} className="rounded-xl">
            <Plus className="w-3.5 h-3.5" />
            Create your first basket
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {baskets.map((basket) => (
            <BasketCard key={basket._id} basket={basket} onEdit={() => openEdit(basket)} onDelete={() => remove(basket._id)} />
          ))}
        </div>
      )}

      <BasketModal isOpen={modalOpen} onClose={() => setModalOpen(false)} existing={editing} />
    </>
  );
}

function BasketCard({
  basket,
  onEdit,
  onDelete,
}: {
  basket: SavedBasket;
  onEdit: () => void;
  onDelete: () => Promise<void>;
}) {
  const router = useRouter();
  const loadDraft = useRequestDraftStore((s) => s.load);
  const [deleting, setDeleting] = useState(false);

  const validItems = basket.items.filter((it) => it.medicine?.name);

  // "Order Basket": do NOT create an order. Load the items into the request
  // draft (the frontend cart) and send the patient to the request page to
  // adjust quantities / remove items before they submit.
  const orderBasket = () => {
    if (validItems.length === 0) {
      toast.error('This basket has no available medicines');
      return;
    }
    loadDraft(validItems.map((it) => ({ name: it.medicine.name, quantity: it.quantity })));
    router.push('/patient/orders/new');
  };

  const handleDelete = async () => {
    if (!confirm(`Delete basket "${basket.name}"?`)) return;
    setDeleting(true);
    try {
      await onDelete();
      toast.success('Basket deleted');
    } catch {
      toast.error('Could not delete basket');
      setDeleting(false);
    }
  };

  return (
    <div className="glass rounded-3xl card-shadow p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center shrink-0">
            <ShoppingBasket className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="min-w-0">
            <p className="text-[15px] font-bold text-slate-800 dark:text-zinc-100 truncate">{basket.name}</p>
            <p className="text-[12px] text-slate-500 dark:text-zinc-400">
              {validItems.length} {validItems.length === 1 ? 'medicine' : 'medicines'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onEdit}
            title="Edit basket"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            title="Delete basket"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Item chips */}
      <div className="flex flex-wrap gap-2">
        {validItems.map((it, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200"
          >
            <Pill className="w-3 h-3 text-sky-500" />
            {it.medicine.name}
            <span className="text-slate-400 dark:text-zinc-500">×{it.quantity}</span>
          </span>
        ))}
        {validItems.length === 0 && (
          <span className="text-[12px] text-slate-400 dark:text-zinc-500">No medicines in this basket.</span>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-zinc-800 flex justify-end">
        <button
          type="button"
          onClick={orderBasket}
          className="inline-flex items-center gap-2 bg-indigo-600 text-white text-[12px] font-bold px-5 py-2.5 rounded-xl hover:bg-indigo-700 active:scale-95 transition-all duration-200"
        >
          <ShoppingBasket className="w-3.5 h-3.5" />
          Order Basket
        </button>
      </div>
    </div>
  );
}

/* ─────────────────── Create / edit basket modal ─────────────────── */

interface DraftItem {
  medicine: { _id: string; name: string; genericName?: string };
  quantity: number;
}

function BasketModal({
  isOpen,
  onClose,
  existing,
}: {
  isOpen: boolean;
  onClose: () => void;
  existing: SavedBasket | null;
}) {
  const create = useSavedBasketStore((s) => s.create);
  const update = useSavedBasketStore((s) => s.update);

  const [name, setName] = useState('');
  const [items, setItems] = useState<DraftItem[]>([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DraftItem['medicine'][]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);

  // Re-seed the form whenever the modal opens (create vs edit).
  useEffect(() => {
    if (!isOpen) return;
    setName(existing?.name || '');
    setItems(
      (existing?.items || [])
        .filter((it) => it.medicine?.name)
        .map((it) => ({ medicine: { _id: it.medicine._id, name: it.medicine.name, genericName: it.medicine.genericName }, quantity: it.quantity }))
    );
    setQuery('');
    setResults([]);
  }, [isOpen, existing]);

  // Debounced catalog search.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const res = await medicineService.autocomplete(q);
        setResults((res.data.data || []) as DraftItem['medicine'][]);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  const addMedicine = useCallback((med: DraftItem['medicine']) => {
    setItems((prev) => (prev.some((i) => i.medicine._id === med._id) ? prev : [...prev, { medicine: med, quantity: 1 }]));
    setQuery('');
    setResults([]);
  }, []);

  const setQty = (id: string, delta: number) =>
    setItems((prev) =>
      prev.map((i) => (i.medicine._id === id ? { ...i, quantity: Math.min(Math.max(i.quantity + delta, 1), 99) } : i))
    );

  const removeItem = (id: string) => setItems((prev) => prev.filter((i) => i.medicine._id !== id));

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Give your basket a name');
      return;
    }
    if (items.length === 0) {
      toast.error('Add at least one medicine');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        items: items.map((i) => ({ medicineId: i.medicine._id, quantity: i.quantity })),
      };
      if (existing) {
        await update(existing._id, payload);
        toast.success('Basket updated');
      } else {
        await create(payload);
        toast.success('Basket created');
      }
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Could not save basket');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={existing ? 'Edit Basket' : 'New Basket'}>
      <div className="space-y-4">
        <Input
          label="Basket name"
          placeholder="e.g. Monthly meds"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        {/* Medicine search */}
        <div className="relative">
          <label className="block text-[11px] uppercase tracking-widest text-neutral-500 dark:text-zinc-400 font-medium mb-1.5">
            Add medicines
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search the catalog…"
              className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-zinc-800/50 border border-neutral-200 dark:border-zinc-700 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-sky-300 dark:focus:ring-sky-700 dark:text-zinc-100 transition-all"
            />
            {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-neutral-400" />}
          </div>
          {results.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-700 rounded-xl shadow-lg max-h-56 overflow-auto">
              {results.map((med) => (
                <button
                  key={med._id}
                  type="button"
                  onClick={() => addMedicine(med)}
                  className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors border-b border-neutral-100 dark:border-zinc-800 last:border-0"
                >
                  <p className="text-[13px] font-medium text-slate-800 dark:text-zinc-100">{med.name}</p>
                  {med.genericName && <p className="text-[11px] text-slate-400 dark:text-zinc-500">{med.genericName}</p>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selected items */}
        <div className="space-y-2 max-h-52 overflow-auto">
          {items.length === 0 ? (
            <p className="text-[12px] text-slate-400 dark:text-zinc-500 text-center py-4">No medicines added yet.</p>
          ) : (
            items.map((it) => (
              <div
                key={it.medicine._id}
                className="flex items-center gap-3 bg-slate-50 dark:bg-zinc-800/50 rounded-xl px-3 py-2"
              >
                <Pill className="w-4 h-4 text-sky-500 shrink-0" />
                <span className="flex-1 text-[13px] font-medium text-slate-800 dark:text-zinc-100 truncate">{it.medicine.name}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setQty(it.medicine._id, -1)}
                    className="w-7 h-7 rounded-lg bg-white dark:bg-zinc-700 border border-neutral-200 dark:border-zinc-600 flex items-center justify-center text-slate-500 hover:text-sky-600 transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-7 text-center text-[13px] font-bold text-slate-700 dark:text-zinc-200">{it.quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQty(it.medicine._id, 1)}
                    className="w-7 h-7 rounded-lg bg-white dark:bg-zinc-700 border border-neutral-200 dark:border-zinc-600 flex items-center justify-center text-slate-500 hover:text-sky-600 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(it.medicine._id)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-500 transition-colors shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="indigo" onClick={handleSave} isLoading={saving} className="flex-1 rounded-xl">
            {existing ? 'Save Changes' : 'Create Basket'}
          </Button>
          <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl">
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}
