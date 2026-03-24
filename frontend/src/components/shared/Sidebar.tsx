'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LucideIcon } from 'lucide-react';

export interface SidebarLink {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface SidebarProps {
  links: SidebarLink[];
  variant?: 'dark' | 'indigo';
}

export default function Sidebar({ links, variant = 'dark' }: SidebarProps) {
  const pathname = usePathname();

  const isIndigo = variant === 'indigo';

  return (
    <aside
      className={`w-60 min-h-[calc(100vh-3.5rem)] py-6 px-3 shrink-0 ${
        isIndigo
          ? 'glass border-r border-white/40'
          : 'bg-white border-r border-neutral-200'
      }`}
    >
      <nav className="space-y-1">
        {links.map((link) => {
          const isActive = pathname === link.href;

          if (isIndigo) {
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[12px] font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200/60'
                    : 'text-slate-500 hover:bg-white/80 hover:text-indigo-700 hover:shadow-sm hover:shadow-indigo-100/50'
                }`}
              >
                <link.icon
                  className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                    isActive ? '' : 'group-hover:scale-110'
                  }`}
                />
                {link.label}
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/70" />
                )}
              </Link>
            );
          }

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 text-[11px] uppercase tracking-widest transition-all duration-200 ${
                isActive
                  ? 'bg-black text-white'
                  : 'text-neutral-500 hover:text-black hover:bg-neutral-50'
              }`}
            >
              <link.icon className="w-4 h-4 shrink-0" />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
