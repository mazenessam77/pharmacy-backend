'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import Navbar from '@/components/shared/Navbar';
import Sidebar, { SidebarLink } from '@/components/shared/Sidebar';
import { LayoutDashboard, ShoppingBag, Package, MessageCircle, Settings, AlertTriangle } from 'lucide-react';
import { useNotificationStore } from '@/store/notificationStore';
import { connectSocket, disconnectSocket } from '@/lib/socket';

export default function PharmacyLayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation('nav');
  const { fetch: fetchNotifications } = useNotificationStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const links: SidebarLink[] = [
    { href: '/pharmacy/dashboard', label: t('app.sidebar.pharmacy.dashboard'), icon: LayoutDashboard },
    { href: '/pharmacy/orders', label: t('app.sidebar.pharmacy.orders'), icon: ShoppingBag },
    { href: '/pharmacy/inventory', label: t('app.sidebar.pharmacy.inventory'), icon: Package },
    { href: '/pharmacy/side-effects', label: t('app.sidebar.pharmacy.sideEffects'), icon: AlertTriangle },
    { href: '/pharmacy/chat', label: t('app.sidebar.pharmacy.messages'), icon: MessageCircle },
    { href: '/pharmacy/settings', label: t('app.sidebar.pharmacy.settings'), icon: Settings },
  ];

  useEffect(() => {
    connectSocket();
    fetchNotifications();
    return () => { disconnectSocket(); };
  }, [fetchNotifications]);

  return (
    <ProtectedRoute roles={['pharmacy']}>
      <div className="min-h-screen bg-white">
        <Navbar onMenuToggle={() => setSidebarOpen(true)} />
        <div className="flex">
          <Sidebar
            links={links}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
          <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-x-hidden">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
