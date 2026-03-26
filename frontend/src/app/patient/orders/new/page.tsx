'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOrderStore } from '@/store/orderStore';
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

export default function NewOrderPage() {
  const router = useRouter();
  const { createOrder, isLoading } = useOrderStore();
  const [medicines, setMedicines] = useState<MedicineEntry[]>([{ name: '', quantity: 1 }]);
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
  const [governorate, setGovernorate] = useState('Giza');
  const [notes, setNotes] = useState('');
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);
  const [prescriptionId, setPrescriptionId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'instapay' | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

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

    const validMeds = medicines.filter((m) => m.name.trim());
    if (validMeds.length === 0) {
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
        prescriptionId: prescriptionId || undefined,
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
        <p className="text-[11px] uppercase tracking-widest text-neutral-400 mb-1">Patient</p>
        <h1 className="text-2xl font-semibold text-neutral-800">Request Medicines</h1>
        <p className="text-[13px] text-neutral-500 mt-1">Fill in the details and pharmacies will send you offers.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        {/* Medicines */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-sky-100 rounded-lg flex items-center justify-center">
              <Pill className="w-4 h-4 text-sky-600" />
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
                    className="pb-3 text-red-300 hover:text-red-500 transition-colors"
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
            className="mt-4 text-[12px] text-sky-600 hover:text-sky-800 transition-colors inline-flex items-center gap-1.5 font-medium"
          >
            <Plus className="w-3.5 h-3.5" /> Add Medicine
          </button>
        </div>

        {/* Prescription Upload */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
              <FileImage className="w-4 h-4 text-teal-600" />
            </div>
            <p className="text-[13px] font-semibold text-neutral-800">Prescription <span className="text-neutral-400 font-normal">(Optional)</span></p>
          </div>
          {prescriptionId ? (
            <div className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-[13px] font-medium">Prescription uploaded successfully</span>
            </div>
          ) : (
            <div className="border-2 border-dashed border-neutral-200 rounded-xl p-5 text-center hover:border-sky-300 transition-colors">
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
        </div>

        {/* Governorate */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <MapPin className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-[13px] font-semibold text-neutral-800">Governorate</p>
          </div>
          <select
            value={governorate}
            onChange={(e) => setGovernorate(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-neutral-200 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-sky-400 transition-all"
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
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 text-[12px] font-semibold hover:bg-blue-100 active:scale-[0.98] disabled:opacity-60 transition-all duration-200"
              >
                <LocateFixed className={`w-3.5 h-3.5 ${locating ? 'animate-spin' : ''}`} />
                {locating ? 'Detecting location...' : 'Use Current Location'}
              </button>
            )}

            {/* Loading state */}
            {locating && (
              <p className="text-[11px] text-blue-500 mt-2">
                Requesting location permission from your browser...
              </p>
            )}

            {/* Error state */}
            {locationError && (
              <div className="mt-2 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                <p className="text-[12px] text-red-600">{locationError}</p>
              </div>
            )}

            {/* Success — structured location object */}
            {location && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-emerald-700">
                    <LocateFixed className="w-3.5 h-3.5" />
                    <span className="text-[12px] font-semibold">Location Detected</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setLocation(null); setLocationError(null); }}
                    className="text-[11px] text-neutral-400 hover:text-red-500 transition-colors"
                  >
                    Remove
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white rounded-lg px-3 py-2">
                    <p className="text-[10px] uppercase tracking-widest text-neutral-400 mb-0.5">Latitude</p>
                    <p className="text-[13px] font-mono font-semibold text-neutral-800">{location.lat.toFixed(6)}</p>
                  </div>
                  <div className="bg-white rounded-lg px-3 py-2">
                    <p className="text-[10px] uppercase tracking-widest text-neutral-400 mb-0.5">Longitude</p>
                    <p className="text-[13px] font-mono font-semibold text-neutral-800">{location.lng.toFixed(6)}</p>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Delivery Type */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-cyan-100 rounded-lg flex items-center justify-center">
              <Truck className="w-4 h-4 text-cyan-600" />
            </div>
            <p className="text-[13px] font-semibold text-neutral-800">Delivery Method</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {(['delivery', 'pickup'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setDeliveryType(type)}
                className={`py-3 rounded-xl text-[12px] font-medium uppercase tracking-wide transition-all duration-200 ${
                  deliveryType === type
                    ? 'bg-sky-600 text-white shadow-sm shadow-sky-200'
                    : 'bg-slate-50 text-neutral-500 hover:bg-sky-50 hover:text-sky-600 border border-neutral-200'
                }`}
              >
                {type === 'delivery' ? '🚚 Delivery' : '🏪 Pickup'}
              </button>
            ))}
          </div>
        </div>

        {/* Payment Method */}
        <div id="payment-section" className={`bg-white rounded-2xl border p-6 transition-colors duration-200 ${paymentMethod === null ? 'border-neutral-200' : 'border-emerald-200'}`}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-200 ${paymentMethod ? 'bg-emerald-100' : 'bg-neutral-100'}`}>
                <Banknote className={`w-4 h-4 transition-colors duration-200 ${paymentMethod ? 'text-emerald-600' : 'text-neutral-400'}`} />
              </div>
              <p className="text-[13px] font-semibold text-neutral-800">Payment Method</p>
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-red-400">Required</span>
          </div>
          <p className="text-[11px] text-neutral-400 mb-4 ml-10">Choose how you'll pay the pharmacy</p>

          <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-3">
            {/* Cash */}
            <button
              type="button"
              onClick={() => setPaymentMethod('cash')}
              className={`relative group flex flex-col items-start gap-3 p-4 rounded-2xl border-2 transition-all duration-200 text-left ${
                paymentMethod === 'cash'
                  ? 'border-emerald-500 bg-emerald-50 shadow-md shadow-emerald-100'
                  : 'border-neutral-200 bg-slate-50 hover:border-emerald-300 hover:bg-emerald-50/40'
              }`}
            >
              {/* Selected check */}
              <div className={`absolute top-3 right-3 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                paymentMethod === 'cash'
                  ? 'bg-emerald-500 border-emerald-500'
                  : 'border-neutral-300 bg-white group-hover:border-emerald-300'
              }`}>
                {paymentMethod === 'cash' && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>

              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-200 ${
                paymentMethod === 'cash' ? 'bg-emerald-500' : 'bg-neutral-200 group-hover:bg-emerald-100'
              }`}>
                <Banknote className={`w-5 h-5 transition-colors duration-200 ${paymentMethod === 'cash' ? 'text-white' : 'text-neutral-500 group-hover:text-emerald-600'}`} />
              </div>

              <div>
                <p className={`text-[13px] font-bold transition-colors duration-200 ${paymentMethod === 'cash' ? 'text-emerald-700' : 'text-neutral-700'}`}>Cash</p>
                <p className="text-[11px] text-neutral-400 mt-0.5 leading-snug">Pay in cash when you receive your order</p>
              </div>
            </button>

            {/* InstaPay */}
            <button
              type="button"
              onClick={() => setPaymentMethod('instapay')}
              className={`relative group flex flex-col items-start gap-3 p-4 rounded-2xl border-2 transition-all duration-200 text-left ${
                paymentMethod === 'instapay'
                  ? 'border-emerald-500 bg-emerald-50 shadow-md shadow-emerald-100'
                  : 'border-neutral-200 bg-slate-50 hover:border-emerald-300 hover:bg-emerald-50/40'
              }`}
            >
              {/* Selected check */}
              <div className={`absolute top-3 right-3 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                paymentMethod === 'instapay'
                  ? 'bg-emerald-500 border-emerald-500'
                  : 'border-neutral-300 bg-white group-hover:border-emerald-300'
              }`}>
                {paymentMethod === 'instapay' && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>

              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-200 ${
                paymentMethod === 'instapay' ? 'bg-emerald-500' : 'bg-neutral-200 group-hover:bg-emerald-100'
              }`}>
                <Smartphone className={`w-5 h-5 transition-colors duration-200 ${paymentMethod === 'instapay' ? 'text-white' : 'text-neutral-500 group-hover:text-emerald-600'}`} />
              </div>

              <div>
                <p className={`text-[13px] font-bold transition-colors duration-200 ${paymentMethod === 'instapay' ? 'text-emerald-700' : 'text-neutral-700'}`}>InstaPay</p>
                <p className="text-[11px] text-neutral-400 mt-0.5 leading-snug">Pay instantly via your mobile wallet</p>
              </div>
            </button>
          </div>

          {/* InstaPay note */}
          {paymentMethod === 'instapay' && (
            <div className="mt-4 flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2.5 animate-fade-in-up">
              <Smartphone className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-blue-600">Payment instructions will be sent after you confirm a pharmacy offer.</p>
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
              <StickyNote className="w-4 h-4 text-amber-600" />
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
          <p className="text-center text-[11px] text-amber-500 font-medium flex items-center justify-center gap-1.5 animate-fade-in-up">
            <Banknote className="w-3.5 h-3.5" />
            Select a payment method above to continue
          </p>
        )}
        <Button
          type="submit"
          variant="indigo"
          isLoading={isLoading}
          disabled={!paymentMethod}
          className="w-full rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
          size="lg"
        >
          Submit Medicine Request
        </Button>
      </form>
    </div>
  );
}
