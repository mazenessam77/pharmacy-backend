'use client';

import { motion } from 'framer-motion';
import { Search, Store, MessageCircle, Package } from 'lucide-react';

const steps = [
  { number: '01', icon: Search,        title: 'Request Medicine', description: 'Search for medicines by name or upload your prescription — we read it for you automatically.', gradient: 'from-sky-400 to-blue-600' },
  { number: '02', icon: Store,         title: 'Get Offers',       description: 'Nearby pharmacies compete to serve you with their best prices and available alternatives.',     gradient: 'from-amber-400 to-orange-600' },
  { number: '03', icon: MessageCircle, title: 'Choose & Chat',    description: 'Compare offers, chat directly with pharmacists, and confirm your preferred option.',            gradient: 'from-emerald-400 to-teal-600' },
  { number: '04', icon: Package,       title: 'Track & Receive',  description: 'Follow your order in real-time from preparation to delivery right at your door.',                gradient: 'from-violet-500 to-purple-700' },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-28 bg-[#fafafa]">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-600 mb-3">How It Works</p>
          <h2 className="text-[clamp(30px,4vw,46px)] font-black text-neutral-900 tracking-tight leading-[1.02]">
            Four Simple Steps
          </h2>
          <p className="text-[15px] text-neutral-500 mt-3">From request to doorstep in minutes.</p>
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
              <div className={`absolute -top-3 -right-2 text-[80px] font-black leading-none select-none pointer-events-none bg-gradient-to-br ${step.gradient} bg-clip-text text-transparent opacity-10 group-hover:opacity-20 transition-opacity duration-500`}>
                {step.number}
              </div>
              <div className={`w-12 h-12 rounded-[14px] flex items-center justify-center mb-5 bg-gradient-to-br ${step.gradient} shadow-md`}>
                <step.icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-[10px] font-bold uppercase tracking-[0.15em] bg-gradient-to-r ${step.gradient} bg-clip-text text-transparent`}>Step {step.number}</span>
              </div>
              <h3 className="text-[15px] font-bold text-neutral-900 mb-2">{step.title}</h3>
              <p className="text-[12.5px] text-neutral-500 leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
