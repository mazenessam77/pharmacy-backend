'use client';

import ProtectedRoute from '@/components/shared/ProtectedRoute';
import Navbar from '@/components/shared/Navbar';
import Sidebar, { SidebarLink } from '@/components/shared/Sidebar';
import { LayoutDashboard, ShoppingBag, Plus, MessageCircle, User } from 'lucide-react';
import { useEffect } from 'react';
import { useNotificationStore } from '@/store/notificationStore';
import { connectSocket, disconnectSocket } from '@/lib/socket';

const links: SidebarLink[] = [
  { href: '/patient/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/patient/orders', label: 'My Orders', icon: ShoppingBag },
  { href: '/patient/orders/new', label: 'New Request', icon: Plus },
  { href: '/patient/chat', label: 'Messages', icon: MessageCircle },
  { href: '/patient/profile', label: 'Profile', icon: User },
];

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  const { fetch: fetchNotifications } = useNotificationStore();

  useEffect(() => {
    connectSocket();
    fetchNotifications();
    return () => { disconnectSocket(); };
  }, [fetchNotifications]);

  return (
    <ProtectedRoute roles={['patient']}>
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="flex">
          <Sidebar links={links} variant="indigo" />
          <main className="flex-1 p-8">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
