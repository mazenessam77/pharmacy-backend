'use client';

import { motion } from 'framer-motion';
import { Search, Store, MessageCircle, Package } from 'lucide-react';

const steps = [
  { number: '01', icon: Search,        title: 'Request Medicine', description: 'Search for medicines by name or upload your prescription — we read it for you automatically.' },
  { number: '02', icon: Store,         title: 'Get Offers',       description: 'Nearby pharmacies compete to serve you with their best prices and available alternatives.' },
  { number: '03', icon: MessageCircle, title: 'Choose & Chat',    description: 'Compare offers, chat directly with pharmacists, and confirm your preferred option.' },
  { number: '04', icon: Package,       title: 'Track & Receive',  description: 'Follow your order in real-time from preparation to delivery right at your door.' },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-blue-600 mb-3">How It Works</p>
          <h2 className="text-[clamp(28px,3.5vw,40px)] font-bold text-neutral-900 tracking-tight leading-[1.12]">
            Four Simple Steps
          </h2>
          <p className="text-[15px] text-neutral-600 leading-relaxed mt-3">From request to doorstep in minutes.</p>
        </div>

        <div className="relative">
          {/* Connector line behind the step cards (desktop only) */}
          <div className="hidden lg:block absolute top-[52px] left-[12%] right-[12%] h-px bg-neutral-200" aria-hidden="true" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: i * 0.12 }}
                whileHover={{ translateY: -4 }}
                className="relative bg-white border border-neutral-200/80 rounded-[16px] p-7 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:shadow-[0_16px_32px_-16px_rgba(15,23,42,0.14)] hover:border-neutral-300 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="w-11 h-11 rounded-[12px] flex items-center justify-center bg-blue-50 text-blue-600">
                    <step.icon className="w-5 h-5" />
                  </div>
                  <span className="w-8 h-8 rounded-full bg-blue-600 text-white text-[12px] font-bold flex items-center justify-center">
                    {step.number}
                  </span>
                </div>
                <h3 className="text-[15px] font-semibold text-neutral-900 mb-2">{step.title}</h3>
                <p className="text-[13px] text-neutral-500 leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
