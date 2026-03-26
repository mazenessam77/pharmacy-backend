'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const categories = [
  {
    name: 'Pain Relief',
    desc: 'Paracetamol, Ibuprofen, Aspirin & more',
    count: '80+ products',
    gradient: 'from-sky-500 via-blue-600 to-blue-700',
    glow: 'rgba(14,165,233,0.25)',
    icon: '💊',
    tag: 'Most Popular',
  },
  {
    name: 'Antibiotics',
    desc: 'Amoxicillin, Azithromycin & capsules',
    count: '45+ products',
    gradient: 'from-amber-400 via-orange-500 to-orange-600',
    glow: 'rgba(245,158,11,0.25)',
    icon: '🔬',
    tag: 'Prescription',
  },
  {
    name: 'Vitamins & Wellness',
    desc: 'Vitamin C, D, B-Complex & supplements',
    count: '120+ products',
    gradient: 'from-emerald-400 via-teal-500 to-teal-600',
    glow: 'rgba(16,185,129,0.25)',
    icon: '🌿',
    tag: 'OTC',
  },
  {
    name: 'Chronic Disease',
    desc: 'Diabetes, Blood Pressure & Cholesterol',
    count: '60+ products',
    gradient: 'from-violet-500 via-purple-600 to-purple-700',
    glow: 'rgba(139,92,246,0.25)',
    icon: '❤️',
    tag: 'Long-term',
  },
  {
    name: 'First Aid',
    desc: 'Bandages, Antiseptics & Wound care',
    count: '35+ products',
    gradient: 'from-rose-400 via-red-500 to-red-600',
    glow: 'rgba(244,63,94,0.25)',
    icon: '🩹',
    tag: 'Emergency',
  },
  {
    name: 'Eye & Ear Care',
    desc: 'Eye drops, Ear drops & solutions',
    count: '30+ products',
    gradient: 'from-cyan-400 via-cyan-500 to-sky-600',
    glow: 'rgba(6,182,212,0.25)',
    icon: '👁️',
    tag: 'Specialist',
  },
  {
    name: 'Skincare & Dermatology',
    desc: 'Creams, ointments & topical gels',
    count: '55+ products',
    gradient: 'from-pink-400 via-rose-500 to-pink-600',
    glow: 'rgba(236,72,153,0.25)',
    icon: '✨',
    tag: 'Topical',
  },
  {
    name: 'Baby & Mother Care',
    desc: 'Infant formulas, supplements & care',
    count: '40+ products',
    gradient: 'from-fuchsia-400 via-purple-500 to-violet-600',
    glow: 'rgba(217,70,239,0.25)',
    icon: '🍼',
    tag: 'Pediatric',
  },
];

export default function MedicineShowcase() {
  return (
    <section id="categories" className="py-28 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-sky-600 mb-3">
              Medicine Categories
            </p>
            <h2 className="text-[clamp(28px,3.5vw,40px)] font-extrabold text-slate-900 leading-tight tracking-tight">
              Browse by Category
            </h2>
            <p className="text-[14px] text-slate-500 mt-2 font-normal max-w-md">
              Hundreds of medicines across all major categories, available from
              nearby pharmacies in real-time.
            </p>
          </div>
          <Link
            href="/register"
            className="shrink-0 inline-flex items-center gap-2 text-[13px] font-semibold text-sky-600 hover:text-sky-700 transition-colors"
          >
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Category Grid — 4 columns on desktop, 2 on tablet, 1 on mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: (i % 4) * 0.08 }}
              whileHover={{ scale: 1.02, translateY: -4 }}
              className={`relative bg-gradient-to-br ${cat.gradient} rounded-2xl overflow-hidden cursor-default select-none group`}
              style={{
                boxShadow: `0 12px 32px -8px ${cat.glow}`,
                aspectRatio: '4/3',
              }}
            >
              {/* Background texture overlay */}
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage:
                    'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.4) 0%, transparent 50%)',
                }}
              />

              {/* Content */}
              <div className="relative z-10 h-full flex flex-col justify-between p-5">
                <div className="flex items-start justify-between">
                  <span className="text-3xl">{cat.icon}</span>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-white/70 bg-white/15 rounded-full px-2.5 py-1">
                    {cat.tag}
                  </span>
                </div>
                <div>
                  <p className="text-white font-bold text-[15px] leading-tight">
                    {cat.name}
                  </p>
                  <p className="text-white/70 text-[11px] font-medium mt-1 leading-snug">
                    {cat.desc}
                  </p>
                  <p className="text-white/50 text-[10px] font-semibold mt-2 uppercase tracking-widest">
                    {cat.count}
                  </p>
                </div>
              </div>

              {/* Hover shimmer */}
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors duration-300" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
