'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useOrderStore } from '@/store/orderStore';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { statusLabel, statusVariant, formatDate } from '@/lib/helpers';
import { ShoppingBag, Plus, ArrowRight } from 'lucide-react';

export default function PatientDashboard() {
  const { user } = useAuthStore();
  const { orders, fetchOrders, isLoading } = useOrderStore();

  useEffect(() => {
    fetchOrders({ page: 1 });
  }, [fetchOrders]);

  const recentOrders = orders.slice(0, 5);
  const activeCount = orders.filter((o) =>
    ['pending', 'offered', 'confirmed', 'preparing', 'out_for_delivery'].includes(o.status)
  ).length;
  const deliveredCount = orders.filter((o) => o.status === 'delivered').length;

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-10">
        <p className="text-[11px] uppercase tracking-widest text-neutral-400 mb-1">Dashboard</p>
        <h1 className="text-[28px] font-light uppercase tracking-wide">
          Welcome, {user?.name?.split(' ')[0]}
        </h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-px bg-neutral-200 border border-neutral-200 mb-10">
        {[
          { label: 'Total Orders', value: orders.length },
          { label: 'Active', value: activeCount },
          { label: 'Delivered', value: deliveredCount },
        ].map((stat) => (
          <div key={stat.label} className="bg-white p-6 text-center">
            <p className="text-[32px] font-light">{stat.value}</p>
            <p className="text-[10px] uppercase tracking-widest text-neutral-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Action */}
      <div className="mb-10">
        <Link href="/patient/orders/new">
          <Button size="lg" className="gap-3">
            <Plus className="w-4 h-4" />
            New Medicine Request
          </Button>
        </Link>
      </div>

      {/* Recent Orders */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[11px] uppercase tracking-widest">Recent Orders</h2>
          <Link
            href="/patient/orders"
            className="text-[11px] uppercase tracking-widest text-neutral-400 hover:text-black transition-colors inline-flex items-center gap-1"
          >
            View All <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <CardSkeleton key={i} />)}
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="border border-neutral-200 p-10 text-center">
            <ShoppingBag className="w-8 h-8 text-neutral-300 mx-auto mb-3" />
            <p className="text-[12px] text-neutral-400">No orders yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <Link
                key={order._id}
                href={`/patient/orders/${order._id}`}
                className="block border border-neutral-200 p-5 hover:border-black transition-colors duration-300"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[13px] mb-1">
                      {order.medicines.map((m) => m.name).join(', ')}
                    </p>
                    <p className="text-[11px] text-neutral-400">{formatDate(order.createdAt)}</p>
                  </div>
                  <Badge variant={statusVariant(order.status)}>
                    {statusLabel(order.status)}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
