'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminService } from '@/lib/services/adminService';
import { Order } from '@/types';
import Badge from '@/components/ui/Badge';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { statusLabel, statusVariant, formatDate } from '@/lib/helpers';
import { ShoppingBag } from 'lucide-react';

const FILTERS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'offered', label: 'Offered' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'out_for_delivery', label: 'In Transit' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });

  const fetchOrders = async (page = 1) => {
    setLoading(true);
    try {
      const res = await adminService.getOrders({ page, status: filter || undefined });
      setOrders(res.data.data?.orders || res.data.data || []);
      setPagination(res.data.pagination || { page: 1, pages: 1 });
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  return (
    <div className="max-w-5xl">
      <p className="text-[11px] uppercase tracking-widest text-neutral-400 mb-1">Oversight</p>
      <h1 className="text-[28px] font-light uppercase tracking-wide mb-8">All Orders</h1>

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

      {loading ? (
        <ListSkeleton count={5} />
      ) : orders.length === 0 ? (
        <div className="border border-neutral-200 p-16 text-center">
          <ShoppingBag className="w-8 h-8 text-neutral-300 mx-auto mb-3" />
          <p className="text-[12px] text-neutral-400">No orders found</p>
        </div>
      ) : (
        <div className="border border-neutral-200">
          <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-neutral-200 bg-neutral-50">
            <div className="col-span-2 text-[10px] uppercase tracking-widest text-neutral-400">ID</div>
            <div className="col-span-4 text-[10px] uppercase tracking-widest text-neutral-400">Medicines</div>
            <div className="col-span-2 text-[10px] uppercase tracking-widest text-neutral-400">Type</div>
            <div className="col-span-2 text-[10px] uppercase tracking-widest text-neutral-400">Status</div>
            <div className="col-span-2 text-[10px] uppercase tracking-widest text-neutral-400">Date</div>
          </div>
          {orders.map((order) => (
            <Link
              key={order._id}
              href={`/admin/orders/${order._id}`}
              className="grid grid-cols-12 gap-4 px-5 py-4 border-b border-neutral-100 items-center hover:bg-neutral-50 transition-colors"
            >
              <div className="col-span-2 text-[12px] text-neutral-500">#{order._id.slice(-8)}</div>
              <div className="col-span-4 text-[13px] truncate">
                {order.medicines.map((m) => m.name).join(', ')}
              </div>
              <div className="col-span-2 text-[12px] capitalize">{order.deliveryType}</div>
              <div className="col-span-2">
                <Badge variant={statusVariant(order.status)}>{statusLabel(order.status)}</Badge>
              </div>
              <div className="col-span-2 text-[12px] text-neutral-500">{formatDate(order.createdAt)}</div>
            </Link>
          ))}
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: pagination.pages }, (_, i) => (
            <button
              key={i}
              onClick={() => fetchOrders(i + 1)}
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
