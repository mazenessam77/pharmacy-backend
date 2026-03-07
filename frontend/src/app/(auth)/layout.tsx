'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && user) {
      const routes: Record<string, string> = {
        patient: '/patient/dashboard',
        pharmacy: '/pharmacy/dashboard',
        admin: '/admin/dashboard',
      };
      router.replace(routes[user.role] || '/');
    }
  }, [isAuthenticated, user, router]);

  return (
    <div className="min-h-screen flex">
      {/* Left — Editorial branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-black items-center justify-center p-16">
        <div className="text-white text-center">
          <h1 className="text-[42px] font-light uppercase tracking-ultra leading-tight mb-6">
            Pharma<br />Link
          </h1>
          <div className="w-12 h-px bg-neutral-600 mx-auto mb-6" />
          <p className="text-[12px] uppercase tracking-widest text-neutral-400 max-w-xs leading-relaxed">
            Your neighbourhood pharmacy, connected
          </p>
        </div>
      </div>

      {/* Right — Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-8 py-16 sm:px-16">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="mb-12 lg:hidden">
            <h1 className="text-[24px] font-light uppercase tracking-ultra">PharmaLink</h1>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
