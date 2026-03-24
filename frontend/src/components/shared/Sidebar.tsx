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

  const activeClass =
    variant === 'indigo'
      ? 'bg-indigo-600 text-white rounded-xl shadow-sm'
      : 'bg-black text-white';

  const inactiveClass =
    variant === 'indigo'
      ? 'text-neutral-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-xl'
      : 'text-neutral-500 hover:text-black hover:bg-neutral-50';

  return (
    <aside className="w-56 border-r border-neutral-200 bg-white min-h-[calc(100vh-3.5rem)] py-8 px-3">
      <nav className="space-y-1">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 text-[11px] uppercase tracking-widest transition-all duration-200 ${
                isActive ? activeClass : inactiveClass
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
