'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useOrderStore } from '@/store/orderStore';
import Badge from '@/components/ui/Badge';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { statusLabel, statusVariant, formatDate } from '@/lib/helpers';
import { ShoppingBag, Plus, ArrowRight, Clock, CheckCircle2, Sparkles } from 'lucide-react';
import MedicineIcon from '@/components/shared/MedicineIcon';

export default function PatientDashboard() {
  const { user } = useAuthStore();
  const { orders, fetchOrders, isLoading } = useOrderStore();

  useEffect(() => { fetchOrders({ page: 1 }); }, [fetchOrders]);

  const recentOrders = orders.slice(0, 5);
  const activeCount = orders.filter((o) =>
    ['pending', 'offered', 'confirmed', 'preparing', 'out_for_delivery'].includes(o.status)
  ).length;
  const deliveredCount = orders.filter((o) => o.status === 'delivered').length;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="max-w-4xl relative">

      {/* ── Vibrant Gradient Hero ──────────────────────────────────────── */}
      <div className="relative rounded-[24px] p-8 mb-7 text-white overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 shadow-[0_30px_70px_-25px_rgba(79,70,229,0.55)]">
        <div className="absolute inset-0 opacity-25 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 85% 15%, rgba(255,255,255,0.5) 0%, transparent 45%)' }} />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-widest mb-3">
              <Sparkles className="w-3 h-3" />
              Patient Portal
            </div>
            <h1 className="text-[28px] font-black leading-tight">
              {greeting()},{' '}
              <span className="text-white/70">{user?.name?.split(' ')[0]}</span> 👋
            </h1>
            <p className="text-white/80 mt-1.5 text-[13px] font-medium">
              Your health, delivered — across all of Egypt.
            </p>
          </div>

          <Link
            href="/patient/orders/new"
            className="shrink-0 flex items-center gap-2 bg-white text-blue-700 font-bold text-[13px] px-5 py-3 rounded-full hover:bg-neutral-100 active:scale-95 transition-all duration-200 shadow-lg"
          >
            <Plus className="w-4 h-4" />
            New Request
          </Link>
        </div>

        <div className="relative mt-6 grid grid-cols-3 gap-3">
          {[
            { label: 'Total', value: orders.length },
            { label: 'Active', value: activeCount },
            { label: 'Delivered', value: deliveredCount },
          ].map((s) => (
            <div key={s.label} className="bg-white/15 rounded-[16px] px-4 py-3 backdrop-blur-sm">
              <p className="text-2xl font-extrabold">{s.value}</p>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/70 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Stat Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4 mb-7">
        {[
          { label: 'Total Orders', value: orders.length,    icon: ShoppingBag,  gradient: 'from-sky-400 to-blue-600' },
          { label: 'In Progress',  value: activeCount,      icon: Clock,        gradient: 'from-amber-400 to-orange-600' },
          { label: 'Delivered',    value: deliveredCount,   icon: CheckCircle2, gradient: 'from-emerald-400 to-teal-600' },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white border border-neutral-100 rounded-[20px] p-5 shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden relative group"
          >
            <div className={`w-11 h-11 rounded-[14px] flex items-center justify-center mb-4 bg-gradient-to-br ${s.gradient} shadow-md`}>
              <s.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-3xl font-black text-neutral-900">{s.value}</p>
            <p className="text-[11px] font-semibold text-neutral-400 mt-1 uppercase tracking-wide">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Recent Orders ──────────────────────────────────────────────── */}
      <div className="bg-white border border-neutral-100 rounded-[24px] shadow-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[16px] font-bold text-neutral-900">Recent Orders</h2>
          <Link href="/patient/orders" className="text-[12px] text-blue-600 font-bold hover:gap-2 transition-all inline-flex items-center gap-1">
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3">{[1, 2, 3].map((i) => <CardSkeleton key={i} />)}</div>
        ) : recentOrders.length === 0 ? (
          <div className="py-14 text-center">
            <div className="w-16 h-16 rounded-[18px] flex items-center justify-center mx-auto mb-4 bg-gradient-to-br from-sky-400 to-blue-600 shadow-md">
              <ShoppingBag className="w-7 h-7 text-white" />
            </div>
            <p className="text-[13px] font-medium text-neutral-500 mb-4">No orders yet — start your first request!</p>
            <Link
              href="/patient/orders/new"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-sky-500 text-white text-[12px] font-bold px-5 py-2.5 rounded-full hover:shadow-lg hover:shadow-blue-500/30 active:scale-95 transition-all duration-200"
            >
              <Plus className="w-3.5 h-3.5" />
              New Request
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {recentOrders.map((order) => (
              <Link
                key={order._id}
                href={`/patient/orders/${order._id}`}
                className="flex items-center gap-4 p-3.5 rounded-[16px] hover:bg-neutral-50 active:scale-[0.99] transition-all duration-200 group"
              >
                <MedicineIcon name={order.medicines[0]?.name ?? 'Medicine'} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-neutral-800 truncate group-hover:text-blue-600 transition-colors">
                    {order.medicines.map((m) => m.name).join(', ')}
                  </p>
                  <p className="text-[11px] text-neutral-400 mt-0.5 font-medium">{formatDate(order.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  <Badge variant={statusVariant(order.status)}>{statusLabel(order.status)}</Badge>
                  <ArrowRight className="w-3.5 h-3.5 text-neutral-300 group-hover:text-blue-500 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ── FAB ──────────────────────────────────────────────────────────── */}
      <Link
        href="/patient/orders/new"
        aria-label="New medicine request"
        className="fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-br from-blue-600 to-sky-500 text-white rounded-full flex items-center justify-center hover:shadow-xl hover:shadow-blue-500/40 active:scale-95 transition-all duration-200 z-50 shadow-lg"
      >
        <Plus className="w-6 h-6" />
      </Link>
    </div>
  );
}
