'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function MedicineShowcase() {
  const { t } = useTranslation('landing');

  const categories = [
    { key: 'pain', gradient: 'from-sky-400 to-blue-600', icon: '💊' },
    { key: 'antibiotics', gradient: 'from-amber-400 to-orange-600', icon: '🔬' },
    { key: 'vitamins', gradient: 'from-emerald-400 to-teal-600', icon: '🌿' },
    { key: 'chronic', gradient: 'from-violet-500 to-purple-700', icon: '❤️' },
    { key: 'firstAid', gradient: 'from-rose-400 to-red-600', icon: '🩹' },
    { key: 'eyeEar', gradient: 'from-cyan-400 to-sky-600', icon: '👁️' },
    { key: 'skincare', gradient: 'from-pink-400 to-fuchsia-600', icon: '✨' },
    { key: 'babyMother', gradient: 'from-fuchsia-500 to-purple-700', icon: '🍼' },
  ] as const;

  return (
    <section id="categories" className="py-28 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-600 mb-3">
              {t('categories.eyebrow')}
            </p>
            <h2 className="text-[clamp(30px,4vw,46px)] font-black text-neutral-900 leading-[1.02] tracking-tight">
              {t('categories.title')}
            </h2>
            <p className="text-[15px] text-neutral-500 mt-3 max-w-md">
              {t('categories.subtitle')}
            </p>
          </div>
          <Link href="/register" className="shrink-0 inline-flex items-center gap-2 text-[13px] font-bold text-blue-600 hover:gap-3 transition-all">
            {t('categories.viewAll')} <ArrowRight className="w-4 h-4 rtl:rotate-180" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.key}
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
                  <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-white bg-white/20 backdrop-blur-sm rounded-full px-2.5 py-1">{t(`categories.items.${cat.key}.tag`)}</span>
                </div>
                <div>
                  <p className="text-white font-extrabold text-[16px] leading-tight drop-shadow-sm">{t(`categories.items.${cat.key}.name`)}</p>
                  <p className="text-white/80 text-[11px] font-medium mt-1 leading-snug">{t(`categories.items.${cat.key}.desc`)}</p>
                  <p className="text-white/70 text-[10px] font-bold mt-2 uppercase tracking-[0.12em]">{t(`categories.items.${cat.key}.count`)}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
