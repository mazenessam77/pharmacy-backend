'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowRight,
  Play,
  MapPin,
  Star,
  Shield,
  Zap,
  Truck,
  Pill,
  Leaf,
  HeartPulse,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function HeroSection() {
  const { t } = useTranslation(['landing', 'common']);

  const featureTiles = [
    { label: t('hero.tiles.painRelief.label'), sub: t('hero.tiles.painRelief.sub'), icon: Pill, iconClass: 'bg-blue-50 text-blue-600' },
    { label: t('hero.tiles.vitamins.label'), sub: t('hero.tiles.vitamins.sub'), icon: Leaf, iconClass: 'bg-teal-50 text-teal-600' },
    { label: t('hero.tiles.chronicCare.label'), sub: t('hero.tiles.chronicCare.sub'), icon: HeartPulse, iconClass: 'bg-rose-50 text-rose-600' },
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
      className="relative bg-gradient-to-b from-[#f4f8fd] via-[#f7f9fc] to-white overflow-hidden"
    >
      {/* Single restrained ambient wash tying both columns together */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/4 w-[44rem] h-[44rem] rounded-full bg-blue-500/10 blur-[140px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 pt-32 pb-20 lg:pt-40 lg:pb-24 w-full">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-20 items-center">
          {/* Left — Copy */}
          <div>
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
              <div className="inline-flex items-center gap-2 bg-white border border-neutral-200/80 rounded-full px-4 py-1.5 mb-7 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] text-neutral-600 font-semibold uppercase tracking-[0.14em]">
                  {t('hero.badge')}
                </span>
              </div>

              <h1 className="text-[clamp(38px,5vw,64px)] font-bold text-neutral-900 leading-[1.05] tracking-tight mb-6">
                {t('hero.titleLine1')}
                <br />
                <span className="bg-gradient-to-r from-blue-700 to-sky-500 bg-clip-text text-transparent">
                  {t('hero.titleHighlight')}
                </span>
              </h1>

              <p className="text-[16px] text-neutral-600 leading-relaxed max-w-[460px] mb-9">
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
                className="group inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-7 py-3.5 rounded-full text-[14px] font-semibold shadow-sm hover:shadow-[0_12px_28px_-10px_rgba(37,99,235,0.55)] active:scale-[0.98] transition-all duration-200"
              >
                {t('common:buttons.getStartedFree')}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform rtl:rotate-180" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 bg-white border border-neutral-200 text-neutral-800 px-7 py-3.5 rounded-full text-[14px] font-semibold hover:border-neutral-300 hover:bg-neutral-50 transition-all duration-200"
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

          {/* Right — Flagship banner + category tiles, same card language as the rest of the page */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.85, delay: 0.25 }}
            className="hidden lg:flex flex-col gap-4"
          >
            {/* Flagship promo card */}
            <div className="relative rounded-[24px] overflow-hidden bg-gradient-to-br from-blue-600 to-blue-800 p-8 min-h-[250px] flex flex-col justify-between shadow-[0_28px_56px_-24px_rgba(30,64,175,0.45)]">
              <div className="absolute inset-0 opacity-25" style={{ backgroundImage: 'radial-gradient(circle at 85% 15%, rgba(255,255,255,0.45) 0%, transparent 45%)' }} />
              <div className="relative z-10 flex items-start justify-between">
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/90 bg-white/15 rounded-full px-3 py-1">
                  {t('hero.featured.tag')}
                </span>
                <div className="w-11 h-11 rounded-[12px] bg-white/15 flex items-center justify-center">
                  <Truck className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="relative z-10">
                <h2 className="text-white font-bold text-[24px] leading-tight tracking-tight">
                  {t('hero.featured.title')}
                </h2>
                <p className="text-white/80 text-[13.5px] leading-relaxed mt-2 max-w-[280px]">
                  {t('hero.featured.subtitle')}
                </p>
                <Link
                  href="/register"
                  className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-blue-700 bg-white hover:bg-blue-50 rounded-full px-5 py-2.5 transition-colors"
                >
                  {t('common:buttons.tryNow')} <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                </Link>
              </div>
            </div>

            {/* Tile row */}
            <div className="grid grid-cols-3 gap-4">
              {featureTiles.map((card, i) => (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + i * 0.1, duration: 0.55 }}
                  whileHover={{ translateY: -4 }}
                  className="bg-white border border-neutral-200/80 rounded-[16px] p-5 flex flex-col gap-4 cursor-default select-none shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:shadow-[0_16px_32px_-16px_rgba(15,23,42,0.14)] transition-shadow duration-300"
                >
                  <div className={`w-11 h-11 rounded-[12px] flex items-center justify-center ${card.iconClass}`}>
                    <card.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-neutral-900 font-semibold text-[13px] leading-tight">{card.label}</p>
                    <p className="text-neutral-500 text-[11px] font-medium mt-1">{card.sub}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.5 }}
              className="mx-auto w-fit flex items-center gap-2 bg-white rounded-full px-5 py-2.5 border border-neutral-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
            >
              <span className="text-[13px] font-bold text-blue-600">{t('hero.medicineCount')}</span>
              <span className="text-[12.5px] text-neutral-500">{t('hero.medicinesAcross')}</span>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
