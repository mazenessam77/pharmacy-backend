'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useOrderStore } from '@/store/orderStore';
import { pharmacyService } from '@/lib/services/pharmacyService';
import { userService } from '@/lib/services/userService';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { statusLabel, statusVariant, formatDate } from '@/lib/helpers';
import { getSocket } from '@/lib/socket';
import toast from 'react-hot-toast';
import { Power, ArrowRight } from 'lucide-react';

export default function PharmacyDashboard() {
  const { user } = useAuthStore();
  const { orders, fetchOrders, isLoading } = useOrderStore();
  const [isOnline, setIsOnline] = useState(false);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    fetchOrders({ page: 1 });
    // Load actual isOpen state from pharmacy profile
    userService.getProfile().then((res) => {
      const pharmacy = res.data.data?.pharmacyProfile || res.data.data?.pharmacy;
      if (pharmacy) setIsOnline(pharmacy.isOpen ?? true);
    }).catch(() => {});

    let cleanup = false;
    const setup = async () => {
      const socket = await getSocket();
      if (cleanup) return;
      socket.on('pharmacy:new-order', () => {
        toast.success('New order received');
        fetchOrders({ page: 1 });
      });
    };
    setup();

    return () => {
      cleanup = true;
      getSocket().then((s) => s.off('pharmacy:new-order'));
    };
  }, [fetchOrders]);

  const toggleOnline = async () => {
    setToggling(true);
    try {
      const socket = await getSocket();
      socket.emit(isOnline ? 'pharmacy:go-offline' : 'pharmacy:go-online');
      await pharmacyService.toggleStatus();
      setIsOnline(!isOnline);
    } catch {
      toast.error('Failed to toggle status');
    } finally {
      setToggling(false);
    }
  };

  const pendingOrders = orders.filter((o) => ['pending', 'offered'].includes(o.status));
  const activeOrders = orders.filter((o) => ['confirmed', 'preparing', 'out_for_delivery'].includes(o.status));
  const deliveredCount = orders.filter((o) => o.status === 'delivered').length;

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-10">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-neutral-400 mb-1">Dashboard</p>
          <h1 className="text-[28px] font-light uppercase tracking-wide">
            Welcome, {user?.name?.split(' ')[0]}
          </h1>
        </div>
        <Button
          variant={isOnline ? 'primary' : 'outline'}
          size="sm"
          onClick={toggleOnline}
          isLoading={toggling}
        >
          <Power className="w-3.5 h-3.5" />
          {isOnline ? 'Online' : 'Offline'}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-px bg-neutral-200 border border-neutral-200 mb-10">
        {[
          { label: 'Pending Requests', value: pendingOrders.length },
          { label: 'Active Orders', value: activeOrders.length },
          { label: 'Delivered', value: deliveredCount },
        ].map((stat) => (
          <div key={stat.label} className="bg-white p-6 text-center">
            <p className="text-[32px] font-light">{stat.value}</p>
            <p className="text-[10px] uppercase tracking-widest text-neutral-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Pending Orders */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[11px] uppercase tracking-widest">Incoming Requests</h2>
          <Link
            href="/pharmacy/orders"
            className="text-[11px] uppercase tracking-widest text-neutral-400 hover:text-black transition-colors inline-flex items-center gap-1"
          >
            View All <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <CardSkeleton key={i} />)}
          </div>
        ) : pendingOrders.length === 0 ? (
          <div className="border border-neutral-200 p-10 text-center">
            <p className="text-[12px] text-neutral-400">No pending requests</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingOrders.slice(0, 5).map((order) => (
              <Link
                key={order._id}
                href={`/pharmacy/orders/${order._id}`}
                className="block border border-neutral-200 p-5 hover:border-black transition-colors duration-300"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[13px] mb-1">
                      {order.medicines.map((m) => `${m.name} x${m.quantity}`).join(', ')}
                    </p>
                    <p className="text-[11px] text-neutral-400">
                      {order.deliveryType} · {formatDate(order.createdAt)}
                    </p>
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
