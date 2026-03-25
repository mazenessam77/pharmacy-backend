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
            'radial-gradient(ellipse at 80% 0%, rgba(99,102,241,0.06) 0%, transparent 60%),' +
            'radial-gradient(ellipse at 0% 100%, rgba(59,130,246,0.05) 0%, transparent 60%),' +
            'linear-gradient(180deg, #f0f4ff 0%, #f8f9ff 50%, #fafbff 100%)',
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
