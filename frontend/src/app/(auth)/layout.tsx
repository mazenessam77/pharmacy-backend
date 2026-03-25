'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

const FEATURES = [
  'Request any medicine instantly',
  'Compare offers from nearby pharmacies',
  'Track your order in real time',
];

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

      {/* ── Left — Editorial branding panel ──────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-1/2 bg-black items-center justify-center p-16 relative overflow-hidden"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(255,255,255,0.045) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      >
        {/* corner brackets */}
        <div className="absolute top-8 left-8 w-8 h-8 border-t border-l border-neutral-800" />
        <div className="absolute top-8 right-8 w-8 h-8 border-t border-r border-neutral-800" />
        <div className="absolute bottom-8 left-8 w-8 h-8 border-b border-l border-neutral-800" />
        <div className="absolute bottom-8 right-8 w-8 h-8 border-b border-r border-neutral-800" />

        <div className="text-white text-center max-w-xs">
          {/* Logo */}
          <h1 className="text-[42px] font-light uppercase tracking-ultra leading-tight mb-5">
            Pharma<br />Link
          </h1>

          {/* Divider */}
          <div className="w-10 h-px bg-neutral-700 mx-auto mb-5" />

          {/* Tagline */}
          <p className="text-[11px] uppercase tracking-widest text-neutral-500 leading-relaxed mb-10">
            Your neighbourhood pharmacy,<br />connected across Egypt
          </p>

          {/* Feature list */}
          <div className="space-y-3.5 text-left">
            {FEATURES.map((feat, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-px h-3 bg-neutral-700 shrink-0" />
                <p className="text-[11px] uppercase tracking-widest text-neutral-600">{feat}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right — Auth form ─────────────────────────────────────────── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-8 py-16 sm:px-16 bg-white">
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
