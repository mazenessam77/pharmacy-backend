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
import SaveOrderMedicineButton from '@/components/shared/SaveOrderMedicineButton';
import { useSavedMedicationStore } from '@/store/savedMedicationStore';
import { MessageCircle, X, Check, Star, Pill, Truck, Calendar, StickyNote, Building2, Tag, Clock, AlertTriangle } from 'lucide-react';
import { getSocket } from '@/lib/socket';
import OrderTrackingSection from '@/components/delivery/OrderTrackingSection';

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { currentOrder, fetchOrder, fetchResponses, responses, acceptOffer, cancelOrder, isLoading } = useOrderStore();
  const fetchSaved = useSavedMedicationStore((s) => s.fetch);
  const [cancelModal, setCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    if (id) {
      fetchOrder(id);
      fetchResponses(id);
    }
  }, [id, fetchOrder, fetchResponses]);

  // Load saved meds so the per-medicine heart shows the right state
  useEffect(() => {
    fetchSaved();
  }, [fetchSaved]);

  // Live marketplace updates: new offers and status changes appear instantly.
  // The backend already emits these to the patient's private room.
  useEffect(() => {
    if (!id) return;
    let cleanup: (() => void) | null = null;
    (async () => {
      const socket = await getSocket();
      const onNewResponse = (data: { response?: { orderId?: string } }) => {
        if (data.response?.orderId === id) {
          fetchResponses(id);
          toast('New pharmacy offer received', { icon: '💊' });
        }
      };
      const onStatus = (data: { orderId?: string }) => {
        if (data.orderId === id) {
          fetchOrder(id);
          fetchResponses(id);
        }
      };
      socket.on('order:new-response', onNewResponse);
      socket.on('order:status-updated', onStatus);
      cleanup = () => {
        socket.off('order:new-response', onNewResponse);
        socket.off('order:status-updated', onStatus);
      };
    })();
    return () => cleanup?.();
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
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-600 mb-1">
          Order #{currentOrder._id.slice(-8)}
        </p>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black text-neutral-900">Order Details</h1>
          <Badge variant={statusVariant(currentOrder.status)}>
            {statusLabel(currentOrder.status)}
          </Badge>
        </div>
      </div>

      {/* Live delivery tracking — only for delivery orders that are in motion. */}
      {currentOrder.deliveryType === 'delivery' &&
        !['pending', 'offered', 'cancelled'].includes(currentOrder.status) && (
          <OrderTrackingSection orderId={currentOrder._id} />
        )}

      {/* Order Info */}
      <div className="bg-white rounded-[18px] border border-neutral-100 shadow-md p-6 mb-4">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Pill className="w-4 h-4 text-blue-600" />
              <p className="text-[11px] uppercase tracking-widest text-neutral-500 font-medium">Medicines</p>
            </div>
            <ul className="space-y-1.5">
              {currentOrder.medicines.map((m, i) => (
                <li key={i} className="flex items-center gap-2 text-[13px]">
                  <span className="w-1.5 h-1.5 bg-gradient-to-br from-blue-500 to-sky-400 rounded-full shrink-0" />
                  <span className="font-medium">{m.name}</span>
                  <span className="text-neutral-400">×{m.quantity}</span>
                  <SaveOrderMedicineButton name={m.name} />
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Truck className="w-3.5 h-3.5 text-blue-600" />
                <p className="text-[11px] uppercase tracking-widest text-neutral-500 font-medium">Delivery</p>
              </div>
              <p className="text-[14px] capitalize pl-5 text-neutral-700">{currentOrder.deliveryType}</p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <p className="text-[11px] uppercase tracking-widest text-neutral-500 font-medium">Date</p>
              </div>
              <p className="text-[13px] pl-5 text-neutral-700">{formatDateTime(currentOrder.createdAt)}</p>
            </div>
          </div>
        </div>
        {currentOrder.notes && (
          <div className="mt-5 pt-5 border-t border-neutral-100">
            <div className="flex items-center gap-2 mb-2">
              <StickyNote className="w-3.5 h-3.5 text-blue-600" />
              <p className="text-[11px] uppercase tracking-widest text-neutral-500 font-medium">Notes</p>
            </div>
            <p className="text-[13px] text-neutral-600 pl-5">{currentOrder.notes}</p>
          </div>
        )}
      </div>

      {/* Accepted Pharmacy */}
      {pharmacyInfo && (
        <div className="rounded-[18px] border border-blue-100 bg-gradient-to-br from-blue-50 to-sky-50 shadow-md p-6 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="w-4 h-4 text-blue-600" />
            <p className="text-[11px] uppercase tracking-widest text-blue-600 font-bold">Assigned Pharmacy</p>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[15px] font-bold text-neutral-900">{pharmacyInfo.pharmacyName}</p>
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
            <Tag className="w-4 h-4 text-blue-600" />
            <p className="text-[13px] font-bold text-neutral-900">
              Pharmacy Offers ({responses.length})
            </p>
          </div>
          {(() => {
            // Side-by-side comparison: cheapest live offer first, best value tagged.
            const grand = (r: OrderResponse) => r.totalPrice + (r.deliveryFee || 0);
            const sorted = [...responses].sort((a, b) => {
              if ((a.status === 'offered') !== (b.status === 'offered')) return a.status === 'offered' ? -1 : 1;
              return grand(a) - grand(b);
            });
            const bestId = sorted.find((r) => r.status === 'offered')?._id;
            const availabilityMeta: Record<string, { label: string; cls: string }> = {
              full: { label: 'Fully available', cls: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
              partial: { label: 'Partially available', cls: 'text-amber-700 bg-amber-50 border-amber-200' },
              none: { label: 'Not available', cls: 'text-rose-700 bg-rose-50 border-rose-200' },
            };
            return (
              <div className="grid md:grid-cols-2 gap-3 items-start">
                {sorted.map((resp) => {
                  const pharmacy = resp.pharmacyId as Pharmacy;
                  const isAccepted = resp.status === 'accepted';
                  const missing = resp.availableMeds.filter((m) => !m.inStock);
                  const avail = resp.availability ? availabilityMeta[resp.availability] : null;
                  return (
                    <div
                      key={resp._id}
                      className={`bg-white rounded-[16px] border p-5 shadow-sm relative ${
                        isAccepted ? 'border-emerald-300 bg-emerald-50/40' : 'border-neutral-100'
                      }`}
                    >
                      {resp._id === bestId && sorted.filter((r) => r.status === 'offered').length > 1 && (
                        <span className="absolute -top-2.5 start-4 text-[9px] font-bold uppercase tracking-widest bg-blue-600 text-white px-2 py-0.5 rounded-full">
                          Best price
                        </span>
                      )}
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-[14px] font-semibold text-neutral-800">
                            {typeof pharmacy === 'object' ? pharmacy.pharmacyName : 'Pharmacy'}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {typeof pharmacy === 'object' && pharmacy.rating > 0 && (
                              <span className="inline-flex items-center gap-1 text-[11px] text-neutral-500">
                                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                {pharmacy.rating.toFixed(1)}
                              </span>
                            )}
                            {resp.estimatedTime && (
                              <span className="inline-flex items-center gap-1 text-[11px] text-neutral-400">
                                <Clock className="w-3 h-3" /> {resp.estimatedTime}
                              </span>
                            )}
                          </div>
                        </div>
                        <Badge variant={isAccepted ? 'success' : resp.status === 'rejected' ? 'danger' : 'default'}>
                          {resp.status}
                        </Badge>
                      </div>

                      {avail && (
                        <span className={`inline-block text-[10px] uppercase tracking-widest border px-2 py-0.5 rounded-full mb-3 ${avail.cls}`}>
                          {avail.label}
                        </span>
                      )}

                      <div className="space-y-1.5 mb-3 bg-neutral-50 rounded-[12px] p-3">
                        {resp.availableMeds.filter((m) => m.inStock).map((med, i) => (
                          <div key={i} className="flex justify-between text-[13px]">
                            <span className="text-neutral-700">
                              {med.name}
                              {(med.quantity ?? 1) > 1 && <span className="text-neutral-400"> ×{med.quantity}</span>}
                            </span>
                            <span className="font-medium text-neutral-800">
                              {(med.price * (med.quantity ?? 1)).toFixed(2)} EGP
                            </span>
                          </div>
                        ))}
                        {missing.length > 0 && (
                          <div className="pt-2 mt-1 border-t border-neutral-200/70">
                            <p className="text-[10px] uppercase tracking-widest text-rose-500 mb-1 inline-flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Missing
                            </p>
                            {missing.map((med, i) => (
                              <p key={i} className="text-[12px] text-neutral-400 line-through">{med.name}</p>
                            ))}
                          </div>
                        )}
                      </div>

                      {resp.alternatives.length > 0 && (
                        <div className="mb-3">
                          <p className="text-[10px] uppercase tracking-widest text-neutral-400 mb-1">Alternatives</p>
                          {resp.alternatives.map((alt, i) => (
                            <p key={i} className="text-[12px] text-neutral-500">
                              {alt.originalName} → <span className="text-neutral-700">{alt.alternativeName}</span> ({alt.alternativePrice} EGP)
                            </p>
                          ))}
                        </div>
                      )}

                      {resp.notes && (
                        <p className="text-[12px] text-neutral-500 italic mb-3">“{resp.notes}”</p>
                      )}

                      <div className="pt-3 border-t border-neutral-100 space-y-0.5 text-[12px] text-neutral-500">
                        <div className="flex justify-between"><span>Medicines</span><span>{resp.totalPrice.toFixed(2)} EGP</span></div>
                        <div className="flex justify-between"><span>Delivery</span><span>{(resp.deliveryFee || 0).toFixed(2)} EGP</span></div>
                        <div className="flex justify-between text-[14px] font-semibold text-neutral-900 pt-1">
                          <span>Total</span><span>{grand(resp).toFixed(2)} EGP</span>
                        </div>
                      </div>

                      {resp.status === 'offered' && currentOrder.status !== 'confirmed' && (
                        <Button variant="success" size="sm" className="w-full mt-3" onClick={() => handleAcceptOffer(resp._id)}>
                          <Check className="w-3.5 h-3.5" />
                          Accept This Offer
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* Cancel Action */}
      {canCancel && (
        <div className="pt-2">
          <Button variant="outline" onClick={() => setCancelModal(true)} className="border-neutral-200 text-neutral-900 hover:bg-black hover:border-neutral-200 hover:text-white">
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
