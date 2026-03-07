'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useOrderStore } from '@/store/orderStore';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { statusLabel, statusVariant, formatDate } from '@/lib/helpers';
import { Plus, ShoppingBag } from 'lucide-react';

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'offered', label: 'Offered' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'out_for_delivery', label: 'In Transit' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function PatientOrdersPage() {
  const { orders, fetchOrders, isLoading, pagination } = useOrderStore();
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchOrders({ page: 1, status: statusFilter || undefined });
  }, [fetchOrders, statusFilter]);

  return (
    <div className="max-w-4xl">
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-neutral-400 mb-1">Orders</p>
          <h1 className="text-[28px] font-light uppercase tracking-wide">My Orders</h1>
        </div>
        <Link href="/patient/orders/new">
          <Button size="sm">
            <Plus className="w-3.5 h-3.5" />
            New Request
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`px-4 py-2 text-[10px] uppercase tracking-widest border transition-colors duration-200 ${
              statusFilter === f.value
                ? 'bg-black text-white border-black'
                : 'bg-white text-neutral-500 border-neutral-200 hover:border-black'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Order List */}
      {isLoading ? (
        <ListSkeleton count={5} />
      ) : orders.length === 0 ? (
        <div className="border border-neutral-200 p-16 text-center">
          <ShoppingBag className="w-8 h-8 text-neutral-300 mx-auto mb-3" />
          <p className="text-[12px] text-neutral-400 mb-4">No orders found</p>
          <Link href="/patient/orders/new">
            <Button variant="outline" size="sm">Create Your First Order</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link
              key={order._id}
              href={`/patient/orders/${order._id}`}
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
                <p className="text-[11px] text-neutral-400">
                  {order.deliveryType === 'delivery' ? 'Delivery' : 'Pickup'}
                </p>
                <p className="text-[11px] text-neutral-400">{formatDate(order.createdAt)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: pagination.pages }, (_, i) => (
            <button
              key={i}
              onClick={() => fetchOrders({ page: i + 1, status: statusFilter || undefined })}
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
