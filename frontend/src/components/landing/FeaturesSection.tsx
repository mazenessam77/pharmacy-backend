'use client';

import { motion } from 'framer-motion';
import { MapPin, Zap, MessageSquare, Camera, Star, Truck, Shield, Bell } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const containerVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

export default function FeaturesSection() {
  const { t } = useTranslation('landing');

  const features = [
    { icon: MapPin, key: 'geo', color: 'from-sky-400 to-blue-600' },
    { icon: Zap, key: 'realtime', color: 'from-amber-400 to-orange-600' },
    { icon: MessageSquare, key: 'chat', color: 'from-emerald-400 to-teal-600' },
    { icon: Camera, key: 'scan', color: 'from-violet-500 to-purple-700' },
    { icon: Star, key: 'reviews', color: 'from-rose-400 to-pink-600' },
    { icon: Truck, key: 'delivery', color: 'from-cyan-400 to-sky-600' },
    { icon: Shield, key: 'secure', color: 'from-indigo-500 to-blue-700' },
    { icon: Bell, key: 'notifications', color: 'from-fuchsia-500 to-purple-700' },
  ] as const;

  return (
    <section id="features" className="py-28 bg-[#fafafa]">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-600 mb-3">
            {t('features.eyebrow')}
          </p>
          <h2 className="text-[clamp(30px,4vw,46px)] font-black text-neutral-900 leading-[1.02] tracking-tight mb-4">
            {t('features.titleLine1')}
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">{t('features.titleHighlight')}</span>
          </h2>
          <p className="text-[15px] text-neutral-500 leading-relaxed">
            {t('features.subtitle')}
          </p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.key}
              variants={itemVariants}
              whileHover={{ translateY: -5 }}
              className="bg-white border border-neutral-100 rounded-[20px] p-6 transition-shadow duration-300 hover:shadow-xl group cursor-default"
            >
              <div className={`w-12 h-12 rounded-[14px] flex items-center justify-center mb-5 bg-gradient-to-br ${feature.color} shadow-md`}>
                <feature.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-[14px] font-bold text-neutral-900 mb-2">{t(`features.items.${feature.key}.title`)}</h3>
              <p className="text-[12.5px] text-neutral-500 leading-relaxed">{t(`features.items.${feature.key}.description`)}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
