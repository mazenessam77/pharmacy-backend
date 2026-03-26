'use client';

import { motion } from 'framer-motion';
import { MapPin, Zap, MessageSquare, Camera, Star, Truck, Shield, Bell } from 'lucide-react';

const features = [
  { icon: MapPin,        title: 'Geolocation Search',   description: 'Find pharmacies near you using GPS-powered search with configurable radius.',             color: 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400',    border: 'hover:border-sky-200 dark:hover:border-sky-800' },
  { icon: Zap,           title: 'Real-time Updates',    description: 'Live order tracking with instant status updates via WebSocket connections.',              color: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400',  border: 'hover:border-amber-200 dark:hover:border-amber-800' },
  { icon: MessageSquare, title: 'In-app Chat',           description: 'Direct messaging between patients and pharmacies with typing indicators.',                color: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400', border: 'hover:border-emerald-200 dark:hover:border-emerald-800' },
  { icon: Camera,        title: 'Prescription OCR',     description: 'Upload prescriptions and let AI extract medicine names automatically.',                    color: 'bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400', border: 'hover:border-violet-200 dark:hover:border-violet-800' },
  { icon: Star,          title: 'Reviews & Ratings',    description: 'Rate pharmacies and read reviews to make informed decisions.',                            color: 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400', border: 'hover:border-orange-200 dark:hover:border-orange-800' },
  { icon: Truck,         title: 'Delivery Tracking',    description: 'Track your order from preparation to doorstep delivery in real-time.',                    color: 'bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400',    border: 'hover:border-teal-200 dark:hover:border-teal-800' },
  { icon: Shield,        title: 'Secure Platform',      description: 'JWT authentication, encrypted data, and role-based access control.',                      color: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400',    border: 'hover:border-blue-200 dark:hover:border-blue-800' },
  { icon: Bell,          title: 'Smart Notifications',  description: 'Push notifications for order updates, new offers, and messages.',                         color: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400',    border: 'hover:border-rose-200 dark:hover:border-rose-800' },
];

const containerVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

export default function FeaturesSection() {
  return (
    <section id="features" className="py-28 bg-white dark:bg-black transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-sky-600 dark:text-sky-400 mb-3">
            Platform Features
          </p>
          <h2 className="text-[clamp(28px,3.5vw,40px)] font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight mb-4">
            Everything You Need,
            <br />
            <span className="text-slate-400 dark:text-zinc-500">Nothing You Don&apos;t</span>
          </h2>
          <p className="text-[14px] text-slate-500 dark:text-zinc-400 leading-relaxed">
            A complete pharmacy ecosystem built with modern technology for patients,
            pharmacies, and administrators.
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
              key={feature.title}
              variants={itemVariants}
              className={`bg-white dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-800/60 rounded-2xl p-6 transition-all duration-300 hover:shadow-lg hover:shadow-slate-100 dark:hover:shadow-black/20 ${feature.border} group cursor-default`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-5 ${feature.color}`}>
                <feature.icon className="w-5 h-5" />
              </div>
              <h3 className="text-[13px] font-bold text-slate-800 dark:text-zinc-100 mb-2">{feature.title}</h3>
              <p className="text-[12px] text-slate-500 dark:text-zinc-400 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
