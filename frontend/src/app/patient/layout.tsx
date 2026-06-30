'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/shared/Navbar';
import Sidebar, { SidebarLink } from '@/components/shared/Sidebar';
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import { LayoutDashboard, ShoppingBag, PlusCircle, User, AlertTriangle, Pill, Heart, FileText, MessageCircle } from 'lucide-react';
import { useNotificationStore } from '@/store/notificationStore';
import { connectSocket, disconnectSocket } from '@/lib/socket';

const links: SidebarLink[] = [
  { href: '/patient/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/patient/orders', label: 'My Orders', icon: ShoppingBag },
  { href: '/patient/orders/new', label: 'New Request', icon: PlusCircle },
  { href: '/patient/medicines', label: 'Medicines', icon: Pill },
  { href: '/patient/prescriptions', label: 'Prescriptions', icon: FileText },
  { href: '/patient/saved', label: 'Saved', icon: Heart },
  { href: '/patient/side-effects', label: 'Side Effects', icon: AlertTriangle },
  { href: '/patient/chat', label: 'Messages', icon: MessageCircle },
  { href: '/patient/profile', label: 'Profile', icon: User },
];

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  const { fetch: fetchNotifications } = useNotificationStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Connect the realtime socket for the whole patient area (parity with the
  // pharmacy/admin layouts). Without this the patient socket stays disconnected,
  // so chat messages never arrive and the patient's own messages are never sent.
  useEffect(() => {
    connectSocket();
    fetchNotifications();
    return () => { disconnectSocket(); };
  }, [fetchNotifications]);

  return (
    <ProtectedRoute roles={['patient']}>
      <div
        className="min-h-screen patient-bg transition-colors duration-200"
      >
        <Navbar onMenuToggle={() => setSidebarOpen(true)} />
        <div className="flex">
          <Sidebar
            links={links}
            variant="indigo"
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
          <main className="flex-1 p-4 sm:p-6 md:p-8 min-h-[calc(100vh-3.5rem)] overflow-x-hidden">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
