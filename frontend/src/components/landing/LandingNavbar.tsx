'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Cross } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import LanguageSwitcher from '@/components/shared/LanguageSwitcher';

const navLinks = [
  { key: 'links.features', href: '#features' },
  { key: 'links.categories', href: '#categories' },
  { key: 'links.howItWorks', href: '#how-it-works' },
  { key: 'links.news', href: '#news' },
  { key: 'links.about', href: '#about' },
] as const;

export default function LandingNavbar() {
  const { t } = useTranslation('nav');
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
            ? 'bg-white/95  backdrop-blur-md  shadow-neutral-100  border-b border-neutral-100 '
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between h-16 lg:h-18">
          {/* Logo */}
          <button
            onClick={() => scrollTo('#hero')}
            aria-label={t('aria.home')}
            className="flex items-center gap-2.5 group"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-sky-500 rounded-[10px] flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
              <Cross className="w-4 h-4 text-white fill-white" />
            </div>
            <span className={`text-[15px] font-bold tracking-tight transition-colors ${
              scrolled ? 'text-neutral-900' : 'text-neutral-900'
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
                    ? 'text-neutral-500 hover:text-neutral-900'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                {t(link.key)}
              </button>
            ))}
          </nav>

          {/* CTA Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            <LanguageSwitcher variant="full" />
            <Link
              href="/login"
              className={`text-[13px] font-medium px-4 py-2 rounded-none transition-colors duration-200 ${
                scrolled
                  ? 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              {t('actions.signIn')}
            </Link>
            <Link
              href="/register"
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-sky-500 text-white text-[13px] font-semibold rounded-full hover:shadow-lg hover:shadow-blue-500/30 active:scale-95 transition-all duration-200"
            >
              {t('actions.getStarted')}
            </Link>
          </div>

          {/* Mobile: switcher + hamburger */}
          <div className="lg:hidden flex items-center gap-1">
            <LanguageSwitcher variant="compact" />
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? t('aria.closeMenu') : t('aria.openMenu')}
              aria-expanded={mobileOpen}
              className={`p-2 rounded-none transition-colors ${
                scrolled
                  ? 'text-neutral-700 hover:bg-neutral-100'
                  : 'text-neutral-700 hover:bg-neutral-100'
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
            className="fixed inset-x-0 top-16 z-40 bg-white border-b border-neutral-100 shadow-neutral-100/50 px-6 py-6"
          >
            <div className="flex flex-col gap-1 mb-6">
              {navLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => scrollTo(link.href)}
                  className="text-start px-4 py-3 text-[14px] font-medium text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 rounded-none transition-colors"
                >
                  {t(link.key)}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-3 pt-4 border-t border-neutral-100">
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="w-full py-3 text-center text-[14px] font-semibold text-neutral-700 border border-neutral-200 rounded-none hover:border-neutral-200 hover:text-neutral-900 transition-colors"
              >
                {t('actions.signIn')}
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileOpen(false)}
                className="w-full py-3 text-center text-[14px] font-semibold text-white bg-gradient-to-r from-blue-600 to-sky-500 rounded-full hover:shadow-lg transition-shadow"
              >
                {t('actions.getStartedFree')}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
