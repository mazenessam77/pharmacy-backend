'use client';

import { motion } from 'framer-motion';
import { MapPin, Clock, ShieldCheck } from 'lucide-react';

const highlights = [
  { icon: MapPin,      title: 'Pharmacies Near You',  description: 'We connect you with trusted pharmacies in your area so you get what you need, faster.' },
  { icon: Clock,       title: 'Always Available',     description: 'Request medicines and track your orders any time of day, right from your phone.' },
  { icon: ShieldCheck, title: 'Safe & Reliable',      description: 'Verified pharmacies, transparent pricing, and secure ordering you can count on.' },
];

export default function AboutSection() {
  return (
    <section id="about" className="py-28 bg-white transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="max-w-2xl mb-14">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-900 mb-3">About Us</p>
          <h2 className="text-[clamp(28px,3.5vw,40px)] font-extrabold text-neutral-900 tracking-tight leading-tight mb-4">
            Built With Purpose,
            <br />
            <span className="text-neutral-400">Delivered With Care</span>
          </h2>
          <p className="text-[14px] text-neutral-500 leading-relaxed">
            PharmaLink bridges the gap between patients and pharmacies, making it
            simple to find the medicines you need and get them delivered to your door.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Mission */}
          <div className="bg-neutral-50 rounded-none p-8 border border-neutral-100">
            <h3 className="text-[12px] font-bold uppercase tracking-widest text-neutral-400 mb-4">Our Mission</h3>
            <p className="text-[14px] text-neutral-600 leading-relaxed mb-6">
              To make pharmaceutical services easier to access by connecting you with
              nearby pharmacies — with transparent pricing, instant communication, and
              reliable delivery, all in one place.
            </p>
            <div className="grid grid-cols-3 gap-4">
              {[{ value: '24/7', label: 'Available' }, { value: 'Live', label: 'Order Tracking' }, { value: 'Verified', label: 'Pharmacies' }].map((stat) => (
                <div key={stat.label} className="bg-white rounded-none p-4 text-center border border-neutral-100">
                  <p className="text-[18px] font-extrabold text-neutral-900">{stat.value}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Why PharmaLink */}
          <div>
            <h3 className="text-[12px] font-bold uppercase tracking-widest text-neutral-400 mb-5">Why PharmaLink</h3>
            <div className="space-y-3">
              {highlights.map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: 16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-start gap-4 bg-white border border-neutral-100 rounded-none p-5 hover:border-neutral-200 transition-all duration-300"
                >
                  <div className="w-11 h-11 bg-neutral-100 rounded-none flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 text-neutral-900" />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-neutral-800">{item.title}</p>
                    <p className="text-[12px] text-neutral-500 leading-relaxed mt-1">{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
