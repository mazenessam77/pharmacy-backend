'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, MapPin, Star, Shield, Zap } from 'lucide-react';

const heroCards = [
  {
    label: 'Pain Relief',
    sub: 'Analgesics & NSAIDs',
    gradient: 'bg-black',
    glow: 'rgba(14,165,233,0.35)',
    icon: '💊',
  },
  {
    label: 'Antibiotics',
    sub: 'Capsules & Tablets',
    gradient: 'bg-black',
    glow: 'rgba(245,158,11,0.35)',
    icon: '🔬',
  },
  {
    label: 'Vitamins & Supplements',
    sub: 'Daily Wellness',
    gradient: 'bg-black',
    glow: 'rgba(16,185,129,0.35)',
    icon: '🌿',
  },
  {
    label: 'Chronic Care',
    sub: 'Diabetes & Cardio',
    gradient: 'bg-black',
    glow: 'rgba(139,92,246,0.35)',
    icon: '❤️',
  },
];

export default function HeroSection() {
  return (
    <section
      id="hero"
      className="relative min-h-screen bg-white flex items-center overflow-hidden transition-colors duration-300"
    >
      {/* Flat white backdrop */}
      <div className="absolute inset-0 bg-white" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 py-32 lg:py-0 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left — Copy */}
          <div>
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
              <div className="inline-flex items-center gap-2 bg-neutral-100 border border-neutral-200/80 rounded-none px-4 py-1.5 mb-6">
                <span className="w-1.5 h-1.5 rounded-none bg-black animate-pulse" />
                <span className="text-[11px] text-neutral-900 font-semibold uppercase tracking-wider">
                  Available across all 27 governorates
                </span>
              </div>

              <h1 className="text-[clamp(38px,5vw,64px)] font-extrabold text-neutral-900 leading-[1.05] tracking-tight mb-6">
                Your Medicine,
                <br />
                <span className="text-neutral-900">Delivered Fast.</span>
              </h1>

              <p className="text-[15px] text-neutral-500 leading-relaxed max-w-[420px] mb-8">
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
                className="group inline-flex items-center justify-center gap-2 bg-black text-white px-7 py-3.5 rounded-none text-[14px] font-semibold hover:bg-black active:scale-[0.98] transition-all duration-200"
              >
                Get Started Free
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 bg-white border border-neutral-200 text-neutral-700 px-7 py-3.5 rounded-none text-[14px] font-semibold hover:border-neutral-200 hover:text-neutral-900 transition-all duration-200"
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
                  <Icon className="w-3.5 h-3.5 text-neutral-500" />
                  <span className="text-[12px] text-neutral-500 font-medium">{text}</span>
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
                  className={` ${card.gradient} rounded-none p-6 aspect-[4/3] flex flex-col justify-between cursor-default select-none`}
                  style={{ boxShadow: 'none' }}
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
              className="mt-4 mx-auto w-fit flex items-center gap-2 bg-white rounded-none px-5 py-2.5 shadow-neutral-100 border border-neutral-100"
            >
              <span className="text-[13px] font-bold text-neutral-800">500+</span>
              <span className="text-[12px] text-neutral-500">medicines across 27 cities</span>
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
          className="w-px h-10 bg-neutral-300"
        />
      </motion.div>
    </section>
  );
}
