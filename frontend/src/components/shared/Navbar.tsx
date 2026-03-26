'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { Bell, LogOut, User, ChevronDown, Menu } from 'lucide-react';
import ThemeToggle from '@/components/ui/ThemeToggle';

interface NavbarProps {
  onMenuToggle?: () => void;
}

export default function Navbar({ onMenuToggle }: NavbarProps) {
  const { user, logout } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const basePath = user?.role === 'admin' ? '/admin' : user?.role === 'pharmacy' ? '/pharmacy' : '/patient';

  return (
    <header className="h-14 border-b border-neutral-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center px-4 sm:px-6 justify-between sticky top-0 z-30 transition-colors duration-200">
      <div className="flex items-center gap-3">
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="md:hidden p-1.5 rounded-lg text-neutral-500 dark:text-slate-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <Link href={`${basePath}/dashboard`} className="text-[13px] font-bold text-slate-800 dark:text-slate-100 tracking-tight">
          PharmaLink
        </Link>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <ThemeToggle />

        {/* Notifications */}
        <Link href={`${basePath}/notifications`} className="relative text-neutral-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-sky-600 text-white text-[9px] rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        {/* User Menu */}
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-1.5 text-[12px] font-medium text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
          >
            <span className="max-w-[80px] truncate">{user?.name?.split(' ')[0]}</span>
            <ChevronDown className="w-3 h-3 shrink-0" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 border border-neutral-200 dark:border-slate-700 rounded-xl shadow-lg dark:shadow-black/30 z-50 overflow-hidden">
              <Link
                href={`${basePath}/profile`}
                className="flex items-center gap-2 px-4 py-3 text-[12px] font-medium text-neutral-600 dark:text-slate-300 hover:bg-neutral-50 dark:hover:bg-slate-700 transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                <User className="w-3.5 h-3.5" />
                Profile
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-3 text-[12px] font-medium text-neutral-600 dark:text-slate-300 hover:bg-neutral-50 dark:hover:bg-slate-700 transition-colors border-t border-neutral-100 dark:border-slate-700"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
