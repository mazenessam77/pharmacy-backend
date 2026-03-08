'use client';

import ProtectedRoute from '@/components/shared/ProtectedRoute';
import Navbar from '@/components/shared/Navbar';
import Sidebar, { SidebarLink } from '@/components/shared/Sidebar';
import { LayoutDashboard, Users, Building2, ShoppingBag, Pill } from 'lucide-react';
import { useEffect } from 'react';
import { useNotificationStore } from '@/store/notificationStore';
import { connectSocket, disconnectSocket } from '@/lib/socket';

const links: SidebarLink[] = [
  { href: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/pharmacies', label: 'Pharmacies', icon: Building2 },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/medicines', label: 'Medicines', icon: Pill },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { fetch: fetchNotifications } = useNotificationStore();

  useEffect(() => {
    connectSocket();
    fetchNotifications();
    return () => { disconnectSocket(); };
  }, [fetchNotifications]);

  return (
    <ProtectedRoute roles={['admin']}>
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex">
          <Sidebar links={links} />
          <main className="flex-1 p-8">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
