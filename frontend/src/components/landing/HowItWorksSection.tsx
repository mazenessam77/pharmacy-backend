'use client';

import { motion } from 'framer-motion';
import { Search, Store, MessageCircle, Package } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: Search,
    title: 'Request Medicine',
    description:
      'Search for medicines by name or upload your prescription. Our OCR reads it for you automatically.',
    accent: 'bg-sky-500',
    light: 'bg-sky-50',
    text: 'text-sky-600',
    border: 'border-sky-100',
  },
  {
    number: '02',
    icon: Store,
    title: 'Get Offers',
    description:
      'Nearby pharmacies compete to serve you with their best prices and available alternatives.',
    accent: 'bg-amber-500',
    light: 'bg-amber-50',
    text: 'text-amber-600',
    border: 'border-amber-100',
  },
  {
    number: '03',
    icon: MessageCircle,
    title: 'Choose & Chat',
    description:
      'Compare offers, chat directly with pharmacists, and confirm your preferred option.',
    accent: 'bg-emerald-500',
    light: 'bg-emerald-50',
    text: 'text-emerald-600',
    border: 'border-emerald-100',
  },
  {
    number: '04',
    icon: Package,
    title: 'Track & Receive',
    description:
      'Follow your order in real-time from preparation to delivery right at your door.',
    accent: 'bg-violet-500',
    light: 'bg-violet-50',
    text: 'text-violet-600',
    border: 'border-violet-100',
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-28 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-sky-600 mb-3">
            How It Works
          </p>
          <h2 className="text-[clamp(28px,3.5vw,40px)] font-extrabold text-slate-900 tracking-tight leading-tight">
            Four Simple Steps
          </h2>
          <p className="text-[14px] text-slate-500 mt-3">
            From request to doorstep in minutes.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: i * 0.12 }}
              className={`bg-white rounded-2xl p-7 border ${step.border} hover:shadow-lg hover:shadow-slate-100/80 transition-all duration-300 group relative overflow-hidden`}
            >
              {/* Big step number watermark */}
              <div
                className={`absolute -top-3 -right-2 text-[80px] font-extrabold leading-none select-none pointer-events-none ${step.text} opacity-[0.06] group-hover:opacity-[0.09] transition-opacity duration-500`}
              >
                {step.number}
              </div>

              {/* Icon */}
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ${step.light}`}>
                <step.icon className={`w-5 h-5 ${step.text}`} />
              </div>

              {/* Step label */}
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-[10px] font-bold uppercase tracking-widest ${step.text}`}>
                  Step {step.number}
                </span>
              </div>

              <h3 className="text-[14px] font-bold text-slate-800 mb-2">
                {step.title}
              </h3>
              <p className="text-[12px] text-slate-500 leading-relaxed">
                {step.description}
              </p>

              {/* Connector dot */}
              {i < steps.length - 1 && (
                <div className={`hidden lg:block absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 ${step.accent} rounded-full z-10 shadow-sm`} />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
