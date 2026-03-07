'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { adminService } from '@/lib/services/adminService';
import { Order, User, Pharmacy } from '@/types';
import Badge from '@/components/ui/Badge';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { statusLabel, statusVariant, formatDateTime } from '@/lib/helpers';

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await adminService.getOrderDetail(id);
        setOrder(res.data.data?.order || res.data.data);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading || !order) {
    return <div className="max-w-3xl space-y-4"><CardSkeleton /><CardSkeleton /></div>;
  }

  const patient = order.patientId as User | undefined;
  const pharmacy = order.acceptedPharmacy as Pharmacy | undefined;

  return (
    <div className="max-w-3xl">
      <p className="text-[11px] uppercase tracking-widest text-neutral-400 mb-1">
        Order #{order._id.slice(-8)}
      </p>
      <div className="flex items-start justify-between mb-8">
        <h1 className="text-[28px] font-light uppercase tracking-wide">Order Details</h1>
        <Badge variant={statusVariant(order.status)}>{statusLabel(order.status)}</Badge>
      </div>

      {/* Patient */}
      {patient && typeof patient === 'object' && (
        <div className="border border-neutral-200 p-6 mb-4">
          <p className="text-[10px] uppercase tracking-widest text-neutral-400 mb-2">Patient</p>
          <p className="text-[14px]">{patient.name}</p>
          <p className="text-[12px] text-neutral-500">{patient.email}</p>
        </div>
      )}

      {/* Pharmacy */}
      {pharmacy && typeof pharmacy === 'object' && (
        <div className="border border-neutral-200 p-6 mb-4">
          <p className="text-[10px] uppercase tracking-widest text-neutral-400 mb-2">Assigned Pharmacy</p>
          <p className="text-[14px]">{pharmacy.pharmacyName}</p>
        </div>
      )}

      {/* Order Info */}
      <div className="border border-neutral-200 p-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-neutral-400 mb-1">Medicines</p>
            <ul className="space-y-1">
              {order.medicines.map((m, i) => (
                <li key={i} className="text-[14px]">
                  {m.name} <span className="text-neutral-400">x{m.quantity}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-neutral-400 mb-1">Delivery</p>
              <p className="text-[14px] capitalize">{order.deliveryType}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-neutral-400 mb-1">Created</p>
              <p className="text-[14px]">{formatDateTime(order.createdAt)}</p>
            </div>
            {order.deliveredAt && (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-neutral-400 mb-1">Delivered</p>
                <p className="text-[14px]">{formatDateTime(order.deliveredAt)}</p>
              </div>
            )}
          </div>
        </div>
        {order.notes && (
          <div className="mt-4 pt-4 border-t border-neutral-100">
            <p className="text-[10px] uppercase tracking-widest text-neutral-400 mb-1">Notes</p>
            <p className="text-[13px] text-neutral-600">{order.notes}</p>
          </div>
        )}
        {order.cancelReason && (
          <div className="mt-4 pt-4 border-t border-neutral-100">
            <p className="text-[10px] uppercase tracking-widest text-neutral-400 mb-1">Cancel Reason</p>
            <p className="text-[13px] text-neutral-600">{order.cancelReason}</p>
          </div>
        )}
      </div>
    </div>
  );
}
