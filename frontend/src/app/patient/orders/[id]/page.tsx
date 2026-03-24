'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useOrderStore } from '@/store/orderStore';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Textarea from '@/components/ui/Textarea';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { statusLabel, statusVariant, formatDateTime } from '@/lib/helpers';
import { OrderResponse, Pharmacy } from '@/types';
import toast from 'react-hot-toast';
import { MessageCircle, X, Check, Star, Pill, Truck, Calendar, StickyNote, Building2, Tag } from 'lucide-react';

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { currentOrder, fetchOrder, fetchResponses, responses, acceptOffer, cancelOrder, isLoading } = useOrderStore();
  const [cancelModal, setCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    if (id) {
      fetchOrder(id);
      fetchResponses(id);
    }
  }, [id, fetchOrder, fetchResponses]);

  const handleCancel = async () => {
    try {
      await cancelOrder(id, cancelReason);
      setCancelModal(false);
      toast.success('Order cancelled');
    } catch {
      toast.error('Failed to cancel');
    }
  };

  const handleAcceptOffer = async (responseId: string) => {
    try {
      await acceptOffer(id, responseId);
      toast.success('Offer accepted');
      fetchOrder(id);
    } catch {
      toast.error('Failed to accept offer');
    }
  };

  if (isLoading || !currentOrder) {
    return (
      <div className="max-w-3xl space-y-4">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  const canCancel = ['pending', 'offered', 'confirmed'].includes(currentOrder.status);
  const pharmacyInfo = currentOrder.acceptedPharmacy as Pharmacy | undefined;

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <p className="text-[11px] uppercase tracking-widest text-neutral-400 mb-1">
          Order #{currentOrder._id.slice(-8)}
        </p>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-neutral-800">Order Details</h1>
          <Badge variant={statusVariant(currentOrder.status)}>
            {statusLabel(currentOrder.status)}
          </Badge>
        </div>
      </div>

      {/* Order Info */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 mb-4">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Pill className="w-4 h-4 text-indigo-500" />
              <p className="text-[11px] uppercase tracking-widest text-neutral-500 font-medium">Medicines</p>
            </div>
            <ul className="space-y-1.5">
              {currentOrder.medicines.map((m, i) => (
                <li key={i} className="flex items-center gap-2 text-[13px]">
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full shrink-0" />
                  <span className="font-medium">{m.name}</span>
                  <span className="text-neutral-400">×{m.quantity}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Truck className="w-3.5 h-3.5 text-cyan-500" />
                <p className="text-[11px] uppercase tracking-widest text-neutral-500 font-medium">Delivery</p>
              </div>
              <p className="text-[14px] capitalize pl-5 text-neutral-700">{currentOrder.deliveryType}</p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                <p className="text-[11px] uppercase tracking-widest text-neutral-500 font-medium">Date</p>
              </div>
              <p className="text-[13px] pl-5 text-neutral-700">{formatDateTime(currentOrder.createdAt)}</p>
            </div>
          </div>
        </div>
        {currentOrder.notes && (
          <div className="mt-5 pt-5 border-t border-neutral-100">
            <div className="flex items-center gap-2 mb-2">
              <StickyNote className="w-3.5 h-3.5 text-amber-500" />
              <p className="text-[11px] uppercase tracking-widest text-neutral-500 font-medium">Notes</p>
            </div>
            <p className="text-[13px] text-neutral-600 pl-5">{currentOrder.notes}</p>
          </div>
        )}
      </div>

      {/* Accepted Pharmacy */}
      {pharmacyInfo && (
        <div className="bg-white rounded-2xl border border-emerald-200 bg-emerald-50/30 p-6 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="w-4 h-4 text-emerald-600" />
            <p className="text-[11px] uppercase tracking-widest text-emerald-700 font-medium">Assigned Pharmacy</p>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[15px] font-semibold text-neutral-800">{pharmacyInfo.pharmacyName}</p>
              <div className="flex items-center gap-1 mt-1">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span className="text-[12px] text-neutral-500">{pharmacyInfo.rating?.toFixed(1)}</span>
              </div>
            </div>
            <Link href={`/patient/chat/${currentOrder._id}`}>
              <Button variant="indigo" size="sm">
                <MessageCircle className="w-3.5 h-3.5" />
                Chat
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Offers */}
      {responses.length > 0 && currentOrder.status !== 'cancelled' && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-4">
            <Tag className="w-4 h-4 text-indigo-500" />
            <p className="text-[13px] font-semibold text-neutral-800">
              Pharmacy Offers ({responses.length})
            </p>
          </div>
          <div className="space-y-3">
            {responses.map((resp) => {
              const pharmacy = resp.pharmacyId as Pharmacy;
              const isAccepted = resp.status === 'accepted';
              return (
                <div
                  key={resp._id}
                  className={`bg-white rounded-2xl border p-5 ${
                    isAccepted ? 'border-emerald-200 bg-emerald-50/20' : 'border-neutral-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-[14px] font-semibold text-neutral-800">
                        {typeof pharmacy === 'object' ? pharmacy.pharmacyName : 'Pharmacy'}
                      </p>
                      {resp.distanceKm && (
                        <p className="text-[11px] text-neutral-400 mt-0.5">{resp.distanceKm.toFixed(1)} km away</p>
                      )}
                    </div>
                    <Badge variant={isAccepted ? 'success' : resp.status === 'rejected' ? 'danger' : 'default'}>
                      {resp.status}
                    </Badge>
                  </div>

                  <div className="space-y-1.5 mb-4 bg-slate-50 rounded-xl p-3">
                    {resp.availableMeds.map((med, i) => (
                      <div key={i} className="flex justify-between text-[13px]">
                        <span className={med.inStock ? 'text-neutral-700' : 'text-neutral-400'}>
                          {med.name}
                          {!med.inStock && <span className="text-[11px] ml-1">(out of stock)</span>}
                        </span>
                        <span className={med.inStock ? 'font-medium text-neutral-800' : 'text-neutral-400'}>
                          {med.inStock ? `${med.price} EGP` : '—'}
                        </span>
                      </div>
                    ))}
                  </div>

                  {resp.alternatives.length > 0 && (
                    <div className="border-t border-neutral-100 pt-3 mb-3">
                      <p className="text-[10px] uppercase tracking-widest text-neutral-400 mb-1.5">Alternatives</p>
                      {resp.alternatives.map((alt, i) => (
                        <p key={i} className="text-[12px] text-neutral-500">
                          {alt.originalName} → {alt.alternativeName} ({alt.alternativePrice} EGP)
                        </p>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
                    <div className="text-[13px] text-neutral-600">
                      Total:{' '}
                      <span className="text-indigo-700 font-semibold">{resp.totalPrice} EGP</span>
                      {resp.deliveryFee > 0 && (
                        <span className="text-neutral-400 text-[12px]"> + {resp.deliveryFee} EGP delivery</span>
                      )}
                      {resp.estimatedTime && (
                        <span className="text-neutral-400 text-[12px]"> · {resp.estimatedTime}</span>
                      )}
                    </div>
                    {resp.status === 'offered' && currentOrder.status !== 'confirmed' && (
                      <Button variant="success" size="sm" onClick={() => handleAcceptOffer(resp._id)}>
                        <Check className="w-3.5 h-3.5" />
                        Accept Offer
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cancel Action */}
      {canCancel && (
        <div className="pt-2">
          <Button variant="outline" onClick={() => setCancelModal(true)} className="border-red-200 text-red-600 hover:bg-red-600 hover:border-red-600 hover:text-white">
            <X className="w-3.5 h-3.5" />
            Cancel Order
          </Button>
        </div>
      )}

      {/* Cancel Modal */}
      <Modal isOpen={cancelModal} onClose={() => setCancelModal(false)} title="Cancel Order">
        <div className="space-y-4">
          <Textarea
            label="Reason (Optional)"
            placeholder="Why are you cancelling?"
            rows={3}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />
          <div className="flex gap-3">
            <Button variant="danger" onClick={handleCancel} className="flex-1">Confirm Cancel</Button>
            <Button variant="outline" onClick={() => setCancelModal(false)} className="flex-1">
              Keep Order
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
