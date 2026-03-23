'use client';

import { motion } from 'framer-motion';
import { PillBottle, Capsule, Tablet, Syringe } from './MedicineIllustrations';

const steps = [
  {
    number: '01',
    title: 'Request Medicine',
    description: 'Search for medicines or upload your prescription. Our OCR reads it for you.',
    illustration: <PillBottle className="w-16 h-24" />,
  },
  {
    number: '02',
    title: 'Get Offers',
    description: 'Nearby pharmacies compete to serve you with their best prices and alternatives.',
    illustration: <Capsule className="w-24 h-12" />,
  },
  {
    number: '03',
    title: 'Choose & Chat',
    description: 'Compare offers, chat with pharmacists, and confirm your preferred option.',
    illustration: <Tablet className="w-16 h-16" />,
  },
  {
    number: '04',
    title: 'Track & Receive',
    description: 'Follow your order in real-time from preparation to delivery at your door.',
    illustration: <Syringe className="w-28 h-10" />,
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-32 bg-neutral-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-20">
          <p className="text-[11px] uppercase tracking-ultra text-neutral-400 mb-4">How It Works</p>
          <h2 className="text-[clamp(28px,3.5vw,42px)] font-light uppercase tracking-wide leading-tight">
            Four Simple Steps
          </h2>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-px bg-neutral-200 border border-neutral-200">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              className="bg-white p-10 text-center relative group"
            >
              {/* Step number */}
              <div className="text-[64px] font-light text-neutral-100 absolute top-4 right-6 select-none group-hover:text-neutral-200 transition-colors duration-500">
                {step.number}
              </div>

              {/* Illustration */}
              <div className="flex items-center justify-center h-28 mb-6 relative z-10">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  {step.illustration}
                </motion.div>
              </div>

              <h3 className="text-[12px] uppercase tracking-widest mb-3 relative z-10">
                {step.title}
              </h3>
              <p className="text-[12px] text-neutral-500 leading-relaxed font-light relative z-10">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
