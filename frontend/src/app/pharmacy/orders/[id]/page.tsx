'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useOrderStore } from '@/store/orderStore';
import { orderService } from '@/lib/services/orderService';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { statusLabel, statusVariant, formatDateTime } from '@/lib/helpers';
import { User, SubmitOfferData } from '@/types';
import toast from 'react-hot-toast';
import { MessageCircle, Send, ArrowRight } from 'lucide-react';

export default function PharmacyOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { currentOrder, fetchOrder, updateStatus, isLoading } = useOrderStore();
  const [offerModal, setOfferModal] = useState(false);
  const [offerData, setOfferData] = useState<{
    meds: { name: string; price: string; inStock: boolean }[];
    deliveryFee: string;
    estimatedTime: string;
  }>({ meds: [], deliveryFee: '0', estimatedTime: '30 mins' });

  useEffect(() => {
    if (id) fetchOrder(id);
  }, [id, fetchOrder]);

  useEffect(() => {
    if (currentOrder) {
      setOfferData((prev) => ({
        ...prev,
        meds: currentOrder.medicines.map((m) => ({
          name: m.name,
          price: '',
          inStock: true,
        })),
      }));
    }
  }, [currentOrder]);

  const handleSubmitOffer = async () => {
    const availableMeds = offerData.meds.map((m) => ({
      name: m.name,
      price: parseFloat(m.price) || 0,
      inStock: m.inStock,
    }));
    const totalPrice = availableMeds.reduce((sum, m) => sum + (m.inStock ? m.price : 0), 0);

    try {
      await orderService.submitOffer(id, {
        availableMeds,
        totalPrice,
        deliveryFee: parseFloat(offerData.deliveryFee) || 0,
        estimatedTime: offerData.estimatedTime,
      });
      setOfferModal(false);
      toast.success('Offer submitted');
      fetchOrder(id);
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to submit offer');
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
    return <div className="max-w-3xl space-y-4"><CardSkeleton /><CardSkeleton /></div>;
  }

  const patient = currentOrder.patientId as User | undefined;
  const nextStatus: Record<string, string> = {
    confirmed: 'preparing',
    preparing: 'out_for_delivery',
    out_for_delivery: 'delivered',
  };

  return (
    <div className="max-w-3xl">
      <p className="text-[11px] uppercase tracking-widest text-neutral-400 mb-1">
        Order #{currentOrder._id.slice(-8)}
      </p>
      <div className="flex items-start justify-between mb-8">
        <h1 className="text-[28px] font-light uppercase tracking-wide">Order Details</h1>
        <Badge variant={statusVariant(currentOrder.status)}>
          {statusLabel(currentOrder.status)}
        </Badge>
      </div>

      {/* Patient Info */}
      {patient && typeof patient === 'object' && (
        <div className="border border-neutral-200 p-6 mb-6">
          <p className="text-[10px] uppercase tracking-widest text-neutral-400 mb-2">Patient</p>
          <p className="text-[14px]">{patient.name}</p>
          {patient.phone && <p className="text-[12px] text-neutral-500">{patient.phone}</p>}
        </div>
      )}

      {/* Order Info */}
      <div className="border border-neutral-200 p-6 mb-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-neutral-400 mb-1">Medicines</p>
            <ul className="space-y-1">
              {currentOrder.medicines.map((m, i) => (
                <li key={i} className="text-[14px]">
                  {m.name} <span className="text-neutral-400">x{m.quantity}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-neutral-400 mb-1">Delivery</p>
              <p className="text-[14px] capitalize">{currentOrder.deliveryType}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-neutral-400 mb-1">Date</p>
              <p className="text-[14px]">{formatDateTime(currentOrder.createdAt)}</p>
            </div>
          </div>
        </div>
        {currentOrder.notes && (
          <div className="mt-4 pt-4 border-t border-neutral-100">
            <p className="text-[10px] uppercase tracking-widest text-neutral-400 mb-1">Notes</p>
            <p className="text-[13px] text-neutral-600">{currentOrder.notes}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 flex-wrap">
        {['pending', 'offered'].includes(currentOrder.status) && (
          <Button onClick={() => setOfferModal(true)}>
            <Send className="w-3.5 h-3.5" />
            Submit Offer
          </Button>
        )}

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

      {/* Offer Modal */}
      <Modal isOpen={offerModal} onClose={() => setOfferModal(false)} title="Submit Offer">
        <div className="space-y-4">
          {offerData.meds.map((med, i) => (
            <div key={i} className="flex items-end gap-3">
              <div className="flex-1">
                <p className="text-[11px] uppercase tracking-widest text-neutral-500 mb-1">{med.name}</p>
              </div>
              <div className="w-24">
                <Input
                  label="Price"
                  type="number"
                  step="0.01"
                  value={med.price}
                  onChange={(e) => {
                    const meds = [...offerData.meds];
                    meds[i].price = e.target.value;
                    setOfferData({ ...offerData, meds });
                  }}
                />
              </div>
              <label className="flex items-center gap-1 pb-3">
                <input
                  type="checkbox"
                  checked={med.inStock}
                  onChange={(e) => {
                    const meds = [...offerData.meds];
                    meds[i].inStock = e.target.checked;
                    setOfferData({ ...offerData, meds });
                  }}
                  className="w-3.5 h-3.5 accent-black"
                />
                <span className="text-[10px] uppercase tracking-widest text-neutral-500">In Stock</span>
              </label>
            </div>
          ))}
          <Input
            label="Delivery Fee"
            type="number"
            step="0.01"
            value={offerData.deliveryFee}
            onChange={(e) => setOfferData({ ...offerData, deliveryFee: e.target.value })}
          />
          <Input
            label="Estimated Time"
            value={offerData.estimatedTime}
            onChange={(e) => setOfferData({ ...offerData, estimatedTime: e.target.value })}
            placeholder="e.g. 30 mins"
          />
          <div className="pt-2">
            <Button onClick={handleSubmitOffer} className="w-full">
              Submit Offer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
