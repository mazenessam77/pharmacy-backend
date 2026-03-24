'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useOrderStore } from '@/store/orderStore';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { statusLabel, statusVariant, formatDate } from '@/lib/helpers';
import { ShoppingBag, Plus, ArrowRight, Pill, Clock, CheckCircle2 } from 'lucide-react';

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

  const stats = [
    { label: 'Total Orders', value: orders.length, bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100', icon: ShoppingBag },
    { label: 'Active', value: activeCount, bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', icon: Clock },
    { label: 'Delivered', value: deliveredCount, bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', icon: CheckCircle2 },
  ];

  return (
    <div className="max-w-4xl">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-500 p-7 mb-8 text-white shadow-lg shadow-indigo-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-indigo-200 text-[11px] uppercase tracking-widest mb-1">Patient Dashboard</p>
            <h1 className="text-2xl font-semibold">
              Hello, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p className="text-indigo-100 mt-1.5 text-[13px]">
              Get your medicines delivered fast across Egypt.
            </p>
          </div>
          <div className="w-16 h-16 bg-white/15 rounded-2xl flex items-center justify-center shrink-0">
            <Pill className="w-8 h-8 text-white" />
          </div>
        </div>
        <div className="mt-5">
          <Link href="/patient/orders/new">
            <Button variant="ghost" size="sm" className="text-white hover:text-white hover:no-underline bg-white/20 hover:bg-white/30 px-5 rounded-lg">
              <Plus className="w-4 h-4" />
              New Medicine Request
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className={`${stat.bg} border ${stat.border} rounded-xl p-5`}>
            <stat.icon className={`w-5 h-5 ${stat.text} mb-3`} />
            <p className={`text-3xl font-bold ${stat.text}`}>{stat.value}</p>
            <p className="text-[11px] text-neutral-500 mt-1 uppercase tracking-wide">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[13px] font-semibold text-neutral-800">Recent Orders</h2>
          <Link
            href="/patient/orders"
            className="text-[11px] text-indigo-600 hover:text-indigo-800 transition-colors inline-flex items-center gap-1 font-medium"
          >
            View All <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <CardSkeleton key={i} />)}
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <ShoppingBag className="w-7 h-7 text-indigo-300" />
            </div>
            <p className="text-[13px] text-neutral-500 mb-4">No orders yet. Start your first request!</p>
            <Link href="/patient/orders/new">
              <Button variant="indigo" size="sm">
                <Plus className="w-3.5 h-3.5" />
                New Request
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {recentOrders.map((order) => (
              <Link
                key={order._id}
                href={`/patient/orders/${order._id}`}
                className="flex items-center justify-between p-4 rounded-xl hover:bg-indigo-50/50 transition-colors duration-200 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
                    <Pill className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-neutral-800 group-hover:text-indigo-700 transition-colors">
                      {order.medicines.map((m) => m.name).join(', ')}
                    </p>
                    <p className="text-[11px] text-neutral-400 mt-0.5">{formatDate(order.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={statusVariant(order.status)}>
                    {statusLabel(order.status)}
                  </Badge>
                  <ArrowRight className="w-3.5 h-3.5 text-neutral-300 group-hover:text-indigo-400 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
