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
import { MessageCircle, X, Check, Star } from 'lucide-react';

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
      <p className="text-[11px] uppercase tracking-widest text-neutral-400 mb-1">
        Order #{currentOrder._id.slice(-8)}
      </p>
      <div className="flex items-start justify-between mb-8">
        <h1 className="text-[28px] font-light uppercase tracking-wide">Order Details</h1>
        <Badge variant={statusVariant(currentOrder.status)}>
          {statusLabel(currentOrder.status)}
        </Badge>
      </div>

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

      {/* Accepted Pharmacy */}
      {pharmacyInfo && (
        <div className="border border-neutral-200 p-6 mb-6">
          <p className="text-[10px] uppercase tracking-widest text-neutral-400 mb-3">Assigned Pharmacy</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[14px] font-medium">{pharmacyInfo.pharmacyName}</p>
              <div className="flex items-center gap-1 mt-1">
                <Star className="w-3 h-3 fill-current" />
                <span className="text-[12px] text-neutral-500">{pharmacyInfo.rating?.toFixed(1)}</span>
              </div>
            </div>
            <Link href={`/patient/chat/${currentOrder._id}`}>
              <Button variant="outline" size="sm">
                <MessageCircle className="w-3.5 h-3.5" />
                Chat
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Offers */}
      {responses.length > 0 && currentOrder.status !== 'cancelled' && (
        <div className="mb-6">
          <p className="text-[11px] uppercase tracking-widest mb-4">
            Offers ({responses.length})
          </p>
          <div className="space-y-3">
            {responses.map((resp) => {
              const pharmacy = resp.pharmacyId as Pharmacy;
              return (
                <div key={resp._id} className="border border-neutral-200 p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-[14px] font-medium">
                        {typeof pharmacy === 'object' ? pharmacy.pharmacyName : 'Pharmacy'}
                      </p>
                      {resp.distanceKm && (
                        <p className="text-[11px] text-neutral-400">{resp.distanceKm.toFixed(1)} km away</p>
                      )}
                    </div>
                    <Badge variant={resp.status === 'accepted' ? 'success' : resp.status === 'rejected' ? 'danger' : 'default'}>
                      {resp.status}
                    </Badge>
                  </div>

                  <div className="space-y-1 mb-3">
                    {resp.availableMeds.map((med, i) => (
                      <div key={i} className="flex justify-between text-[13px]">
                        <span>{med.name} {!med.inStock && <span className="text-neutral-400">(out of stock)</span>}</span>
                        <span>{med.inStock ? `$${med.price}` : '—'}</span>
                      </div>
                    ))}
                  </div>

                  {resp.alternatives.length > 0 && (
                    <div className="border-t border-neutral-100 pt-2 mb-3">
                      <p className="text-[10px] uppercase tracking-widest text-neutral-400 mb-1">Alternatives</p>
                      {resp.alternatives.map((alt, i) => (
                        <p key={i} className="text-[12px] text-neutral-500">
                          {alt.originalName} → {alt.alternativeName} (${alt.alternativePrice})
                        </p>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
                    <div className="text-[12px] text-neutral-500">
                      Total: <span className="text-black font-medium">${resp.totalPrice}</span>
                      {resp.deliveryFee > 0 && ` + $${resp.deliveryFee} delivery`}
                      {resp.estimatedTime && ` · ${resp.estimatedTime}`}
                    </div>
                    {resp.status === 'offered' && currentOrder.status !== 'confirmed' && (
                      <Button size="sm" onClick={() => handleAcceptOffer(resp._id)}>
                        <Check className="w-3 h-3" />
                        Accept
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      {canCancel && (
        <div className="pt-4">
          <Button variant="outline" onClick={() => setCancelModal(true)}>
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
            <Button onClick={handleCancel} className="flex-1">Confirm Cancel</Button>
            <Button variant="outline" onClick={() => setCancelModal(false)} className="flex-1">
              Keep Order
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
