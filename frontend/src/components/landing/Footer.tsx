'use client';

import Link from 'next/link';
import { Cross } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 dark:bg-black text-white border-t border-slate-800 dark:border-zinc-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-sky-600 rounded-xl flex items-center justify-center shadow-sm">
                <Cross className="w-4 h-4 text-white fill-white" />
              </div>
              <span className="text-[15px] font-bold tracking-tight">PharmaLink</span>
            </div>
            <p className="text-[13px] text-slate-400 leading-relaxed max-w-sm">
              Connecting patients with nearby pharmacies through real-time technology.
              A graduation project built with modern web technologies.
            </p>
            <div className="flex items-center gap-6 mt-6">
              {[{ value: '27', label: 'Cities' }, { value: '500+', label: 'Medicines' }, { value: '24/7', label: 'Available' }].map((s) => (
                <div key={s.label}>
                  <p className="text-[16px] font-extrabold text-white">{s.value}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-medium">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 mb-5">Platform</h4>
            <div className="space-y-3">
              {[{ label: 'Sign In', href: '/login' }, { label: 'Register as Patient', href: '/register' }, { label: 'Register Pharmacy', href: '/register' }].map((link) => (
                <Link key={link.label} href={link.href} className="block text-[13px] text-slate-400 hover:text-sky-400 transition-colors duration-200">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 mb-5">Built With</h4>
            <div className="space-y-3">
              {['Next.js 14', 'Express.js', 'MongoDB', 'Socket.IO', 'Docker', 'AWS EC2'].map((tech) => (
                <p key={tech} className="text-[13px] text-slate-400">{tech}</p>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-800 dark:border-zinc-900">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[12px] text-slate-500">&copy; 2026 PharmaLink — Graduation Project</p>
          <p className="text-[12px] text-slate-600">Faculty of Computer Science</p>
        </div>
      </div>
    </footer>
  );
}
