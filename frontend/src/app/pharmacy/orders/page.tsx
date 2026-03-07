'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useOrderStore } from '@/store/orderStore';
import Badge from '@/components/ui/Badge';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { statusLabel, statusVariant, formatDate } from '@/lib/helpers';
import { ShoppingBag } from 'lucide-react';

const FILTERS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'out_for_delivery', label: 'In Transit' },
  { value: 'delivered', label: 'Delivered' },
];

export default function PharmacyOrdersPage() {
  const { orders, fetchOrders, isLoading, pagination } = useOrderStore();
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchOrders({ page: 1, status: filter || undefined });
  }, [fetchOrders, filter]);

  return (
    <div className="max-w-4xl">
      <p className="text-[11px] uppercase tracking-widest text-neutral-400 mb-1">Orders</p>
      <h1 className="text-[28px] font-light uppercase tracking-wide mb-8">Order Management</h1>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 text-[10px] uppercase tracking-widest border transition-colors duration-200 ${
              filter === f.value
                ? 'bg-black text-white border-black'
                : 'bg-white text-neutral-500 border-neutral-200 hover:border-black'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <ListSkeleton count={5} />
      ) : orders.length === 0 ? (
        <div className="border border-neutral-200 p-16 text-center">
          <ShoppingBag className="w-8 h-8 text-neutral-300 mx-auto mb-3" />
          <p className="text-[12px] text-neutral-400">No orders found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link
              key={order._id}
              href={`/pharmacy/orders/${order._id}`}
              className="block border border-neutral-200 p-5 hover:border-black transition-colors duration-300"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] uppercase tracking-widest text-neutral-400">
                  #{order._id.slice(-8)}
                </p>
                <Badge variant={statusVariant(order.status)}>
                  {statusLabel(order.status)}
                </Badge>
              </div>
              <p className="text-[14px] mb-2">
                {order.medicines.map((m) => `${m.name} x${m.quantity}`).join(', ')}
              </p>
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-neutral-400 capitalize">{order.deliveryType}</p>
                <p className="text-[11px] text-neutral-400">{formatDate(order.createdAt)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: pagination.pages }, (_, i) => (
            <button
              key={i}
              onClick={() => fetchOrders({ page: i + 1, status: filter || undefined })}
              className={`w-8 h-8 text-[11px] border transition-colors ${
                pagination.page === i + 1
                  ? 'bg-black text-white border-black'
                  : 'border-neutral-200 hover:border-black'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
