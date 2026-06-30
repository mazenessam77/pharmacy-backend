'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Newspaper, Briefcase, Store } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function NewsCareersSection() {
  const { t } = useTranslation('landing');

  const news = [
    { key: 'storage', date: t('news.date'), gradient: 'from-sky-400 to-blue-600', icon: '🌡️' },
    { key: 'scanning', date: t('news.date'), gradient: 'from-emerald-400 to-teal-600', icon: '📷' },
    { key: 'coverage', date: t('news.date'), gradient: 'from-violet-500 to-purple-700', icon: '📍' },
  ] as const;

  return (
    <section id="news" className="py-28 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        {/* News */}
        <div className="flex items-center gap-2 mb-3">
          <Newspaper className="w-4 h-4 text-blue-600" />
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-600">{t('news.eyebrow')}</p>
        </div>
        <h2 className="text-[clamp(30px,4vw,46px)] font-black text-neutral-900 leading-[1.02] tracking-tight mb-12">
          {t('news.title')}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {news.map((item, i) => (
            <motion.article
              key={item.key}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ translateY: -6 }}
              className="group bg-white border border-neutral-100 rounded-[22px] overflow-hidden shadow-md hover:shadow-2xl transition-shadow duration-300 cursor-pointer"
            >
              <div className={`relative h-40 bg-gradient-to-br ${item.gradient} flex items-center justify-center`}>
                <div className="absolute inset-0 opacity-25" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.6) 0%, transparent 50%)' }} />
                <span className="relative z-10 text-5xl drop-shadow">{item.icon}</span>
                <span className="absolute top-4 start-4 z-10 text-[9px] font-bold uppercase tracking-[0.15em] text-white bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">{t(`news.items.${item.key}.tag`)}</span>
              </div>
              <div className="p-6">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400 mb-2">{item.date}</p>
                <h3 className="text-[16px] font-bold text-neutral-900 leading-snug mb-2 group-hover:text-blue-600 transition-colors">{t(`news.items.${item.key}.title`)}</h3>
                <p className="text-[13px] text-neutral-500 leading-relaxed mb-4">{t(`news.items.${item.key}.excerpt`)}</p>
                <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-blue-600">
                  {t('news.readMore')} <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform rtl:rotate-180" />
                </span>
              </div>
            </motion.article>
          ))}
        </div>

        {/* Careers / Partner banner */}
        <div className="grid md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-blue-600 to-indigo-700 p-9 text-white shadow-[0_30px_70px_-25px_rgba(67,56,202,0.55)]"
          >
            <div className="absolute inset-0 opacity-25" style={{ backgroundImage: 'radial-gradient(circle at 85% 15%, rgba(255,255,255,0.5) 0%, transparent 45%)' }} />
            <div className="relative z-10">
              <Store className="w-8 h-8 mb-5" />
              <h3 className="text-[24px] font-black leading-tight tracking-tight mb-2">{t('news.partner.title')}</h3>
              <p className="text-[14px] text-white/80 leading-relaxed max-w-sm mb-6">
                {t('news.partner.body')}
              </p>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 bg-white text-blue-700 rounded-full px-6 py-3 text-[13px] font-bold hover:bg-neutral-100 transition-colors"
              >
                {t('news.partner.cta')} <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-emerald-500 to-teal-600 p-9 text-white shadow-[0_30px_70px_-25px_rgba(13,148,136,0.55)]"
          >
            <div className="absolute inset-0 opacity-25" style={{ backgroundImage: 'radial-gradient(circle at 85% 15%, rgba(255,255,255,0.5) 0%, transparent 45%)' }} />
            <div className="relative z-10">
              <Briefcase className="w-8 h-8 mb-5" />
              <h3 className="text-[24px] font-black leading-tight tracking-tight mb-2">{t('news.careers.title')}</h3>
              <p className="text-[14px] text-white/80 leading-relaxed max-w-sm mb-6">
                {t('news.careers.body')}
              </p>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 bg-white text-emerald-700 rounded-full px-6 py-3 text-[13px] font-bold hover:bg-neutral-100 transition-colors"
              >
                {t('news.careers.cta')} <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
