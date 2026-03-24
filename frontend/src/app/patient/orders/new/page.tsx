'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOrderStore } from '@/store/orderStore';
import { prescriptionService } from '@/lib/services/prescriptionService';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import toast from 'react-hot-toast';
import { Plus, Trash2, Upload, CheckCircle2, Pill, MapPin, Truck, FileImage, StickyNote } from 'lucide-react';
import { EGYPTIAN_GOVERNORATES } from '@/lib/governorates';

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

    try {
      const order = await createOrder({
        medicines: validMeds,
        deliveryType,
        notes: notes || undefined,
        prescriptionId: prescriptionId || undefined,
        governorate,
      });
      toast.success('Order created');
      router.push(`/patient/orders/${order._id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to create order');
    }
  };

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <p className="text-[11px] uppercase tracking-widest text-neutral-400 mb-1">Patient</p>
        <h1 className="text-2xl font-semibold text-neutral-800">Request Medicines</h1>
        <p className="text-[13px] text-neutral-500 mt-1">Fill in the details and pharmacies will send you offers.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Medicines */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Pill className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-[13px] font-semibold text-neutral-800">Medicines</p>
          </div>
          <div className="space-y-3">
            {medicines.map((med, i) => (
              <div key={i} className="flex gap-3 items-end">
                <div className="flex-1">
                  <Input
                    label={i === 0 ? 'Medicine Name' : undefined}
                    placeholder="e.g. Paracetamol 500mg"
                    value={med.name}
                    onChange={(e) => updateMedicine(i, 'name', e.target.value)}
                  />
                </div>
                <div className="w-24">
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
            className="mt-4 text-[12px] text-indigo-600 hover:text-indigo-800 transition-colors inline-flex items-center gap-1.5 font-medium"
          >
            <Plus className="w-3.5 h-3.5" /> Add Medicine
          </button>
        </div>

        {/* Prescription Upload */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <FileImage className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-[13px] font-semibold text-neutral-800">Prescription <span className="text-neutral-400 font-normal">(Optional)</span></p>
          </div>
          {prescriptionId ? (
            <div className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-[13px] font-medium">Prescription uploaded successfully</span>
            </div>
          ) : (
            <div className="border-2 border-dashed border-neutral-200 rounded-xl p-5 text-center hover:border-indigo-300 transition-colors">
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
        <div className="bg-white rounded-2xl border border-neutral-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <MapPin className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-[13px] font-semibold text-neutral-800">Governorate</p>
          </div>
          <select
            value={governorate}
            onChange={(e) => setGovernorate(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-neutral-200 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all"
          >
            {EGYPTIAN_GOVERNORATES.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
          <p className="text-[11px] text-neutral-400 mt-2">All pharmacies in this governorate will see your order</p>
        </div>

        {/* Delivery Type */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-cyan-100 rounded-lg flex items-center justify-center">
              <Truck className="w-4 h-4 text-cyan-600" />
            </div>
            <p className="text-[13px] font-semibold text-neutral-800">Delivery Method</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(['delivery', 'pickup'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setDeliveryType(type)}
                className={`py-3 rounded-xl text-[12px] font-medium uppercase tracking-wide transition-all duration-200 ${
                  deliveryType === type
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                    : 'bg-slate-50 text-neutral-500 hover:bg-indigo-50 hover:text-indigo-600 border border-neutral-200'
                }`}
              >
                {type === 'delivery' ? '🚚 Delivery' : '🏪 Pickup'}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-6">
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
        <Button type="submit" variant="indigo" isLoading={isLoading} className="w-full rounded-xl" size="lg">
          Submit Medicine Request
        </Button>
      </form>
    </div>
  );
}
