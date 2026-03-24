'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useOrderStore } from '@/store/orderStore';
import Badge from '@/components/ui/Badge';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { statusLabel, statusVariant, formatDate } from '@/lib/helpers';
import { ShoppingBag, Plus, ArrowRight, Clock, CheckCircle2, Sparkles } from 'lucide-react';

// ─── Medicine Avatar ──────────────────────────────────────────────────────────
// Generates a deterministic pastel circle with the medicine's initials.
// Replaces the generic pill icon so each medicine looks visually distinct.
const AVATAR_PALETTES = [
  { bg: '#e0e7ff', fg: '#4338ca' }, // indigo
  { bg: '#d1fae5', fg: '#065f46' }, // emerald
  { bg: '#fef3c7', fg: '#92400e' }, // amber
  { bg: '#fce7f3', fg: '#9d174d' }, // pink
  { bg: '#ede9fe', fg: '#5b21b6' }, // violet
  { bg: '#e0f2fe', fg: '#075985' }, // sky
  { bg: '#dcfce7', fg: '#15803d' }, // green
  { bg: '#fff7ed', fg: '#9a3412' }, // orange
];

function MedicineAvatar({ name }: { name: string }) {
  const code = Array.from(name).reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const { bg, fg } = AVATAR_PALETTES[code % AVATAR_PALETTES.length];
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <div
      className="w-11 h-11 rounded-2xl flex items-center justify-center text-[11px] font-bold shrink-0 select-none"
      style={{ backgroundColor: bg, color: fg }}
    >
      {initials}
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
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

      {/* ── Mesh Gradient Hero ─────────────────────────────────────────── */}
      <div
        className="mesh-gradient rounded-3xl p-8 mb-7 text-white overflow-hidden relative"
        style={{ boxShadow: '0 20px 40px -10px rgba(67, 56, 202, 0.40)' }}
      >
        {/* decorative blobs */}
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-36 h-36 bg-purple-400/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-widest mb-3">
              <Sparkles className="w-3 h-3" />
              Patient Portal
            </div>
            <h1 className="text-[28px] font-extrabold leading-tight">
              {greeting()},{' '}
              <span className="text-indigo-200">{user?.name?.split(' ')[0]}</span> 👋
            </h1>
            <p className="text-indigo-100/80 mt-1.5 text-[13px] font-medium">
              Your health, delivered — across all of Egypt.
            </p>
          </div>

          {/* High-contrast FAB inside hero */}
          <Link
            href="/patient/orders/new"
            className="shrink-0 flex items-center gap-2 bg-white text-indigo-700 font-bold text-[13px] px-5 py-3 rounded-2xl hover:bg-indigo-50 active:scale-95 transition-all duration-200"
            style={{ boxShadow: '0 8px 20px rgba(0,0,0,0.15)' }}
          >
            <Plus className="w-4 h-4" />
            New Request
          </Link>
        </div>

        {/* Mini stats strip inside hero */}
        <div className="relative mt-6 grid grid-cols-3 gap-3">
          {[
            { label: 'Total', value: orders.length },
            { label: 'Active', value: activeCount },
            { label: 'Delivered', value: deliveredCount },
          ].map((s) => (
            <div key={s.label} className="bg-white/15 rounded-2xl px-4 py-3 backdrop-blur-sm">
              <p className="text-2xl font-extrabold">{s.value}</p>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-200 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Stat Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4 mb-7">
        {[
          {
            label: 'Total Orders',
            value: orders.length,
            icon: ShoppingBag,
            accent: '#e0e7ff',
            iconColor: '#4338ca',
            bar: 'bg-indigo-500',
          },
          {
            label: 'In Progress',
            value: activeCount,
            icon: Clock,
            accent: '#fef3c7',
            iconColor: '#b45309',
            bar: 'bg-amber-400',
          },
          {
            label: 'Delivered',
            value: deliveredCount,
            icon: CheckCircle2,
            accent: '#d1fae5',
            iconColor: '#065f46',
            bar: 'bg-emerald-500',
          },
        ].map((s) => (
          <div
            key={s.label}
            className="glass rounded-2xl p-5 card-shadow hover:card-shadow-lg transition-shadow duration-300 overflow-hidden relative group"
          >
            {/* colored top bar */}
            <div className={`absolute top-0 left-0 right-0 h-0.5 ${s.bar} opacity-60 group-hover:opacity-100 transition-opacity`} />

            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center mb-4"
              style={{ backgroundColor: s.accent }}
            >
              <s.icon className="w-4.5 h-4.5" style={{ color: s.iconColor, width: 18, height: 18 }} />
            </div>
            <p className="text-3xl font-extrabold text-slate-800">{s.value}</p>
            <p className="text-[11px] font-semibold text-slate-400 mt-1 uppercase tracking-wide">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Recent Orders ──────────────────────────────────────────────── */}
      <div className="glass rounded-3xl card-shadow p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[15px] font-bold text-slate-800">Recent Orders</h2>
          <Link
            href="/patient/orders"
            className="text-[12px] text-indigo-600 font-semibold hover:text-indigo-800 transition-colors inline-flex items-center gap-1"
          >
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <CardSkeleton key={i} />)}
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="py-14 text-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: '#e0e7ff' }}
            >
              <ShoppingBag className="w-7 h-7" style={{ color: '#4338ca' }} />
            </div>
            <p className="text-[13px] font-medium text-slate-500 mb-4">No orders yet — start your first request!</p>
            <Link
              href="/patient/orders/new"
              className="inline-flex items-center gap-2 bg-indigo-600 text-white text-[12px] font-bold px-5 py-2.5 rounded-xl hover:bg-indigo-700 active:scale-95 transition-all duration-200"
              style={{ boxShadow: '0 4px 14px rgba(99,102,241,0.4)' }}
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
                className="flex items-center gap-4 p-3.5 rounded-2xl hover:bg-indigo-50/60 active:scale-[0.99] transition-all duration-200 group"
              >
                {/* Medicine avatar — unique per medicine name */}
                <MedicineAvatar name={order.medicines[0]?.name ?? 'Medicine'} />

                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-slate-800 truncate group-hover:text-indigo-700 transition-colors">
                    {order.medicines.map((m) => m.name).join(', ')}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5 font-medium">{formatDate(order.createdAt)}</p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <Badge variant={statusVariant(order.status)}>
                    {statusLabel(order.status)}
                  </Badge>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ── Floating Action Button (outside main content) ──────────────── */}
      <Link
        href="/patient/orders/new"
        aria-label="New medicine request"
        className="fixed bottom-8 right-8 w-14 h-14 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:bg-indigo-700 active:scale-95 transition-all duration-200 z-50"
        style={{ boxShadow: '0 8px 25px rgba(99,102,241,0.55)' }}
      >
        <Plus className="w-6 h-6" />
      </Link>
    </div>
  );
}
