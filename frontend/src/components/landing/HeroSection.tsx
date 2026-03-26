'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, MapPin, Star, Shield, Zap } from 'lucide-react';

const heroCards = [
  {
    label: 'Pain Relief',
    sub: 'Analgesics & NSAIDs',
    gradient: 'from-sky-500 to-blue-700',
    glow: 'rgba(14,165,233,0.35)',
    icon: '💊',
  },
  {
    label: 'Antibiotics',
    sub: 'Capsules & Tablets',
    gradient: 'from-amber-400 to-orange-600',
    glow: 'rgba(245,158,11,0.35)',
    icon: '🔬',
  },
  {
    label: 'Vitamins & Supplements',
    sub: 'Daily Wellness',
    gradient: 'from-emerald-400 to-teal-600',
    glow: 'rgba(16,185,129,0.35)',
    icon: '🌿',
  },
  {
    label: 'Chronic Care',
    sub: 'Diabetes & Cardio',
    gradient: 'from-violet-500 to-purple-700',
    glow: 'rgba(139,92,246,0.35)',
    icon: '❤️',
  },
];

export default function HeroSection() {
  return (
    <section
      id="hero"
      className="relative min-h-screen bg-white dark:bg-slate-950 flex items-center overflow-hidden transition-colors duration-300"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-sky-50/80 via-white to-teal-50/60 dark:from-sky-950/40 dark:via-slate-950 dark:to-teal-950/30" />
      <div
        className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(186,230,253,0.5) 0%, transparent 70%)' }}
      />
      <div
        className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(167,243,208,0.4) 0%, transparent 70%)' }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 py-32 lg:py-0 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left — Copy */}
          <div>
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
              <div className="inline-flex items-center gap-2 bg-sky-50 dark:bg-sky-900/40 border border-sky-200/80 dark:border-sky-800 rounded-full px-4 py-1.5 mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
                <span className="text-[11px] text-sky-700 dark:text-sky-300 font-semibold uppercase tracking-wider">
                  Available across all 27 governorates
                </span>
              </div>

              <h1 className="text-[clamp(38px,5vw,64px)] font-extrabold text-slate-900 dark:text-white leading-[1.05] tracking-tight mb-6">
                Your Medicine,
                <br />
                <span className="text-sky-600 dark:text-sky-400">Delivered Fast.</span>
              </h1>

              <p className="text-[15px] text-slate-500 dark:text-slate-400 leading-relaxed max-w-[420px] mb-8">
                Connect with nearby pharmacies in real-time. Upload prescriptions,
                compare offers, chat with pharmacists, and get your medicines delivered
                — all from one platform.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.22 }}
              className="flex flex-col sm:flex-row gap-3 mb-10"
            >
              <Link
                href="/register"
                className="group inline-flex items-center justify-center gap-2 bg-sky-600 text-white px-7 py-3.5 rounded-2xl text-[14px] font-semibold hover:bg-sky-700 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-sky-200 dark:shadow-sky-900/50"
              >
                Get Started Free
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-7 py-3.5 rounded-2xl text-[14px] font-semibold hover:border-sky-300 dark:hover:border-sky-700 hover:text-sky-700 dark:hover:text-sky-400 transition-all duration-200"
              >
                Sign In
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.45 }}
              className="flex flex-wrap items-center gap-5"
            >
              {[
                { icon: MapPin, text: '27 Governorates' },
                { icon: Star, text: '4.9 / 5 Rating' },
                { icon: Shield, text: 'Secure & Encrypted' },
                { icon: Zap, text: 'Real-time Updates' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5 text-sky-400" />
                  <span className="text-[12px] text-slate-500 dark:text-slate-400 font-medium">{text}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right — Category Cards */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.85, delay: 0.3 }}
            className="hidden lg:block"
          >
            <div className="grid grid-cols-2 gap-4">
              {heroCards.map((card, i) => (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.1, duration: 0.6 }}
                  whileHover={{ scale: 1.03, translateY: -4 }}
                  className={`bg-gradient-to-br ${card.gradient} rounded-2xl p-6 aspect-[4/3] flex flex-col justify-between cursor-default select-none`}
                  style={{ boxShadow: `0 16px 36px -8px ${card.glow}` }}
                >
                  <span className="text-3xl">{card.icon}</span>
                  <div>
                    <p className="text-white font-bold text-[15px] leading-tight">{card.label}</p>
                    <p className="text-white/70 text-[11px] font-medium mt-1">{card.sub}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.5 }}
              className="mt-4 mx-auto w-fit flex items-center gap-2 bg-white dark:bg-slate-800 rounded-full px-5 py-2.5 shadow-lg shadow-slate-100 dark:shadow-black/30 border border-slate-100 dark:border-slate-700"
            >
              <span className="text-[13px] font-bold text-slate-800 dark:text-slate-100">500+</span>
              <span className="text-[12px] text-slate-500 dark:text-slate-400">medicines across 27 cities</span>
            </motion.div>
          </motion.div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-px h-10 bg-gradient-to-b from-sky-400/60 to-transparent"
        />
      </motion.div>
    </section>
  );
}
