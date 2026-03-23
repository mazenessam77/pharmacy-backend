'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';

const navLinks = [
  { label: 'Home', href: '#hero' },
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'About Us', href: '#about' },
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
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-white/90 backdrop-blur-md border-b border-neutral-200 shadow-sm'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <button onClick={() => scrollTo('#hero')} className="flex items-center gap-3 group">
            <div className={`w-8 h-8 flex items-center justify-center transition-colors duration-500 ${
              scrolled ? 'bg-black' : 'bg-white'
            }`}>
              <span className={`text-[14px] font-bold ${scrolled ? 'text-white' : 'text-black'}`}>P</span>
            </div>
            <span className={`text-[13px] uppercase tracking-ultra font-light transition-colors duration-500 ${
              scrolled ? 'text-black' : 'text-white'
            }`}>
              PharmaLink
            </span>
          </button>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-10">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => scrollTo(link.href)}
                className={`text-[11px] uppercase tracking-widest transition-colors duration-300 hover:opacity-100 ${
                  scrolled ? 'text-neutral-500 hover:text-black' : 'text-white/70 hover:text-white'
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* CTA Buttons */}
          <div className="hidden lg:flex items-center gap-4">
            <Link
              href="/login"
              className={`text-[11px] uppercase tracking-widest transition-colors duration-300 ${
                scrolled ? 'text-neutral-500 hover:text-black' : 'text-white/70 hover:text-white'
              }`}
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className={`px-6 py-2.5 text-[11px] uppercase tracking-widest transition-all duration-300 ${
                scrolled
                  ? 'bg-black text-white hover:bg-neutral-800'
                  : 'bg-white text-black hover:bg-neutral-100'
              }`}
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className={`lg:hidden transition-colors ${scrolled ? 'text-black' : 'text-white'}`}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-black flex flex-col items-center justify-center gap-8"
          >
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => scrollTo(link.href)}
                className="text-[14px] uppercase tracking-ultra text-white/80 hover:text-white transition-colors"
              >
                {link.label}
              </button>
            ))}
            <div className="w-12 h-px bg-neutral-700 my-2" />
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="text-[14px] uppercase tracking-ultra text-white/60 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              onClick={() => setMobileOpen(false)}
              className="px-8 py-3 bg-white text-black text-[12px] uppercase tracking-ultra hover:bg-neutral-100 transition-colors"
            >
              Get Started
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
