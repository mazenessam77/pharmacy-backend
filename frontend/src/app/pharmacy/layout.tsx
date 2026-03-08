'use client';

import ProtectedRoute from '@/components/shared/ProtectedRoute';
import Navbar from '@/components/shared/Navbar';
import Sidebar, { SidebarLink } from '@/components/shared/Sidebar';
import { LayoutDashboard, ShoppingBag, Package, MessageCircle, Settings } from 'lucide-react';
import { useEffect } from 'react';
import { useNotificationStore } from '@/store/notificationStore';
import { connectSocket, disconnectSocket } from '@/lib/socket';

const links: SidebarLink[] = [
  { href: '/pharmacy/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/pharmacy/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/pharmacy/inventory', label: 'Inventory', icon: Package },
  { href: '/pharmacy/chat', label: 'Messages', icon: MessageCircle },
  { href: '/pharmacy/settings', label: 'Settings', icon: Settings },
];

export default function PharmacyLayout({ children }: { children: React.ReactNode }) {
  const { fetch: fetchNotifications } = useNotificationStore();

  useEffect(() => {
    connectSocket();
    fetchNotifications();
    return () => { disconnectSocket(); };
  }, [fetchNotifications]);

  return (
    <ProtectedRoute roles={['pharmacy']}>
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
