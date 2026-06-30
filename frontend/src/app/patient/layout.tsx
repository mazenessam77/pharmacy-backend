'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Navbar from '@/components/shared/Navbar';
import Sidebar, { SidebarLink } from '@/components/shared/Sidebar';
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import { LayoutDashboard, ShoppingBag, PlusCircle, User, AlertTriangle, Pill, Heart, FileText } from 'lucide-react';

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation('nav');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const links: SidebarLink[] = [
    { href: '/patient/dashboard', label: t('app.sidebar.patient.dashboard'), icon: LayoutDashboard },
    { href: '/patient/orders', label: t('app.sidebar.patient.orders'), icon: ShoppingBag },
    { href: '/patient/orders/new', label: t('app.sidebar.patient.newRequest'), icon: PlusCircle },
    { href: '/patient/medicines', label: t('app.sidebar.patient.medicines'), icon: Pill },
    { href: '/patient/prescriptions', label: t('app.sidebar.patient.prescriptions'), icon: FileText },
    { href: '/patient/saved', label: t('app.sidebar.patient.saved'), icon: Heart },
    { href: '/patient/side-effects', label: t('app.sidebar.patient.sideEffects'), icon: AlertTriangle },
    { href: '/patient/profile', label: t('app.sidebar.patient.profile'), icon: User },
  ];

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
