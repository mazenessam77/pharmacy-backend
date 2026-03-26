'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LucideIcon, X } from 'lucide-react';

export interface SidebarLink {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface SidebarProps {
  links: SidebarLink[];
  variant?: 'dark' | 'indigo';
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ links, variant = 'dark', isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const isIndigo = variant === 'indigo';

  const navContent = (
    <nav className="space-y-1">
      {links.map((link) => {
        const isActive = pathname === link.href;

        if (isIndigo) {
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[12px] font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-sky-600 text-white shadow-lg shadow-sky-200/60 dark:shadow-sky-950/60'
                  : 'text-slate-500 dark:text-zinc-400 hover:bg-white/80 dark:hover:bg-zinc-800/60 hover:text-sky-700 dark:hover:text-sky-300 hover:shadow-sm'
              }`}
            >
              <link.icon className="w-4 h-4 shrink-0" />
              {link.label}
              {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/70" />}
            </Link>
          );
        }

        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onClose}
            className={`flex items-center gap-3 px-3 py-2.5 text-[11px] uppercase tracking-widest transition-all duration-200 ${
              isActive
                ? 'bg-black dark:bg-sky-600 text-white'
                : 'text-neutral-500 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-zinc-800'
            }`}
          >
            <link.icon className="w-4 h-4 shrink-0" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* ── Desktop sidebar (md+) ─────────────────────────────────── */}
      <aside
        className={`hidden md:block w-60 min-h-[calc(100vh-3.5rem)] py-6 px-3 shrink-0 transition-colors duration-200 ${
          isIndigo
            ? 'glass border-r border-white/40 dark:border-zinc-800/60'
            : 'bg-white dark:bg-zinc-950 border-r border-neutral-200 dark:border-zinc-800'
        }`}
      >
        {navContent}
      </aside>

      {/* ── Mobile drawer backdrop ────────────────────────────────── */}
      <div
        className={`md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* ── Mobile drawer ─────────────────────────────────────────── */}
      <aside
        className={`md:hidden fixed top-0 left-0 h-full w-72 z-50 flex flex-col py-6 px-3 shadow-2xl transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${
          isIndigo
            ? 'bg-white dark:bg-zinc-950 border-r border-sky-100 dark:border-zinc-800'
            : 'bg-white dark:bg-zinc-950 border-r border-neutral-200 dark:border-zinc-800'
        }`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between mb-6 px-1.5">
          <span className="text-[13px] font-bold text-slate-800 dark:text-zinc-100 tracking-tight">PharmaLink</span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 dark:text-zinc-500 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">{navContent}</div>
      </aside>
    </>
  );
}
