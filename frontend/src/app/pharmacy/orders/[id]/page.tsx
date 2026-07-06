'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useOrderStore } from '@/store/orderStore';
import { orderService } from '@/lib/services/orderService';
import { prescriptionService } from '@/lib/services/prescriptionService';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { statusLabel, statusVariant, formatDateTime } from '@/lib/helpers';
import { User, Prescription, OfferAvailability } from '@/types';
import toast from 'react-hot-toast';
import {
  MessageCircle,
  Send,
  ArrowRight,
  FileText,
  Plus,
  Trash2,
  ZoomIn,
  ZoomOut,
  Maximize,
} from 'lucide-react';

interface OfferMedRow {
  name: string;
  quantity: string;
  price: string;
  inStock: boolean;
}
interface AlternativeRow {
  originalName: string;
  alternativeName: string;
  alternativePrice: string;
}

const AVAILABILITY_META: Record<OfferAvailability, { label: string; cls: string }> = {
  full: { label: 'Fully available', cls: 'border-emerald-600 text-emerald-700 bg-emerald-50' },
  partial: { label: 'Partially available', cls: 'border-amber-500 text-amber-700 bg-amber-50' },
  none: { label: 'Not available', cls: 'border-rose-500 text-rose-700 bg-rose-50' },
};

/** Sticky prescription viewer with zoom — stays visible beside the offer form. */
function PrescriptionViewer({ prescription, error }: { prescription: Prescription | null; error: boolean }) {
  const [zoom, setZoom] = useState(1);
  const ok = prescription?.imageUrl?.startsWith('http');

  return (
    <div className="border border-neutral-200 bg-white">
      <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-2.5">
        <p className="text-[10px] uppercase tracking-widest text-neutral-400 flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5" /> Prescription
        </p>
        {ok && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Zoom out"
              onClick={() => setZoom((z) => Math.max(1, +(z - 0.5).toFixed(1)))}
              className="p-1.5 text-neutral-500 hover:text-black hover:bg-neutral-100 transition-colors"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-[11px] text-neutral-500 w-10 text-center tabular-nums">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              aria-label="Zoom in"
              onClick={() => setZoom((z) => Math.min(4, +(z + 0.5).toFixed(1)))}
              className="p-1.5 text-neutral-500 hover:text-black hover:bg-neutral-100 transition-colors"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              aria-label="Reset zoom"
              onClick={() => setZoom(1)}
              className="p-1.5 text-neutral-500 hover:text-black hover:bg-neutral-100 transition-colors"
            >
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
      <div className="bg-neutral-50 overflow-auto max-h-[70vh]">
        {ok ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={prescription!.imageUrl}
            alt="Prescription"
            style={{ width: `${zoom * 100}%`, maxWidth: 'none' }}
            className="object-contain"
          />
        ) : (
          <p className="text-[13px] text-neutral-500 p-6">
            {error ? 'The prescription image could not be loaded.' : 'Loading prescription…'}
          </p>
        )}
      </div>
    </div>
  );
}

export default function PharmacyOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { currentOrder, fetchOrder, updateStatus, isLoading } = useOrderStore();
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [prescriptionError, setPrescriptionError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [meds, setMeds] = useState<OfferMedRow[]>([]);
  const [alternatives, setAlternatives] = useState<AlternativeRow[]>([]);
  const [deliveryFee, setDeliveryFee] = useState('0');
  const [estimatedTime, setEstimatedTime] = useState('30 mins');
  const [notes, setNotes] = useState('');
  // null = follow the stock toggles; a value = pharmacist's explicit choice.
  const [availabilityOverride, setAvailabilityOverride] = useState<OfferAvailability | null>(null);

  // Rows coming from the patient's typed list are fixed; rows the pharmacist
  // adds after reading the prescription are editable.
  const requestedCount = currentOrder?.medicines.length ?? 0;

  useEffect(() => {
    if (id) fetchOrder(id);
  }, [id, fetchOrder]);

  useEffect(() => {
    if (currentOrder) {
      setMeds(
        currentOrder.medicines.map((m) => ({
          name: m.name,
          quantity: String(m.quantity || 1),
          price: '',
          inStock: true,
        }))
      );
    }
  }, [currentOrder]);

  // The prescription image is served through the API with per-pharmacy
  // authorization; the returned imageUrl is a short-lived signed URL.
  useEffect(() => {
    const rxId =
      typeof currentOrder?.prescriptionId === 'string'
        ? currentOrder.prescriptionId
        : currentOrder?.prescriptionId?._id;
    if (!rxId) {
      setPrescription(null);
      return;
    }
    let cancelled = false;
    setPrescriptionError(false);
    prescriptionService
      .getById(rxId)
      .then((res) => {
        if (!cancelled) setPrescription(res.data.data);
      })
      .catch(() => {
        if (!cancelled) setPrescriptionError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [currentOrder]);

  const setMed = (i: number, patch: Partial<OfferMedRow>) =>
    setMeds((prev) => prev.map((m, k) => (k === i ? { ...m, ...patch } : m)));

  const derivedAvailability: OfferAvailability = useMemo(() => {
    const filled = meds.filter((m) => m.name.trim());
    if (filled.length === 0) return 'none';
    const inStock = filled.filter((m) => m.inStock).length;
    return inStock === filled.length ? 'full' : inStock === 0 ? 'none' : 'partial';
  }, [meds]);
  const availability = availabilityOverride ?? derivedAvailability;

  const medsSubtotal = useMemo(
    () =>
      meds
        .filter((m) => m.name.trim() && m.inStock)
        .reduce((sum, m) => sum + (parseFloat(m.price) || 0) * (parseInt(m.quantity) || 1), 0),
    [meds]
  );
  const grandTotal = medsSubtotal + (parseFloat(deliveryFee) || 0);

  const handleSubmitOffer = async () => {
    const availableMeds = meds
      .filter((m) => m.name.trim())
      .map((m) => ({
        name: m.name.trim(),
        quantity: parseInt(m.quantity) || 1,
        price: parseFloat(m.price) || 0,
        inStock: m.inStock,
      }));

    if (availableMeds.length === 0) {
      toast.error('Add at least one medicine from the prescription');
      return;
    }

    setSubmitting(true);
    try {
      await orderService.submitOffer(id, {
        availableMeds,
        alternatives: alternatives
          .filter((a) => a.originalName.trim() && a.alternativeName.trim())
          .map((a) => ({
            originalName: a.originalName.trim(),
            alternativeName: a.alternativeName.trim(),
            alternativePrice: parseFloat(a.alternativePrice) || 0,
          })),
        totalPrice: medsSubtotal,
        deliveryFee: parseFloat(deliveryFee) || 0,
        estimatedTime,
        notes: notes.trim() || undefined,
        availability,
      });
      toast.success('Offer submitted');
      fetchOrder(id);
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to submit offer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (status: string) => {
    try {
      await updateStatus(id, status);
      toast.success(`Status updated to ${statusLabel(status as any)}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Update failed');
    }
  };

  if (isLoading || !currentOrder) {
    return <div className="max-w-5xl space-y-4"><CardSkeleton /><CardSkeleton /></div>;
  }

  const patient = currentOrder.patientId as User | undefined;
  const canOffer = ['pending', 'offered'].includes(currentOrder.status);
  const hasRx = currentOrder.prescriptionId != null;
  const nextStatus: Record<string, string> = {
    confirmed: 'preparing',
    preparing: 'out_for_delivery',
    out_for_delivery: 'delivered',
  };

  return (
    <div className="max-w-6xl">
      <p className="text-[11px] uppercase tracking-widest text-neutral-400 mb-1">
        Order #{currentOrder._id.slice(-8)}
      </p>
      <div className="flex items-start justify-between mb-6">
        <h1 className="text-[28px] font-light uppercase tracking-wide">Order Details</h1>
        <Badge variant={statusVariant(currentOrder.status)}>
          {statusLabel(currentOrder.status)}
        </Badge>
      </div>

      {/* ── Split screen: prescription (left, sticky) · order + offer (right) ── */}
      <div className={`grid gap-6 items-start ${hasRx ? 'lg:grid-cols-[1fr_1fr]' : ''}`}>
        {hasRx && (
          <div className="lg:sticky lg:top-20">
            <PrescriptionViewer prescription={prescription} error={prescriptionError} />
          </div>
        )}

        <div className="space-y-5 min-w-0">
          {/* Patient + order summary */}
          <div className="border border-neutral-200 p-5">
            <div className="grid grid-cols-2 gap-5">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-neutral-400 mb-1">Patient</p>
                <p className="text-[14px]">{typeof patient === 'object' ? patient.name : '—'}</p>
                {typeof patient === 'object' && patient.phone && (
                  <p className="text-[12px] text-neutral-500">{patient.phone}</p>
                )}
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-neutral-400 mb-1">Delivery · Date</p>
                <p className="text-[13px] capitalize">{currentOrder.deliveryType}</p>
                <p className="text-[12px] text-neutral-500">{formatDateTime(currentOrder.createdAt)}</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-neutral-100">
              <p className="text-[10px] uppercase tracking-widest text-neutral-400 mb-1">Requested</p>
              {currentOrder.medicines.length > 0 ? (
                <ul className="space-y-0.5">
                  {currentOrder.medicines.map((m, i) => (
                    <li key={i} className="text-[13px]">
                      {m.name} <span className="text-neutral-400">x{m.quantity}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[13px] text-neutral-500">
                  📄 Prescription only — read the image and compose the offer.
                </p>
              )}
              {currentOrder.notes && (
                <p className="text-[12px] text-neutral-500 mt-2">“{currentOrder.notes}”</p>
              )}
            </div>
          </div>

          {/* Inline offer form — the prescription stays visible on the left */}
          {canOffer && (
            <div className="border border-neutral-200 p-5">
              <p className="text-[10px] uppercase tracking-widest text-neutral-400 mb-4 flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5" /> Your Offer
              </p>

              <div className="space-y-3">
                {meds.map((med, i) => (
                  <div key={i} className="flex items-end gap-2">
                    <div className="flex-1 min-w-0">
                      {i < requestedCount ? (
                        <p className="text-[11px] uppercase tracking-widest text-neutral-500 mb-2 truncate">
                          {med.name}
                        </p>
                      ) : (
                        <Input
                          placeholder="Medicine from prescription"
                          value={med.name}
                          onChange={(e) => setMed(i, { name: e.target.value })}
                        />
                      )}
                    </div>
                    <div className="w-16">
                      <Input
                        label={i === 0 ? 'Qty' : undefined}
                        type="number"
                        min="1"
                        value={med.quantity}
                        onChange={(e) => setMed(i, { quantity: e.target.value })}
                      />
                    </div>
                    <div className="w-24">
                      <Input
                        label={i === 0 ? 'Unit price' : undefined}
                        type="number"
                        step="0.01"
                        value={med.price}
                        onChange={(e) => setMed(i, { price: e.target.value })}
                      />
                    </div>
                    <label className="flex items-center gap-1 pb-3 shrink-0">
                      <input
                        type="checkbox"
                        checked={med.inStock}
                        onChange={(e) => setMed(i, { inStock: e.target.checked })}
                        className="w-3.5 h-3.5 accent-black"
                      />
                      <span className="text-[10px] uppercase tracking-widest text-neutral-500">Stock</span>
                    </label>
                    {i >= requestedCount && (
                      <button
                        type="button"
                        onClick={() => setMeds((prev) => prev.filter((_, k) => k !== i))}
                        className="pb-3 text-neutral-400 hover:text-neutral-900 transition-colors"
                        aria-label="Remove medicine"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setMeds((p) => [...p, { name: '', quantity: '1', price: '', inStock: true }])}
                  className="text-[11px] uppercase tracking-widest text-neutral-500 hover:text-neutral-900 transition-colors inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Medicine
                </button>
              </div>

              {/* Alternatives for unavailable items */}
              <div className="mt-5 pt-4 border-t border-neutral-100">
                <p className="text-[10px] uppercase tracking-widest text-neutral-400 mb-3">
                  Alternatives (for unavailable items)
                </p>
                {alternatives.map((alt, i) => (
                  <div key={i} className="flex items-end gap-2 mb-2">
                    <div className="flex-1">
                      <Input
                        placeholder="Unavailable medicine"
                        value={alt.originalName}
                        onChange={(e) =>
                          setAlternatives((p) => p.map((a, k) => (k === i ? { ...a, originalName: e.target.value } : a)))
                        }
                      />
                    </div>
                    <div className="flex-1">
                      <Input
                        placeholder="Suggested alternative"
                        value={alt.alternativeName}
                        onChange={(e) =>
                          setAlternatives((p) => p.map((a, k) => (k === i ? { ...a, alternativeName: e.target.value } : a)))
                        }
                      />
                    </div>
                    <div className="w-24">
                      <Input
                        placeholder="Price"
                        type="number"
                        step="0.01"
                        value={alt.alternativePrice}
                        onChange={(e) =>
                          setAlternatives((p) => p.map((a, k) => (k === i ? { ...a, alternativePrice: e.target.value } : a)))
                        }
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setAlternatives((p) => p.filter((_, k) => k !== i))}
                      className="pb-3 text-neutral-400 hover:text-neutral-900 transition-colors"
                      aria-label="Remove alternative"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setAlternatives((p) => [...p, { originalName: '', alternativeName: '', alternativePrice: '' }])
                  }
                  className="text-[11px] uppercase tracking-widest text-neutral-500 hover:text-neutral-900 transition-colors inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Alternative
                </button>
              </div>

              {/* Availability */}
              <div className="mt-5 pt-4 border-t border-neutral-100">
                <p className="text-[10px] uppercase tracking-widest text-neutral-400 mb-2">Availability</p>
                <div className="flex gap-2 flex-wrap">
                  {(Object.keys(AVAILABILITY_META) as OfferAvailability[]).map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setAvailabilityOverride(key === derivedAvailability ? null : key)}
                      className={`px-3 py-1.5 border text-[11px] uppercase tracking-widest transition-colors ${
                        availability === key
                          ? AVAILABILITY_META[key].cls
                          : 'border-neutral-200 text-neutral-400 hover:text-neutral-700'
                      }`}
                    >
                      {AVAILABILITY_META[key].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fee / ETA / notes */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <Input
                  label="Delivery Fee"
                  type="number"
                  step="0.01"
                  value={deliveryFee}
                  onChange={(e) => setDeliveryFee(e.target.value)}
                />
                <Input
                  label="Estimated Time"
                  value={estimatedTime}
                  onChange={(e) => setEstimatedTime(e.target.value)}
                  placeholder="e.g. 30 mins"
                />
              </div>
              <div className="mt-3">
                <label className="block text-[11px] uppercase tracking-widest text-neutral-500 mb-2">
                  Pharmacist notes <span className="text-neutral-300 normal-case">(optional)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value.slice(0, 500))}
                  rows={2}
                  placeholder="e.g. Alternative has the same active ingredient…"
                  className="w-full border border-neutral-200 p-2.5 text-[13px] focus:outline-none focus:border-black transition-colors resize-none"
                />
              </div>

              {/* Totals + submit */}
              <div className="mt-4 pt-4 border-t border-neutral-100 flex items-center justify-between">
                <div className="text-[12px] text-neutral-500 space-y-0.5">
                  <p>Medicines: <span className="text-neutral-900 font-medium">{medsSubtotal.toFixed(2)} EGP</span></p>
                  <p>
                    Total with delivery:{' '}
                    <span className="text-neutral-900 font-semibold">{grandTotal.toFixed(2)} EGP</span>
                  </p>
                </div>
                <Button onClick={handleSubmitOffer} isLoading={submitting}>
                  <Send className="w-3.5 h-3.5" />
                  Submit Offer
                </Button>
              </div>
            </div>
          )}

          {/* Post-offer lifecycle actions */}
          <div className="flex gap-3 flex-wrap">
            {nextStatus[currentOrder.status] && (
              <Button onClick={() => handleStatusUpdate(nextStatus[currentOrder.status])}>
                <ArrowRight className="w-3.5 h-3.5" />
                Mark as {statusLabel(nextStatus[currentOrder.status] as any)}
              </Button>
            )}
            {currentOrder.acceptedPharmacy && (
              <Link href={`/pharmacy/chat/${currentOrder._id}`}>
                <Button variant="outline">
                  <MessageCircle className="w-3.5 h-3.5" />
                  Chat with Patient
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
