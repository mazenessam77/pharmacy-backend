'use client';

import { motion } from 'framer-motion';
import { MapPin, Clock, ShieldCheck } from 'lucide-react';

const highlights = [
  { icon: MapPin,      title: 'Pharmacies Near You',  description: 'We connect you with trusted pharmacies in your area so you get what you need, faster.', gradient: 'from-sky-400 to-blue-600' },
  { icon: Clock,       title: 'Always Available',     description: 'Request medicines and track your orders any time of day, right from your phone.',         gradient: 'from-emerald-400 to-teal-600' },
  { icon: ShieldCheck, title: 'Safe & Reliable',      description: 'Verified pharmacies, transparent pricing, and secure ordering you can count on.',         gradient: 'from-violet-500 to-purple-700' },
];

export default function AboutSection() {
  return (
    <section id="about" className="py-28 bg-[#fafafa]">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="max-w-2xl mb-14">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-600 mb-3">About Us</p>
          <h2 className="text-[clamp(30px,4vw,46px)] font-black text-neutral-900 tracking-tight leading-[1.02] mb-4">
            Built With Purpose,
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">Delivered With Care</span>
          </h2>
          <p className="text-[15px] text-neutral-500 leading-relaxed">
            PharmaLink bridges the gap between patients and pharmacies, making it
            simple to find the medicines you need and get them delivered to your door.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Mission */}
          <div className="bg-white rounded-[24px] p-8 border border-neutral-100 shadow-md">
            <h3 className="text-[12px] font-bold uppercase tracking-[0.15em] text-neutral-400 mb-4">Our Mission</h3>
            <p className="text-[15px] text-neutral-600 leading-relaxed mb-6">
              To make pharmaceutical services easier to access by connecting you with
              nearby pharmacies — with transparent pricing, instant communication, and
              reliable delivery, all in one place.
            </p>
            <div className="grid grid-cols-3 gap-4">
              {[
                { value: '24/7', label: 'Available', gradient: 'from-sky-400 to-blue-600' },
                { value: 'Live', label: 'Order Tracking', gradient: 'from-emerald-400 to-teal-600' },
                { value: 'Verified', label: 'Pharmacies', gradient: 'from-violet-500 to-purple-700' },
              ].map((stat) => (
                <div key={stat.label} className="bg-[#fafafa] rounded-[16px] p-4 text-center border border-neutral-100">
                  <p className={`text-[18px] font-black bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>{stat.value}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Why PharmaLink */}
          <div>
            <h3 className="text-[12px] font-bold uppercase tracking-[0.15em] text-neutral-400 mb-5">Why PharmaLink</h3>
            <div className="space-y-3">
              {highlights.map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: 16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  whileHover={{ translateY: -3 }}
                  className="flex items-start gap-4 bg-white border border-neutral-100 rounded-[20px] p-5 shadow-md hover:shadow-xl transition-shadow duration-300"
                >
                  <div className={`w-12 h-12 rounded-[14px] flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${item.gradient} shadow-md`}>
                    <item.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-neutral-900">{item.title}</p>
                    <p className="text-[12.5px] text-neutral-500 leading-relaxed mt-1">{item.description}</p>
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
