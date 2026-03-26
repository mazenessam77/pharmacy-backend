'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Cross } from 'lucide-react';
import ThemeToggle from '@/components/ui/ThemeToggle';

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Categories', href: '#categories' },
  { label: 'About', href: '#about' },
];

export default function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (href: string) => {
    setMobileOpen(false);
    const el = document.querySelector(href);
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-sm shadow-slate-100 dark:shadow-black/20 border-b border-slate-100 dark:border-slate-800'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between h-16 lg:h-18">
          {/* Logo */}
          <button onClick={() => scrollTo('#hero')} className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-sky-600 rounded-xl flex items-center justify-center shadow-sm shadow-sky-200 dark:shadow-sky-900 group-hover:bg-sky-700 transition-colors">
              <Cross className="w-4 h-4 text-white fill-white" />
            </div>
            <span className={`text-[15px] font-bold tracking-tight transition-colors ${
              scrolled ? 'text-slate-900 dark:text-white' : 'text-white'
            }`}>
              PharmaLink
            </span>
          </button>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => scrollTo(link.href)}
                className={`text-[13px] font-medium transition-colors duration-200 ${
                  scrolled
                    ? 'text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* CTA Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/login"
              className={`text-[13px] font-medium px-4 py-2 rounded-xl transition-colors duration-200 ${
                scrolled
                  ? 'text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/30'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-5 py-2.5 bg-sky-600 text-white text-[13px] font-semibold rounded-xl hover:bg-sky-700 active:scale-95 transition-all duration-200 shadow-sm shadow-sky-200 dark:shadow-sky-900"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile: theme toggle + hamburger */}
          <div className="lg:hidden flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className={`p-2 rounded-lg transition-colors ${
                scrolled
                  ? 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-16 z-40 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shadow-lg shadow-slate-100/50 dark:shadow-black/30 px-6 py-6"
          >
            <div className="flex flex-col gap-1 mb-6">
              {navLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => scrollTo(link.href)}
                  className="text-left px-4 py-3 text-[14px] font-medium text-slate-700 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/20 rounded-xl transition-colors"
                >
                  {link.label}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="w-full py-3 text-center text-[14px] font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-sky-300 hover:text-sky-600 dark:hover:border-sky-700 dark:hover:text-sky-400 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileOpen(false)}
                className="w-full py-3 text-center text-[14px] font-semibold text-white bg-sky-600 rounded-xl hover:bg-sky-700 transition-colors"
              >
                Get Started Free
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
