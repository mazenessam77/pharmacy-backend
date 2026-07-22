'use client';

import { motion } from 'framer-motion';
import { MapPin, Clock, ShieldCheck } from 'lucide-react';

const highlights = [
  { icon: MapPin,      title: 'Pharmacies Near You', description: 'We connect you with trusted pharmacies in your area so you get what you need, faster.' },
  { icon: Clock,       title: 'Always Available',    description: 'Request medicines and track your orders any time of day, right from your phone.' },
  { icon: ShieldCheck, title: 'Safe & Reliable',     description: 'Verified pharmacies, transparent pricing, and secure ordering you can count on.' },
];

const stats = [
  { value: '24/7', label: 'Available' },
  { value: 'Live', label: 'Order Tracking' },
  { value: 'Verified', label: 'Pharmacies' },
];

export default function AboutSection() {
  return (
    <section id="about" className="py-20 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="max-w-2xl mb-14">
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-blue-600 mb-3">About Us</p>
          <h2 className="text-[clamp(28px,3.5vw,40px)] font-bold text-neutral-900 tracking-tight leading-[1.12] mb-4">
            Built With Purpose,
            <br />
            <span className="bg-gradient-to-r from-blue-700 to-sky-500 bg-clip-text text-transparent">Delivered With Care</span>
          </h2>
          <p className="text-[15px] text-neutral-600 leading-relaxed">
            PharmaLink bridges the gap between patients and pharmacies, making it
            simple to find the medicines you need and get them delivered to your door.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-start">
          {/* Mission */}
          <div className="bg-white rounded-[16px] p-8 border border-neutral-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <h3 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-neutral-400 mb-4">Our Mission</h3>
            <p className="text-[15px] text-neutral-600 leading-relaxed mb-6">
              To make pharmaceutical services easier to access by connecting you with
              nearby pharmacies — with transparent pricing, instant communication, and
              reliable delivery, all in one place.
            </p>
            <div className="grid grid-cols-3 gap-4">
              {stats.map((stat) => (
                <div key={stat.label} className="bg-[#f7f9fc] rounded-[12px] p-4 text-center border border-neutral-200/60">
                  <p className="text-[17px] font-bold text-blue-700">{stat.value}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Why PharmaLink */}
          <div>
            <h3 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-neutral-400 mb-5">Why PharmaLink</h3>
            <div className="space-y-4">
              {highlights.map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  whileHover={{ translateY: -3 }}
                  className="flex items-start gap-4 bg-white border border-neutral-200/80 rounded-[16px] p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:shadow-[0_16px_32px_-16px_rgba(15,23,42,0.14)] hover:border-neutral-300 transition-all duration-300"
                >
                  <div className="w-11 h-11 rounded-[12px] flex items-center justify-center flex-shrink-0 bg-blue-50 text-blue-600">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[15px] font-semibold text-neutral-900">{item.title}</p>
                    <p className="text-[13px] text-neutral-500 leading-relaxed mt-1">{item.description}</p>
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
