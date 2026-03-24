'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useOrderStore } from '@/store/orderStore';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { statusLabel, statusVariant, formatDate } from '@/lib/helpers';
import { Plus, ShoppingBag, Pill, ChevronRight } from 'lucide-react';

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

const statusBorderColor: Record<string, string> = {
  pending: 'border-l-amber-400',
  offered: 'border-l-blue-400',
  confirmed: 'border-l-indigo-400',
  preparing: 'border-l-purple-400',
  out_for_delivery: 'border-l-cyan-400',
  delivered: 'border-l-emerald-400',
  cancelled: 'border-l-red-300',
};

export default function PatientOrdersPage() {
  const { orders, fetchOrders, isLoading, pagination } = useOrderStore();
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchOrders({ page: 1, status: statusFilter || undefined });
  }, [fetchOrders, statusFilter]);

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-neutral-400 mb-1">Patient</p>
          <h1 className="text-2xl font-semibold text-neutral-800">My Orders</h1>
        </div>
        <Link href="/patient/orders/new">
          <Button variant="indigo" size="sm">
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
            className={`px-4 py-1.5 text-[11px] rounded-full font-medium transition-all duration-200 ${
              statusFilter === f.value
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                : 'bg-white text-neutral-500 border border-neutral-200 hover:border-indigo-300 hover:text-indigo-600'
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
        <div className="bg-white rounded-2xl border border-neutral-200 py-16 text-center">
          <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <ShoppingBag className="w-7 h-7 text-indigo-300" />
          </div>
          <p className="text-[13px] text-neutral-500 mb-4">No orders found</p>
          <Link href="/patient/orders/new">
            <Button variant="indigo" size="sm">Create Your First Order</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link
              key={order._id}
              href={`/patient/orders/${order._id}`}
              className={`flex items-center gap-4 bg-white border border-neutral-200 border-l-4 ${statusBorderColor[order.status] ?? 'border-l-neutral-300'} rounded-xl p-4 hover:shadow-md hover:shadow-neutral-100 transition-all duration-200 group`}
            >
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                <Pill className="w-5 h-5 text-indigo-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] text-neutral-400 uppercase tracking-widest">
                    #{order._id.slice(-8)}
                  </p>
                  <Badge variant={statusVariant(order.status)}>
                    {statusLabel(order.status)}
                  </Badge>
                </div>
                <p className="text-[13px] font-medium text-neutral-800 truncate">
                  {order.medicines.map((m) => `${m.name} ×${m.quantity}`).join(', ')}
                </p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-[11px] text-neutral-400">
                    {order.deliveryType === 'delivery' ? '🚚 Delivery' : '🏪 Pickup'}
                  </p>
                  <p className="text-[11px] text-neutral-400">{formatDate(order.createdAt)}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-300 group-hover:text-indigo-400 shrink-0 transition-colors" />
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
              className={`w-9 h-9 text-[12px] rounded-lg font-medium transition-colors ${
                pagination.page === i + 1
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white border border-neutral-200 text-neutral-600 hover:border-indigo-300'
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
