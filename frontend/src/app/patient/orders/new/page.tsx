'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { useOrderStore } from '@/store/orderStore';
import { useRequestDraftStore } from '@/store/requestDraftStore';
import { prescriptionService } from '@/lib/services/prescriptionService';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import toast from 'react-hot-toast';
import { Plus, Trash2, Upload, CheckCircle2, Pill, MapPin, Truck, FileImage, StickyNote, LocateFixed, Banknote, Smartphone } from 'lucide-react';
import { EGYPTIAN_GOVERNORATES } from '@/lib/governorates';
import MedicineIcon from '@/components/shared/MedicineIcon';

interface MedicineEntry {
  name: string;
  quantity: number;
}

type OrderType = 'prescription' | 'manual';

export default function NewOrderPage() {
  const router = useRouter();
  const { createOrder, isLoading } = useOrderStore();
  // Two distinct flows: most patients with a prescription don't know the
  // medicine names, so they should never be asked to type them.
  const [orderType, setOrderType] = useState<OrderType>('prescription');
  const [medicines, setMedicines] = useState<MedicineEntry[]>([{ name: '', quantity: 1 }]);
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
  const [governorate, setGovernorate] = useState('Giza');
  const [notes, setNotes] = useState('');
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);
  const [prescriptionId, setPrescriptionId] = useState<string | null>(null);
  // Reorder review: prefilled from a delivered order. If it carried a
  // prescription, the patient must EXPLICITLY choose reuse vs upload.
  const searchParams = useSearchParams();
  const reorderId = searchParams.get('reorder');
  const [reuseRxId, setReuseRxId] = useState<string | null>(null);
  const [rxChoice, setRxChoice] = useState<'reuse' | 'upload' | null>(null);
  const [uploading, setUploading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'instapay' | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // If we arrived here from "Order Basket", pre-fill the medicine rows from the
  // draft (consumed once). The patient can then tweak quantities / remove rows
  // before submitting — no order is created until they hit submit.
  const consumeDraft = useRequestDraftStore((s) => s.consume);
  useEffect(() => {
    const draft = consumeDraft();
    if (draft && draft.length > 0) {
      setMedicines(draft.map((d) => ({ name: d.name, quantity: d.quantity || 1 })));
      setOrderType('manual'); // the basket IS the medicine list
      toast.success('Basket loaded — review and submit your request');
    }
  }, [consumeDraft]);

  useEffect(() => {
    if (!reorderId) return;
    let cancelled = false;
    api.get(`/orders/${reorderId}/reorder-context`).then((res) => {
      if (cancelled) return;
      const ctx = res.data.data;
      setGovernorate(ctx.governorate || 'Giza');
      setDeliveryType(ctx.deliveryType || 'delivery');
      if (ctx.hadPrescription) {
        setOrderType('prescription');
        setReuseRxId(ctx.prescriptionId || null); // patient's own rx, reuse is opt-in
        setRxChoice(null); // force an explicit choice
        setPrescriptionId(null);
      } else if (ctx.medicines?.length) {
        setOrderType('manual');
        setMedicines(ctx.medicines.map((m: any) => ({ name: m.name, quantity: m.quantity || 1 })));
      }
      toast.success('Loaded from your delivered order — review and submit');
    }).catch(() => toast.error('Could not load that order for reorder'));
    return () => { cancelled = true; };
  }, [reorderId]);

  const chooseReuse = () => { setRxChoice('reuse'); setPrescriptionId(reuseRxId); };
  const chooseUpload = () => { setRxChoice('upload'); setPrescriptionId(null); setPrescriptionFile(null); };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    setLocationError(null);
    setLocation(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const result = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setLocation(result);
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLocationError('Location permission denied. Please allow access in your browser settings.');
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setLocationError('Location unavailable. Check your device GPS or network.');
        } else {
          setLocationError('Location request timed out. Please try again.');
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const addMedicine = () => setMedicines([...medicines, { name: '', quantity: 1 }]);

  const removeMedicine = (index: number) => {
    if (medicines.length === 1) return;
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const updateMedicine = (index: number, field: keyof MedicineEntry, value: string | number) => {
    setMedicines(medicines.map((m, i) => (i === index ? { ...m, [field]: value } : m)));
  };

  const handleUploadPrescription = async () => {
    if (!prescriptionFile) return;
    setUploading(true);
    try {
      const res = await prescriptionService.upload(prescriptionFile);
      const id = res.data.data?.prescription?._id || res.data.data?._id;
      setPrescriptionId(id);
      toast.success('Prescription uploaded');
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validMeds = orderType === 'manual' ? medicines.filter((m) => m.name.trim()) : [];
    if (orderType === 'prescription' && !prescriptionId) {
      if (reuseRxId && rxChoice === null) {
        toast.error('Choose to reuse your previous prescription or upload a new one');
      } else {
        toast.error(prescriptionFile ? 'Press "Upload Prescription" and wait for it to finish' : 'Upload your prescription first');
      }
      return;
    }
    if (orderType === 'manual' && validMeds.length === 0) {
      toast.error('Add at least one medicine');
      return;
    }

    if (!paymentMethod) {
      toast.error('Please select a payment method');
      document.getElementById('payment-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    try {
      const order = await createOrder({
        medicines: validMeds,
        deliveryType,
        paymentMethod,
        notes: notes || undefined,
        // Only a prescription order carries the prescription.
        prescriptionId: orderType === 'prescription' ? prescriptionId || undefined : undefined,
        governorate,
        patientLocation: location || undefined,
      });
      toast.success('Order created');
      router.push(`/patient/orders/${order._id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to create order');
    }
  };

  return (
    <div className="max-w-2xl w-full">
      {/* Header */}
      <div className="mb-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-600 mb-1">Patient</p>
        <h1 className="text-2xl font-black text-neutral-900">Request Medicines</h1>
        <p className="text-[13px] text-neutral-500 mt-1">Fill in the details and pharmacies will send you offers.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        {/* Order type — exactly one flow is shown at a time */}
        <div className="bg-white rounded-[18px] border border-neutral-100 shadow-sm p-4 sm:p-6">
          <p className="text-[13px] font-semibold text-neutral-800 mb-3">How would you like to order?</p>
          <div role="radiogroup" aria-label="Order type" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {([
              { key: 'prescription', icon: FileImage, title: 'Order using a Prescription', desc: 'Upload a photo — the pharmacist reads it and builds your offer.' },
              { key: 'manual', icon: Pill, title: 'Order by entering Medicines', desc: 'You already know the names — type them yourself.' },
            ] as const).map((opt) => (
              <button
                key={opt.key}
                type="button"
                role="radio"
                aria-checked={orderType === opt.key}
                onClick={() => setOrderType(opt.key)}
                className={`relative flex items-start gap-3 p-4 rounded-[14px] border-2 text-left transition-all duration-200 ${
                  orderType === opt.key
                    ? 'border-blue-500 bg-blue-50/50 shadow-sm'
                    : 'border-neutral-200 bg-neutral-50 hover:border-neutral-300'
                }`}
              >
                <span className={`mt-0.5 w-4 h-4 shrink-0 rounded-full border-2 flex items-center justify-center ${
                  orderType === opt.key ? 'border-blue-600' : 'border-neutral-300'
                }`}>
                  {orderType === opt.key && <span className="w-2 h-2 rounded-full bg-blue-600" />}
                </span>
                <span>
                  <span className={`flex items-center gap-1.5 text-[13px] font-bold ${orderType === opt.key ? 'text-blue-700' : 'text-neutral-700'}`}>
                    <opt.icon className="w-3.5 h-3.5" /> {opt.title}
                  </span>
                  <span className="block text-[11px] text-neutral-400 mt-1 leading-snug">{opt.desc}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Medicines — manual flow only */}
        {orderType === 'manual' && (
        <div className="bg-white rounded-[18px] border border-neutral-100 shadow-sm p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-sky-500 rounded-[10px] shadow-sm flex items-center justify-center">
              <Pill className="w-4 h-4 text-white" />
            </div>
            <p className="text-[13px] font-semibold text-neutral-800">Medicines</p>
          </div>
          <div className="space-y-3">
            {medicines.map((med, i) => (
              <div key={i} className="flex gap-3 items-end">
                {/* Live medicine icon */}
                <div className={i === 0 ? 'mb-[2px]' : 'mb-[2px]'}>
                  <MedicineIcon name={med.name || 'medicine'} size="sm" />
                </div>
                <div className="flex-1">
                  <Input
                    label={i === 0 ? 'Medicine Name' : undefined}
                    placeholder="e.g. Paracetamol 500mg"
                    value={med.name}
                    onChange={(e) => updateMedicine(i, 'name', e.target.value)}
                  />
                </div>
                <div className="w-20">
                  <Input
                    label={i === 0 ? 'Qty' : undefined}
                    type="number"
                    min={1}
                    value={med.quantity}
                    onChange={(e) => updateMedicine(i, 'quantity', parseInt(e.target.value) || 1)}
                  />
                </div>
                {medicines.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMedicine(i)}
                    className="pb-3 text-neutral-500 hover:text-neutral-900 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addMedicine}
            className="mt-4 text-[12px] text-blue-600 hover:text-blue-700 transition-colors inline-flex items-center gap-1.5 font-bold"
          >
            <Plus className="w-3.5 h-3.5" /> Add Medicine
          </button>
        </div>
        )}

        {/* Prescription Upload — prescription flow only */}
        {orderType === 'prescription' && (
        <div className="bg-white rounded-[18px] border border-neutral-100 shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-sky-500 rounded-[10px] shadow-sm flex items-center justify-center">
                <FileImage className="w-4 h-4 text-white" />
              </div>
              <p className="text-[13px] font-semibold text-neutral-800">Prescription</p>
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">Required</span>
          </div>
          <p className="text-[11px] text-neutral-400 -mt-2 mb-4">
            No need to type medicine names — the pharmacist reads your prescription and sends an offer.
          </p>
          {reuseRxId && (
            <div className="mb-4">
              <p className="text-[11px] text-neutral-500 mb-2">This is a reorder — we never assume your old prescription is still valid. Please choose:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button type="button" onClick={chooseReuse}
                  className={`p-3 rounded-[12px] border-2 text-left text-[12px] font-semibold transition-colors ${rxChoice === 'reuse' ? 'border-blue-500 bg-blue-50/50 text-blue-700' : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'}`}>
                  ♻️ Reuse previous prescription
                </button>
                <button type="button" onClick={chooseUpload}
                  className={`p-3 rounded-[12px] border-2 text-left text-[12px] font-semibold transition-colors ${rxChoice === 'upload' ? 'border-blue-500 bg-blue-50/50 text-blue-700' : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'}`}>
                  ⬆️ Upload a new prescription
                </button>
              </div>
              {rxChoice === 'reuse' && (
                <div className="flex items-center gap-2 text-emerald-700 mt-3 text-[12px] font-medium">
                  <CheckCircle2 className="w-4 h-4" /> Reusing your previous prescription
                </div>
              )}
            </div>
          )}
          {reuseRxId && rxChoice !== 'upload' ? null : (<>
          {prescriptionId ? (
            <div className="flex items-center gap-2 text-neutral-900">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-[13px] font-medium">Prescription uploaded — pharmacies will review it with your order</span>
            </div>
          ) : (
            <div className="border-2 border-dashed border-neutral-200 rounded-none p-5 text-center hover:border-neutral-200 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPrescriptionFile(e.target.files?.[0] || null)}
                className="text-[12px] text-neutral-500 w-full"
              />
              {prescriptionFile && (
                <Button
                  type="button"
                  variant="indigo"
                  size="sm"
                  className="mt-3"
                  onClick={handleUploadPrescription}
                  isLoading={uploading}
                >
                  <Upload className="w-3.5 h-3.5" />
                  Upload Prescription
                </Button>
              )}
            </div>
          )}
          </>)}
        </div>
        )}

        {/* Governorate */}
        <div className="bg-white rounded-[18px] border border-neutral-100 shadow-sm p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-sky-500 rounded-[10px] shadow-sm flex items-center justify-center">
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <p className="text-[13px] font-semibold text-neutral-800">Governorate</p>
          </div>
          <select
            value={governorate}
            onChange={(e) => setGovernorate(e.target.value)}
            className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-[12px] text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-300 transition-all"
          >
            {EGYPTIAN_GOVERNORATES.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
          <p className="text-[11px] text-neutral-400 mt-2">All pharmacies in this governorate will see your order</p>

          {/* Current location */}
          <div className="mt-4 pt-4 border-t border-neutral-100">

            {/* Button */}
            {!location && (
              <button
                type="button"
                onClick={handleGetLocation}
                disabled={locating}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-none border border-neutral-200 bg-neutral-100 text-neutral-900 text-[12px] font-semibold hover:bg-neutral-100 active:scale-[0.98] disabled:opacity-60 transition-all duration-200"
              >
                <LocateFixed className={`w-3.5 h-3.5 ${locating ? 'animate-spin' : ''}`} />
                {locating ? 'Detecting location...' : 'Use Current Location'}
              </button>
            )}

            {/* Loading state */}
            {locating && (
              <p className="text-[11px] text-neutral-900 mt-2">
                Requesting location permission from your browser...
              </p>
            )}

            {/* Error state */}
            {locationError && (
              <div className="mt-2 flex items-start gap-2 bg-neutral-100 border border-neutral-200 rounded-none px-3 py-2.5">
                <MapPin className="w-3.5 h-3.5 text-neutral-500 shrink-0 mt-0.5" />
                <p className="text-[12px] text-neutral-900">{locationError}</p>
              </div>
            )}

            {/* Success — structured location object */}
            {location && (
              <div className="bg-neutral-100 border border-neutral-200 rounded-none px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-neutral-900">
                    <LocateFixed className="w-3.5 h-3.5" />
                    <span className="text-[12px] font-semibold">Location Detected</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setLocation(null); setLocationError(null); }}
                    className="text-[11px] text-neutral-400 hover:text-neutral-900 transition-colors"
                  >
                    Remove
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white rounded-none px-3 py-2">
                    <p className="text-[10px] uppercase tracking-widest text-neutral-400 mb-0.5">Latitude</p>
                    <p className="text-[13px] font-mono font-semibold text-neutral-800">{location.lat.toFixed(6)}</p>
                  </div>
                  <div className="bg-white rounded-none px-3 py-2">
                    <p className="text-[10px] uppercase tracking-widest text-neutral-400 mb-0.5">Longitude</p>
                    <p className="text-[13px] font-mono font-semibold text-neutral-800">{location.lng.toFixed(6)}</p>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Delivery Type */}
        <div className="bg-white rounded-[18px] border border-neutral-100 shadow-sm p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-sky-500 rounded-[10px] shadow-sm flex items-center justify-center">
              <Truck className="w-4 h-4 text-white" />
            </div>
            <p className="text-[13px] font-semibold text-neutral-800">Delivery Method</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {(['delivery', 'pickup'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setDeliveryType(type)}
                className={`py-3 rounded-[12px] text-[12px] font-semibold uppercase tracking-wide transition-all duration-200 ${
                  deliveryType === type
                    ? 'bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-md shadow-blue-500/30'
                    : 'bg-neutral-50 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 border border-neutral-200'
                }`}
              >
                {type === 'delivery' ? '🚚 Delivery' : '🏪 Pickup'}
              </button>
            ))}
          </div>
        </div>

        {/* Payment Method */}
        <div id="payment-section" className={`bg-white  rounded-none border p-6 transition-colors duration-200 ${paymentMethod === null ? 'border-neutral-200 ' : 'border-neutral-200 '}`}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-none flex items-center justify-center transition-colors duration-200 ${paymentMethod ? 'bg-neutral-100' : 'bg-neutral-100'}`}>
                <Banknote className={`w-4 h-4 transition-colors duration-200 ${paymentMethod ? 'text-neutral-900' : 'text-neutral-400 '}`} />
              </div>
              <p className="text-[13px] font-semibold text-neutral-800">Payment Method</p>
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">Required</span>
          </div>
          <p className="text-[11px] text-neutral-400 mb-4 ml-10">Choose how you'll pay the pharmacy</p>

          <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-3">
            {/* Cash */}
            <button
              type="button"
              onClick={() => setPaymentMethod('cash')}
              className={`relative group flex flex-col items-start gap-3 p-4 rounded-none border-2 transition-all duration-200 text-left ${
                paymentMethod === 'cash'
                  ? 'border-neutral-200 bg-neutral-100  '
                  : 'border-neutral-200 bg-neutral-50 hover:border-neutral-200 hover:bg-neutral-100/40'
              }`}
            >
              {/* Selected check */}
              <div className={`absolute top-3 right-3 w-5 h-5 rounded-none border-2 flex items-center justify-center transition-all duration-200 ${
                paymentMethod === 'cash'
                  ? 'bg-gradient-to-br from-blue-600 to-sky-500 border-transparent'
                  : 'border-neutral-300 bg-white group-hover:border-blue-300'
              }`}>
                {paymentMethod === 'cash' && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>

              <div className={`w-10 h-10 rounded-none flex items-center justify-center transition-colors duration-200 ${
                paymentMethod === 'cash' ? 'bg-gradient-to-br from-blue-600 to-sky-500' : 'bg-neutral-200 group-hover:bg-neutral-100'
              }`}>
                <Banknote className={`w-5 h-5 transition-colors duration-200 ${paymentMethod === 'cash' ? 'text-white' : 'text-neutral-500  group-hover:text-neutral-900'}`} />
              </div>

              <div>
                <p className={`text-[13px] font-bold transition-colors duration-200 ${paymentMethod === 'cash' ? 'text-neutral-900' : 'text-neutral-700'}`}>Cash</p>
                <p className="text-[11px] text-neutral-400 mt-0.5 leading-snug">Pay in cash when you receive your order</p>
              </div>
            </button>

            {/* InstaPay */}
            <button
              type="button"
              onClick={() => setPaymentMethod('instapay')}
              className={`relative group flex flex-col items-start gap-3 p-4 rounded-none border-2 transition-all duration-200 text-left ${
                paymentMethod === 'instapay'
                  ? 'border-neutral-200 bg-neutral-100  '
                  : 'border-neutral-200 bg-neutral-50 hover:border-neutral-200 hover:bg-neutral-100/40'
              }`}
            >
              {/* Selected check */}
              <div className={`absolute top-3 right-3 w-5 h-5 rounded-none border-2 flex items-center justify-center transition-all duration-200 ${
                paymentMethod === 'instapay'
                  ? 'bg-gradient-to-br from-blue-600 to-sky-500 border-transparent'
                  : 'border-neutral-300 bg-white group-hover:border-blue-300'
              }`}>
                {paymentMethod === 'instapay' && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>

              <div className={`w-10 h-10 rounded-none flex items-center justify-center transition-colors duration-200 ${
                paymentMethod === 'instapay' ? 'bg-gradient-to-br from-blue-600 to-sky-500' : 'bg-neutral-200 group-hover:bg-neutral-100'
              }`}>
                <Smartphone className={`w-5 h-5 transition-colors duration-200 ${paymentMethod === 'instapay' ? 'text-white' : 'text-neutral-500  group-hover:text-neutral-900'}`} />
              </div>

              <div>
                <p className={`text-[13px] font-bold transition-colors duration-200 ${paymentMethod === 'instapay' ? 'text-neutral-900' : 'text-neutral-700'}`}>InstaPay</p>
                <p className="text-[11px] text-neutral-400 mt-0.5 leading-snug">Pay instantly via your mobile wallet</p>
              </div>
            </button>
          </div>

          {/* InstaPay note */}
          {paymentMethod === 'instapay' && (
            <div className="mt-4 flex items-start gap-2 bg-neutral-100 border border-neutral-200 rounded-none px-3 py-2.5 animate-fade-in-up">
              <Smartphone className="w-3.5 h-3.5 text-neutral-900 shrink-0 mt-0.5" />
              <p className="text-[11px] text-neutral-900">Payment instructions will be sent after you confirm a pharmacy offer.</p>
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="bg-white rounded-[18px] border border-neutral-100 shadow-sm p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-sky-500 rounded-[10px] shadow-sm flex items-center justify-center">
              <StickyNote className="w-4 h-4 text-white" />
            </div>
            <p className="text-[13px] font-semibold text-neutral-800">Notes <span className="text-neutral-400 font-normal">(Optional)</span></p>
          </div>
          <Textarea
            placeholder="Any special instructions for the pharmacy..."
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Submit */}
        {!paymentMethod && (
          <p className="text-center text-[11px] text-neutral-900 font-medium flex items-center justify-center gap-1.5 animate-fade-in-up">
            <Banknote className="w-3.5 h-3.5" />
            Select a payment method above to continue
          </p>
        )}
        <Button
          type="submit"
          variant="indigo"
          isLoading={isLoading}
          disabled={!paymentMethod}
          className="w-full disabled:opacity-50 disabled:cursor-not-allowed"
          size="lg"
        >
          {orderType === 'prescription' ? 'Send Prescription to Pharmacies' : 'Submit Medicine Request'}
        </Button>
      </form>
    </div>
  );
}
