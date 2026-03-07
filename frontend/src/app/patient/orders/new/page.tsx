'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOrderStore } from '@/store/orderStore';
import { prescriptionService } from '@/lib/services/prescriptionService';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import toast from 'react-hot-toast';
import { Plus, Trash2, Upload } from 'lucide-react';

interface MedicineEntry {
  name: string;
  quantity: number;
}

export default function NewOrderPage() {
  const router = useRouter();
  const { createOrder, isLoading } = useOrderStore();
  const [medicines, setMedicines] = useState<MedicineEntry[]>([{ name: '', quantity: 1 }]);
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
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
        location: { lat: 30.0444, lng: 31.2357 }, // Default Cairo — ideally from user profile/geolocation
      });
      toast.success('Order created');
      router.push(`/patient/orders/${order._id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to create order');
    }
  };

  return (
    <div className="max-w-2xl">
      <p className="text-[11px] uppercase tracking-widest text-neutral-400 mb-1">New Order</p>
      <h1 className="text-[28px] font-light uppercase tracking-wide mb-10">Request Medicines</h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Medicines */}
        <div>
          <p className="text-[11px] uppercase tracking-widest mb-4">Medicines</p>
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
                    className="pb-3 text-neutral-300 hover:text-black transition-colors"
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
            className="mt-3 text-[11px] uppercase tracking-widest text-neutral-400 hover:text-black transition-colors inline-flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> Add Medicine
          </button>
        </div>

        {/* Prescription Upload */}
        <div>
          <p className="text-[11px] uppercase tracking-widest mb-4">Prescription (Optional)</p>
          <div className="border border-dashed border-neutral-300 p-6">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setPrescriptionFile(e.target.files?.[0] || null)}
              className="text-[12px] text-neutral-500"
            />
            {prescriptionFile && !prescriptionId && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={handleUploadPrescription}
                isLoading={uploading}
              >
                <Upload className="w-3 h-3" />
                Upload
              </Button>
            )}
            {prescriptionId && (
              <p className="mt-2 text-[11px] text-neutral-500">Uploaded successfully</p>
            )}
          </div>
        </div>

        {/* Delivery Type */}
        <div>
          <p className="text-[11px] uppercase tracking-widest mb-4">Delivery Method</p>
          <div className="flex border border-black">
            <button
              type="button"
              onClick={() => setDeliveryType('delivery')}
              className={`flex-1 py-3 text-[11px] uppercase tracking-widest transition-colors duration-300 ${
                deliveryType === 'delivery' ? 'bg-black text-white' : 'bg-white text-black'
              }`}
            >
              Delivery
            </button>
            <button
              type="button"
              onClick={() => setDeliveryType('pickup')}
              className={`flex-1 py-3 text-[11px] uppercase tracking-widest transition-colors duration-300 border-l border-black ${
                deliveryType === 'pickup' ? 'bg-black text-white' : 'bg-white text-black'
              }`}
            >
              Pickup
            </button>
          </div>
        </div>

        {/* Notes */}
        <Textarea
          label="Notes (Optional)"
          placeholder="Any special instructions..."
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        {/* Submit */}
        <div className="pt-4">
          <Button type="submit" isLoading={isLoading} className="w-full" size="lg">
            Submit Request
          </Button>
        </div>
      </form>
    </div>
  );
}
