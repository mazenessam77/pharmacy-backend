'use client';

import { useState } from 'react';
import Navbar from '@/components/shared/Navbar';
import Sidebar, { SidebarLink } from '@/components/shared/Sidebar';
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import { LayoutDashboard, ShoppingBag, PlusCircle, User } from 'lucide-react';

const links: SidebarLink[] = [
  { href: '/patient/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/patient/orders', label: 'My Orders', icon: ShoppingBag },
  { href: '/patient/orders/new', label: 'New Request', icon: PlusCircle },
  { href: '/patient/profile', label: 'Profile', icon: User },
];

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ProtectedRoute roles={['patient']}>
      <div
        className="min-h-screen"
        style={{
          background:
            'radial-gradient(ellipse at 80% 0%, rgba(14,165,233,0.07) 0%, transparent 60%),' +
            'radial-gradient(ellipse at 0% 100%, rgba(13,148,136,0.05) 0%, transparent 60%),' +
            'linear-gradient(180deg, #f0f9ff 0%, #f8fffe 50%, #fafffe 100%)',
        }}
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
