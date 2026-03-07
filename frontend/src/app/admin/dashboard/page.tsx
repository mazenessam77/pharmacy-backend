'use client';

import { useEffect, useState } from 'react';
import { adminService } from '@/lib/services/adminService';
import { AdminStats } from '@/types';
import { CardSkeleton } from '@/components/ui/Skeleton';

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await adminService.getStats();
        setStats(res.data.data?.stats || res.data.data);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl space-y-4">
        <CardSkeleton />
        <div className="grid grid-cols-3 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  const statCards = stats
    ? [
        { label: 'Total Patients', value: stats.totalPatients },
        { label: 'Total Pharmacies', value: stats.totalPharmacies },
        { label: 'Total Orders', value: stats.totalOrders },
        { label: "Today's Orders", value: stats.todayOrders },
        { label: 'Delivered', value: stats.deliveredOrders },
      ]
    : [];

  return (
    <div className="max-w-4xl">
      <p className="text-[11px] uppercase tracking-widest text-neutral-400 mb-1">Administration</p>
      <h1 className="text-[28px] font-light uppercase tracking-wide mb-10">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-px bg-neutral-200 border border-neutral-200">
        {statCards.map((s) => (
          <div key={s.label} className="bg-white p-6 text-center">
            <p className="text-[32px] font-light">{s.value}</p>
            <p className="text-[10px] uppercase tracking-widest text-neutral-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
