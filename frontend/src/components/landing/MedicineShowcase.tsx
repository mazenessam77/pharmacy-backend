'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const categories = [
  { name: 'Pain Relief',            desc: 'Paracetamol, Ibuprofen, Aspirin & more',  count: '80+ products',  gradient: 'from-sky-400 to-blue-600',       icon: '💊', tag: 'Most Popular' },
  { name: 'Antibiotics',            desc: 'Amoxicillin, Azithromycin & capsules',    count: '45+ products',  gradient: 'from-amber-400 to-orange-600',   icon: '🔬', tag: 'Prescription' },
  { name: 'Vitamins & Wellness',    desc: 'Vitamin C, D, B-Complex & supplements',   count: '120+ products', gradient: 'from-emerald-400 to-teal-600',   icon: '🌿', tag: 'OTC' },
  { name: 'Chronic Disease',        desc: 'Diabetes, Blood Pressure & Cholesterol',  count: '60+ products',  gradient: 'from-violet-500 to-purple-700',  icon: '❤️', tag: 'Long-term' },
  { name: 'First Aid',              desc: 'Bandages, Antiseptics & Wound care',      count: '35+ products',  gradient: 'from-rose-400 to-red-600',       icon: '🩹', tag: 'Emergency' },
  { name: 'Eye & Ear Care',         desc: 'Eye drops, Ear drops & solutions',        count: '30+ products',  gradient: 'from-cyan-400 to-sky-600',       icon: '👁️', tag: 'Specialist' },
  { name: 'Skincare',               desc: 'Creams, ointments & topical gels',        count: '55+ products',  gradient: 'from-pink-400 to-fuchsia-600',   icon: '✨', tag: 'Topical' },
  { name: 'Baby & Mother Care',     desc: 'Infant formulas, supplements & care',     count: '40+ products',  gradient: 'from-fuchsia-500 to-purple-700', icon: '🍼', tag: 'Pediatric' },
];

export default function MedicineShowcase() {
  return (
    <section id="categories" className="py-28 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-600 mb-3">
              Medicine Categories
            </p>
            <h2 className="text-[clamp(30px,4vw,46px)] font-black text-neutral-900 leading-[1.02] tracking-tight">
              Browse by Category
            </h2>
            <p className="text-[15px] text-neutral-500 mt-3 max-w-md">
              Hundreds of medicines across all major categories, available from
              nearby pharmacies in real-time.
            </p>
          </div>
          <Link href="/register" className="shrink-0 inline-flex items-center gap-2 text-[13px] font-bold text-blue-600 hover:gap-3 transition-all">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: (i % 4) * 0.08 }}
              whileHover={{ translateY: -6 }}
              className={`relative bg-gradient-to-br ${cat.gradient} rounded-[22px] overflow-hidden cursor-default select-none group shadow-lg hover:shadow-2xl transition-shadow duration-300`}
              style={{ aspectRatio: '4/3' }}
            >
              <div className="absolute inset-0 opacity-25" style={{ backgroundImage: 'radial-gradient(circle at 80% 15%, rgba(255,255,255,0.65) 0%, transparent 50%)' }} />
              <div className="relative z-10 h-full flex flex-col justify-between p-5">
                <div className="flex items-start justify-between">
                  <span className="text-3xl drop-shadow-sm">{cat.icon}</span>
                  <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-white bg-white/20 backdrop-blur-sm rounded-full px-2.5 py-1">{cat.tag}</span>
                </div>
                <div>
                  <p className="text-white font-extrabold text-[16px] leading-tight drop-shadow-sm">{cat.name}</p>
                  <p className="text-white/80 text-[11px] font-medium mt-1 leading-snug">{cat.desc}</p>
                  <p className="text-white/70 text-[10px] font-bold mt-2 uppercase tracking-[0.12em]">{cat.count}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
