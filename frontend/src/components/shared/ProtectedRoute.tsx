'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[];
}

export default function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading, getMe } = useAuthStore();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const check = async () => {
      if (!isAuthenticated) {
        await getMe();
      }
      setChecked(true);
    };
    check();
  }, [isAuthenticated, getMe]);

  useEffect(() => {
    if (!checked || isLoading) return;

    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    if (roles && user && !roles.includes(user.role)) {
      const routes: Record<string, string> = {
        patient: '/patient/dashboard',
        pharmacy: '/pharmacy/dashboard',
        admin: '/admin/dashboard',
      };
      router.replace(routes[user.role] || '/login');
    }
  }, [checked, isLoading, isAuthenticated, user, roles, router]);

  if (!checked || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-5 h-5 border border-black border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;
  if (roles && user && !roles.includes(user.role)) return null;

  return <>{children}</>;
}
