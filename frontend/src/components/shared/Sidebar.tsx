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
}

export default function Sidebar({ links }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-56 border-r border-neutral-200 bg-white min-h-[calc(100vh-3.5rem)] py-8 px-4">
      <nav className="space-y-1">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 text-[11px] uppercase tracking-widest transition-colors duration-200 ${
                isActive
                  ? 'bg-black text-white'
                  : 'text-neutral-500 hover:text-black hover:bg-neutral-50'
              }`}
            >
              <link.icon className="w-4 h-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
