'use client';

import Link from 'next/link';
import { Cross } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-neutral-950 text-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-sky-500 rounded-[10px] flex items-center justify-center shadow-md">
                <Cross className="w-4 h-4 text-white fill-white" />
              </div>
              <span className="text-[15px] font-bold tracking-tight">PharmaLink</span>
            </div>
            <p className="text-[13px] text-neutral-400 leading-relaxed max-w-sm">
              Connecting patients with nearby pharmacies — find your medicines,
              compare offers, and get them delivered to your door.
            </p>
            <div className="flex items-center gap-6 mt-6">
              {[{ value: '27', label: 'Cities' }, { value: '500+', label: 'Medicines' }, { value: '24/7', label: 'Available' }].map((s) => (
                <div key={s.label}>
                  <p className="text-[16px] font-extrabold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">{s.value}</p>
                  <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-medium">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-widest text-neutral-500 mb-5">Platform</h4>
            <div className="space-y-3">
              {[{ label: 'Sign In', href: '/login' }, { label: 'Register as Patient', href: '/register' }, { label: 'Register Pharmacy', href: '/register' }].map((link) => (
                <Link key={link.label} href={link.href} className="block text-[13px] text-neutral-400 hover:text-white transition-colors duration-200">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-neutral-800">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[12px] text-neutral-500">&copy; 2026 PharmaLink. All rights reserved.</p>
          <p className="text-[12px] text-neutral-600">Your health, delivered.</p>
        </div>
      </div>
    </footer>
  );
}
