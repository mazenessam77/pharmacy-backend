'use client';

import { motion } from 'framer-motion';
import { Search, Store, MessageCircle, Package } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function HowItWorksSection() {
  const { t } = useTranslation('landing');

  const steps = [
    { number: '01', icon: Search, key: 'request', gradient: 'from-sky-400 to-blue-600' },
    { number: '02', icon: Store, key: 'offers', gradient: 'from-amber-400 to-orange-600' },
    { number: '03', icon: MessageCircle, key: 'chat', gradient: 'from-emerald-400 to-teal-600' },
    { number: '04', icon: Package, key: 'track', gradient: 'from-violet-500 to-purple-700' },
  ] as const;

  return (
    <section id="how-it-works" className="py-28 bg-[#fafafa]">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-600 mb-3">{t('howItWorks.eyebrow')}</p>
          <h2 className="text-[clamp(30px,4vw,46px)] font-black text-neutral-900 tracking-tight leading-[1.02]">
            {t('howItWorks.title')}
          </h2>
          <p className="text-[15px] text-neutral-500 mt-3">{t('howItWorks.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: i * 0.12 }}
              whileHover={{ translateY: -5 }}
              className="bg-white rounded-[22px] p-7 border border-neutral-100 shadow-md hover:shadow-xl transition-shadow duration-300 group relative overflow-hidden"
            >
              <div className={`absolute -top-3 -end-2 text-[80px] font-black leading-none select-none pointer-events-none bg-gradient-to-br ${step.gradient} bg-clip-text text-transparent opacity-10 group-hover:opacity-20 transition-opacity duration-500`}>
                {step.number}
              </div>
              <div className={`w-12 h-12 rounded-[14px] flex items-center justify-center mb-5 bg-gradient-to-br ${step.gradient} shadow-md`}>
                <step.icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-[10px] font-bold uppercase tracking-[0.15em] bg-gradient-to-r ${step.gradient} bg-clip-text text-transparent`}>{t('howItWorks.stepLabel')} {step.number}</span>
              </div>
              <h3 className="text-[15px] font-bold text-neutral-900 mb-2">{t(`howItWorks.steps.${step.key}.title`)}</h3>
              <p className="text-[12.5px] text-neutral-500 leading-relaxed">{t(`howItWorks.steps.${step.key}.description`)}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
