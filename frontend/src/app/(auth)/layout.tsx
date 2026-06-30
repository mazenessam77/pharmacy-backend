'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation('auth');
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();

  const features = [
    t('brand.features.instant'),
    t('brand.features.compare'),
    t('brand.features.track'),
  ];

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
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-16 relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700">
        {/* ambient highlights */}
        <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 80% 15%, rgba(255,255,255,0.5) 0%, transparent 45%)' }} />
        <div className="absolute -bottom-16 -left-16 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        {/* corner brackets */}
        <div className="absolute top-8 left-8 w-8 h-8 border-t border-l border-white/25" />
        <div className="absolute top-8 right-8 w-8 h-8 border-t border-r border-white/25" />
        <div className="absolute bottom-8 left-8 w-8 h-8 border-b border-l border-white/25" />
        <div className="absolute bottom-8 right-8 w-8 h-8 border-b border-r border-white/25" />

        <div className="relative text-white text-center max-w-xs">
          {/* Logo */}
          <h1 className="text-[44px] font-black tracking-tight leading-none mb-5">
            Pharma<span className="text-white/70">Link</span>
          </h1>

          {/* Divider */}
          <div className="w-12 h-1 rounded-full bg-white/40 mx-auto mb-5" />

          {/* Tagline */}
          <p className="text-[12px] uppercase tracking-widest text-white/70 leading-relaxed mb-10">
            {t('brand.tagline')}
          </p>

          {/* Feature list */}
          <div className="space-y-3.5 text-start">
            {features.map((feat, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                <p className="text-[11px] uppercase tracking-widest text-white/80">{feat}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right — Auth form ─────────────────────────────────────────── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-5 py-10 sm:px-10 sm:py-16 lg:px-16 bg-white overflow-y-auto">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="mb-8 sm:mb-12 lg:hidden">
            <h1 className="text-[24px] sm:text-[26px] font-black tracking-tight">Pharma<span className="bg-gradient-to-r from-blue-600 to-sky-500 bg-clip-text text-transparent">Link</span></h1>
          </div>
          {children}
        </div>
      </div>

    </div>
  );
}
