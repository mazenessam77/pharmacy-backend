'use client';

import ProtectedRoute from '@/components/shared/ProtectedRoute';
import Navbar from '@/components/shared/Navbar';
import Sidebar, { SidebarLink } from '@/components/shared/Sidebar';
import { LayoutDashboard, Users, Building2, ShoppingBag, Pill, AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNotificationStore } from '@/store/notificationStore';
import { connectSocket, disconnectSocket } from '@/lib/socket';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation('nav');
  const { fetch: fetchNotifications } = useNotificationStore();

  const links: SidebarLink[] = [
    { href: '/admin/dashboard', label: t('app.sidebar.admin.overview'), icon: LayoutDashboard },
    { href: '/admin/users', label: t('app.sidebar.admin.users'), icon: Users },
    { href: '/admin/pharmacies', label: t('app.sidebar.admin.pharmacies'), icon: Building2 },
    { href: '/admin/orders', label: t('app.sidebar.admin.orders'), icon: ShoppingBag },
    { href: '/admin/medicines', label: t('app.sidebar.admin.medicines'), icon: Pill },
    { href: '/admin/side-effects', label: t('app.sidebar.admin.sideEffects'), icon: AlertTriangle },
  ];

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
