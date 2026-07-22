'use client';

import Link from 'next/link';
import { Cross } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation('footer');

  const stats = [
    { value: '27', label: t('stats.cities') },
    { value: '500+', label: t('stats.medicines') },
    { value: '24/7', label: t('stats.available') },
  ];

  const links = [
    { label: t('links.signIn'), href: '/login' },
    { label: t('links.registerPatient'), href: '/register' },
    { label: t('links.registerPharmacy'), href: '/register' },
  ];

  return (
    <footer className="bg-[#0b1220] text-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 bg-blue-600 rounded-[10px] flex items-center justify-center">
                <Cross className="w-4 h-4 text-white fill-white" />
              </div>
              <span className="text-[16px] font-bold tracking-tight">PharmaLink</span>
            </div>
            <p className="text-[13.5px] text-neutral-400 leading-relaxed max-w-sm">
              {t('tagline')}
            </p>
            <div className="flex items-center gap-8 mt-7">
              {stats.map((s) => (
                <div key={s.label}>
                  <p className="text-[17px] font-bold text-white">{s.value}</p>
                  <p className="text-[10px] text-neutral-500 uppercase tracking-[0.14em] font-semibold mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500 mb-5">{t('platform')}</h4>
            <div className="space-y-3">
              {links.map((link) => (
                <Link key={link.label} href={link.href} className="block text-[13.5px] text-neutral-400 hover:text-white transition-colors duration-200">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[12px] text-neutral-500">{t('copyright', { year: new Date().getFullYear() })}</p>
          <p className="text-[12px] text-neutral-600">{t('slogan')}</p>
        </div>
      </div>
    </footer>
  );
}
