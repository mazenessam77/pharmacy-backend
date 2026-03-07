'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useOrderStore } from '@/store/orderStore';
import { ListSkeleton } from '@/components/ui/Skeleton';
import Badge from '@/components/ui/Badge';
import { statusLabel, statusVariant, formatDate } from '@/lib/helpers';
import { MessageCircle } from 'lucide-react';
import { Pharmacy } from '@/types';

export default function PatientChatListPage() {
  const { orders, fetchOrders, isLoading } = useOrderStore();

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const chatOrders = orders.filter(
    (o) => o.acceptedPharmacy && !['cancelled'].includes(o.status)
  );

  return (
    <div className="max-w-3xl">
      <p className="text-[11px] uppercase tracking-widest text-neutral-400 mb-1">Messages</p>
      <h1 className="text-[28px] font-light uppercase tracking-wide mb-8">Conversations</h1>

      {isLoading ? (
        <ListSkeleton count={4} />
      ) : chatOrders.length === 0 ? (
        <div className="border border-neutral-200 p-16 text-center">
          <MessageCircle className="w-8 h-8 text-neutral-300 mx-auto mb-3" />
          <p className="text-[12px] text-neutral-400">No conversations yet</p>
          <p className="text-[11px] text-neutral-300 mt-1">Chat will appear once a pharmacy accepts your order</p>
        </div>
      ) : (
        <div className="space-y-3">
          {chatOrders.map((order) => {
            const pharmacy = order.acceptedPharmacy as Pharmacy;
            return (
              <Link
                key={order._id}
                href={`/patient/chat/${order._id}`}
                className="block border border-neutral-200 p-5 hover:border-black transition-colors duration-300"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[14px] font-medium">
                      {typeof pharmacy === 'object' ? pharmacy.pharmacyName : 'Pharmacy'}
                    </p>
                    <p className="text-[11px] text-neutral-400 mt-1">
                      {order.medicines.map((m) => m.name).join(', ')}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant={statusVariant(order.status)}>
                      {statusLabel(order.status)}
                    </Badge>
                    <p className="text-[10px] text-neutral-400 mt-1">{formatDate(order.createdAt)}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
