'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Play, MapPin, Star, Shield, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function HeroSection() {
  const { t } = useTranslation(['landing', 'common']);

  const featureTiles = [
    { label: t('hero.tiles.painRelief.label'), sub: t('hero.tiles.painRelief.sub'), icon: '💊', gradient: 'from-sky-400 to-blue-600' },
    { label: t('hero.tiles.vitamins.label'), sub: t('hero.tiles.vitamins.sub'), icon: '🌿', gradient: 'from-emerald-400 to-teal-600' },
    { label: t('hero.tiles.chronicCare.label'), sub: t('hero.tiles.chronicCare.sub'), icon: '❤️', gradient: 'from-rose-400 to-pink-600' },
  ];

  const trust = [
    { icon: MapPin, text: t('hero.trust.governorates') },
    { icon: Star, text: t('hero.trust.rating') },
    { icon: Shield, text: t('hero.trust.secure') },
    { icon: Zap, text: t('hero.trust.realtime') },
  ];

  return (
    <section
      id="hero"
      className="relative min-h-screen bg-[#fafafa] flex items-center overflow-hidden"
    >
      {/* Bright ambient color washes */}
      <div className="absolute -top-32 -right-24 w-[34rem] h-[34rem] rounded-full bg-blue-400/20 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -left-24 w-[34rem] h-[34rem] rounded-full bg-emerald-400/20 blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 py-32 lg:py-24 w-full">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-16 items-center">
          {/* Left — Copy */}
          <div>
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
              <div className="inline-flex items-center gap-2 bg-white border border-neutral-200 rounded-full px-4 py-1.5 mb-7 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] text-neutral-700 font-semibold uppercase tracking-wider">
                  {t('hero.badge')}
                </span>
              </div>

              <h1 className="text-[clamp(42px,6vw,76px)] font-black text-neutral-900 leading-[0.98] tracking-tight mb-6">
                {t('hero.titleLine1')}
                <br />
                <span className="bg-gradient-to-r from-blue-600 via-sky-500 to-emerald-500 bg-clip-text text-transparent">
                  {t('hero.titleHighlight')}
                </span>
              </h1>

              <p className="text-[16px] text-neutral-500 leading-relaxed max-w-[460px] mb-9">
                {t('hero.subtitle')}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.22 }}
              className="flex flex-col sm:flex-row gap-3 mb-11"
            >
              <Link
                href="/register"
                className="group inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-sky-500 text-white px-8 py-4 rounded-full text-[14px] font-bold hover:shadow-[0_16px_40px_-12px_rgba(37,99,235,0.6)] active:scale-[0.98] transition-all duration-200"
              >
                {t('common:buttons.getStartedFree')}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform rtl:rotate-180" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 bg-white border border-neutral-200 text-neutral-800 px-8 py-4 rounded-full text-[14px] font-semibold hover:border-neutral-300 hover:shadow-md transition-all duration-200"
              >
                <Play className="w-4 h-4 fill-neutral-800 rtl:-scale-x-100" />
                {t('common:buttons.seeHowItWorks')}
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.45 }}
              className="flex flex-wrap items-center gap-x-6 gap-y-3"
            >
              {trust.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-1.5">
                  <Icon className="w-4 h-4 text-blue-600" />
                  <span className="text-[12.5px] text-neutral-600 font-medium">{text}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right — Flagship featured banner + tiles */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.85, delay: 0.25 }}
            className="hidden lg:block"
          >
            {/* Flagship promo card */}
            <div className="relative rounded-[28px] overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 p-8 min-h-[260px] flex flex-col justify-between shadow-[0_30px_70px_-25px_rgba(79,70,229,0.55)]">
              <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 85% 15%, rgba(255,255,255,0.5) 0%, transparent 45%)' }} />
              <div className="relative z-10 flex items-start justify-between">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/80 bg-white/15 rounded-full px-3 py-1">
                  {t('hero.featured.tag')}
                </span>
                <span className="text-4xl">🚚</span>
              </div>
              <div className="relative z-10">
                <h3 className="text-white font-black text-[26px] leading-tight tracking-tight">
                  {t('hero.featured.title')}
                </h3>
                <p className="text-white/75 text-[13px] mt-2 max-w-[260px]">
                  {t('hero.featured.subtitle')}
                </p>
                <Link
                  href="/register"
                  className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-bold text-white bg-white/15 hover:bg-white/25 rounded-full px-4 py-2 transition-colors"
                >
                  {t('common:buttons.tryNow')} <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                </Link>
              </div>
            </div>

            {/* Tile row */}
            <div className="grid grid-cols-3 gap-4 mt-4">
              {featureTiles.map((card, i) => (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + i * 0.1, duration: 0.55 }}
                  whileHover={{ translateY: -5 }}
                  className={`bg-gradient-to-br ${card.gradient} rounded-[20px] p-4 aspect-square flex flex-col justify-between cursor-default select-none shadow-lg`}
                >
                  <span className="text-2xl">{card.icon}</span>
                  <div>
                    <p className="text-white font-bold text-[12.5px] leading-tight">{card.label}</p>
                    <p className="text-white/75 text-[10px] font-medium mt-0.5">{card.sub}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.5 }}
              className="mt-4 mx-auto w-fit flex items-center gap-2 bg-white rounded-full px-5 py-2.5 shadow-lg border border-neutral-100"
            >
              <span className="text-[13px] font-extrabold text-blue-600">{t('hero.medicineCount')}</span>
              <span className="text-[12px] text-neutral-500">{t('hero.medicinesAcross')}</span>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
