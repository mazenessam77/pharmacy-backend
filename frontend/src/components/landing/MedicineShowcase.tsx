'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowRight,
  Pill,
  Microscope,
  Leaf,
  HeartPulse,
  Bandage,
  Eye,
  Sparkles,
  Baby,
} from 'lucide-react';

const categories = [
  { name: 'Pain Relief',         desc: 'Paracetamol, Ibuprofen, Aspirin & more', count: '80+ products',  icon: Pill,       iconClass: 'bg-blue-50 text-blue-600',       tag: 'Most Popular' },
  { name: 'Antibiotics',         desc: 'Amoxicillin, Azithromycin & capsules',   count: '45+ products',  icon: Microscope, iconClass: 'bg-amber-50 text-amber-600',     tag: 'Prescription' },
  { name: 'Vitamins & Wellness', desc: 'Vitamin C, D, B-Complex & supplements',  count: '120+ products', icon: Leaf,       iconClass: 'bg-emerald-50 text-emerald-600', tag: 'OTC' },
  { name: 'Chronic Disease',     desc: 'Diabetes, Blood Pressure & Cholesterol', count: '60+ products',  icon: HeartPulse, iconClass: 'bg-violet-50 text-violet-600',   tag: 'Long-term' },
  { name: 'First Aid',           desc: 'Bandages, Antiseptics & Wound care',     count: '35+ products',  icon: Bandage,    iconClass: 'bg-rose-50 text-rose-600',       tag: 'Emergency' },
  { name: 'Eye & Ear Care',      desc: 'Eye drops, Ear drops & solutions',       count: '30+ products',  icon: Eye,        iconClass: 'bg-sky-50 text-sky-600',         tag: 'Specialist' },
  { name: 'Skincare',            desc: 'Creams, ointments & topical gels',       count: '55+ products',  icon: Sparkles,   iconClass: 'bg-teal-50 text-teal-600',       tag: 'Topical' },
  { name: 'Baby & Mother Care',  desc: 'Infant formulas, supplements & care',    count: '40+ products',  icon: Baby,       iconClass: 'bg-indigo-50 text-indigo-600',   tag: 'Pediatric' },
];

export default function MedicineShowcase() {
  return (
    <section id="categories" className="py-20 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-blue-600 mb-3">
              Medicine Categories
            </p>
            <h2 className="text-[clamp(28px,3.5vw,40px)] font-bold text-neutral-900 leading-[1.12] tracking-tight">
              Browse by Category
            </h2>
            <p className="text-[15px] text-neutral-600 leading-relaxed mt-3 max-w-md">
              Hundreds of medicines across all major categories, available from
              nearby pharmacies in real-time.
            </p>
          </div>
          <Link
            href="/register"
            className="group shrink-0 inline-flex items-center gap-2 text-[13.5px] font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            View All
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform rtl:rotate-180" />
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
              whileHover={{ translateY: -4 }}
              className="bg-white border border-neutral-200/80 rounded-[16px] p-6 cursor-default select-none shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:shadow-[0_16px_32px_-16px_rgba(15,23,42,0.14)] hover:border-neutral-300 transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-5">
                <div className={`w-11 h-11 rounded-[12px] flex items-center justify-center ${cat.iconClass}`}>
                  <cat.icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-500 bg-neutral-100 rounded-full px-2.5 py-1">
                  {cat.tag}
                </span>
              </div>
              <p className="text-neutral-900 font-semibold text-[15px] leading-tight">{cat.name}</p>
              <p className="text-neutral-500 text-[13px] leading-relaxed mt-1.5">{cat.desc}</p>
              <p className="text-neutral-400 text-[11px] font-semibold mt-4 uppercase tracking-[0.1em]">{cat.count}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
